import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { Markdown } from "@/components/public/markdown";
import { CoverImage } from "@/components/public/cover-image";
import { getPublishedNews } from "@/services/news.service";
import { formatDate } from "@/lib/utils/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getPublishedNews((await params).slug);
  if (!row) return {};
  const slug = (await params).slug;
  return {
    title: row.n.title,
    description: row.n.excerpt,
    alternates: { canonical: `/news/${slug}` },
    openGraph: { title: row.n.title, description: row.n.excerpt, type: "article", images: row.n.coverImageUrl ? [{ url: row.n.coverImageUrl, alt: row.n.coverImageAlt ?? row.n.title }] : undefined },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const row = await getPublishedNews((await params).slug);
  if (!row) notFound();
  const { n } = row;
  return (
    <article className="mx-auto max-w-3xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Berita", href: "/news" }, { label: n.title }]} />
      <CoverImage src={n.coverImageUrl} alt={n.coverImageAlt ?? `Gambar untuk berita: ${n.title}`} className="mb-5 h-56 w-full rounded-xl" />
      <p className="text-sm text-slate-500">
        {formatDate(n.publishedAt)}
        {row.campaignSlug && (
          <> · Update campaign: <Link className="text-brand-ink hover:underline" href={`/campaigns/${row.campaignSlug}`}>{row.campaignTitle}</Link></>
        )}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{n.title}</h1>
      <div className="mt-4"><Markdown>{n.bodyMd}</Markdown></div>
    </article>
  );
}
