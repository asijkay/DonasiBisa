import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui";
import { PaymentSummary } from "@/components/public/payment-summary";
import { getDonationStatus } from "@/services/donations.service";

export const metadata: Metadata = { title: "Status pembayaran" };

export default async function PaymentPage({ params }: { params: Promise<{ donationCode: string }> }) {
  const s = await getDonationStatus((await params).donationCode);
  if (!s) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="Pembayaran donasi" />
      <PaymentSummary s={s} />
    </div>
  );
}
