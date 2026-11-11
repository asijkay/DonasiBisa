import "server-only";
import { and, asc, desc, eq, gt, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import {
  campaignAmountOptions,
  campaigns,
  donations,
  newsPosts,
  type CampaignStatus,
  type CampaignCategory,
  type CloseReason,
} from "@/db/schema";
import { cached, cacheDel, cacheDelPrefix } from "@/lib/cache/redis";
import { CACHE_TTL_SECONDS, CacheKeys } from "@/lib/cache/cache-keys";
import type { CampaignInput } from "@/lib/validation/schemas";
import { writeAudit } from "./audit.service";

export type CampaignRow = typeof campaigns.$inferSelect;

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/* ---------- Pure domain rules (unit tested) ---------- */

export type DonationBlockReason =
  | "NOT_PUBLISHED"
  | "PAUSED"
  | "CLOSED"
  | "NOT_STARTED"
  | "ENDED"
  | "TARGET_REACHED";

type OpenCheckable = Pick<CampaignRow, "status" | "startsAt" | "endsAt" | "raisedAmount" | "targetAmount" | "autoCloseOnTarget">;

/** Returns why a campaign cannot take new donations, or null when it is open. */
export function getDonationBlockReason(c: OpenCheckable, now: Date = new Date()): DonationBlockReason | null {
  switch (c.status) {
    case "PUBLISHED":
      break;
    case "PAUSED":
      return "PAUSED";
    case "COMPLETED":
    case "CLOSED":
    case "ARCHIVED":
      return "CLOSED";
    default:
      return "NOT_PUBLISHED";
  }
  if (c.startsAt && c.startsAt > now) return "NOT_STARTED";
  if (c.endsAt && c.endsAt <= now) return "ENDED";
  if (c.autoCloseOnTarget && c.raisedAmount >= c.targetAmount) return "TARGET_REACHED";
  return null;
}

export const BLOCK_MESSAGES: Record<DonationBlockReason, string> = {
  NOT_PUBLISHED: "Campaign belum dipublikasikan.",
  PAUSED: "Campaign sedang dijeda dan belum menerima donasi baru.",
  CLOSED: "Campaign sudah ditutup dan tidak menerima donasi baru.",
  NOT_STARTED: "Campaign belum dimulai.",
  ENDED: "Periode campaign sudah berakhir.",
  TARGET_REACHED: "Target campaign sudah tercapai.",
};

export type AmountOptionRow = { id: string; amount: number; isActive: boolean };

/**
 * Server-side amount validation. For CLOSED_AMOUNT only an active preset (by id and value) is
 * accepted; client-supplied free amounts are ignored/rejected.
 */
export function resolveDonationAmount(
  campaign: Pick<CampaignRow, "amountMode">,
  options: AmountOptionRow[],
  input: { amount?: number | null; amountOptionId?: string | null },
  limits: { min: number; max: number },
): number {
  if (campaign.amountMode === "CLOSED_AMOUNT") {
    if (!input.amountOptionId) throw new DomainError("Pilih salah satu nominal donasi.", "AMOUNT_OPTION_REQUIRED");
    const opt = options.find((o) => o.id === input.amountOptionId && o.isActive);
    if (!opt) throw new DomainError("Nominal donasi tidak tersedia.", "AMOUNT_OPTION_INVALID");
    if (input.amount != null && input.amount !== opt.amount) {
      throw new DomainError("Nominal tidak sesuai pilihan.", "AMOUNT_OPTION_MISMATCH");
    }
    return opt.amount;
  }
  const amount = input.amount;
  if (amount == null || !Number.isInteger(amount)) throw new DomainError("Nominal donasi wajib diisi.", "AMOUNT_REQUIRED");
  if (amount < limits.min) throw new DomainError(`Nominal minimal ${limits.min.toLocaleString("id-ID")}.`, "AMOUNT_TOO_LOW");
  if (amount > limits.max) throw new DomainError(`Nominal maksimal ${limits.max.toLocaleString("id-ID")}.`, "AMOUNT_TOO_HIGH");
  return amount;
}

const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["PAUSED", "COMPLETED", "CLOSED"],
  PAUSED: ["PUBLISHED", "CLOSED"],
  COMPLETED: ["ARCHIVED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canCampaignTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/* ---------- Public DTOs (JSON-safe, no private data) ---------- */

export type CampaignCardDTO = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  targetAmount: number;
  raisedAmount: number;
  status: CampaignStatus;
  amountMode: "OPEN_AMOUNT" | "CLOSED_AMOUNT";
  category: CampaignCategory;
  endsAt: string | null;
  isDemo: boolean;
  isOpen: boolean;
};

export type CampaignDetailDTO = CampaignCardDTO & {
  descriptionMd: string;
  closeReason: CloseReason | null;
  options: Array<{ id: string; amount: number; label: string | null }>;
  updates: Array<{ slug: string; title: string; excerpt: string; publishedAt: string | null }>;
};

function toCard(c: CampaignRow): CampaignCardDTO {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    coverImageUrl: c.coverImageUrl,
    coverImageAlt: c.coverImageAlt,
    targetAmount: c.targetAmount,
    raisedAmount: c.raisedAmount,
    status: c.status,
    amountMode: c.amountMode,
    category: c.category,
    endsAt: c.endsAt?.toISOString() ?? null,
    isDemo: c.isDemo,
    isOpen: getDonationBlockReason(c) === null,
  };
}

const json = <T>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;

export async function listPublicCampaigns(opts: { featured?: boolean; limit?: number; category?: CampaignCategory } = {}): Promise<CampaignCardDTO[]> {
  const key = opts.featured ? CacheKeys.featuredCampaigns : `${CacheKeys.campaignList}:${opts.limit ?? 24}:${opts.category ?? "all"}`;
  return cached(key, CACHE_TTL_SECONDS, async () => {
    const now = new Date();
    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, "PUBLISHED"),
          opts.featured ? eq(campaigns.isFeatured, true) : undefined,
          opts.category ? eq(campaigns.category, opts.category) : undefined,
          or(sql`${campaigns.endsAt} is null`, gt(campaigns.endsAt, now)),
          or(sql`${campaigns.startsAt} is null`, lte(campaigns.startsAt, now)),
        ),
      )
      .orderBy(desc(campaigns.publishedAt))
      .limit(opts.limit ?? 24);
    return json<CampaignCardDTO[]>(rows.map(toCard));
  });
}

export async function getPublicCampaign(slug: string): Promise<CampaignDetailDTO | null> {
  return cached(CacheKeys.campaignDetail(slug), CACHE_TTL_SECONDS, async () => {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    if (!c || !["PUBLISHED", "PAUSED", "COMPLETED", "CLOSED"].includes(c.status)) return null as never;
    const [options, updates] = await Promise.all([
      db
        .select()
        .from(campaignAmountOptions)
        .where(and(eq(campaignAmountOptions.campaignId, c.id), eq(campaignAmountOptions.isActive, true)))
        .orderBy(asc(campaignAmountOptions.sortOrder), asc(campaignAmountOptions.amount)),
      db
        .select({ slug: newsPosts.slug, title: newsPosts.title, excerpt: newsPosts.excerpt, publishedAt: newsPosts.publishedAt })
        .from(newsPosts)
        .where(and(eq(newsPosts.campaignId, c.id), eq(newsPosts.status, "PUBLISHED")))
        .orderBy(desc(newsPosts.publishedAt))
        .limit(10),
    ]);
    return json<CampaignDetailDTO>({
      ...toCard(c),
      descriptionMd: c.descriptionMd,
      closeReason: c.closeReason,
      options: options.map((o) => ({ id: o.id, amount: o.amount, label: o.label })),
      updates,
    });
  });
}

export async function invalidateCampaignCache(slug?: string): Promise<void> {
  await cacheDel(CacheKeys.featuredCampaigns);
  await cacheDelPrefix(CacheKeys.campaignList);
  if (slug) await cacheDel(CacheKeys.campaignDetail(slug));
}

/* ---------- Admin operations ---------- */

type Actor = { userId: string };

function assertPublishable(c: CampaignRow, activeOptions: number): void {
  if (!c.title || !c.slug || !c.summary || !c.descriptionMd || !c.targetAmount) {
    throw new DomainError("Data wajib campaign belum lengkap.", "CAMPAIGN_INCOMPLETE");
  }
  if (c.amountMode === "CLOSED_AMOUNT" && activeOptions < 1) {
    throw new DomainError("Campaign nominal tetap memerlukan minimal satu pilihan nominal aktif.", "NO_AMOUNT_OPTIONS");
  }
}

async function replaceOptions(tx: Tx, campaignId: string, options: CampaignInput["amountOptions"]): Promise<void> {
  await tx.delete(campaignAmountOptions).where(eq(campaignAmountOptions.campaignId, campaignId));
  const unique = new Map(options.map((o) => [o.amount, o]));
  if (unique.size) {
    await tx.insert(campaignAmountOptions).values(
      [...unique.values()].map((o, i) => ({ campaignId, amount: o.amount, label: o.label ?? null, sortOrder: i })),
    );
  }
}

export async function createCampaign(input: CampaignInput, actor: Actor): Promise<CampaignRow> {
  const row = await db.transaction(async (tx) => {
    const [dupe] = await tx.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, input.slug)).limit(1);
    if (dupe) throw new DomainError("Slug sudah digunakan.", "SLUG_TAKEN", 409);
    const [created] = await tx
      .insert(campaigns)
      .values({
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        descriptionMd: input.descriptionMd,
        targetAmount: input.targetAmount,
        amountMode: input.amountMode,
        category: input.category,
        autoCloseOnTarget: input.autoCloseOnTarget,
        isFeatured: input.isFeatured,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        coverImageAlt: input.coverImageAlt ?? null,
        createdBy: actor.userId,
      })
      .returning();
    await replaceOptions(tx, created.id, input.amountOptions);
    await writeAudit(tx, actor.userId, "campaign.create", "campaign", created.id, null, { slug: created.slug, title: created.title });
    return created;
  });
  await invalidateCampaignCache(row.slug);
  return row;
}

export async function updateCampaign(id: string, input: CampaignInput, actor: Actor): Promise<CampaignRow> {
  const row = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(campaigns).where(eq(campaigns.id, id)).for("update");
    if (!before) throw new DomainError("Campaign tidak ditemukan.", "NOT_FOUND", 404);
    if (input.slug !== before.slug) {
      const [dupe] = await tx.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, input.slug)).limit(1);
      if (dupe) throw new DomainError("Slug sudah digunakan.", "SLUG_TAKEN", 409);
    }
    const [updated] = await tx
      .update(campaigns)
      .set({
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        descriptionMd: input.descriptionMd,
        targetAmount: input.targetAmount,
        amountMode: input.amountMode,
        category: input.category,
        autoCloseOnTarget: input.autoCloseOnTarget,
        isFeatured: input.isFeatured,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        coverImageAlt: input.coverImageAlt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();
    await replaceOptions(tx, id, input.amountOptions);
    await writeAudit(tx, actor.userId, "campaign.update", "campaign", id, { title: before.title, targetAmount: before.targetAmount }, { title: updated.title, targetAmount: updated.targetAmount });
    return { updated, oldSlug: before.slug };
  });
  await invalidateCampaignCache(row.oldSlug);
  await invalidateCampaignCache(row.updated.slug);
  return row.updated;
}

export async function setCampaignStatus(id: string, to: CampaignStatus, actor: Actor): Promise<CampaignRow> {
  const result = await db.transaction(async (tx) => {
    const [c] = await tx.select().from(campaigns).where(eq(campaigns.id, id)).for("update");
    if (!c) throw new DomainError("Campaign tidak ditemukan.", "NOT_FOUND", 404);
    if (!canCampaignTransition(c.status, to)) {
      throw new DomainError(`Transisi ${c.status} → ${to} tidak diizinkan.`, "INVALID_TRANSITION", 409);
    }
    if (to === "PUBLISHED") {
      const opts = await tx
        .select({ id: campaignAmountOptions.id })
        .from(campaignAmountOptions)
        .where(and(eq(campaignAmountOptions.campaignId, id), eq(campaignAmountOptions.isActive, true)));
      assertPublishable(c, opts.length);
    }
    const patch: Partial<typeof campaigns.$inferInsert> = { status: to, updatedAt: new Date() };
    if (to === "PUBLISHED" && !c.publishedAt) patch.publishedAt = new Date();
    if (to === "CLOSED") patch.closeReason = "MANUAL";
    const [updated] = await tx.update(campaigns).set(patch).where(eq(campaigns.id, id)).returning();
    await writeAudit(tx, actor.userId, "campaign.status", "campaign", id, { status: c.status }, { status: to });
    return updated;
  });
  await invalidateCampaignCache(result.slug);
  return result;
}

/* ---------- Lifecycle job (also callable directly) ---------- */

/**
 * Completes campaigns whose end date passed or whose target was reached (when auto-close is on).
 * Pending payments created earlier are untouched; their webhooks are still processed.
 */
export async function runCampaignLifecycle(now: Date = new Date()): Promise<{ completed: number }> {
  const ended = await db
    .update(campaigns)
    .set({ status: "COMPLETED", closeReason: "END_DATE", updatedAt: now })
    .where(and(eq(campaigns.status, "PUBLISHED"), isNotNull(campaigns.endsAt), lte(campaigns.endsAt, now)))
    .returning({ slug: campaigns.slug });
  const reached = await db
    .update(campaigns)
    .set({ status: "COMPLETED", closeReason: "TARGET_REACHED", updatedAt: now })
    .where(
      and(
        eq(campaigns.status, "PUBLISHED"),
        eq(campaigns.autoCloseOnTarget, true),
        sql`${campaigns.raisedAmount} >= ${campaigns.targetAmount}`,
      ),
    )
    .returning({ slug: campaigns.slug });
  const slugs = [...ended, ...reached].map((r) => r.slug);
  if (slugs.length) {
    await invalidateCampaignCache();
    await Promise.all(slugs.map((s) => cacheDel(CacheKeys.campaignDetail(s))));
  }
  return { completed: slugs.length };
}

export async function getCampaignForCheckout(slug: string) {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
  if (!c) return null;
  const options = await db
    .select({ id: campaignAmountOptions.id, amount: campaignAmountOptions.amount, isActive: campaignAmountOptions.isActive })
    .from(campaignAmountOptions)
    .where(eq(campaignAmountOptions.campaignId, c.id));
  return { campaign: c, options };
}

export async function listAdminCampaigns(): Promise<CampaignRow[]> {
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function getAdminCampaign(id: string) {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!c) return null;
  const options = await db
    .select()
    .from(campaignAmountOptions)
    .where(eq(campaignAmountOptions.campaignId, id))
    .orderBy(asc(campaignAmountOptions.sortOrder));
  return { campaign: c, options };
}

export async function campaignStatusCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: campaigns.status, n: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(inArray(campaigns.status, ["PUBLISHED", "DRAFT", "PAUSED", "COMPLETED", "CLOSED"]))
    .groupBy(campaigns.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

/* ---------- Public aggregate stats (no PII) ---------- */

export type PublicStats = { totalRaised: number; donorCount: number; donationCount: number; activeCampaigns: number };

export async function getPublicStats(): Promise<PublicStats> {
  return cached("stats:public:v1", CACHE_TTL_SECONDS, async () => {
    const [raised] = await db
      .select({ total: sql<number>`coalesce(sum(${campaigns.raisedAmount}), 0)::bigint`, active: sql<number>`count(*) filter (where ${campaigns.status} = 'PUBLISHED')::int` })
      .from(campaigns)
      .where(and(inArray(campaigns.status, ["PUBLISHED", "PAUSED", "COMPLETED", "CLOSED"]), eq(campaigns.isDemo, false)));
    const [d] = await db
      .select({ donors: sql<number>`count(distinct ${donations.donorId})::int`, n: sql<number>`count(*)::int` })
      .from(donations)
      .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
      .where(and(eq(donations.status, "SUCCEEDED"), eq(campaigns.isDemo, false)));
    return { totalRaised: Number(raised.total), donorCount: d.donors, donationCount: d.n, activeCampaigns: raised.active };
  });
}
