import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageNav } from "@/components/public/page-nav";
import { PageHeading } from "@/components/ui";
import { PaymentSummary } from "@/components/public/payment-summary";
import { getDonationStatus } from "@/services/donations.service";

export const metadata: Metadata = { title: "Status pembayaran" };

export default async function PaymentPage({ params }: { params: Promise<{ donationCode: string }> }) {
  const s = await getDonationStatus((await params).donationCode);
  if (!s) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: s.campaignTitle, href: `/campaigns/${s.campaignSlug}` }, { label: "Pembayaran", href: `/payment/${s.donationCode}` }, { label: "Status" }]} />
      <PageHeading title="Pembayaran donasi" />
      <PaymentSummary s={s} />
    </div>
  );
}
