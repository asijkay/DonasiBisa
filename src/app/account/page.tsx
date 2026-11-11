import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageNav } from "@/components/public/page-nav";
import { Alert, Badge, ButtonLink, EmptyState, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth/session";
import { getDonorForUser, getDonorSummary, listDonorTransactions } from "@/services/donations.service";
import { eraseAccountAction } from "@/app/actions/privacy";
import { Avatar } from "@/components/public/logo";
import { IconArrow, IconCard, IconChart, IconCheck, IconDownload, IconHand, IconShield, IconTrash } from "@/components/public/icons";
import { formatDateTime, formatIDR } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Akun saya" };

function Stat({ label, value, icon, tone }: { label: string; value: ReactNode; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-card p-5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)]">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${tone}`}>{icon}</span>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/account");
  const { error } = await searchParams;
  const donor = await getDonorForUser(user.id);
  const [summary, recent] = donor ? await Promise.all([getDonorSummary(donor.id), listDonorTransactions(donor.id, 5)]) : [null, []];
  const isAdmin = user.roles.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Akun" }]} />

      <section className="band-blue relative overflow-hidden rounded-2xl px-6 pb-14 pt-8 text-white sm:px-10 sm:pt-10">
        <div className="flex flex-wrap items-center gap-5">
          <span className="rounded-full bg-white/20 p-1 ring-1 ring-white/40"><Avatar src={user.image} name={user.name} size={76} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/75">Selamat datang</p>
            <h1 className="truncate text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{user.name ?? user.email}</h1>
            <p className="mt-1 truncate text-sm text-white/80">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/18 px-3 py-1">Donatur</span>
              {isAdmin && <span className="rounded-full bg-white/18 px-3 py-1">{user.roles.join(" · ").replaceAll("_", " ")}</span>}
              <span className="rounded-full bg-white/18 px-3 py-1">Masuk dengan Google</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0b1b3a] shadow-sm transition hover:brightness-95">
              Donasi lagi <IconArrow width={16} height={16} />
            </Link>
            {isAdmin && (
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25">
                Panel admin
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 -mt-9 grid gap-4 px-2 sm:grid-cols-3 sm:px-6">
        <Stat label="Total donasi berhasil" value={formatIDR(summary?.totalSucceeded ?? 0)} icon={<IconHand width={20} height={20} />} tone="bg-gradient-to-br from-accent-fixed to-accent-fixed-light" />
        <Stat label="Donasi berhasil" value={summary?.succeededCount ?? 0} icon={<IconCheck width={20} height={20} />} tone="bg-gradient-to-br from-emerald-600 to-emerald-400" />
        <Stat label="Semua transaksi" value={summary?.transactionCount ?? 0} icon={<IconChart width={20} height={20} />} tone="bg-gradient-to-br from-brand to-brand-light" />
      </div>

      {!donor && (
        <div className="mt-6"><Alert tone="info" title="Belum ada donasi yang terhubung">Donasi yang dibuat dengan email {user.email} akan muncul di sini setelah Anda berdonasi.</Alert></div>
      )}

      <section aria-labelledby="h-recent" className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="h-recent" className="text-xl font-bold tracking-tight">Transaksi terbaru</h2>
          <Link href="/account/transactions" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline">Lihat semua <IconArrow width={14} height={14} /></Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="Belum ada transaksi">Mulai dari <Link href="/campaigns" className="font-semibold text-brand-ink underline">campaign yang sedang berjalan</Link>.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-[0_12px_30px_-22px_rgba(15,23,42,0.35)]">
            {recent.map(({ d, campaignTitle }) => (
              <li key={d.id}>
                <Link href={`/account/transactions/${d.donationCode}`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-brand-soft sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink"><IconCard width={18} height={18} /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{campaignTitle}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(d.createdAt)} · {d.donationCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3"><span className="font-bold">{formatIDR(d.amount)}</span><StatusBadge status={d.status} /></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="privasi" aria-labelledby="h-privasi" className="mt-12 scroll-mt-24">
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink"><IconShield width={20} height={20} /></span>
          <div>
            <h2 id="h-privasi" className="text-xl font-bold tracking-tight">Privasi &amp; data saya</h2>
            <p className="text-sm text-slate-600">Kendali penuh atas data pribadi Anda. Lihat juga <Link href="/privacy" className="font-semibold text-brand-ink underline">Kebijakan Privasi</Link>.</p>
          </div>
        </div>
        {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-card p-6 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.35)]">
            <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800"><IconDownload width={20} height={20} /></span>
            <h3 className="mt-4 text-lg font-bold">Unduh data saya</h3>
            <p className="mt-1 flex-1 text-sm text-slate-700">Salinan data akun, profil donatur, dan riwayat donasi Anda dalam format JSON.</p>
            <div className="mt-4"><ButtonLink href="/api/account/export" variant="secondary">Unduh data (JSON)</ButtonLink></div>
          </div>

          <details className="group rounded-2xl border border-red-200 bg-card p-6 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.35)] open:border-red-300" open={Boolean(error)}>
            <summary className="cursor-pointer">
              <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"><IconTrash width={20} height={20} /></span>
              <h3 className="mt-4 text-lg font-bold text-red-700 dark:text-red-300">Hapus data dan akun saya</h3>
              <p className="mt-1 text-sm text-slate-700">Tindakan permanen. Klik untuk membuka dan membaca konsekuensinya.</p>
            </summary>
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-700">Tindakan ini <strong>tidak dapat dibatalkan</strong>. Akun login Anda dihapus dan nama, email, nomor WhatsApp, serta pesan pada semua donasi Anda diganti dengan penanda &quot;data dihapus&quot;. Catatan transaksi (nominal, tanggal, status) tetap disimpan tanpa identitas karena kewajiban pencatatan keuangan, dan bukti donasi PDF tidak dapat diunduh lagi.</p>
              <form action={eraseAccountAction} className="space-y-3">
                <label htmlFor="confirm" className="block text-sm font-medium">Ketik <strong>HAPUS</strong> untuk mengonfirmasi</label>
                <input id="confirm" name="confirm" required autoComplete="off" className="w-full max-w-xs rounded-lg border border-slate-300 bg-card px-3 py-2.5 text-sm" />
                <div><SubmitButton variant="danger" pendingLabel="Menghapus…">Hapus data dan akun saya</SubmitButton></div>
              </form>
            </div>
          </details>
        </div>
        <p className="mt-4 text-xs text-slate-500">Bukan pemilik akun ini? Ajukan permintaan lewat <Link href="/permintaan-data" className="underline">formulir permintaan data</Link>. {donor && <Badge tone="info">Profil donatur terhubung</Badge>}</p>
      </section>
    </div>
  );
}
