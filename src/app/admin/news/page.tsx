import Link from "next/link";
import { ButtonLink, EmptyState, PageHeading, StatusBadge, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listAdminNews } from "@/services/news.service";
import { formatDateTime } from "@/lib/utils/format";

export default async function AdminNews() {
  const user = await requirePermission("news:read");
  const rows = await listAdminNews();
  return (
    <div>
      <PageHeading title="Berita">{hasPermission(user.roles, "news:write") && <ButtonLink href="/admin/news/new">Berita baru</ButtonLink>}</PageHeading>
      {rows.length === 0 ? <EmptyState title="Belum ada berita" /> : (
        <Table>
          <thead><tr><Th>Judul</Th><Th>Jenis</Th><Th>Status</Th><Th>Dipublikasikan</Th></tr></thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id}>
                <Td><Link className="font-medium text-brand hover:underline" href={`/admin/news/${n.id}`}>{n.title}</Link></Td>
                <Td>{n.campaignId ? "Update campaign" : "Berita umum"}</Td>
                <Td><StatusBadge status={n.status} /></Td>
                <Td>{formatDateTime(n.publishedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
