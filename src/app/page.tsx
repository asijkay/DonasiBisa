import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { CampaignCard } from "@/components/public/campaign-card";
import { CategoryLinks, CtaBand, Faq, Hero, HowItWorks, SectionHeading, StatsBand, TrustSection } from "@/components/public/landing-sections";
import { Reveal } from "@/components/public/reveal";
import { IconArrow } from "@/components/public/icons";
import { getBrand } from "@/services/brand.service";
import { getPublicStats, listPublicCampaigns } from "@/services/campaigns.service";
import { listPublishedNews } from "@/services/news.service";
import { formatDate } from "@/lib/utils/format";

export default async function HomePage() {
  const [brand, stats, featured, active, news] = await Promise.all([
    getBrand(),
    getPublicStats(),
    listPublicCampaigns({ featured: true, limit: 3 }),
    listPublicCampaigns({ limit: 6 }),
    listPublishedNews(6),
  ]);
  const featuredIds = new Set(featured.map((c) => c.id));
  const campaigns = [...featured, ...active.filter((c) => !featuredIds.has(c.id))].slice(0, 6);

  return (
    <div>
      <Hero ctaLabel={brand.ctaLabel} stats={stats} />
      <CategoryLinks />

      <section id="campaign" aria-labelledby="h-campaign" className="scroll-mt-24 pb-14">
        <Reveal className="mb-8"><div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow="Campaign pilihan" title="Dukung mereka yang membutuhkan"><span id="h-campaign" className="sr-only">Campaign pilihan</span></SectionHeading>
          <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink hover:underline">Lihat semua <IconArrow width={16} height={16} /></Link>
        </div></Reveal>
        {campaigns.length === 0 ? (
          <EmptyState title="Campaign akan segera hadir">Campaign yang dipublikasikan admin akan tampil di sini.</EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{campaigns.map((c, i) => (<CampaignCard key={c.id} c={c} delay={(i % 3) * 90} />))}</div>
        )}
      </section>

      <StatsBand stats={stats} />
      <HowItWorks />
      <TrustSection />

      <section aria-labelledby="h-news" className="py-16">
        <Reveal className="mb-8"><div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow="Berita" title="Kabar &amp; update terbaru"><span id="h-news" className="sr-only">Berita terbaru</span></SectionHeading>
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink hover:underline">Semua berita <IconArrow width={16} height={16} /></Link>
        </div></Reveal>
        {news.length === 0 ? (
          <EmptyState title="Belum ada berita" />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.slice(0, 3).map((n, i) => (
              <li key={n.slug}><Reveal delay={i * 90} className="h-full"><div className="card-hover h-full rounded-2xl border border-slate-200 bg-card p-4 shadow-sm sm:p-6">
                <p className="text-xs font-medium text-brand-ink">{formatDate(n.publishedAt)}{n.campaignTitle ? ` · Update: ${n.campaignTitle}` : ""}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900"><Link href={`/news/${n.slug}`} className="hover:text-brand-ink">{n.title}</Link></h3>
                <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{n.excerpt}</p>
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
