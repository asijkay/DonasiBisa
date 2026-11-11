import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { campaignAmountOptions, campaigns, donations, donors, paymentMethodConfigs, paymentProviders, payments } from "../src/db/schema";

export async function resetDb(): Promise<void> {
  await db.execute(sql`truncate table audit_logs, notification_logs, notification_templates, payment_logs, webhook_events, payments, donations, donors, campaign_amount_options, news_posts, campaigns, payment_method_configs, payment_providers, brand_config, user_roles, sessions, accounts, users restart identity cascade`);
}

let n = 0;
export async function makeCampaign(over: Partial<typeof campaigns.$inferInsert> = {}) {
  n++;
  const [c] = await db
    .insert(campaigns)
    .values({
      slug: `camp-${Date.now()}-${n}`,
      title: "Campaign Uji",
      summary: "Ringkasan campaign untuk pengujian",
      descriptionMd: "Deskripsi campaign untuk pengujian.",
      targetAmount: 1_000_000,
      amountMode: "OPEN_AMOUNT",
      status: "PUBLISHED",
      publishedAt: new Date(),
      ...over,
    })
    .returning();
  return c;
}

export async function makeOptions(campaignId: string, amounts: number[]) {
  return db.insert(campaignAmountOptions).values(amounts.map((amount, i) => ({ campaignId, amount, sortOrder: i }))).returning();
}

/** Seeds an enabled Midtrans provider + channel so donors can select it. */
export async function enableMidtrans(channel = "qris") {
  const [prov] = await db.insert(paymentProviders).values({ provider: "MIDTRANS", isEnabled: true, sortOrder: 1 }).onConflictDoNothing().returning();
  const providerId = prov?.id ?? (await db.select().from(paymentProviders))[0].id;
  await db.insert(paymentMethodConfigs).values({ providerId, channelCode: channel, displayName: "QRIS", isEnabled: true }).onConflictDoNothing();
}

export async function makeDonationWithPayment(campaignId: string, amount = 50_000, provider: "MIDTRANS" | "XENDIT" = "MIDTRANS") {
  const [donor] = await db.insert(donors).values({ fullName: "Budi", email: "budi@example.com", normalizedEmail: `budi${++n}@example.com` }).returning();
  const code = `DON-TEST${n}${Date.now()}`;
  const [donation] = await db
    .insert(donations)
    .values({ donationCode: code, campaignId, donorId: donor.id, amount, donorNameSnapshot: "Budi", donorEmailSnapshot: "budi@example.com", donorWhatsappSnapshot: "+628123456789", whatsappOptInSnapshot: true, status: "PENDING" })
    .returning();
  const [payment] = await db
    .insert(payments)
    .values({ donationId: donation.id, provider, providerReference: `${code}-1`, channelCode: "qris", status: "PENDING" })
    .returning();
  return { donor, donation, payment };
}
