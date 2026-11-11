import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  dataRequests,
  donations,
  donors,
  notificationLogs,
  userRoles,
  users,
  webhookEvents,
} from "@/db/schema";
import { normalizeEmail } from "@/lib/utils/contact";
import { DomainError } from "./campaigns.service";
import { writeAudit } from "./audit.service";

const REMOVED_NAME = "Donatur (data dihapus)";

/** Stop all non-receipt messages (email + WhatsApp). Receipts stay because they are transactional. */
export async function unsubscribeDonor(donorId: string): Promise<boolean> {
  const rows = await db
    .update(donors)
    .set({ emailOptOut: true, whatsappOptIn: false, updatedAt: new Date() })
    .where(eq(donors.id, donorId))
    .returning({ id: donors.id });
  return rows.length > 0;
}

/**
 * Right to erasure. Personal data is replaced; the financial skeleton (amount, status, campaign, dates, code)
 * is kept because payment records must be retained for accounting/audit purposes.
 */
export async function anonymizeDonor(donorId: string, actorUserId: string | null): Promise<{ donations: number }> {
  return db.transaction(async (tx) => {
    const [donor] = await tx.select().from(donors).where(eq(donors.id, donorId)).for("update");
    if (!donor) throw new DomainError("Data donatur tidak ditemukan.", "NOT_FOUND", 404);

    const rows = await tx.select({ id: donations.id, code: donations.donationCode }).from(donations).where(eq(donations.donorId, donorId));
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      await tx
        .update(donations)
        .set({
          donorNameSnapshot: REMOVED_NAME,
          donorEmailSnapshot: sql`'deleted-' || ${donations.id} || '@deleted.invalid'`,
          donorWhatsappSnapshot: null,
          whatsappOptInSnapshot: false,
          message: null,
          isAnonymous: true,
          updatedAt: new Date(),
        })
        .where(inArray(donations.id, ids));
      await tx.update(notificationLogs).set({ recipient: "[dihapus]", metadataSanitized: null, errorMessage: null }).where(inArray(notificationLogs.donationId, ids));
      // Provider webhooks may echo customer details; drop stored payloads for these donations.
      for (const r of rows) {
        await tx.update(webhookEvents).set({ payloadSanitized: null }).where(sql`${webhookEvents.providerReference} like ${r.code + "-%"}`);
      }
    }
    await tx
      .update(donors)
      .set({
        fullName: REMOVED_NAME,
        email: sql`'deleted-' || ${donors.id} || '@deleted.invalid'`,
        normalizedEmail: sql`'deleted-' || ${donors.id} || '@deleted.invalid'`,
        whatsappNumber: null,
        whatsappOptIn: false,
        emailOptOut: true,
        userId: null,
        anonymizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(donors.id, donorId));
    await writeAudit(tx, actorUserId, "privacy.anonymize", "donor", donorId, null, { donations: ids.length });
    return { donations: ids.length };
  });
}

/** Self-service: anonymise the donor profile linked to this user and delete the login account. */
export async function eraseAccount(userId: string): Promise<void> {
  const [roles, supers] = await Promise.all([
    db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId)),
    db.select({ n: sql<number>`count(*)::int` }).from(userRoles).where(eq(userRoles.role, "SUPER_ADMIN")),
  ]);
  if (roles.some((r) => r.role === "SUPER_ADMIN") && supers[0].n <= 1) {
    throw new DomainError("Anda adalah Super Admin terakhir. Alihkan peran Super Admin ke orang lain sebelum menghapus akun.", "LAST_SUPER_ADMIN", 409);
  }
  const [donor] = await db.select({ id: donors.id }).from(donors).where(eq(donors.userId, userId)).limit(1);
  if (donor) await anonymizeDonor(donor.id, userId);
  await writeAudit(db, null, "privacy.account_deleted", "user", userId, null, null);
  await db.delete(users).where(eq(users.id, userId)); // cascades accounts, sessions, roles
}

/** Right of access / portability: everything we hold about the donor linked to this user. */
export async function exportAccountData(userId: string) {
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
  const [donor] = await db.select().from(donors).where(eq(donors.userId, userId)).limit(1);
  const rows = donor
    ? await db
        .select({
          donationCode: donations.donationCode,
          campaign: campaigns.title,
          amountIdr: donations.amount,
          status: donations.status,
          createdAt: donations.createdAt,
          paidAt: donations.paidAt,
          isAnonymous: donations.isAnonymous,
          message: donations.message,
          whatsappOptIn: donations.whatsappOptInSnapshot,
          termsAcceptedAt: donations.termsAcceptedAt,
          consentVersion: donations.consentVersion,
          ageConfirmed: donations.ageConfirmed,
        })
        .from(donations)
        .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
        .where(eq(donations.donorId, donor.id))
    : [];
  return {
    exportedAt: new Date().toISOString(),
    account: user ?? null,
    donorProfile: donor
      ? { fullName: donor.fullName, email: donor.email, whatsappNumber: donor.whatsappNumber, whatsappOptIn: donor.whatsappOptIn, emailOptOut: donor.emailOptOut }
      : null,
    donations: rows,
  };
}

/* ---------- Guest data requests (access / deletion) ---------- */

export async function createDataRequest(input: { type: "ACCESS" | "DELETE"; email: string; details?: string | null }) {
  const normalizedEmail = normalizeEmail(input.email);
  const [open] = await db
    .select({ id: dataRequests.id })
    .from(dataRequests)
    .where(and(eq(dataRequests.normalizedEmail, normalizedEmail), eq(dataRequests.type, input.type), eq(dataRequests.status, "OPEN")))
    .limit(1);
  if (open) return open; // idempotent: one open request per email/type
  const [row] = await db
    .insert(dataRequests)
    .values({ type: input.type, email: input.email.trim(), normalizedEmail, details: input.details?.slice(0, 1000) || null })
    .returning({ id: dataRequests.id });
  return row;
}

export async function listDataRequests() {
  return db.select().from(dataRequests).orderBy(sql`${dataRequests.status} = 'OPEN' desc`, sql`${dataRequests.createdAt} desc`).limit(200);
}

export async function resolveDataRequest(id: string, outcome: "DONE" | "REJECTED", actorId: string, opts: { anonymize?: boolean } = {}): Promise<void> {
  const [req] = await db.select().from(dataRequests).where(eq(dataRequests.id, id)).limit(1);
  if (!req) throw new DomainError("Permintaan tidak ditemukan.", "NOT_FOUND", 404);
  if (opts.anonymize && req.type === "DELETE") {
    const [donor] = await db.select({ id: donors.id }).from(donors).where(eq(donors.normalizedEmail, req.normalizedEmail)).limit(1);
    if (donor) await anonymizeDonor(donor.id, actorId);
  }
  await db.update(dataRequests).set({ status: outcome, resolvedAt: new Date(), resolvedBy: actorId }).where(eq(dataRequests.id, id));
  await writeAudit(db, actorId, "privacy.request_resolved", "data_request", id, { type: req.type }, { outcome, anonymized: !!opts.anonymize });
}
