import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { EmptyState, PageHeading, StatusBadge, Table, Td, Th } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getDonorForUser, listDonorTransactions } from "@/services/donations.service";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Transaksi saya" };

export default async function TransactionsPage() {
  const user = await requireUser("/account/transactions");
  const donor = await getDonorForUser(user.id);
  const rows = donor ? await listDonorTransactions(donor.id, 100) : [];
  return (
    <div>
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Akun", href: "/account" }, { label: "Transaksi" }]} />
      <PageHeading title="Riwayat donasi" />
      {rows.length === 0 ? <EmptyState title="Belum ada transaksi" /> : (
        <Table>
          <thead><tr><Th>Tanggal</Th><Th>Kampanye</Th><Th>Nominal</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {rows.map(({ d, campaignTitle }) => (
              <tr key={d.id}>
                <Td>{formatDateTime(d.createdAt)}</Td>
                <Td>{campaignTitle}</Td>
                <Td>{formatIDR(d.amount)}</Td>
                <Td><StatusBadge status={d.status} /></Td>
                <Td><Link className="text-brand-ink hover:underline" href={`/account/transactions/${d.donationCode}`}>Detail</Link></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
