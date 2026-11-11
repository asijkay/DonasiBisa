import { NextResponse } from "next/server";
import { getPublishedNews } from "@/services/news.service";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const row = await getPublishedNews(slug);
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const { n } = row;
  return NextResponse.json({ data: { slug: n.slug, title: n.title, excerpt: n.excerpt, bodyMd: n.bodyMd, coverImageUrl: n.coverImageUrl, publishedAt: n.publishedAt } });
}
