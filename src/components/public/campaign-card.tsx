import Link from "next/link";
import type { CampaignCardDTO } from "@/services/campaigns.service";
import { formatIDR, progressPercent } from "@/lib/utils/format";
import { Badge, ProgressBar, StatusBadge } from "@/components/ui";
import { CoverImage } from "./cover-image";
import { CATEGORY_META, IconArrow } from "./icons";

export function CampaignCard({ c, headingLevel: H = "h3" }: { c: CampaignCardDTO; headingLevel?: "h2" | "h3" }) {
  const pct = progressPercent(c.raisedAmount, c.targetAmount);
  const cat = CATEGORY_META[c.category];
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10">
      <Link href={`/campaigns/${c.slug}`} className="relative block overflow-hidden" tabIndex={-1} aria-hidden>
        <CoverImage src={c.coverImageUrl} alt="" className="h-44 w-full transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow">
          <cat.Icon width={14} height={14} /> {cat.label}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {!c.isOpen && <StatusBadge status={c.status} />}
          {c.isDemo && <Badge tone="warning">DEMO</Badge>}
        </div>
        <H className="text-lg font-bold leading-snug text-slate-900">
          <Link href={`/campaigns/${c.slug}`} className="hover:text-brand-ink">{c.title}</Link>
        </H>
        <p className="line-clamp-2 text-sm text-slate-600">{c.summary}</p>
        <div className="mt-auto space-y-2 pt-2">
          <ProgressBar percent={pct} label={`Progres ${c.title}`} />
          <div className="flex items-baseline justify-between text-sm">
            <span><strong className="text-slate-900">{formatIDR(c.raisedAmount)}</strong> <span className="text-slate-500">terkumpul</span></span>
            <span className="font-semibold text-brand-ink">{pct}%</span>
          </div>
          <p className="text-xs text-slate-500">dari target {formatIDR(c.targetAmount)}</p>
        </div>
        <Link href={c.isOpen ? `/donate/${c.slug}` : `/campaigns/${c.slug}`} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-bold text-on-accent transition hover:brightness-105">
          {c.isOpen ? "Donasi sekarang" : "Lihat campaign"} <IconArrow width={16} height={16} />
        </Link>
      </div>
    </article>
  );
}
