import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  donations,
  donors,
  paymentLogs,
  paymentMethodConfigs,
  paymentProviders,
  payments,
  type Provider,
} from "@/db/schema";
import { getEnv, liveMoneyEnabled } from "@/lib/env";
import { normalizeWhatsapp } from "@/lib/utils/contact";
import { CONSENT_VERSION } from "@/lib/consent";
import { generateDonationCode } from "@/lib/utils/security";
import { getAdapter } from "@/lib/payments/registry";
import { isSafeHttpUrl, sanitizePayload } from "@/lib/utils/security";
import type { DonationInput } from "@/lib/validation/schemas";
import {
  BLOCK_MESSAGES,
  DomainError,
  getCampaignForCheckout,
  getDonationBlockReason,
  resolveDonationAmount,
} from "./campaigns.service";
import { upsertDonor } from "./donors.service";
import { publishNotificationJobs, queueNotifications } from "./notifications.service";

/** Drizzle wraps driver errors; the Postgres code lives on the error or its cause. */
function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err.code === "23505" || err.cause?.code === "23505";
}

const DONATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Creates a PENDING donation. Amount, campaign state and presets are all re-validated from the DB. */
export async function createDonation(input: DonationInput, ctx: { idempotencyKey?: string | null } = {}) {
  const key = ctx.idempotencyKey?.slice(0, 100) || null;
  if (key) {
    const [existing] = await db.select().from(donations).where(eq(donations.idempotencyKey, key)).limit(1);
    if (existing) return existing;
  }

  const loaded = await getCampaignForCheckout(input.campaignSlug);
  if (!loaded) throw new DomainError("Kampanye tidak ditemukan.", "CAMPAIGN_NOT_FOUND", 404);
  const { campaign, options } = loaded;
  const block = getDonationBlockReason(campaign);
  if (block) throw new DomainError(BLOCK_MESSAGES[block], `CAMPAIGN_${block}`, 409);

  const env = getEnv();
  // Demo campaigns are fiction: they must never collect real money.
  if (campaign.isDemo && liveMoneyEnabled()) {
    throw new DomainError("Kampanye contoh (demo) tidak menerima donasi sungguhan.", "CAMPAIGN_DEMO", 409);
  }
  const amount = resolveDonationAmount(campaign, options, input, { min: env.MIN_DONATION_AMOUNT, max: env.MAX_DONATION_AMOUNT });
  // Data minimisation: keep the phone number only if the donor opted in to WhatsApp messages.
  let whatsapp: string | null = null;
  if (input.donor.whatsappOptIn) {
    whatsapp = normalizeWhatsapp(input.donor.whatsapp ?? "");
    if (!whatsapp) throw new DomainError("Nomor WhatsApp tidak valid.", "WHATSAPP_INVALID");
  }

  try {
    return await db.transaction(async (tx) => {
      const donor = await upsertDonor(tx, {
        name: input.donor.name,
        email: input.donor.email,
        whatsapp,
        whatsappOptIn: input.donor.whatsappOptIn,
      });
      const [created] = await tx
        .insert(donations)
        .values({
          donationCode: generateDonationCode(),
          idempotencyKey: key,
          campaignId: campaign.id,
          donorId: donor.id,
          amount,
          status: "PENDING",
          donorNameSnapshot: input.donor.name,
          donorEmailSnapshot: input.donor.email.trim(),
          donorWhatsappSnapshot: whatsapp,
          message: input.message || null,
          isAnonymous: input.isAnonymous,
          whatsappOptInSnapshot: input.donor.whatsappOptIn,
          termsAcceptedAt: new Date(),
          consentVersion: CONSENT_VERSION,
          ageConfirmed: input.ageConfirmed,
          expiresAt: new Date(Date.now() + DONATION_TTL_MS),
        })
        .returning();
      return created;
    });
  } catch (e) {
    // Lost an idempotency race: return the winner.
    if (key && isUniqueViolation(e)) {
      const [existing] = await db.select().from(donations).where(eq(donations.idempotencyKey, key)).limit(1);
      if (existing) return existing;
    }
    throw e;
  }
}

export type PublicPaymentMethod = {
  provider: Provider;
  channelCode: string;
  displayName: string;
  description: string | null;
};

/** Methods a donor may choose: provider enabled in DB AND configured in env/simulator AND channel enabled. */
export async function listAvailablePaymentMethods(): Promise<PublicPaymentMethod[]> {
  const rows = await db
    .select({
      provider: paymentProviders.provider,
      providerSort: paymentProviders.sortOrder,
      channelCode: paymentMethodConfigs.channelCode,
      displayName: paymentMethodConfigs.displayName,
      description: paymentMethodConfigs.description,
      sortOrder: paymentMethodConfigs.sortOrder,
    })
    .from(paymentMethodConfigs)
    .innerJoin(paymentProviders, eq(paymentProviders.id, paymentMethodConfigs.providerId))
    .where(and(eq(paymentProviders.isEnabled, true), eq(paymentMethodConfigs.isEnabled, true)))
    .orderBy(paymentProviders.sortOrder, paymentMethodConfigs.sortOrder);
  return rows
    .filter((r) => getAdapter(r.provider).isConfigured())
    .map(({ provider, channelCode, displayName, description }) => ({ provider, channelCode, displayName, description }));
}

export type PaymentView = {
  provider: Provider;
  status: string;
  checkoutUrl: string | null;
  expiresAt: string | null;
  instructions: Record<string, unknown> | null;
};

const ACTIVE = ["CREATED", "PENDING"] as const;

export async function createPaymentForDonation(
  donationCode: string,
  input: { provider: Provider; channelCode: string },
): Promise<PaymentView> {
  const env = getEnv();
  const adapter = getAdapter(input.provider);

  const methods = await listAvailablePaymentMethods();
  if (!methods.some((m) => m.provider === input.provider && m.channelCode === input.channelCode)) {
    throw new DomainError("Metode pembayaran tidak tersedia.", "METHOD_UNAVAILABLE", 400);
  }

  // Step 1 (tx): lock the donation, enforce one active attempt, reserve the attempt row.
  const reserved = await db.transaction(async (tx) => {
    const [d] = await tx.select().from(donations).where(eq(donations.donationCode, donationCode)).for("update");
    if (!d) throw new DomainError("Donasi tidak ditemukan.", "NOT_FOUND", 404);
    if (d.status !== "PENDING") throw new DomainError("Donasi tidak lagi menunggu pembayaran.", "DONATION_NOT_PENDING", 409);
    if (d.expiresAt && d.expiresAt <= new Date()) throw new DomainError("Donasi sudah kedaluwarsa.", "DONATION_EXPIRED", 409);
    const [campaign] = await tx.select().from(campaigns).where(eq(campaigns.id, d.campaignId)).limit(1);
    const block = campaign ? getDonationBlockReason(campaign) : "NOT_PUBLISHED";
    if (block && block !== "TARGET_REACHED") throw new DomainError(BLOCK_MESSAGES[block], `CAMPAIGN_${block}`, 409);

    const attempts = await tx.select().from(payments).where(eq(payments.donationId, d.id)).orderBy(desc(payments.createdAt));
    const active = attempts.find((p) => (ACTIVE as readonly string[]).includes(p.status));
    if (active) {
      if (active.status === "PENDING" && active.provider === input.provider && active.channelCode === input.channelCode) {
        return { kind: "reuse" as const, payment: active };
      }
      throw new DomainError("Pembayaran untuk donasi ini sedang diproses.", "PAYMENT_IN_PROGRESS", 409);
    }
    const reference = `${d.donationCode}-${attempts.length + 1}`;
    const [payment] = await tx
      .insert(payments)
      .values({ donationId: d.id, provider: input.provider, providerReference: reference, channelCode: input.channelCode, status: "CREATED" })
      .returning();
    return { kind: "new" as const, donation: d, campaignTitle: campaign?.title ?? "Donasi", payment };
  });

  if (reserved.kind === "reuse") return toPaymentView(reserved.payment);
  const { donation, payment, campaignTitle } = reserved;

  // Step 2: call provider OUTSIDE the transaction (network I/O).
  const base = env.NEXT_PUBLIC_APP_URL;
  const t0 = Date.now();
  try {
    const checkout = await adapter.createCheckout({
      reference: payment.providerReference,
      donationCode: donation.donationCode,
      amount: donation.amount, // always from DB
      currency: "IDR",
      donor: { name: donation.donorNameSnapshot, email: donation.donorEmailSnapshot, phone: donation.donorWhatsappSnapshot ?? undefined },
      channelCode: input.channelCode,
      description: `Donasi ${campaignTitle}`,
      successUrl: `${base}/payment/${donation.donationCode}/success`,
      pendingUrl: `${base}/payment/${donation.donationCode}/pending`,
      failureUrl: `${base}/payment/${donation.donationCode}`,
    });
    if (checkout.checkoutUrl && !isSafeHttpUrl(checkout.checkoutUrl, { allowLocalhostHttp: env.APP_ENV === "development" })) {
      throw new Error("Provider returned an unsafe checkout URL");
    }
    const out = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(payments)
        .set({
          status: "PENDING",
          providerPaymentId: checkout.providerPaymentId ?? null,
          checkoutUrl: checkout.checkoutUrl ?? null,
          instructionData: (checkout.instructionData as Record<string, unknown> | undefined) ?? null,
          providerMetadata: (sanitizePayload(checkout.rawSafeMetadata ?? {}) as Record<string, unknown>) ?? null,
          expiresAt: checkout.expiresAt ?? null,
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, payment.id), eq(payments.status, "CREATED")))
        .returning();
      if (checkout.expiresAt) await tx.update(donations).set({ expiresAt: checkout.expiresAt, updatedAt: new Date() }).where(eq(donations.id, donation.id));
      await tx.insert(paymentLogs).values({
        paymentId: payment.id,
        provider: input.provider,
        eventType: "checkout.created",
        statusBefore: "CREATED",
        statusAfter: "PENDING",
        metadataSanitized: { latencyMs: Date.now() - t0, channelCode: input.channelCode, donationCode: donation.donationCode },
      });
      // If a webhook already advanced the row (updated is undefined), read the current state instead.
      const current = updated ?? (await tx.select().from(payments).where(eq(payments.id, payment.id)).limit(1))[0]!;
      const logIds = await queueNotifications(tx, donation, "DONATION_CREATED");
      return { updated: current, logIds };
    });
    await publishNotificationJobs(out.logIds);
    return toPaymentView(out.updated);
  } catch (e) {
    const message = (e as Error).message.slice(0, 300);
    await db.transaction(async (tx) => {
      await tx.update(payments).set({ status: "FAILED", updatedAt: new Date() }).where(and(eq(payments.id, payment.id), eq(payments.status, "CREATED")));
      await tx.insert(paymentLogs).values({
        paymentId: payment.id,
        provider: input.provider,
        eventType: "checkout.failed",
        statusBefore: "CREATED",
        statusAfter: "FAILED",
        metadataSanitized: { error: message, latencyMs: Date.now() - t0 },
      });
    });
    throw new DomainError("Gagal membuat pembayaran. Silakan coba lagi.", "PROVIDER_ERROR", 502);
  }
}

function toPaymentView(p: typeof payments.$inferSelect): PaymentView {
  return {
    provider: p.provider,
    status: p.status,
    checkoutUrl: p.checkoutUrl,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    instructions: p.instructionData,
  };
}

export type DonationStatusView = {
  donationCode: string;
  status: string;
  amount: number;
  campaignTitle: string;
  campaignSlug: string;
  paidAt: string | null;
  expiresAt: string | null;
  latestPayment: PaymentView | null;
};

/** Public status view: deliberately excludes donor e-mail/phone. */
export async function getDonationStatus(code: string): Promise<DonationStatusView | null> {
  const [row] = await db
    .select({ d: donations, title: campaigns.title, slug: campaigns.slug })
    .from(donations)
    .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
    .where(eq(donations.donationCode, code))
    .limit(1);
  if (!row) return null;
  const [p] = await db.select().from(payments).where(eq(payments.donationId, row.d.id)).orderBy(desc(payments.createdAt)).limit(1);
  return {
    donationCode: row.d.donationCode,
    status: row.d.status,
    amount: row.d.amount,
    campaignTitle: row.title,
    campaignSlug: row.slug,
    paidAt: row.d.paidAt?.toISOString() ?? null,
    expiresAt: row.d.expiresAt?.toISOString() ?? null,
    latestPayment: p ? toPaymentView(p) : null,
  };
}

/* ---------- Donor-facing queries (always scoped by owning user) ---------- */

export async function getDonorForUser(userId: string) {
  const [d] = await db.select().from(donors).where(eq(donors.userId, userId)).limit(1);
  return d ?? null;
}

export async function getDonorSummary(donorId: string) {
  const [s] = await db
    .select({
      total: sql<number>`coalesce(sum(${donations.amount}) filter (where ${donations.status} = 'SUCCEEDED'), 0)::bigint`,
      succeeded: sql<number>`count(*) filter (where ${donations.status} = 'SUCCEEDED')::int`,
      all: count(),
    })
    .from(donations)
    .where(eq(donations.donorId, donorId));
  return { totalSucceeded: Number(s.total), succeededCount: s.succeeded, transactionCount: s.all };
}

export async function listDonorTransactions(donorId: string, limit = 50) {
  return db
    .select({ d: donations, campaignTitle: campaigns.title })
    .from(donations)
    .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
    .where(eq(donations.donorId, donorId))
    .orderBy(desc(donations.createdAt))
    .limit(limit);
}

/** Ownership-enforced lookup: returns null if the donation does not belong to the donor. */
export async function getDonorTransaction(donorId: string, code: string) {
  const [row] = await db
    .select({ d: donations, campaignTitle: campaigns.title })
    .from(donations)
    .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
    .where(and(eq(donations.donationCode, code), eq(donations.donorId, donorId)))
    .limit(1);
  return row ?? null;
}

