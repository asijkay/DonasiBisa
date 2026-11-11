import Link from "next/link";
import type { Metadata } from "next";
import { PageNav } from "@/components/public/page-nav";
import { CoverImage } from "@/components/public/cover-image";
import { EmptyState, PageHeading } from "@/components/ui";
import { listPublishedNews } from "@/services/news.service";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Berita", description: "Kabar terbaru dan perkembangan penyaluran dari kampanye donasi.", alternates: { canonical: "/news" } };

export default async function NewsPage() {
  const news = await listPublishedNews(50);
  return (
    <div>
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Berita" }]} />
      <PageHeading title="Berita &amp; kabar" />
      {news.length === 0 ? (
        <EmptyState title="Belum ada berita" />
      ) : (
        <ul className="space-y-6">
          {news.map((n) => (
            <li key={n.slug} className="card-hover flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm sm:flex-row">
              {(n.coverImageUrl ?? n.campaignCoverUrl) && <CoverImage src={n.coverImageUrl ?? n.campaignCoverUrl} alt="" sizes="(min-width: 640px) 240px, 100vw" className="h-44 w-full shrink-0 sm:h-auto sm:w-60" />}
              <div className="p-4 sm:p-6">
              <p className="text-xs text-slate-500">{formatDate(n.publishedAt)}{n.campaignTitle ? ` · Kabar kampanye: ${n.campaignTitle}` : " · Berita umum"}</p>
              <h2 className="mt-1 text-lg font-semibold"><Link href={`/news/${n.slug}`} className="hover:underline">{n.title}</Link></h2>
              <p className="mt-1 text-sm text-slate-600">{n.excerpt}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
