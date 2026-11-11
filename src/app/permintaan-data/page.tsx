import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { PageNav } from "@/components/public/page-nav";
import { submitDataRequestAction } from "@/app/actions/privacy";

export const metadata: Metadata = { title: "Permintaan data pribadi" };

export default async function DataRequestPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <div className="mx-auto max-w-xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Kebijakan Privasi", href: "/privacy" }, { label: "Permintaan data" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Permintaan data pribadi</h1>
      <p className="mt-3 text-slate-700">Ajukan permintaan akses atau penghapusan data pribadi untuk donasi yang Anda buat sebagai tamu. Jika Anda sudah masuk dengan Google, lebih cepat memakai <Link className="text-brand-ink underline" href="/account#privasi">Akun → Privasi &amp; data</Link>.</p>
      <div className="mt-6 space-y-4">
        {sent && <Alert tone="success" title="Permintaan diterima">Kami akan memverifikasi kepemilikan email Anda sebelum memproses. Penghapusan menganonimkan data identitas; catatan transaksi tanpa identitas tetap disimpan untuk keperluan pencatatan keuangan.</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <Card>
          <form action={submitDataRequestAction} className="space-y-4">
            <div><Label htmlFor="type">Jenis permintaan</Label><Select id="type" name="type" defaultValue="ACCESS"><option value="ACCESS">Akses / unduh salinan data saya</option><option value="DELETE">Hapus data pribadi saya</option></Select></div>
            <div><Label htmlFor="email">Email yang dipakai saat berdonasi</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
            <div><Label htmlFor="details" hint="(opsional)">Keterangan</Label><Textarea id="details" name="details" rows={3} maxLength={1000} /></div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" required className="mt-1 h-4 w-4" /><span>Saya menyatakan email tersebut adalah milik saya. Kami dapat meminta bukti kepemilikan sebelum memproses.</span></label>
            <SubmitButton pendingLabel="Mengirim…">Kirim permintaan</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
