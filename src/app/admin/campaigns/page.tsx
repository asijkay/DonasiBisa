import Link from "next/link";
import { ButtonLink, EmptyState, PageHeading, StatusBadge, Table, Td, Th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listAdminCampaigns } from "@/services/campaigns.service";
import { formatIDR } from "@/lib/utils/format";

export default async function AdminCampaigns() {
  const user = await requirePermission("campaign:read");
  const rows = await listAdminCampaigns();
  return (
    <div>
      <PageHeading title="Campaign">{hasPermission(user.roles, "campaign:write") && <ButtonLink href="/admin/campaigns/new">Campaign baru</ButtonLink>}</PageHeading>
      {rows.length === 0 ? <EmptyState title="Belum ada campaign" /> : (
        <Table>
          <thead><tr><Th>Judul</Th><Th>Mode</Th><Th>Terkumpul / target</Th><Th>Status</Th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td><Link className="font-medium text-brand-ink hover:underline" href={`/admin/campaigns/${c.id}`}>{c.title}</Link>{c.isDemo && <span className="ml-2 text-xs text-amber-700">DEMO</span>}</Td>
                <Td>{c.amountMode === "OPEN_AMOUNT" ? "Nominal bebas" : "Paket nominal"}</Td>
                <Td>{formatIDR(c.raisedAmount)} / {formatIDR(c.targetAmount)}</Td>
                <Td><StatusBadge status={c.status} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
