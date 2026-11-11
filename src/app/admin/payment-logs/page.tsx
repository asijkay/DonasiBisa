import { EmptyState, PageHeading, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listPaymentLogs } from "@/services/admin.service";
import { formatDateTime } from "@/lib/utils/format";

export default async function PaymentLogsPage() {
  await requirePermission("payment:read");
  const rows = await listPaymentLogs(150);
  return (
    <div>
      <PageHeading title="Log pembayaran &amp; webhook" />
      {rows.length === 0 ? <EmptyState title="Belum ada log" /> : (
        <Table>
          <thead><tr><Th>Waktu</Th><Th>Provider</Th><Th>Event</Th><Th>Status</Th><Th>Metadata</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.createdAt)}</Td><Td>{r.provider}</Td><Td>{r.eventType}</Td>
                <Td>{r.statusBefore ?? "-"} → {r.statusAfter ?? "-"}</Td>
                <Td className="max-w-xs break-words font-mono text-xs">{JSON.stringify(r.metadataSanitized ?? {})}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
