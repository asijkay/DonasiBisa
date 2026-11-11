import Link from "next/link";
import { EmptyState, PageHeading, Select, StatusBadge, Table, Td, Th, Button } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listTransactions } from "@/services/admin.service";
import { DONATION_STATUSES, PROVIDERS, type DonationStatus, type Provider } from "@/db/schema";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

type SP = { status?: string; provider?: string; page?: string };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePermission("transaction:read");
  const sp = await searchParams;
  const status = DONATION_STATUSES.includes(sp.status as DonationStatus) ? (sp.status as DonationStatus) : undefined;
  const provider = PROVIDERS.includes(sp.provider as Provider) ? (sp.provider as Provider) : undefined;
  const { rows, page, pageSize } = await listTransactions({ status, provider, page: Number(sp.page) || 1 });
  const qs = (p: number) => new URLSearchParams({ ...(status && { status }), ...(provider && { provider }), page: String(p) }).toString();

  return (
    <div>
      <PageHeading title="Transaksi" />
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <label className="text-sm">Status<Select name="status" defaultValue={status ?? ""}><option value="">Semua</option>{DONATION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}</Select></label>
        <label className="text-sm">Gateway<Select name="provider" defaultValue={provider ?? ""}><option value="">Semua</option>{PROVIDERS.map((s) => (<option key={s} value={s}>{s}</option>))}</Select></label>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {rows.length === 0 ? <EmptyState title="Tidak ada transaksi" /> : (
        <Table>
          <thead><tr><Th>Waktu</Th><Th>Kode</Th><Th>Campaign</Th><Th>Gateway</Th><Th>Nominal</Th><Th>Status</Th></tr></thead>
          <tbody>
            {rows.map(({ d, campaignTitle, provider: pv, paymentStatus }) => (
              <tr key={d.id}>
                <Td>{formatDateTime(d.createdAt)}</Td>
                <Td className="font-mono text-xs">{d.donationCode}</Td>
                <Td>{campaignTitle}</Td>
                <Td>{pv ?? "-"}{paymentStatus && paymentStatus !== d.status ? <span className="ml-1 text-xs text-slate-500">({paymentStatus})</span> : null}</Td>
                <Td>{formatIDR(d.amount)}</Td>
                <Td><StatusBadge status={d.status} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <div className="mt-4 flex gap-3 text-sm">
        {page > 1 && <Link className="text-brand hover:underline" href={`?${qs(page - 1)}`}>← Sebelumnya</Link>}
        {rows.length === pageSize && <Link className="text-brand hover:underline" href={`?${qs(page + 1)}`}>Berikutnya →</Link>}
      </div>
    </div>
  );
}
