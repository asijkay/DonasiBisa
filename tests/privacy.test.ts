import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, db } from "../src/db";
import { donations, donors, notificationLogs, notificationTemplates, users } from "../src/db/schema";
import { donationInputSchema } from "../src/lib/validation/schemas";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../src/lib/unsubscribe";
import { DEFAULT_TEMPLATES } from "../src/lib/notifications/templates";
import { CONSENT_VERSION } from "../src/lib/consent";
import { createDonation } from "../src/services/donations.service";
import { dispatchNotification, queueNotifications } from "../src/services/notifications.service";
import { anonymizeDonor, createDataRequest, eraseAccount, exportAccountData, unsubscribeDonor } from "../src/services/privacy.service";
import { makeCampaign, resetDb } from "./helpers";

const base = {
  campaignSlug: "x",
  amount: 25_000,
  donor: { name: "Siti", email: "siti@example.com", whatsapp: null as string | null, whatsappOptIn: false },
  isAnonymous: false,
  acceptedTerms: true,
  ageConfirmed: true,
} as const;

beforeEach(resetDb);
afterAll(async () => {
  await new Promise((r) => setTimeout(r, 300));
  await closeDb();
});

describe("consent validation", () => {
  it("requires explicit terms + age confirmation (not defaulted)", () => {
    expect(donationInputSchema.safeParse(base).success).toBe(true);
    expect(donationInputSchema.safeParse({ ...base, acceptedTerms: false }).success).toBe(false);
    expect(donationInputSchema.safeParse({ ...base, ageConfirmed: false }).success).toBe(false);
    const noTerms: Record<string, unknown> = { ...base };
    delete noTerms.acceptedTerms;
    expect(donationInputSchema.safeParse(noTerms).success).toBe(false);
  });
  it("asks for a phone number only when WhatsApp is opted in", () => {
    expect(donationInputSchema.safeParse(base).success).toBe(true); // no phone needed
    const optInNoPhone = { ...base, donor: { ...base.donor, whatsappOptIn: true } };
    expect(donationInputSchema.safeParse(optInNoPhone).success).toBe(false);
    expect(donationInputSchema.safeParse({ ...optInNoPhone, donor: { ...optInNoPhone.donor, whatsapp: "081234567890" } }).success).toBe(true);
  });
});

describe("data minimisation + consent record", () => {
  it("does not store a phone number without WhatsApp opt-in, and records consent", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ ...base, campaignSlug: c.slug, donor: { ...base.donor, whatsapp: "081234567890" } });
    expect(d.donorWhatsappSnapshot).toBeNull();
    expect(d.whatsappOptInSnapshot).toBe(false);
    expect(d).toMatchObject({ ageConfirmed: true, consentVersion: CONSENT_VERSION });
    expect(d.termsAcceptedAt).toBeInstanceOf(Date);
    const [donor] = await db.select().from(donors);
    expect(donor.whatsappNumber).toBeNull();
  });
  it("keeps the number only with opt-in", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ ...base, campaignSlug: c.slug, donor: { ...base.donor, whatsapp: "081234567890", whatsappOptIn: true } });
    expect(d.donorWhatsappSnapshot).toBe("+6281234567890");
  });
});

describe("unsubscribe", () => {
  it("tokens are tamper-proof", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const t = createUnsubscribeToken(id);
    expect(verifyUnsubscribeToken(t)).toBe(id);
    expect(verifyUnsubscribeToken(`${t}x`)).toBeNull();
    expect(verifyUnsubscribeToken("garbage")).toBeNull();
    expect(verifyUnsubscribeToken(createUnsubscribeToken("22222222-2222-4222-8222-222222222222").replace(/\..*/, "") + "." + t.split(".")[1])).toBeNull();
  });

  it("every message has an unsubscribe link + List-Unsubscribe headers; opted-out donors only get receipts", async () => {
    await db.insert(notificationTemplates).values(DEFAULT_TEMPLATES.map((t) => ({ templateKey: t.templateKey, channel: t.channel, subject: t.subject ?? null, bodyText: t.bodyText, bodyHtml: t.bodyHtml ?? null })));
    const c = await makeCampaign();
    const d = await createDonation({ ...base, campaignSlug: c.slug });
    const send = vi.fn().mockResolvedValue({ messageId: "m1" });

    // 1) normal donor: instruction email carries the link + headers
    let ids = await db.transaction((tx) => queueNotifications(tx, d, "DONATION_CREATED"));
    await dispatchNotification(ids[0], { email: { send } });
    const sent = send.mock.calls[0][0] as { text: string; html: string; headers: Record<string, string> };
    expect(sent.text).toMatch(/\/unsubscribe\?t=/);
    expect(sent.html).toMatch(/unsubscribe\?t=/);
    expect(sent.headers["List-Unsubscribe"]).toMatch(/\/api\/unsubscribe\?t=/);
    expect(sent.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");

    // 2) after unsubscribing: expiry notice is skipped, receipt still goes out
    await unsubscribeDonor(d.donorId);
    ids = await db.transaction((tx) => queueNotifications(tx, d, "PAYMENT_EXPIRED"));
    await dispatchNotification(ids[0], { email: { send } });
    const [expired] = await db.select().from(notificationLogs).where(eq(notificationLogs.id, ids[0]));
    expect(expired).toMatchObject({ status: "SKIPPED", errorMessage: "UNSUBSCRIBED" });
    expect(send).toHaveBeenCalledTimes(1);

    ids = await db.transaction((tx) => queueNotifications(tx, d, "PAYMENT_SUCCEEDED"));
    await dispatchNotification(ids[0], { email: { send } });
    expect(send).toHaveBeenCalledTimes(2);
    expect((send.mock.calls[1][0] as { text: string }).text).toMatch(/bukti transaksi/);
  });
});

describe("data deletion (right to erasure)", () => {
  it("anonymises identity but keeps the financial record", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ ...base, campaignSlug: c.slug, message: "Doa saya", donor: { ...base.donor, whatsapp: "081234567890", whatsappOptIn: true } });
    const res = await anonymizeDonor(d.donorId, null);
    expect(res.donations).toBe(1);
    const [after] = await db.select().from(donations).where(eq(donations.id, d.id));
    expect(after).toMatchObject({ amount: 25_000, donationCode: d.donationCode, status: "PENDING", donorNameSnapshot: "Donatur (data dihapus)", donorWhatsappSnapshot: null, message: null });
    expect(after.donorEmailSnapshot).toMatch(/@deleted\.invalid$/);
    const [donor] = await db.select().from(donors).where(eq(donors.id, d.donorId));
    expect(donor).toMatchObject({ fullName: "Donatur (data dihapus)", whatsappNumber: null, whatsappOptIn: false });
    expect(donor.anonymizedAt).toBeInstanceOf(Date);
    expect(donor.email).not.toContain("siti");
  });

  it("account erasure deletes the login and anonymises linked data; export returns own data", async () => {
    const c = await makeCampaign();
    const d = await createDonation({ ...base, campaignSlug: c.slug });
    const [u] = await db.insert(users).values({ email: "siti@example.com", name: "Siti", emailVerified: new Date() }).returning();
    await db.update(donors).set({ userId: u.id }).where(eq(donors.id, d.donorId));
    const exported = await exportAccountData(u.id);
    expect(exported.donations).toHaveLength(1);
    expect(exported.donorProfile?.email).toBe("siti@example.com");
    await eraseAccount(u.id);
    expect(await db.select().from(users).where(eq(users.id, u.id))).toHaveLength(0);
    const [donor] = await db.select().from(donors).where(eq(donors.id, d.donorId));
    expect(donor.anonymizedAt).not.toBeNull();
  });

  it("data requests are deduplicated per email/type", async () => {
    const a = await createDataRequest({ type: "DELETE", email: "Siti@Example.com" });
    const b = await createDataRequest({ type: "DELETE", email: "siti@example.com" });
    expect(a.id).toBe(b.id);
  });
});
