import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { JsonLd } from "@/components/public/json-ld";
import { siteUrl } from "@/lib/utils/site";
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
  const cover = n.coverImageUrl ?? row.campaignCoverUrl;
  const article = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.title,
    description: n.excerpt,
    inLanguage: "id",
    mainEntityOfPage: `${siteUrl()}/news/${n.slug}`,
    ...(n.publishedAt ? { datePublished: new Date(n.publishedAt).toISOString() } : {}),
    ...(n.updatedAt ? { dateModified: new Date(n.updatedAt).toISOString() } : {}),
    ...(cover ? { image: cover.startsWith("/") ? `${siteUrl()}${cover}` : cover } : {}),
  };
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={article} />
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Berita", href: "/news" }, { label: n.title }]} />
      {cover && (
        <figure className="mb-6">
          <CoverImage src={cover} alt={n.coverImageUrl ? (n.coverImageAlt ?? `Gambar untuk berita: ${n.title}`) : ""} sizes="(min-width: 768px) 768px, 100vw" priority className="h-56 w-full rounded-2xl sm:h-72" />
          {!n.coverImageUrl && <figcaption className="mt-2 text-xs text-slate-500">Foto ilustrasi kampanye terkait</figcaption>}
        </figure>
      )}
      <p className="text-sm text-slate-500">
        {formatDate(n.publishedAt)}
        {row.campaignSlug && (
          <> · Kabar kampanye: <Link className="text-brand-ink hover:underline" href={`/campaigns/${row.campaignSlug}`}>{row.campaignTitle}</Link></>
        )}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{n.title}</h1>
      <div className="mt-4"><Markdown>{n.bodyMd}</Markdown></div>
    </article>
  );
}
