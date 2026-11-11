import { Alert, Card, PageHeading, StatusBadge } from "@/components/ui";
import { requireAdminUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { dashboardStats } from "@/services/admin.service";
import { campaignStatusCounts } from "@/services/campaigns.service";
import { formatIDR } from "@/lib/utils/format";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ forbidden?: string }> }) {
  const user = await requireAdminUser();
  const { forbidden } = await searchParams;
  const canSeeMoney = hasPermission(user.roles, "transaction:read") || hasPermission(user.roles, "campaign:read");
  const [stats, counts] = canSeeMoney ? await Promise.all([dashboardStats(), campaignStatusCounts()]) : [null, {}];

  return (
    <div>
      <PageHeading title="Dashboard" />
      {forbidden && <div className="mb-4"><Alert tone="warning">Anda tidak memiliki izin untuk halaman tersebut.</Alert></div>}
      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card><p className="text-sm text-slate-600">Campaign aktif</p><p className="text-3xl font-bold">{stats.activeCampaigns}</p></Card>
            <Card><p className="text-sm text-slate-600">Donasi berhasil</p><p className="text-3xl font-bold">{stats.succeededDonations}</p></Card>
            <Card><p className="text-sm text-slate-600">Nilai donasi berhasil</p><p className="text-3xl font-bold">{formatIDR(stats.succeededValue)}</p></Card>
            <Card><p className="text-sm text-slate-600">Transaksi pending</p><p className="text-3xl font-bold">{stats.pendingTransactions}</p></Card>
          </div>
          <h2 className="mb-2 mt-8 text-lg font-bold">Campaign per status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(counts).map(([s, n]) => (<Card key={s} className="flex items-center gap-3 py-3"><StatusBadge status={s} /><span className="text-xl font-bold">{n}</span></Card>))}
          </div>
        </>
      )}
    </div>
  );
}
