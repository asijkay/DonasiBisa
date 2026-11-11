import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { Alert, Card, PageHeading, ProgressBar } from "@/components/ui";
import { CoverImage } from "@/components/public/cover-image";
import { formatIDR, progressPercent } from "@/lib/utils/format";
import { DonateForm } from "@/components/public/donate-form";
import { getEnv } from "@/lib/env";
import { BLOCK_MESSAGES, getDonationBlockReason, getCampaignForCheckout } from "@/services/campaigns.service";
import { getPublicCampaign } from "@/services/campaigns.service";

export const metadata: Metadata = { title: "Donasi" };

export default async function DonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await getCampaignForCheckout(slug);
  if (!loaded || loaded.campaign.status === "DRAFT" || loaded.campaign.status === "ARCHIVED") notFound();
  const { campaign } = loaded;
  const block = getDonationBlockReason(campaign);
  const detail = await getPublicCampaign(slug);
  const env = getEnv();

  return (
    <div className="mx-auto max-w-2xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Kampanye", href: "/campaigns" }, { label: campaign.title, href: `/campaigns/${slug}` }, { label: "Donasi" }]} />
      <div className="reveal"><PageHeading title="Donasi" /></div>
      <p className="reveal reveal-2 -mt-2 mb-6 text-slate-600">
        untuk <Link href={`/campaigns/${slug}`} className="font-medium text-brand-ink hover:underline">{campaign.title}</Link>
      </p>
      {block ? (
        <Alert tone="warning" title="Donasi tidak tersedia">{BLOCK_MESSAGES[block]}</Alert>
      ) : (
        <div className="reveal reveal-3 space-y-4">
        {detail && (
          <Card className="flex items-center gap-4">
            <CoverImage src={detail.coverImageUrl} alt="" sizes="96px" className="h-16 w-24 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-sm font-semibold text-slate-900">{detail.title}</p>
              <ProgressBar percent={progressPercent(detail.raisedAmount, detail.targetAmount)} label="Progres donasi" />
              <p className="text-xs text-slate-600">{formatIDR(detail.raisedAmount)} terkumpul · {progressPercent(detail.raisedAmount, detail.targetAmount)}%</p>
            </div>
          </Card>
        )}
        <Card>
          <DonateForm slug={slug} amountMode={campaign.amountMode} options={detail?.options ?? []} min={env.MIN_DONATION_AMOUNT} max={env.MAX_DONATION_AMOUNT} />
        </Card></div>
      )}
    </div>
  );
}
