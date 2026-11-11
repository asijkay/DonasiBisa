import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Card, EmptyState, PageHeading, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getDonorForUser, getDonorSummary, listDonorTransactions } from "@/services/donations.service";
import { Avatar } from "@/components/public/logo";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const donor = await getDonorForUser(user.id);
  const [summary, recent] = donor ? await Promise.all([getDonorSummary(donor.id), listDonorTransactions(donor.id, 5)]) : [null, []];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Avatar src={user.image} name={user.name} size={48} /><PageHeading title={`Halo, ${user.name ?? user.email}`} /></div>
      {!donor && <Alert tone="info" title="Belum ada donasi yang terhubung">Donasi yang dibuat dengan email {user.email} akan muncul di sini setelah Anda berdonasi.</Alert>}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><p className="text-sm text-slate-600">Total donasi berhasil</p><p className="text-2xl font-bold">{formatIDR(summary.totalSucceeded)}</p></Card>
          <Card><p className="text-sm text-slate-600">Donasi berhasil</p><p className="text-2xl font-bold">{summary.succeededCount}</p></Card>
          <Card><p className="text-sm text-slate-600">Semua transaksi</p><p className="text-2xl font-bold">{summary.transactionCount}</p></Card>
        </div>
      )}
      <section aria-labelledby="h-recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="h-recent" className="text-lg font-bold">Transaksi terbaru</h2>
          <Link href="/account/transactions" className="text-sm font-medium text-brand hover:underline">Lihat semua</Link>
        </div>
        {recent.length === 0 ? <EmptyState title="Belum ada transaksi" /> : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-card">
            {recent.map(({ d, campaignTitle }) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <Link href={`/account/transactions/${d.donationCode}`} className="font-medium hover:underline">{campaignTitle}</Link>
                  <p className="text-xs text-slate-500">{formatDateTime(d.createdAt)} · {d.donationCode}</p>
                </div>
                <div className="flex items-center gap-3"><span className="font-semibold">{formatIDR(d.amount)}</span><StatusBadge status={d.status} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
