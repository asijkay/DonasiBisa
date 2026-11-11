import type { MetadataRoute } from "next";
import { listPublicCampaigns } from "@/services/campaigns.service";
import { listPublishedNews } from "@/services/news.service";
import { siteUrl } from "@/lib/utils/site";

export const dynamic = "force-dynamic";

const STATIC = ["", "/campaigns", "/news", "/tentang", "/terms", "/privacy", "/refund", "/cookies", "/aksesibilitas", "/kredit-foto", "/permintaan-data"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC.map((p) => ({ url: `${base}${p}` }));
  try {
    const [open, done, news] = await Promise.all([listPublicCampaigns({ limit: 200 }), listPublicCampaigns({ limit: 200, completed: true }), listPublishedNews(200)]);
    for (const c of [...open, ...done]) entries.push({ url: `${base}/campaigns/${c.slug}` });
    for (const n of news) entries.push({ url: `${base}/news/${n.slug}`, lastModified: n.publishedAt ?? undefined });
  } catch {
    // The static pages are still worth listing if the database is unreachable.
  }
  return entries;
}
