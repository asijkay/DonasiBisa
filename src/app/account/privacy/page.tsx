import type { Metadata } from "next";
import { Alert, Card } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { PageNav } from "@/components/public/page-nav";
import { requireUser } from "@/lib/auth/session";
import { eraseAccountAction } from "@/app/actions/privacy";

export const metadata: Metadata = { title: "Privasi & data saya" };

export default async function AccountPrivacyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser("/account/privacy");
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Akun", href: "/account" }, { label: "Privasi & data" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Privasi &amp; data saya</h1>
      {error && <Alert tone="danger">{error}</Alert>}
      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Unduh data saya</h2>
        <p className="text-sm text-slate-700">Salinan data akun, profil donatur, dan riwayat donasi Anda dalam format JSON.</p>
        <a href="/api/account/export" className="inline-flex rounded-xl border border-slate-300 bg-card px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-brand hover:text-brand-ink">Unduh data (JSON)</a>
      </Card>
      <Card className="space-y-3 border-red-300">
        <h2 className="text-lg font-bold text-red-700 dark:text-red-300">Hapus data dan akun saya</h2>
        <p className="text-sm text-slate-700">Tindakan ini <strong>tidak dapat dibatalkan</strong>. Akun login Anda dihapus dan nama, email, nomor WhatsApp, serta pesan pada semua donasi Anda diganti dengan penanda &quot;data dihapus&quot;. Catatan transaksi (nominal, tanggal, status) tetap disimpan tanpa identitas karena kewajiban pencatatan keuangan, dan bukti donasi PDF tidak dapat diunduh lagi.</p>
        <form action={eraseAccountAction} className="space-y-3">
          <label htmlFor="confirm" className="block text-sm font-medium">Ketik <strong>HAPUS</strong> untuk mengonfirmasi</label>
          <input id="confirm" name="confirm" required autoComplete="off" className="w-full max-w-xs rounded-lg border border-slate-300 bg-card px-3 py-2.5 text-sm" />
          <div><SubmitButton variant="danger" pendingLabel="Menghapus…">Hapus data dan akun saya</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
