import { notFound } from "next/navigation";
import { Card, PageHeading, StatusBadge, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { getDonorDetail } from "@/services/admin.service";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

export default async function DonorDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("donor:read");
  const detail = await getDonorDetail((await params).id);
  if (!detail) notFound();
  const { donor, history } = detail;
  return (
    <div className="space-y-6">
      <PageHeading title={donor.fullName} />
      <Card className="text-sm">
        <p>Email: {donor.email}</p>
        <p>WhatsApp: {donor.whatsappNumber ?? "-"} {donor.whatsappNumber ? (donor.whatsappOptIn ? "(consent: ya)" : "(consent: tidak)") : ""}</p>
        <p>Akun Google terhubung: {donor.userId ? "Ya" : "Belum"}</p>
      </Card>
      <Table>
        <thead><tr><Th>Waktu</Th><Th>Kode</Th><Th>Campaign</Th><Th>Nominal</Th><Th>Status</Th></tr></thead>
        <tbody>
          {history.map(({ d, campaignTitle }) => (
            <tr key={d.id}><Td>{formatDateTime(d.createdAt)}</Td><Td className="font-mono text-xs">{d.donationCode}</Td><Td>{campaignTitle}</Td><Td>{formatIDR(d.amount)}</Td><Td><StatusBadge status={d.status} /></Td></tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
