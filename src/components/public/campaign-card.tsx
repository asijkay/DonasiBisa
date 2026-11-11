import Link from "next/link";
import type { CampaignCardDTO } from "@/services/campaigns.service";
import { formatIDR, progressPercent } from "@/lib/utils/format";
import { Badge, ProgressBar, StatusBadge } from "@/components/ui";
import { CoverImage } from "./cover-image";

export function CampaignCard({ c }: { c: CampaignCardDTO }) {
  const pct = progressPercent(c.raisedAmount, c.targetAmount);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-card shadow-sm transition hover:shadow-md">
      <CoverImage src={c.coverImageUrl} alt="" className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {!c.isOpen && <StatusBadge status={c.status} />}
          {c.isDemo && <Badge tone="warning">DEMO</Badge>}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-slate-900">
          <Link href={`/campaigns/${c.slug}`} className="hover:underline">
            {c.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-slate-600">{c.summary}</p>
        <div className="mt-auto space-y-2">
          <ProgressBar percent={pct} label={`Progres ${c.title}`} />
          <div className="flex justify-between text-sm">
            <span>
              <strong>{formatIDR(c.raisedAmount)}</strong> terkumpul
            </span>
            <span className="text-slate-600">{pct}%</span>
          </div>
          <p className="text-xs text-slate-500">Target {formatIDR(c.targetAmount)}</p>
        </div>
      </div>
    </article>
  );
}
