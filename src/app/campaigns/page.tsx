import Link from "next/link";
import type { Metadata } from "next";
import { PageNav } from "@/components/public/page-nav";
import { EmptyState, Input, PageHeading, Select, cn } from "@/components/ui";
import { CampaignCard } from "@/components/public/campaign-card";
import { CATEGORY_META } from "@/components/public/icons";
import { CAMPAIGN_CATEGORIES, type CampaignCategory } from "@/db/schema";
import { listPublicCampaigns, publicCategoryCounts, type CampaignSort } from "@/services/campaigns.service";

export const metadata: Metadata = { title: "Kampanye", description: "Telusuri kampanye donasi yang sedang berjalan maupun yang sudah tercapai, lalu donasi tanpa perlu membuat akun.", alternates: { canonical: "/campaigns" } };

const SORTS: Array<{ value: CampaignSort; label: string }> = [
  { value: "terbaru", label: "Terbaru" },
  { value: "progres", label: "Progres tertinggi" },
  { value: "berakhir", label: "Segera berakhir" },
];

type Search = { kategori?: string; status?: string; q?: string; urut?: string };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { kategori, status, q, urut } = await searchParams;
  const completed = status === "selesai";
  const category = CAMPAIGN_CATEGORIES.includes(kategori as CampaignCategory) ? (kategori as CampaignCategory) : undefined;
  const sort = SORTS.some((s) => s.value === urut) ? (urut as CampaignSort) : "terbaru";
  const query = q?.trim().slice(0, 80) || undefined;
  const [rows, counts] = await Promise.all([
    listPublicCampaigns({ category, limit: 48, completed, q: query, sort }),
    publicCategoryCounts(completed),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const chip = "rounded-full border px-4 py-1.5 text-sm font-semibold transition";
  const on = "border-brand bg-brand text-white";
  const off = "border-slate-300 hover:border-brand hover:text-brand-ink";
  // Chips keep the current finished/open mode; empty categories are hidden unless currently selected.
  const mode = completed ? "&status=selesai" : "";
  const visible = CAMPAIGN_CATEGORIES.filter((k) => (counts[k] ?? 0) > 0 || k === category);
  return (
    <div>
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Kampanye" }]} />
      <PageHeading title={completed ? "Kampanye yang sudah tercapai" : "Kampanye donasi"} />

      <form role="search" action="/campaigns" className="mb-6 grid gap-4 sm:grid-cols-[1fr_200px_auto]">
        {category && <input type="hidden" name="kategori" value={category} />}
        {completed && <input type="hidden" name="status" value="selesai" />}
        <div>
          <label htmlFor="q" className="sr-only">Cari kampanye</label>
          <Input id="q" name="q" type="search" defaultValue={query ?? ""} placeholder="Cari kampanye…" maxLength={80} />
        </div>
        <div>
          <label htmlFor="urut" className="sr-only">Urutkan</label>
          <Select id="urut" name="urut" defaultValue={sort}>{SORTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</Select>
        </div>
        <button type="submit" className="rounded-xl border border-brand bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 active:scale-[0.99]">Cari</button>
      </form>

      <nav aria-label="Filter kategori" className="mb-6 flex flex-wrap gap-2">
        <Link href={completed ? "/campaigns?status=selesai" : "/campaigns"} aria-current={!category ? "page" : undefined} className={cn(chip, !category ? on : off)}>Semua ({total})</Link>
        {visible.map((k) => (
          <Link key={k} href={`/campaigns?kategori=${k}${mode}`} aria-current={category === k ? "page" : undefined} className={cn(chip, category === k ? on : off)}>{CATEGORY_META[k].label} ({counts[k] ?? 0})</Link>
        ))}
        <Link href={completed ? "/campaigns" : "/campaigns?status=selesai"} className={cn(chip, completed ? on : off)}>{completed ? "Kampanye berjalan" : "Sudah tercapai"}</Link>
      </nav>

      {rows.length === 0 ? (
        <EmptyState title={query ? `Tidak ada kampanye untuk “${query}”` : completed ? "Belum ada kampanye yang selesai" : "Belum ada kampanye di kategori ini"}>
          {query ? <Link className="font-semibold text-brand-ink underline" href="/campaigns">Hapus pencarian</Link> : "Coba kategori lain atau kembali lagi nanti."}
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((c, i) => (<CampaignCard key={c.id} c={c} headingLevel="h2" delay={(i % 3) * 90} />))}</div>
      )}
    </div>
  );
}
