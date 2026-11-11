import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, db } from "../src/db";
import { donations, donors, payments, users } from "../src/db/schema";
import { createDonation, createPaymentForDonation } from "../src/services/donations.service";
import { linkDonorToUser } from "../src/services/donors.service";
import { DomainError } from "../src/services/campaigns.service";
import { resetEnvCache } from "../src/lib/env";
import { enableMidtrans, makeCampaign, makeOptions, resetDb } from "./helpers";

const donor = { name: "Siti", email: "Siti@Example.com", whatsapp: "081234567890", whatsappOptIn: true };

beforeEach(async () => {
  await resetDb();
  await enableMidtrans("qris");
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await new Promise((r) => setTimeout(r, 300));
  await closeDb();
});

describe("createDonation", () => {
  it("creates a PENDING donation with server-side validation and snapshots", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: true });
    expect(d).toMatchObject({ status: "PENDING", amount: 25_000, isAnonymous: true, donorWhatsappSnapshot: "+6281234567890", whatsappOptInSnapshot: true });
    expect(d.donationCode).toMatch(/^DON-/);
  });

  it("rejects free amount on CLOSED_AMOUNT and accepts a preset", async () => {
    const c = await makeCampaign({ amountMode: "CLOSED_AMOUNT" });
    const [opt] = await makeOptions(c.id, [50_000, 100_000]);
    await expect(createDonation({ campaignSlug: c.slug, amount: 50_000, donor, isAnonymous: false })).rejects.toBeInstanceOf(DomainError);
    const d = await createDonation({ campaignSlug: c.slug, amountOptionId: opt.id, donor, isAnonymous: false });
    expect(d.amount).toBe(50_000);
  });

  it.each(["DRAFT", "PAUSED", "CLOSED", "COMPLETED"] as const)("refuses %s campaigns", async (status) => {
    const c = await makeCampaign({ status });
    await expect(createDonation({ campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false })).rejects.toBeInstanceOf(DomainError);
  });

  it("is idempotent per Idempotency-Key and reuses one donor per normalized e-mail", async () => {
    const c = await makeCampaign();
    const input = { campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false };
    const [a, b] = await Promise.all([createDonation(input, { idempotencyKey: "k1" }), createDonation(input, { idempotencyKey: "k1" })]);
    expect(a.id).toBe(b.id);
    await createDonation(input, { idempotencyKey: "k2" });
    expect((await db.select().from(donations)).length).toBe(2);
    expect((await db.select().from(donors)).length).toBe(1);
  });
});

describe("demo campaigns", () => {
  it("accept sandbox donations but are blocked when live payment keys are configured", async () => {
    const c = await makeCampaign({ isDemo: true });
    const input = { campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false };
    await expect(createDonation(input)).resolves.toMatchObject({ status: "PENDING" });
    process.env.MIDTRANS_IS_PRODUCTION = "true";
    resetEnvCache();
    try {
      await expect(createDonation(input)).rejects.toThrow(/demo/i);
    } finally {
      delete process.env.MIDTRANS_IS_PRODUCTION;
      resetEnvCache();
    }
  });
});

describe("createPaymentForDonation", () => {
  const mockMidtrans = () =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ token: "t", redirect_url: "https://app.sandbox.midtrans.com/snap/v4/redirection/t" }), { status: 201 }));

  it("stores PENDING payment with amount taken from the DB", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false });
    const spy = mockMidtrans();
    const view = await createPaymentForDonation(d.donationCode, { provider: "MIDTRANS", channelCode: "qris" });
    expect(view).toMatchObject({ status: "PENDING", checkoutUrl: expect.stringContaining("midtrans.com") });
    const sent = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.transaction_details.gross_amount).toBe(25_000);
    expect(sent.transaction_details.order_id).toBe(`${d.donationCode}-1`);
    // second call reuses the active attempt instead of creating another
    await createPaymentForDonation(d.donationCode, { provider: "MIDTRANS", channelCode: "qris" });
    expect((await db.select().from(payments)).length).toBe(1);
  });

  it("rejects disabled provider/channel and does not call the gateway", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false });
    const spy = mockMidtrans();
    await expect(createPaymentForDonation(d.donationCode, { provider: "MIDTRANS", channelCode: "gopay" })).rejects.toThrow(/tidak tersedia/);
    await expect(createPaymentForDonation(d.donationCode, { provider: "XENDIT", channelCode: "QRIS" })).rejects.toThrow(/tidak tersedia/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("provider failure marks the attempt FAILED, leaves donation PENDING, and allows retry", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(createPaymentForDonation(d.donationCode, { provider: "MIDTRANS", channelCode: "qris" })).rejects.toThrow(/Gagal membuat pembayaran/);
    const [after] = await db.select().from(donations).where(eq(donations.id, d.id));
    expect(after.status).toBe("PENDING");
    mockMidtrans();
    const retry = await createPaymentForDonation(d.donationCode, { provider: "MIDTRANS", channelCode: "qris" });
    expect(retry.status).toBe("PENDING");
    expect((await db.select().from(payments)).map((p) => p.providerReference).sort()).toEqual([`${d.donationCode}-1`, `${d.donationCode}-2`]);
  });
});

describe("donor linking", () => {
  it("links only with a verified, matching e-mail", async () => {
    const c = await makeCampaign();
    await createDonation({ campaignSlug: c.slug, amount: 25_000, donor, isAnonymous: false });
    const [u] = await db.insert(users).values({ email: "siti@example.com" }).returning();
    expect(await linkDonorToUser({ id: u.id, email: u.email, emailVerified: null })).toBe(false);
    expect(await linkDonorToUser({ id: u.id, email: "other@example.com", emailVerified: new Date() })).toBe(false);
    expect(await linkDonorToUser({ id: u.id, email: u.email, emailVerified: new Date() })).toBe(true);
    expect((await db.select().from(donors))[0].userId).toBe(u.id);
  });
});
