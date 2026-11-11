import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { CampaignCard } from "@/components/public/campaign-card";
import { CategoryLinks, CtaBand, Faq, Hero, HowItWorks, SectionHeading, StatsBand, TransparencySection, TrustSection } from "@/components/public/landing-sections";
import { CoverImage } from "@/components/public/cover-image";
import { JsonLd } from "@/components/public/json-ld";
import { siteUrl } from "@/lib/utils/site";
import { Reveal } from "@/components/public/reveal";
import { IconArrow } from "@/components/public/icons";
import { getBrand } from "@/services/brand.service";
import { getPublicStats, listPublicCampaigns, publicCategoryCounts } from "@/services/campaigns.service";
import { listPublishedNews } from "@/services/news.service";
import { formatDate } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: { absolute: `${brand.brandName} — Donasi Online Aman, Tanpa Akun` },
    description: brand.tagline ?? "Pilih kampanye, donasi dalam hitungan menit tanpa perlu membuat akun, dan pantau perkembangannya.",
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [brand, stats, featured, active, news, counts] = await Promise.all([
    getBrand(),
    getPublicStats(),
    listPublicCampaigns({ featured: true, limit: 3 }),
    listPublicCampaigns({ limit: 6 }),
    listPublishedNews(6),
    publicCategoryCounts(),
  ]);
  const featuredIds = new Set(featured.map((c) => c.id));
  const campaigns = [...featured, ...active.filter((c) => !featuredIds.has(c.id))].slice(0, 6);

  const base = siteUrl();
  const organization = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: brand.legalName ?? brand.brandName,
        alternateName: brand.brandName,
        url: base,
        ...(brand.logoUrl ? { logo: brand.logoUrl } : { logo: `${base}/brand/icon-512.png` }),
        ...(brand.contactEmail ? { email: brand.contactEmail } : {}),
        ...(brand.contactWhatsapp ? { telephone: brand.contactWhatsapp } : {}),
        ...(brand.address ? { address: brand.address } : {}),
        ...(Object.values(brand.socialLinks).length ? { sameAs: Object.values(brand.socialLinks) } : {}),
      },
      { "@type": "WebSite", name: brand.brandName, url: base, inLanguage: "id", potentialAction: { "@type": "SearchAction", target: `${base}/campaigns?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    ],
  };

  return (
    <div>
      <JsonLd data={organization} />
      <Hero ctaLabel={brand.ctaLabel} stats={stats} />
      <CategoryLinks counts={counts} />

      <section id="campaign" aria-labelledby="h-campaign" className="scroll-mt-24 pb-14">
        <Reveal className="mb-8"><div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow="Kampanye pilihan" title="Dukung mereka yang membutuhkan"><span id="h-campaign" className="sr-only">Kampanye pilihan</span></SectionHeading>
          <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink hover:underline">Lihat semua <IconArrow width={16} height={16} /></Link>
        </div></Reveal>
        {/* Phones: swipeable row (keeps the page short); from sm up: the usual grid. */}
        {campaigns.length === 0 ? (
          <EmptyState title="Kampanye akan segera hadir">Kampanye yang dipublikasikan admin akan tampil di sini.</EmptyState>
        ) : (
          <div role="region" aria-label="Daftar kampanye pilihan" tabIndex={0} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {campaigns.map((c, i) => (<CampaignCard key={c.id} c={c} delay={(i % 3) * 90} wrapperClassName="w-[82%] shrink-0 snap-center sm:w-auto" />))}
          </div>
        )}
      </section>

      <StatsBand stats={stats} />
      <HowItWorks />
      <TrustSection />
      <TransparencySection brand={brand} />

      <section aria-labelledby="h-news" className="py-16">
        <Reveal className="mb-8"><div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow="Berita" title="Kabar terbaru"><span id="h-news" className="sr-only">Berita terbaru</span></SectionHeading>
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink hover:underline">Semua berita <IconArrow width={16} height={16} /></Link>
        </div></Reveal>
        {news.length === 0 ? (
          <EmptyState title="Belum ada berita" />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.slice(0, 3).map((n, i) => (
              <li key={n.slug}><Reveal delay={i * 90} className="h-full"><div className="card-hover h-full overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm">
                {(n.coverImageUrl ?? n.campaignCoverUrl) && <CoverImage src={n.coverImageUrl ?? n.campaignCoverUrl} alt="" sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="h-36 w-full" />}
                <div className="p-4 sm:p-6">
                <p className="text-xs font-medium text-brand-ink">{formatDate(n.publishedAt)}{n.campaignTitle ? ` · Kabar: ${n.campaignTitle}` : ""}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900"><Link href={`/news/${n.slug}`} className="hover:text-brand-ink">{n.title}</Link></h3>
                <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{n.excerpt}</p>
                </div>
              </div></Reveal></li>
            ))}
          </ul>
        )}
      </section>

      <Faq />
      <CtaBand ctaLabel={brand.ctaLabel} />
    </div>
  );
}
