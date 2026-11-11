import { EmptyState, PageHeading, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listAuditLogs } from "@/services/admin.service";
import { formatDateTime } from "@/lib/utils/format";

export default async function AuditLogsPage() {
  await requirePermission("admin:manage");
  const rows = await listAuditLogs(150);
  return (
    <div>
      <PageHeading title="Audit log" />
      {rows.length === 0 ? <EmptyState title="Belum ada aktivitas" /> : (
        <Table>
          <thead><tr><Th>Waktu</Th><Th>Aksi</Th><Th>Entitas</Th><Th>Sebelum</Th><Th>Sesudah</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.createdAt)}</Td><Td>{r.action}</Td><Td className="text-xs">{r.entityType}:{r.entityId ?? "-"}</Td>
                <Td className="break-words font-mono text-xs">{r.beforeData ? JSON.stringify(r.beforeData) : ""}</Td>
                <Td className="break-words font-mono text-xs">{r.afterData ? JSON.stringify(r.afterData) : ""}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
