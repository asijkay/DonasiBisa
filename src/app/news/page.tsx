import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageHeading } from "@/components/ui";
import { listPublishedNews } from "@/services/news.service";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Berita" };

export default async function NewsPage() {
  const news = await listPublishedNews(50);
  return (
    <div>
      <PageHeading title="Berita &amp; update" />
      {news.length === 0 ? (
        <EmptyState title="Belum ada berita" />
      ) : (
        <ul className="space-y-4">
          {news.map((n) => (
            <li key={n.slug} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{formatDate(n.publishedAt)}{n.campaignTitle ? ` · Update campaign: ${n.campaignTitle}` : " · Berita umum"}</p>
              <h2 className="mt-1 text-lg font-semibold"><Link href={`/news/${n.slug}`} className="hover:underline">{n.title}</Link></h2>
              <p className="mt-1 text-sm text-slate-600">{n.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
