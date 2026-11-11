import { ButtonLink, EmptyState } from "@/components/ui";
import { CampaignCard } from "@/components/public/campaign-card";
import { getBrand } from "@/services/brand.service";
import { listPublicCampaigns } from "@/services/campaigns.service";
import { listPublishedNews } from "@/services/news.service";
import { formatDate } from "@/lib/utils/format";
import Link from "next/link";

export default async function HomePage() {
  const [brand, featured, active, news] = await Promise.all([
    getBrand(),
    listPublicCampaigns({ featured: true, limit: 3 }),
    listPublicCampaigns({ limit: 12 }),
    listPublishedNews(6),
  ]);
  const featuredIds = new Set(featured.map((c) => c.id));
  const others = active.filter((c) => !featuredIds.has(c.id));

  return (
    <div className="space-y-14">
      <section className="rounded-2xl bg-gradient-to-br from-brand/10 via-card to-brand-accent/10 px-6 py-12 sm:px-12">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{brand.tagline ?? `Berdonasi bersama ${brand.brandName}`}</h1>
        <p className="mt-3 max-w-xl text-slate-600">Pilih campaign, donasi tanpa perlu membuat akun, dan pantau perkembangannya.</p>
        <ButtonLink href="#campaign" className="mt-6">{brand.ctaLabel}</ButtonLink>
      </section>

      <section id="campaign" aria-labelledby="h-campaign" className="scroll-mt-20">
        <h2 id="h-campaign" className="mb-4 text-xl font-bold">Campaign unggulan &amp; aktif</h2>
        {featured.length + others.length === 0 ? (
          <EmptyState title="Belum ada campaign aktif">Campaign yang dipublikasikan admin akan tampil di sini.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...featured, ...others].map((c) => (
              <CampaignCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="h-how">
        <h2 id="h-how" className="mb-4 text-xl font-bold">Cara berdonasi</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {["Pilih campaign dan nominal", "Isi data singkat dan pilih metode pembayaran", "Selesaikan pembayaran; konfirmasi dikirim lewat email/WhatsApp"].map((t, i) => (
            <li key={t} className="rounded-xl border border-slate-200 bg-card p-4">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <p className="text-sm text-slate-700">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="h-news">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="h-news" className="text-xl font-bold">Berita terbaru</h2>
          <Link href="/news" className="text-sm font-medium text-brand hover:underline">Semua berita</Link>
        </div>
        {news.length === 0 ? (
          <EmptyState title="Belum ada berita" />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <li key={n.slug} className="rounded-xl border border-slate-200 bg-card p-4">
                <p className="text-xs text-slate-500">{formatDate(n.publishedAt)}{n.campaignTitle ? ` · Update: ${n.campaignTitle}` : ""}</p>
                <h3 className="mt-1 font-semibold"><Link href={`/news/${n.slug}`} className="hover:underline">{n.title}</Link></h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{n.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
