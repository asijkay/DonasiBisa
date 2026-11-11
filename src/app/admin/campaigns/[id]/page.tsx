import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, PageHeading, StatusBadge } from "@/components/ui";
import { CampaignForm } from "@/components/admin/campaign-form";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminCampaign } from "@/services/campaigns.service";
import { campaignStatusAction } from "@/app/admin/actions";
import { db } from "@/db";
import { newsPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatIDR } from "@/lib/utils/format";
import type { CampaignStatus } from "@/db/schema";

const NEXT: Record<CampaignStatus, Array<{ to: CampaignStatus; label: string; danger?: boolean }>> = {
  DRAFT: [{ to: "PUBLISHED", label: "Publikasikan" }],
  PUBLISHED: [{ to: "PAUSED", label: "Jeda" }, { to: "CLOSED", label: "Tutup manual", danger: true }],
  PAUSED: [{ to: "PUBLISHED", label: "Lanjutkan" }, { to: "CLOSED", label: "Tutup manual", danger: true }],
  COMPLETED: [{ to: "ARCHIVED", label: "Arsipkan" }],
  CLOSED: [{ to: "ARCHIVED", label: "Arsipkan" }],
  ARCHIVED: [],
};

export default async function EditCampaign({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requirePermission("campaign:read");
  const { id } = await params;
  const loaded = await getAdminCampaign(id);
  if (!loaded) notFound();
  const { campaign, options } = loaded;
  const related = await db.select().from(newsPosts).where(eq(newsPosts.campaignId, id));
  const canWrite = hasPermission(user.roles, "campaign:write");
  const canPublish = hasPermission(user.roles, "campaign:publish");

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeading title={campaign.title}><StatusBadge status={campaign.status} /></PageHeading>
      <Flash {...(await searchParams)} />
      <Card className="space-y-2">
        <p className="text-sm">Terkumpul <strong>{formatIDR(campaign.raisedAmount)}</strong> dari {formatIDR(campaign.targetAmount)}{campaign.closeReason ? ` · alasan penutupan: ${campaign.closeReason}` : ""}</p>
        {canPublish && NEXT[campaign.status].length > 0 && (
          <div className="flex flex-wrap gap-2">
            {NEXT[campaign.status].map((n) => (
              <form key={n.to} action={campaignStatusAction.bind(null, campaign.id, n.to)}>
                <Button type="submit" variant={n.danger ? "danger" : "secondary"}>{n.label}</Button>
              </form>
            ))}
          </div>
        )}
      </Card>
      <CampaignForm campaign={campaign} options={options} canWrite={canWrite} />
      <section>
        <h2 className="mb-2 text-lg font-bold">Berita &amp; update terkait</h2>
        {related.length === 0 ? <p className="text-sm text-slate-600">Belum ada.</p> : (
          <ul className="space-y-1 text-sm">{related.map((n) => (<li key={n.id}><Link className="text-brand-ink hover:underline" href={`/admin/news/${n.id}`}>{n.title}</Link> <StatusBadge status={n.status} /></li>))}</ul>
        )}
      </section>
    </div>
  );
}
