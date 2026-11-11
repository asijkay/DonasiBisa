import "server-only";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  brandConfig,
  campaigns,
  donations,
  notificationLogs,
  notificationTemplates,
  type NotificationChannel,
} from "@/db/schema";
import { getEnv, isDevelopment } from "@/lib/env";
import { enqueueJob, registerLocalHandler } from "@/lib/qstash/queue";
import { EVENT_KEYS, type EventKey } from "@/lib/notifications/templates";
import { renderTemplate, type TemplateVars } from "@/lib/notifications/render";
import { emailConfigured, getEmailProvider, type EmailProvider } from "@/lib/notifications/email";
import { fonnteProvider, NotificationSendError, whatsappConfigured, type WhatsappProvider } from "@/lib/notifications/whatsapp";
import { formatIDR } from "@/lib/utils/format";
import { unsubscribeApiUrl, unsubscribeUrl } from "@/lib/unsubscribe";
import { escapeHtml } from "@/lib/notifications/render";
import { donors } from "@/db/schema";

const MAX_ATTEMPTS = 3;

type DonationRow = typeof donations.$inferSelect;

/**
 * Outbox step, run INSIDE the settlement/payment transaction: creates one log row per channel with a
 * unique (donation, channel, event) key so repeated webhooks never produce repeated messages.
 * Returns ids that should be dispatched after commit.
 */
export async function queueNotifications(tx: Tx, donation: DonationRow, eventKey: EventKey): Promise<string[]> {
  const rows: Array<typeof notificationLogs.$inferInsert> = [
    {
      donationId: donation.id,
      eventKey,
      channel: "EMAIL",
      recipient: donation.donorEmailSnapshot,
      status: "QUEUED",
    },
  ];
  const waAllowed = donation.whatsappOptInSnapshot && !!donation.donorWhatsappSnapshot;
  const waExpiryOff = eventKey === "PAYMENT_EXPIRED"; // PRD: WA for expiry/failure is optional, default off
  rows.push({
    donationId: donation.id,
    eventKey,
    channel: "WHATSAPP",
    recipient: donation.donorWhatsappSnapshot ?? "-",
    status: waAllowed && !waExpiryOff ? "QUEUED" : "SKIPPED",
    errorMessage: !waAllowed ? "NO_WHATSAPP_CONSENT" : waExpiryOff ? "WHATSAPP_EXPIRY_DISABLED" : null,
  });
  const inserted = await tx
    .insert(notificationLogs)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: notificationLogs.id, status: notificationLogs.status });
  return inserted.filter((r) => r.status === "QUEUED").map((r) => r.id);
}

/** Post-commit: hand ids to the queue. Never throws into the caller. */
export async function publishNotificationJobs(logIds: string[]): Promise<void> {
  if (!logIds.length) return;
  try {
    await enqueueJob("notifications", { logIds });
  } catch (e) {
    console.error("[notifications] enqueue failed", (e as Error).message);
  }
}

export type DispatchDeps = { email?: EmailProvider; whatsapp?: WhatsappProvider };

async function loadContext(donationId: string) {
  const [row] = await db
    .select({ donation: donations, campaignTitle: campaigns.title, donorOptOut: donors.emailOptOut })
    .from(donations)
    .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
    .innerJoin(donors, eq(donors.id, donations.donorId))
    .where(eq(donations.id, donationId))
    .limit(1);
  const [brand] = await db.select().from(brandConfig).limit(1);
  return { row, brandName: brand?.brandName ?? getEnv().EMAIL_FROM_NAME };
}

/** Render + send a single queued log entry. Failures are recorded, never thrown to the payment flow. */
export async function dispatchNotification(logId: string, deps: DispatchDeps = {}): Promise<void> {
  const [log] = await db.select().from(notificationLogs).where(eq(notificationLogs.id, logId)).limit(1);
  if (!log || log.status !== "QUEUED") return; // already handled → idempotent
  const channel: NotificationChannel = log.channel;

  const mark = (patch: Partial<typeof notificationLogs.$inferInsert>) =>
    db.update(notificationLogs).set(patch).where(eq(notificationLogs.id, logId));

  try {
    const enabled = channel === "EMAIL" ? emailConfigured() || !!deps.email : whatsappConfigured() || !!deps.whatsapp;
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(and(eq(notificationTemplates.templateKey, log.eventKey), eq(notificationTemplates.channel, channel)))
      .limit(1);
    if (!template || !template.isActive) {
      await mark({ status: "SKIPPED", errorMessage: "TEMPLATE_INACTIVE_OR_MISSING", templateId: template?.id ?? null });
      return;
    }
    const { row, brandName } = await loadContext(log.donationId);
    if (!row) {
      await mark({ status: "FAILED", errorMessage: "DONATION_NOT_FOUND" });
      return;
    }
    const base = getEnv().NEXT_PUBLIC_APP_URL;
    const vars: TemplateVars = {
      donor_name: row.donation.donorNameSnapshot,
      donation_code: row.donation.donationCode,
      campaign_title: row.campaignTitle,
      amount: formatIDR(row.donation.amount),
      payment_url: `${base}/payment/${row.donation.donationCode}`,
      receipt_url: `${base}/account/transactions/${row.donation.donationCode}`,
      brand_name: brandName,
    };
    // Every message carries a working unsubscribe link (also exposed as List-Unsubscribe headers).
    const unsub = unsubscribeUrl(row.donation.donorId);
    const transactionalNote = log.eventKey === "PAYMENT_SUCCEEDED" ? "Pesan ini adalah bukti transaksi dan tetap dikirim. " : "";
    const text = `${renderTemplate(template.bodyText, vars, "text")}\n\n—\n${transactionalNote}Berhenti menerima pesan selain bukti transaksi: ${unsub}`;
    const subject = template.subject ? renderTemplate(template.subject, vars, "text") : "Notifikasi donasi";
    const html = template.bodyHtml
      ? `${renderTemplate(template.bodyHtml, vars, "html")}<hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px"/><p style="font-size:12px;color:#555">${transactionalNote}<a href="${escapeHtml(unsub)}">Berhenti menerima pesan selain bukti transaksi</a></p>`
      : undefined;
    const headers = { "List-Unsubscribe": `<${unsubscribeApiUrl(row.donation.donorId)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };

    // Unsubscribed donors still get the payment receipt (transactional) but nothing else.
    if (row.donorOptOut && log.eventKey !== "PAYMENT_SUCCEEDED") {
      await mark({ status: "SKIPPED", errorMessage: "UNSUBSCRIBED", templateId: template.id });
      return;
    }
    // Defence in depth: WhatsApp only ever goes out with a true consent snapshot.
    if (channel === "WHATSAPP" && !row.donation.whatsappOptInSnapshot) {
      await mark({ status: "SKIPPED", errorMessage: "NO_WHATSAPP_CONSENT", templateId: template.id });
      return;
    }
    if (!enabled) {
      await mark({
        status: "SKIPPED",
        templateId: template.id,
        errorMessage: "CHANNEL_DISABLED",
        metadataSanitized: isDevelopment() ? { preview: { subject, text: text.slice(0, 500) } } : null,
      });
      return;
    }

    const attempts = log.attempts + 1;
    const result =
      channel === "EMAIL"
        ? await (deps.email ?? getEmailProvider()).send({ to: log.recipient, subject, text, html, headers })
        : await (deps.whatsapp ?? fonnteProvider).send({ to: log.recipient, message: text });
    await mark({ status: "SENT", attempts, templateId: template.id, providerMessageId: result.messageId ?? null, sentAt: new Date(), errorMessage: null });
  } catch (e) {
    const retryable = e instanceof NotificationSendError ? e.retryable : true;
    await mark({
      status: "FAILED",
      attempts: log.attempts + 1,
      errorMessage: (e as Error).message.slice(0, 300),
      metadataSanitized: { retryable },
    });
  }
}

export async function dispatchNotifications(logIds: string[], deps: DispatchDeps = {}): Promise<void> {
  for (const id of logIds) await dispatchNotification(id, deps);
}

/** Retry sweep: re-queue retryable failures (bounded attempts) and dispatch them. */
export async function retryFailedNotifications(deps: DispatchDeps = {}): Promise<number> {
  const failed = await db
    .select({ id: notificationLogs.id })
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.status, "FAILED"),
        lt(notificationLogs.attempts, MAX_ATTEMPTS),
        sql`coalesce((${notificationLogs.metadataSanitized}->>'retryable')::boolean, true) = true`,
      ),
    )
    .limit(50);
  if (!failed.length) return 0;
  await db
    .update(notificationLogs)
    .set({ status: "QUEUED" })
    .where(sql`${notificationLogs.id} in ${failed.map((f) => f.id)}`);
  await dispatchNotifications(failed.map((f) => f.id), deps);
  return failed.length;
}

registerLocalHandler("notifications", async (payload) => {
  const p = payload as { logIds?: string[]; sweep?: boolean };
  if (p.sweep) await retryFailedNotifications();
  else await dispatchNotifications(p.logIds ?? []);
});

export { EVENT_KEYS };

export async function listNotificationLogs(limit = 100) {
  return db.select().from(notificationLogs).orderBy(desc(notificationLogs.createdAt)).limit(limit);
}
