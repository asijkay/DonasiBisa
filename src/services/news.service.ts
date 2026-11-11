import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, newsPosts } from "@/db/schema";
import { cacheDel, cached } from "@/lib/cache/redis";
import { CACHE_TTL_SECONDS, CacheKeys } from "@/lib/cache/cache-keys";
import type { NewsInput } from "@/lib/validation/schemas";
import { DomainError, invalidateCampaignCache } from "./campaigns.service";
import { writeAudit } from "./audit.service";

export type NewsCardDTO = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  campaignSlug: string | null;
  campaignTitle: string | null;
  /** Cover of the related campaign, used as an illustration when the post has no image of its own. */
  campaignCoverUrl: string | null;
};

export async function listPublishedNews(limit = 20): Promise<NewsCardDTO[]> {
  const load = async () => {
    const rows = await db
      .select({
        slug: newsPosts.slug,
        title: newsPosts.title,
        excerpt: newsPosts.excerpt,
        coverImageUrl: newsPosts.coverImageUrl,
        publishedAt: newsPosts.publishedAt,
        campaignSlug: campaigns.slug,
        campaignTitle: campaigns.title,
        campaignCoverUrl: campaigns.coverImageUrl,
      })
      .from(newsPosts)
      .leftJoin(campaigns, eq(campaigns.id, newsPosts.campaignId))
      .where(eq(newsPosts.status, "PUBLISHED"))
      .orderBy(desc(newsPosts.publishedAt))
      .limit(limit);
    return JSON.parse(JSON.stringify(rows)) as NewsCardDTO[];
  };
  return limit === 6 ? cached(CacheKeys.newsLatest, CACHE_TTL_SECONDS, load) : load();
}

export async function getPublishedNews(slug: string) {
  const [row] = await db
    .select({ n: newsPosts, campaignSlug: campaigns.slug, campaignTitle: campaigns.title, campaignCoverUrl: campaigns.coverImageUrl })
    .from(newsPosts)
    .leftJoin(campaigns, eq(campaigns.id, newsPosts.campaignId))
    .where(and(eq(newsPosts.slug, slug), eq(newsPosts.status, "PUBLISHED")))
    .limit(1);
  return row ?? null;
}

export async function listAdminNews() {
  return db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt));
}

export async function getAdminNews(id: string) {
  const [n] = await db.select().from(newsPosts).where(eq(newsPosts.id, id)).limit(1);
  return n ?? null;
}

export async function saveNews(id: string | null, input: NewsInput, actorId: string) {
  const [dupe] = await db.select({ id: newsPosts.id }).from(newsPosts).where(eq(newsPosts.slug, input.slug)).limit(1);
  if (dupe && dupe.id !== id) throw new DomainError("Slug sudah digunakan.", "SLUG_TAKEN", 409);
  const now = new Date();
  const values = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    bodyMd: input.bodyMd,
    coverImageUrl: input.coverImageUrl ?? null,
    coverImageAlt: input.coverImageAlt ?? null,
    campaignId: input.campaignId ?? null,
    status: input.status,
    updatedAt: now,
  };
  let saved: typeof newsPosts.$inferSelect;
  if (id) {
    const before = await getAdminNews(id);
    if (!before) throw new DomainError("Berita tidak ditemukan.", "NOT_FOUND", 404);
    [saved] = await db
      .update(newsPosts)
      .set({ ...values, publishedAt: input.status === "PUBLISHED" ? (before.publishedAt ?? now) : before.publishedAt })
      .where(eq(newsPosts.id, id))
      .returning();
    await writeAudit(db, actorId, "news.update", "news", id, { status: before.status }, { status: saved.status });
  } else {
    [saved] = await db
      .insert(newsPosts)
      .values({ ...values, authorId: actorId, publishedAt: input.status === "PUBLISHED" ? now : null })
      .returning();
    await writeAudit(db, actorId, "news.create", "news", saved.id, null, { slug: saved.slug });
  }
  await cacheDel(CacheKeys.newsLatest);
  if (saved.campaignId) {
    const [c] = await db.select({ slug: campaigns.slug }).from(campaigns).where(eq(campaigns.id, saved.campaignId)).limit(1);
    if (c) await invalidateCampaignCache(c.slug);
  }
  return saved;
}

export async function deleteNews(id: string, actorId: string): Promise<void> {
  const before = await getAdminNews(id);
  if (!before) return;
  await db.delete(newsPosts).where(eq(newsPosts.id, id));
  await writeAudit(db, actorId, "news.delete", "news", id, { slug: before.slug }, null);
  await cacheDel(CacheKeys.newsLatest);
  await invalidateCampaignCache();
}
