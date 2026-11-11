import "server-only";
import { and, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  campaigns,
  donations,
  paymentLogs,
  payments,
  webhookEvents,
  type Provider,
} from "@/db/schema";
import { cacheDel } from "@/lib/cache/redis";
import { CacheKeys } from "@/lib/cache/cache-keys";
import { getAdapter } from "@/lib/payments/registry";
import { canTransition } from "@/lib/payments/status-mapper";
import type { NormalizedPaymentEvent } from "@/lib/payments/types";
import { invalidateCampaignCache } from "./campaigns.service";
import { publishNotificationJobs, queueNotifications } from "./notifications.service";
import { registerLocalHandler } from "@/lib/qstash/queue";

export type SettleOutcome = "APPLIED" | "DUPLICATE" | "IGNORED";
export type SettleResult = { outcome: SettleOutcome; reason?: string; paymentStatus?: string; becameSucceeded?: boolean };

type Effects = { campaignSlug?: string; notificationIds: string[] };

/**
 * Settlement inside ONE transaction (TRD §4.3). Row locks on payment+donation serialize concurrent
 * deliveries; the donation UPDATE is conditional on status = 'PENDING', so raised_amount can only
 * increase once per donation no matter how many events arrive.
 */
async function settleInTx(tx: Tx, event: NormalizedPaymentEvent, effects: Effects): Promise<SettleResult> {
  const [payment] = await tx
    .select()
    .from(payments)
    .where(and(eq(payments.provider, event.provider), eq(payments.providerReference, event.providerReference)))
    .for("update");
  if (!payment) return { outcome: "IGNORED", reason: "UNKNOWN_REFERENCE" };

  const [donation] = await tx.select().from(donations).where(eq(donations.id, payment.donationId)).for("update");
  if (!donation) return { outcome: "IGNORED", reason: "DONATION_NOT_FOUND" };

  const log = (eventType: string, before: string | null, after: string | null, extra: Record<string, unknown> = {}) =>
    tx.insert(paymentLogs).values({
      paymentId: payment.id,
      provider: event.provider,
      eventType,
      statusBefore: before,
      statusAfter: after,
      metadataSanitized: { donationCode: donation.donationCode, providerEventStatus: event.status, ...extra },
    });

  // Never trust the notification alone: amount/currency must match our own record.
  if ((event.amount !== undefined && event.amount !== donation.amount) || (event.currency && event.currency !== "IDR")) {
    await log("settlement.mismatch", payment.status, payment.status, { reportedAmount: event.amount ?? null, expectedAmount: donation.amount });
    return { outcome: "IGNORED", reason: "AMOUNT_MISMATCH", paymentStatus: payment.status };
  }

  const from = payment.status;
  if (!canTransition(from, event.status)) {
    // Stale/duplicate/regressing event (e.g. late "pending" after success). Flag late money for Finance.
    const late = event.status === "SUCCEEDED" && from !== "SUCCEEDED";
    await log(late ? "settlement.late_success_ignored" : "settlement.stale_ignored", from, from);
    return { outcome: "IGNORED", reason: late ? "LATE_SUCCESS" : "STALE_EVENT", paymentStatus: from };
  }

  const now = new Date();
  await tx
    .update(payments)
    .set({
      status: event.status,
      paidAt: event.status === "SUCCEEDED" ? (event.occurredAt ?? now) : payment.paidAt,
      providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId,
      paymentMethod: event.paymentMethod ?? payment.paymentMethod,
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id));

  let becameSucceeded = false;

  if (event.status === "SUCCEEDED") {
    const flipped = await tx
      .update(donations)
      .set({ status: "SUCCEEDED", paidAt: now, updatedAt: now })
      .where(and(eq(donations.id, donation.id), eq(donations.status, "PENDING")))
      .returning();
    if (flipped.length) {
      becameSucceeded = true;
      const [camp] = await tx
        .update(campaigns)
        .set({ raisedAmount: sql`${campaigns.raisedAmount} + ${donation.amount}`, updatedAt: now })
        .where(eq(campaigns.id, donation.campaignId))
        .returning();
      if (camp.autoCloseOnTarget && camp.status === "PUBLISHED" && camp.raisedAmount >= camp.targetAmount) {
        await tx
          .update(campaigns)
          .set({ status: "COMPLETED", closeReason: "TARGET_REACHED", updatedAt: now })
          .where(and(eq(campaigns.id, camp.id), eq(campaigns.status, "PUBLISHED")));
      }
      effects.campaignSlug = camp.slug;
      effects.notificationIds.push(...(await queueNotifications(tx, flipped[0], "PAYMENT_SUCCEEDED")));
    } else {
      await log("settlement.donation_not_pending", from, "SUCCEEDED", { donationStatus: donation.status });
    }
  } else if (event.status === "FAILED" || event.status === "EXPIRED" || event.status === "CANCELLED") {
    const others = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.donationId, donation.id), ne(payments.id, payment.id), inArray(payments.status, ["CREATED", "PENDING"])));
    if (!others.length) {
      const flipped = await tx
        .update(donations)
        .set({ status: event.status, updatedAt: now })
        .where(and(eq(donations.id, donation.id), eq(donations.status, "PENDING")))
        .returning();
      if (flipped.length && event.status !== "CANCELLED") {
        effects.notificationIds.push(...(await queueNotifications(tx, flipped[0], "PAYMENT_EXPIRED")));
      }
    }
  } else if (event.status === "REFUNDED") {
    // Provider-confirmed refund: record status only. raised_amount is intentionally untouched
    // (ERD: aggregate only increases); Finance reconciles refunds manually. See README "Keputusan terbuka".
    await tx
      .update(donations)
      .set({ status: "REFUNDED", updatedAt: now })
      .where(and(eq(donations.id, donation.id), eq(donations.status, "SUCCEEDED")));
  }

  await log("settlement.applied", from, event.status, { becameSucceeded });
  return { outcome: "APPLIED", paymentStatus: event.status, becameSucceeded };
}

/**
 * Idempotent entry point for verified provider events (webhook or status poll).
 * Order: persist event (dedupe) → settle in transaction → post-commit effects.
 */
export async function applyPaymentEvent(event: NormalizedPaymentEvent): Promise<SettleResult> {
  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: event.provider,
      externalEventId: event.externalEventId,
      providerReference: event.providerReference,
      eventType: event.eventType,
      payloadSanitized: event.payloadSanitized,
      processingStatus: "RECEIVED",
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });

  let eventId = inserted[0]?.id;
  if (!eventId) {
    const [existing] = await db
      .select()
      .from(webhookEvents)
      .where(and(eq(webhookEvents.provider, event.provider), eq(webhookEvents.externalEventId, event.externalEventId)))
      .limit(1);
    if (existing && (existing.processingStatus === "PROCESSED" || existing.processingStatus === "IGNORED")) {
      return { outcome: "DUPLICATE" };
    }
    eventId = existing?.id;
  }

  const effects: Effects = { notificationIds: [] };
  try {
    const result = await db.transaction((tx) => settleInTx(tx, event, effects));
    await db
      .update(webhookEvents)
      .set({
        processingStatus: result.outcome === "IGNORED" ? "IGNORED" : "PROCESSED",
        errorMessage: result.reason ?? null,
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.id, eventId));

    // Post-commit side effects: cache + async notifications. None can alter the payment outcome.
    if (effects.campaignSlug) {
      await invalidateCampaignCache(effects.campaignSlug);
      await cacheDel(CacheKeys.featuredCampaigns);
    }
    await publishNotificationJobs(effects.notificationIds);
    return result;
  } catch (e) {
    await db
      .update(webhookEvents)
      .set({ processingStatus: "FAILED", errorMessage: (e as Error).message.slice(0, 300), processedAt: new Date() })
      .where(eq(webhookEvents.id, eventId));
    throw e; // non-2xx → provider retries
  }
}

/** Server-to-server verification for a payment (used by the "cek status" button and reconciliation). */
export async function reconcilePayment(paymentId: string): Promise<SettleResult | null> {
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!p) return null;
  const event = await getAdapter(p.provider as Provider).getPaymentStatus(p.providerReference, p.providerPaymentId);
  if (!event) return null;
  return applyPaymentEvent(event);
}

export async function reconcileLatestPaymentByCode(donationCode: string): Promise<SettleResult | null> {
  const [row] = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .innerJoin(donations, eq(donations.id, payments.donationId))
    .where(eq(donations.donationCode, donationCode))
    .orderBy(sql`${payments.createdAt} desc`)
    .limit(1);
  if (!row || (row.status !== "PENDING" && row.status !== "CREATED")) return null;
  return reconcilePayment(row.id);
}

/**
 * Job: poll provider for stale pending payments; mark EXPIRED only after expiry AND a provider check.
 */
export async function expirePayments(now: Date = new Date()): Promise<{ checked: number; expired: number; settled: number }> {
  const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);
  const candidates = await db
    .select({ p: payments, dExpires: donations.expiresAt })
    .from(payments)
    .innerJoin(donations, eq(donations.id, payments.donationId))
    .where(and(inArray(payments.status, ["PENDING", "CREATED"]), or(lt(payments.createdAt, staleBefore), lt(payments.expiresAt, now))))
    .limit(100);

  let expired = 0;
  let settled = 0;
  for (const { p, dExpires } of candidates) {
    const expiry = p.expiresAt ?? dExpires;
    let polled: NormalizedPaymentEvent | null = null;
    try {
      polled = p.status === "PENDING" ? await getAdapter(p.provider as Provider).getPaymentStatus(p.providerReference, p.providerPaymentId) : null;
    } catch (e) {
      console.error("[expire-payments] provider check failed", p.providerReference, (e as Error).message);
      continue; // never expire on provider outage
    }
    if (polled && polled.status !== "PENDING") {
      const r = await applyPaymentEvent(polled);
      if (r.outcome === "APPLIED") settled++;
      continue;
    }
    if (expiry && expiry <= now) {
      const r = await applyPaymentEvent({
        provider: p.provider,
        externalEventId: `expire:${p.id}`,
        providerReference: p.providerReference,
        eventType: "reconciliation.expired",
        status: "EXPIRED",
        payloadSanitized: { reason: "expiry_elapsed_and_provider_pending" },
      });
      if (r.outcome === "APPLIED") expired++;
    }
  }

  // Donations that never got a payment attempt and passed their TTL.
  await db
    .update(donations)
    .set({ status: "EXPIRED", updatedAt: now })
    .where(
      and(
        eq(donations.status, "PENDING"),
        lt(donations.expiresAt, now),
        sql`not exists (select 1 from ${payments} where ${payments.donationId} = ${donations.id} and ${payments.status} in ('CREATED','PENDING'))`,
      ),
    );
  return { checked: candidates.length, expired, settled };
}

registerLocalHandler("expire-payments", async () => expirePayments());
