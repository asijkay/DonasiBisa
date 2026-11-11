import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, StatusBadge } from "@/components/ui";
import { requireAdminUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { dashboardStats } from "@/services/admin.service";
import { campaignStatusCounts } from "@/services/campaigns.service";
import { formatIDR } from "@/lib/utils/format";
import { IconCard, IconChart, IconClock, IconHand, IconNews, IconPlus } from "@/components/public/icons";

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "bg-emerald-500", PAUSED: "bg-amber-400", DRAFT: "bg-slate-400", COMPLETED: "bg-sky-500", CLOSED: "bg-indigo-400", ARCHIVED: "bg-slate-300",
};

function Stat({ label, value, icon, tone }: { label: string; value: ReactNode; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${tone}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ forbidden?: string }> }) {
  const user = await requireAdminUser();
  const { forbidden } = await searchParams;
  const canSeeMoney = hasPermission(user.roles, "transaction:read") || hasPermission(user.roles, "campaign:read");
  const [stats, counts] = canSeeMoney ? await Promise.all([dashboardStats(), campaignStatusCounts()]) : [null, {} as Record<string, number>];
  const totalCampaigns = Object.values(counts).reduce((a, b) => a + b, 0);
  const firstName = (user.name ?? user.email ?? "Admin").split(" ")[0];

  const actions = [
    hasPermission(user.roles, "campaign:write") && { href: "/admin/campaigns/new", label: "Campaign baru", icon: <IconPlus width={16} height={16} /> },
    hasPermission(user.roles, "news:write") && { href: "/admin/news/new", label: "Berita baru", icon: <IconNews width={16} height={16} /> },
    hasPermission(user.roles, "payment:read") && { href: "/admin/payment-methods", label: "Atur metode bayar", icon: <IconCard width={16} height={16} /> },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: ReactNode }>;

  return (
    <div className="space-y-8">
      {forbidden && <Alert tone="warning">Anda tidak memiliki izin untuk halaman tersebut.</Alert>}

      <section className="band-navy relative overflow-hidden rounded-3xl p-7 text-white shadow-[0_24px_50px_-28px_rgba(6,34,70,0.8)] sm:p-9">
        <p className="text-sm font-medium text-white/70">Selamat datang kembali</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Halo, {firstName}</h1>
        <p className="mt-2 max-w-xl text-sm text-white/75">Ringkasan penggalangan dana dan transaksi terbaru. Kelola campaign, metode pembayaran, dan notifikasi dari menu di kiri.</p>
        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2.5">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="inline-flex items-center gap-2 rounded-xl bg-white/14 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] backdrop-blur transition hover:bg-white/22">
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {stats && (
        <>
          <section aria-label="Statistik utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Campaign aktif" value={stats.activeCampaigns} icon={<IconHand width={20} height={20} />} tone="bg-gradient-to-br from-[#0064db] to-[#2a8cff]" />
            <Stat label="Donasi berhasil" value={stats.succeededDonations} icon={<IconChart width={20} height={20} />} tone="bg-gradient-to-br from-emerald-600 to-emerald-400" />
            <Stat label="Nilai donasi berhasil" value={formatIDR(stats.succeededValue)} icon={<IconCard width={20} height={20} />} tone="bg-gradient-to-br from-[#ff6b57] to-[#ff9a6b]" />
            <Stat label="Transaksi pending" value={stats.pendingTransactions} icon={<IconClock width={20} height={20} />} tone="bg-gradient-to-br from-amber-500 to-amber-300" />
          </section>

          <section aria-labelledby="h-status" className="rounded-xl border bg-card p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="h-status" className="text-lg font-bold">Campaign per status</h2>
              <p className="text-sm text-slate-600">{totalCampaigns} campaign</p>
            </div>
            {totalCampaigns > 0 && (
              <div role="img" aria-label="Komposisi status campaign" className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {Object.entries(counts).map(([s, n]) => (
                  <span key={s} className={STATUS_COLOR[s] ?? "bg-slate-400"} style={{ width: `${(n / totalCampaigns) * 100}%` }} />
                ))}
              </div>
            )}
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(counts).map(([s, n]) => (
                <li key={s} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2.5"><span aria-hidden className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s] ?? "bg-slate-400"}`} /><StatusBadge status={s} /></span>
                  <span className="text-xl font-extrabold">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
