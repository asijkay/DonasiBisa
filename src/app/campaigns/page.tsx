import Link from "next/link";
import type { Metadata } from "next";
import { PageNav } from "@/components/public/page-nav";
import { EmptyState, PageHeading, cn } from "@/components/ui";
import { CampaignCard } from "@/components/public/campaign-card";
import { CATEGORY_META } from "@/components/public/icons";
import { CAMPAIGN_CATEGORIES, type CampaignCategory } from "@/db/schema";
import { listPublicCampaigns } from "@/services/campaigns.service";

export const metadata: Metadata = { title: "Campaign", description: "Telusuri campaign donasi yang sedang berjalan maupun yang sudah tercapai, lalu donasi tanpa perlu membuat akun.", alternates: { canonical: "/campaigns" } };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ kategori?: string; status?: string }> }) {
  const { kategori, status } = await searchParams;
  const completed = status === "selesai";
  const category = CAMPAIGN_CATEGORIES.includes(kategori as CampaignCategory) ? (kategori as CampaignCategory) : undefined;
  const rows = await listPublicCampaigns({ category, limit: 48, completed });
  const chip = "rounded-full border px-4 py-1.5 text-sm font-semibold transition";
  return (
    <div>
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Campaign" }]} />
      <PageHeading title="Campaign donasi" />
      <nav aria-label="Filter kategori" className="mb-6 flex flex-wrap gap-2">
        <Link href="/campaigns" aria-current={!category && !completed ? "page" : undefined} className={cn(chip, !category && !completed ? "border-brand bg-brand text-white" : "border-slate-300 hover:border-brand hover:text-brand-ink")}>Semua</Link>
        {CAMPAIGN_CATEGORIES.map((k) => (
          <Link key={k} href={`/campaigns?kategori=${k}`} aria-current={category === k ? "page" : undefined} className={cn(chip, category === k ? "border-brand bg-brand text-white" : "border-slate-300 hover:border-brand hover:text-brand-ink")}>{CATEGORY_META[k].label}</Link>
        ))}
        <Link href="/campaigns?status=selesai" aria-current={completed ? "page" : undefined} className={cn(chip, completed ? "border-brand bg-brand text-white" : "border-slate-300 hover:border-brand hover:text-brand-ink")}>Sudah tercapai</Link>
      </nav>
      {rows.length === 0 ? <EmptyState title={completed ? "Belum ada campaign yang selesai" : "Belum ada campaign di kategori ini"}>Coba kategori lain atau kembali lagi nanti.</EmptyState> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((c) => (<CampaignCard key={c.id} c={c} headingLevel="h2" />))}</div>
      )}
    </div>
  );
}
