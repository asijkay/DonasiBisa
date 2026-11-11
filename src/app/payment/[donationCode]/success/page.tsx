import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageNav } from "@/components/public/page-nav";
import { PageHeading } from "@/components/ui";
import { PaymentSummary } from "@/components/public/payment-summary";
import { getDonationStatus } from "@/services/donations.service";

export const metadata: Metadata = { title: "Donasi berhasil" };

/** Reachable only when the DATABASE says SUCCEEDED — never because of a redirect/query string. */
export default async function SuccessPage({ params }: { params: Promise<{ donationCode: string }> }) {
  const { donationCode } = await params;
  const s = await getDonationStatus(donationCode);
  if (!s) notFound();
  if (s.status !== "SUCCEEDED") redirect(`/payment/${donationCode}/pending`);
  return (
    <div className="mx-auto max-w-2xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: s.campaignTitle, href: `/campaigns/${s.campaignSlug}` }, { label: "Pembayaran", href: `/payment/${s.donationCode}` }, { label: "Berhasil" }]} />
      <PageHeading title="Donasi berhasil" />
      <PaymentSummary s={s} />
    </div>
  );
}
