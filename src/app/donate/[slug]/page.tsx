import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { Alert, Card, PageHeading } from "@/components/ui";
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
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Campaign", href: "/campaigns" }, { label: campaign.title, href: `/campaigns/${slug}` }, { label: "Donasi" }]} />
      <div className="reveal"><PageHeading title="Donasi" /></div>
      <p className="reveal reveal-2 -mt-2 mb-6 text-slate-600">
        untuk <Link href={`/campaigns/${slug}`} className="font-medium text-brand-ink hover:underline">{campaign.title}</Link>
      </p>
      {block ? (
        <Alert tone="warning" title="Donasi tidak tersedia">{BLOCK_MESSAGES[block]}</Alert>
      ) : (
        <div className="reveal reveal-3"><Card>
          <DonateForm slug={slug} amountMode={campaign.amountMode} options={detail?.options ?? []} min={env.MIN_DONATION_AMOUNT} max={env.MAX_DONATION_AMOUNT} />
        </Card></div>
      )}
    </div>
  );
}
