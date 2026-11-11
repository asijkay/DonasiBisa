import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert, Card, PageHeading } from "@/components/ui";
import { PaymentPicker } from "@/components/public/payment-picker";
import { getDonationStatus, listAvailablePaymentMethods } from "@/services/donations.service";
import { formatIDR } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Pilih pembayaran" };

export default async function SelectPaymentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ code?: string }> }) {
  const { slug } = await params;
  const { code } = await searchParams;
  if (!code) redirect(`/donate/${slug}`);
  const status = await getDonationStatus(code);
  if (!status) redirect(`/donate/${slug}`);
  if (status.status !== "PENDING" || status.latestPayment?.status === "PENDING") redirect(`/payment/${code}`);
  const methods = await listAvailablePaymentMethods();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="Pilih metode pembayaran" />
      <Card className="mb-4">
        <p className="text-sm text-slate-600">{status.campaignTitle}</p>
        <p className="text-2xl font-bold">{formatIDR(status.amount)}</p>
        <p className="text-xs text-slate-500">Kode donasi {status.donationCode}</p>
      </Card>
      {methods.length === 0 ? (
        <Alert tone="warning" title="Belum ada metode pembayaran aktif">Admin belum mengaktifkan penyedia pembayaran. Silakan coba lagi nanti.</Alert>
      ) : (
        <Card><PaymentPicker donationCode={code} methods={methods} /></Card>
      )}
    </div>
  );
}
