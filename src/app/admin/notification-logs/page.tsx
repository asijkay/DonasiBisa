import { EmptyState, PageHeading, StatusBadge, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listNotificationLogs } from "@/services/notifications.service";
import { formatDateTime } from "@/lib/utils/format";

function mask(recipient: string): string {
  if (recipient.includes("@")) { const [u, d] = recipient.split("@"); return `${u.slice(0, 2)}***@${d}`; }
  return recipient.length > 6 ? `${recipient.slice(0, 5)}****${recipient.slice(-2)}` : recipient;
}

export default async function NotificationLogsPage() {
  await requirePermission("notification:read");
  const rows = await listNotificationLogs(150);
  return (
    <div>
      <PageHeading title="Log notifikasi" />
      {rows.length === 0 ? <EmptyState title="Belum ada notifikasi" /> : (
        <Table>
          <thead><tr><Th>Waktu</Th><Th>Event</Th><Th>Kanal</Th><Th>Penerima</Th><Th>Status</Th><Th>Keterangan</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{formatDateTime(r.createdAt)}</Td><Td>{r.eventKey}</Td><Td>{r.channel}</Td><Td>{mask(r.recipient)}</Td>
                <Td><StatusBadge status={r.status} /></Td><Td className="text-xs text-slate-600">{r.errorMessage ?? ""}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
