import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ButtonLink, Card, PageHeading, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getDonorForUser, getDonorTransaction } from "@/services/donations.service";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Detail donasi" };

export default async function TransactionDetailPage({ params }: { params: Promise<{ donationCode: string }> }) {
  const { donationCode } = await params;
  const user = await requireUser(`/account/transactions/${donationCode}`);
  const donor = await getDonorForUser(user.id);
  const row = donor ? await getDonorTransaction(donor.id, donationCode) : null;
  if (!row) notFound(); // ownership enforced in the query; knowing the code is not enough
  const { d, campaignTitle } = row;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="Detail donasi"><StatusBadge status={d.status} /></PageHeading>
      <Card className="space-y-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-slate-600">Kode</dt><dd className="font-mono">{d.donationCode}</dd>
          <dt className="text-slate-600">Campaign</dt><dd>{campaignTitle}</dd>
          <dt className="text-slate-600">Nominal</dt><dd className="font-semibold">{formatIDR(d.amount)}</dd>
          <dt className="text-slate-600">Dibuat</dt><dd>{formatDateTime(d.createdAt)}</dd>
          <dt className="text-slate-600">Dibayar</dt><dd>{formatDateTime(d.paidAt)}</dd>
          {d.message && (<><dt className="text-slate-600">Pesan</dt><dd>{d.message}</dd></>)}
        </dl>
        {d.status === "SUCCEEDED" && <a href={`/api/receipts/${d.donationCode}`} className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">Unduh bukti donasi (PDF)</a>}
        {d.status === "PENDING" && <ButtonLink variant="secondary" href={`/payment/${d.donationCode}`}>Lihat status pembayaran</ButtonLink>}
      </Card>
    </div>
  );
}
