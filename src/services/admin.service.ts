import "server-only";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  campaigns,
  donations,
  donors,
  notificationTemplates,
  paymentLogs,
  paymentMethodConfigs,
  paymentProviders,
  payments,
  userRoles,
  users,
  type DonationStatus,
  type Provider,
  type Role,
} from "@/db/schema";
import { getAdapter } from "@/lib/payments/registry";
import { findUnknownPlaceholders } from "@/lib/notifications/render";
import { DomainError } from "./campaigns.service";
import { fillDailySeries } from "@/lib/utils/series";
import { writeAudit } from "./audit.service";

export async function dashboardStats() {
  const [c] = await db
    .select({ active: sql<number>`count(*) filter (where ${campaigns.status} = 'PUBLISHED')::int` })
    .from(campaigns);
  const [d] = await db
    .select({
      succeeded: sql<number>`count(*) filter (where ${donations.status} = 'SUCCEEDED')::int`,
      pending: sql<number>`count(*) filter (where ${donations.status} = 'PENDING')::int`,
      value: sql<number>`coalesce(sum(${donations.amount}) filter (where ${donations.status} = 'SUCCEEDED'), 0)::bigint`,
    })
    .from(donations);
  return { activeCampaigns: c.active, succeededDonations: d.succeeded, pendingTransactions: d.pending, succeededValue: Number(d.value) };
}

/** Data for the dashboard charts: 30-day trend, top campaigns, donation outcomes and payment provider split. */
export async function dashboardCharts() {
  const when = sql`coalesce(${donations.paidAt}, ${donations.createdAt})`;
  const [daily, top, statuses, providers] = await Promise.all([
    db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${when} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`,
        amount: sql<number>`coalesce(sum(${donations.amount}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(donations)
      .where(and(eq(donations.status, "SUCCEEDED"), sql`${when} >= now() - interval '31 days'`))
      .groupBy(sql`1`),
    db
      .select({
        title: campaigns.title,
        amount: sql<number>`coalesce(sum(${donations.amount}), 0)::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(donations)
      .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
      .where(eq(donations.status, "SUCCEEDED"))
      .groupBy(campaigns.id, campaigns.title)
      .orderBy(desc(sql`2`))
      .limit(5),
    db.select({ status: donations.status, count: sql<number>`count(*)::int` }).from(donations).groupBy(donations.status),
    db
      .select({ provider: payments.provider, amount: sql<number>`coalesce(sum(${donations.amount}), 0)::bigint`, count: sql<number>`count(*)::int` })
      .from(payments)
      .innerJoin(donations, eq(donations.id, payments.donationId))
      .where(and(eq(donations.status, "SUCCEEDED"), eq(payments.status, "SUCCEEDED")))
      .groupBy(payments.provider),
  ]);
  return {
    daily: fillDailySeries(daily.map((r) => ({ date: r.date, amount: Number(r.amount), count: r.count })), 30),
    topCampaigns: top.map((r) => ({ title: r.title, amount: Number(r.amount), count: r.count })),
    statuses: statuses.map((r) => ({ status: r.status as string, count: r.count })),
    providers: providers.map((r) => ({ provider: r.provider as string, amount: Number(r.amount), count: r.count })),
  };
}

export async function listTransactions(filter: { status?: DonationStatus; provider?: Provider; page?: number; pageSize?: number } = {}) {
  const pageSize = filter.pageSize ?? 25;
  const page = Math.max(1, filter.page ?? 1);
  const rows = await db
    .select({
      d: donations,
      campaignTitle: campaigns.title,
      provider: sql<string | null>`(select p.provider::text from ${payments} p where p.donation_id = ${donations.id} order by p.created_at desc limit 1)`,
      paymentStatus: sql<string | null>`(select p.status::text from ${payments} p where p.donation_id = ${donations.id} order by p.created_at desc limit 1)`,
    })
    .from(donations)
    .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
    .where(
      and(
        filter.status ? eq(donations.status, filter.status) : undefined,
        filter.provider ? sql`exists (select 1 from ${payments} p where p.donation_id = ${donations.id} and p.provider = ${filter.provider})` : undefined,
      ),
    )
    .orderBy(desc(donations.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, page, pageSize };
}

export async function listDonors(search?: string) {
  const q = search?.trim();
  return db
    .select({
      donor: donors,
      total: sql<number>`coalesce((select sum(d.amount) from ${donations} d where d.donor_id = ${donors.id} and d.status = 'SUCCEEDED'), 0)::bigint`,
      count: sql<number>`(select count(*) from ${donations} d where d.donor_id = ${donors.id})::int`,
    })
    .from(donors)
    .where(q ? or(ilike(donors.fullName, `%${q}%`), ilike(donors.email, `%${q}%`)) : undefined)
    .orderBy(desc(donors.createdAt))
    .limit(100);
}

export async function getDonorDetail(id: string) {
  const [donor] = await db.select().from(donors).where(eq(donors.id, id)).limit(1);
  if (!donor) return null;
  const history = await db
    .select({ d: donations, campaignTitle: campaigns.title })
    .from(donations)
    .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
    .where(eq(donations.donorId, id))
    .orderBy(desc(donations.createdAt));
  return { donor, history };
}

export async function listPaymentLogs(limit = 100) {
  return db.select().from(paymentLogs).orderBy(desc(paymentLogs.createdAt)).limit(limit);
}

export async function listAuditLogs(limit = 100) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

/* ---- Payment methods ---- */

export async function listPaymentConfig() {
  const providers = await db.select().from(paymentProviders).orderBy(paymentProviders.sortOrder);
  const methods = await db.select().from(paymentMethodConfigs).orderBy(paymentMethodConfigs.sortOrder);
  return providers.map((p) => ({
    ...p,
    credentialsConfigured: getAdapter(p.provider).isConfigured(),
    methods: methods.filter((m) => m.providerId === p.id),
  }));
}

export async function setProviderEnabled(provider: Provider, enabled: boolean, actorId: string): Promise<void> {
  if (enabled && !getAdapter(provider).isConfigured()) {
    throw new DomainError("Kredensial provider belum dikonfigurasi di environment. Provider tidak dapat diaktifkan.", "PROVIDER_NOT_CONFIGURED", 409);
  }
  await db.update(paymentProviders).set({ isEnabled: enabled, updatedAt: new Date() }).where(eq(paymentProviders.provider, provider));
  await writeAudit(db, actorId, "payment.provider.toggle", "payment_provider", provider, null, { enabled });
}

export async function updateMethod(
  id: string,
  patch: { isEnabled: boolean; displayName: string; description: string | null; sortOrder: number },
  actorId: string,
): Promise<void> {
  await db.update(paymentMethodConfigs).set({ ...patch, updatedAt: new Date() }).where(eq(paymentMethodConfigs.id, id));
  await writeAudit(db, actorId, "payment.method.update", "payment_method", id, null, patch);
}

/** Persists a drag-and-drop order for one provider's channels (position in the list becomes sort_order). */
export async function reorderMethods(provider: Provider, orderedIds: string[], actorId: string): Promise<void> {
  if (orderedIds.length === 0 || new Set(orderedIds).size !== orderedIds.length) {
    throw new DomainError("Urutan tidak valid.", "INVALID_ORDER", 400);
  }
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ id: paymentProviders.id }).from(paymentProviders).where(eq(paymentProviders.provider, provider)).limit(1);
    if (!row) throw new DomainError("Provider tidak ditemukan.", "NOT_FOUND", 404);
    const owned = await tx
      .select({ id: paymentMethodConfigs.id })
      .from(paymentMethodConfigs)
      .where(and(eq(paymentMethodConfigs.providerId, row.id), inArray(paymentMethodConfigs.id, orderedIds)));
    if (owned.length !== orderedIds.length) throw new DomainError("Urutan tidak valid.", "INVALID_ORDER", 400);
    const now = new Date();
    for (const [index, id] of orderedIds.entries()) {
      await tx.update(paymentMethodConfigs).set({ sortOrder: index, updatedAt: now }).where(eq(paymentMethodConfigs.id, id));
    }
    await writeAudit(tx, actorId, "payment.method.reorder", "payment_provider", provider, null, { order: orderedIds });
  });
}

/* ---- Notification templates ---- */

export async function listTemplates() {
  return db.select().from(notificationTemplates).orderBy(notificationTemplates.templateKey, notificationTemplates.channel);
}

export async function saveTemplate(id: string, input: { subject?: string; bodyText: string; bodyHtml?: string; isActive: boolean }, actorId: string): Promise<void> {
  const unknown = findUnknownPlaceholders(input.subject, input.bodyText, input.bodyHtml);
  if (unknown.length) throw new DomainError(`Placeholder tidak dikenal: ${unknown.join(", ")}`, "UNKNOWN_PLACEHOLDER");
  await db
    .update(notificationTemplates)
    .set({ subject: input.subject ?? null, bodyText: input.bodyText, bodyHtml: input.bodyHtml ?? null, isActive: input.isActive, updatedAt: new Date() })
    .where(eq(notificationTemplates.id, id));
  await writeAudit(db, actorId, "notification.template.update", "notification_template", id, null, { isActive: input.isActive });
}

/* ---- Admin users ---- */

export async function listAdminUsers() {
  const rows = await db
    .select({ user: users, role: userRoles.role })
    .from(users)
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .orderBy(users.email);
  const map = new Map<string, { id: string; email: string | null; name: string | null; roles: Role[] }>();
  for (const r of rows) {
    const e = map.get(r.user.id) ?? { id: r.user.id, email: r.user.email, name: r.user.name, roles: [] };
    if (r.role) e.roles.push(r.role);
    map.set(r.user.id, e);
  }
  return [...map.values()];
}

/** Grants a role by e-mail of an already-registered, e-mail-verified user. */
export async function grantRole(email: string, role: Role, actorId: string): Promise<void> {
  const [u] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  if (!u) throw new DomainError("Pengguna belum pernah login. Minta pengguna login dengan Google terlebih dahulu.", "USER_NOT_FOUND", 404);
  if (!u.emailVerified) throw new DomainError("Email pengguna belum terverifikasi.", "EMAIL_UNVERIFIED", 409);
  await db.insert(userRoles).values({ userId: u.id, role }).onConflictDoNothing();
  await writeAudit(db, actorId, "admin.role.grant", "user", u.id, null, { role });
}

export async function revokeRole(userId: string, role: Role, actorId: string): Promise<void> {
  if (role === "SUPER_ADMIN") {
    const [n] = await db.select({ n: count() }).from(userRoles).where(eq(userRoles.role, "SUPER_ADMIN"));
    if (n.n <= 1) throw new DomainError("Tidak dapat mencabut Super Admin terakhir.", "LAST_SUPER_ADMIN", 409);
  }
  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)));
  await writeAudit(db, actorId, "admin.role.revoke", "user", userId, { role }, null);
}

