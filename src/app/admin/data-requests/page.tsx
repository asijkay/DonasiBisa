import { Alert, Badge, EmptyState, PageHeading, Table, Td, Th } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { listDataRequests } from "@/services/privacy.service";
import { resolveDataRequestAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/utils/format";

export default async function DataRequestsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requirePermission("admin:manage");
  const rows = await listDataRequests();
  return (
    <div>
      <PageHeading title="Permintaan data pribadi" />
      <Flash {...(await searchParams)} />
      <div className="mb-4"><Alert tone="info" title="Verifikasi dulu">Permintaan dari tamu belum terverifikasi. Pastikan pengaju adalah pemilik email (balas ke emailnya / minta bukti) sebelum menekan <strong>Hapus data</strong>. Penghapusan menganonimkan identitas dan tidak dapat dibatalkan; catatan transaksi tanpa identitas tetap disimpan.</Alert></div>
      {rows.length === 0 ? <EmptyState title="Belum ada permintaan" /> : (
        <Table>
          <thead><tr><Th>Waktu</Th><Th>Jenis</Th><Th>Email</Th><Th>Keterangan</Th><Th>Status</Th><Th>Tindakan</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.createdAt)}</Td>
                <Td>{r.type === "DELETE" ? "Hapus data" : "Akses data"}</Td>
                <Td>{r.email}</Td>
                <Td className="max-w-xs break-words text-xs">{r.details ?? "-"}</Td>
                <Td><Badge tone={r.status === "OPEN" ? "warning" : r.status === "DONE" ? "success" : "neutral"}>{r.status === "OPEN" ? "Terbuka" : r.status === "DONE" ? "Selesai" : "Ditolak"}</Badge></Td>
                <Td>
                  {r.status === "OPEN" && (
                    <div className="flex flex-wrap gap-2">
                      {r.type === "DELETE" && <form action={resolveDataRequestAction.bind(null, r.id, "DONE", true)}><SubmitButton variant="danger" pendingLabel="Menghapus…">Hapus data</SubmitButton></form>}
                      <form action={resolveDataRequestAction.bind(null, r.id, "DONE", false)}><SubmitButton variant="secondary">Tandai selesai</SubmitButton></form>
                      <form action={resolveDataRequestAction.bind(null, r.id, "REJECTED", false)}><SubmitButton variant="ghost">Tolak</SubmitButton></form>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
