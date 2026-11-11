import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageHeading } from "@/components/ui";
import { PaymentSummary } from "@/components/public/payment-summary";
import { getDonationStatus } from "@/services/donations.service";

export const metadata: Metadata = { title: "Menunggu pembayaran" };

export default async function PendingPage({ params }: { params: Promise<{ donationCode: string }> }) {
  const { donationCode } = await params;
  const s = await getDonationStatus(donationCode);
  if (!s) notFound();
  if (s.status === "SUCCEEDED") redirect(`/payment/${donationCode}/success`);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="Menunggu konfirmasi" />
      <PaymentSummary s={s} />
    </div>
  );
}
