import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, db } from "../src/db";
import { campaigns, donations, notificationLogs, paymentLogs, payments, users, webhookEvents } from "../src/db/schema";
import { applyPaymentEvent } from "../src/services/payments.service";
import { runCampaignLifecycle, setCampaignStatus } from "../src/services/campaigns.service";
import type { NormalizedPaymentEvent } from "../src/lib/payments/types";
import { makeCampaign, makeDonationWithPayment, resetDb } from "./helpers";

const ev = (reference: string, over: Partial<NormalizedPaymentEvent> = {}): NormalizedPaymentEvent => ({
  provider: "MIDTRANS",
  externalEventId: `evt-${Math.random()}`,
  providerReference: reference,
  eventType: "transaction.settlement",
  status: "SUCCEEDED",
  amount: 50_000,
  currency: "IDR",
  payloadSanitized: {},
  ...over,
});

const raised = async (id: string) => (await db.select().from(campaigns).where(eq(campaigns.id, id)))[0].raisedAmount;
const settle = (e: NormalizedPaymentEvent) => applyPaymentEvent(e);

beforeEach(resetDb);
afterAll(async () => {
  await new Promise((r) => setTimeout(r, 300)); // let fire-and-forget notification jobs finish
  await closeDb();
});

describe("settlement", () => {
  it("success increments raised_amount once and queues notifications", async () => {
    const c = await makeCampaign();
    const { donation, payment } = await makeDonationWithPayment(c.id);
    const r = await settle(ev(payment.providerReference));
    expect(r).toMatchObject({ outcome: "APPLIED", becameSucceeded: true });
    expect(await raised(c.id)).toBe(50_000);
    const [d] = await db.select().from(donations).where(eq(donations.id, donation.id));
    expect(d.status).toBe("SUCCEEDED");
    expect(d.paidAt).not.toBeNull();
    const logs = await db.select().from(notificationLogs).where(eq(notificationLogs.donationId, donation.id));
    expect(logs.map((l) => l.channel).sort()).toEqual(["EMAIL", "WHATSAPP"]);
  });

  it("duplicate event id is a no-op", async () => {
    const c = await makeCampaign();
    const { payment } = await makeDonationWithPayment(c.id);
    const e = ev(payment.providerReference);
    await settle(e);
    expect(await settle(e)).toEqual({ outcome: "DUPLICATE" });
    expect(await raised(c.id)).toBe(50_000);
    expect((await db.select().from(webhookEvents)).length).toBe(1);
  });

  it("a different event for an already-succeeded payment does not double count", async () => {
    const c = await makeCampaign();
    const { payment } = await makeDonationWithPayment(c.id);
    await settle(ev(payment.providerReference));
    const again = await settle(ev(payment.providerReference)); // new event id, same outcome
    expect(again.outcome).toBe("IGNORED");
    expect(await raised(c.id)).toBe(50_000);
    expect((await db.select().from(notificationLogs)).length).toBe(2);
  });

  it("concurrent deliveries count exactly once", async () => {
    const c = await makeCampaign();
    const { payment } = await makeDonationWithPayment(c.id);
    await Promise.all(Array.from({ length: 6 }, () => settle(ev(payment.providerReference))));
    expect(await raised(c.id)).toBe(50_000);
  });

  it("stale pending event cannot regress SUCCEEDED", async () => {
    const c = await makeCampaign();
    const { donation, payment } = await makeDonationWithPayment(c.id);
    await settle(ev(payment.providerReference));
    const r = await settle(ev(payment.providerReference, { status: "PENDING", eventType: "transaction.pending" }));
    expect(r.outcome).toBe("IGNORED");
    const [p] = await db.select().from(payments).where(eq(payments.id, payment.id));
    const [d] = await db.select().from(donations).where(eq(donations.id, donation.id));
    expect(p.status).toBe("SUCCEEDED");
    expect(d.status).toBe("SUCCEEDED");
  });

  it("pending event does not change anything or add to raised", async () => {
    const c = await makeCampaign();
    const { payment } = await makeDonationWithPayment(c.id);
    const r = await settle(ev(payment.providerReference, { status: "PENDING" }));
    expect(r.outcome).toBe("IGNORED");
    expect(await raised(c.id)).toBe(0);
  });

  it("amount mismatch is rejected and logged", async () => {
    const c = await makeCampaign();
    const { donation, payment } = await makeDonationWithPayment(c.id);
    const r = await settle(ev(payment.providerReference, { amount: 1 }));
    expect(r).toMatchObject({ outcome: "IGNORED", reason: "AMOUNT_MISMATCH" });
    expect(await raised(c.id)).toBe(0);
    const [d] = await db.select().from(donations).where(eq(donations.id, donation.id));
    expect(d.status).toBe("PENDING");
    const logs = await db.select().from(paymentLogs);
    expect(logs.some((l) => l.eventType === "settlement.mismatch")).toBe(true);
  });

  it("unknown reference is ignored without error", async () => {
    expect(await settle(ev("NOPE-1"))).toMatchObject({ outcome: "IGNORED", reason: "UNKNOWN_REFERENCE" });
  });

  it("expiry marks donation EXPIRED and queues an expiry email (WA skipped)", async () => {
    const c = await makeCampaign();
    const { donation, payment } = await makeDonationWithPayment(c.id);
    await settle(ev(payment.providerReference, { status: "EXPIRED", eventType: "transaction.expire" }));
    const [d] = await db.select().from(donations).where(eq(donations.id, donation.id));
    expect(d.status).toBe("EXPIRED");
    const logs = await db.select().from(notificationLogs);
    expect(logs.find((l) => l.channel === "WHATSAPP")?.status).toBe("SKIPPED");
    expect(await raised(c.id)).toBe(0);
  });

  it("late success after expiry never counts", async () => {
    const c = await makeCampaign();
    const { payment } = await makeDonationWithPayment(c.id);
    await settle(ev(payment.providerReference, { status: "EXPIRED" }));
    const r = await settle(ev(payment.providerReference));
    expect(r).toMatchObject({ outcome: "IGNORED", reason: "LATE_SUCCESS" });
    expect(await raised(c.id)).toBe(0);
  });
});

describe("campaign closure", () => {
  it("auto-completes when target is reached (auto_close on)", async () => {
    const c = await makeCampaign({ targetAmount: 50_000 });
    const { payment } = await makeDonationWithPayment(c.id, 50_000);
    await settle(ev(payment.providerReference));
    const [after] = await db.select().from(campaigns).where(eq(campaigns.id, c.id));
    expect(after).toMatchObject({ status: "COMPLETED", closeReason: "TARGET_REACHED" });
  });

  it("stays open when auto_close_on_target is false", async () => {
    const c = await makeCampaign({ targetAmount: 50_000, autoCloseOnTarget: false });
    const { payment } = await makeDonationWithPayment(c.id, 50_000);
    await settle(ev(payment.providerReference));
    const [after] = await db.select().from(campaigns).where(eq(campaigns.id, c.id));
    expect(after.status).toBe("PUBLISHED");
  });

  it("webhook for an already closed campaign still settles", async () => {
    const c = await makeCampaign();
    const { payment } = await makeDonationWithPayment(c.id);
    await db.update(campaigns).set({ status: "CLOSED", closeReason: "MANUAL" }).where(eq(campaigns.id, c.id));
    const r = await settle(ev(payment.providerReference));
    expect(r.outcome).toBe("APPLIED");
    expect(await raised(c.id)).toBe(50_000);
  });

  it("lifecycle job completes campaigns past end date", async () => {
    const c = await makeCampaign({ endsAt: new Date(Date.now() - 1000) });
    const res = await runCampaignLifecycle();
    expect(res.completed).toBeGreaterThanOrEqual(1);
    const [after] = await db.select().from(campaigns).where(eq(campaigns.id, c.id));
    expect(after).toMatchObject({ status: "COMPLETED", closeReason: "END_DATE" });
  });

  it("manual close sets reason MANUAL; publishing CLOSED_AMOUNT needs presets", async () => {
    const [admin] = await db.insert(users).values({ email: "a@example.com" }).returning();
    const c = await makeCampaign();
    const closed = await setCampaignStatus(c.id, "CLOSED", { userId: admin.id });
    expect(closed).toMatchObject({ status: "CLOSED", closeReason: "MANUAL" });
    await expect(setCampaignStatus(c.id, "PUBLISHED", { userId: admin.id })).rejects.toThrow(/tidak diizinkan/);
    const draft = await makeCampaign({ status: "DRAFT", amountMode: "CLOSED_AMOUNT" });
    await expect(setCampaignStatus(draft.id, "PUBLISHED", { userId: admin.id })).rejects.toThrow(/nominal/i);
  });
});
