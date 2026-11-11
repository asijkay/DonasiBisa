import Link from "next/link";
import { Button, EmptyState, Input, PageHeading, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listDonors } from "@/services/admin.service";
import { formatIDR } from "@/lib/utils/format";

export default async function DonorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("donor:read");
  const { q } = await searchParams;
  const rows = await listDonors(q);
  return (
    <div>
      <PageHeading title="Donatur" />
      <form method="get" className="mb-4 flex gap-2"><Input name="q" defaultValue={q} placeholder="Cari nama atau email" aria-label="Cari donatur" className="max-w-xs" /><Button type="submit" variant="secondary">Cari</Button></form>
      {rows.length === 0 ? <EmptyState title="Tidak ada donatur" /> : (
        <Table>
          <thead><tr><Th>Nama</Th><Th>Email</Th><Th>WhatsApp</Th><Th>Donasi</Th><Th>Total berhasil</Th></tr></thead>
          <tbody>
            {rows.map(({ donor, total, count }) => (
              <tr key={donor.id}>
                <Td><Link className="font-medium text-brand-ink hover:underline" href={`/admin/donors/${donor.id}`}>{donor.fullName}</Link></Td>
                <Td>{donor.email}</Td>
                <Td>{donor.whatsappNumber ?? "-"}{donor.whatsappNumber && !donor.whatsappOptIn ? " (tanpa consent)" : ""}</Td>
                <Td>{count}</Td>
                <Td>{formatIDR(Number(total))}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
