import type { Metadata } from "next";
import { Alert, Card, PageHeading } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { PageNav } from "@/components/public/page-nav";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { unsubscribeAction } from "@/app/actions/privacy";

export const metadata: Metadata = { title: "Berhenti menerima pesan", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t = "", done } = await searchParams;
  const valid = !!verifyUnsubscribeToken(t);
  return (
    <div className="mx-auto max-w-xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Berhenti menerima pesan" }]} />
      <PageHeading title="Berhenti menerima pesan" />
      {done ? (
        <Alert tone="success" title="Pengaturan Anda sudah disimpan">
          Anda tidak akan lagi menerima email atau WhatsApp selain bukti transaksi (konfirmasi pembayaran berhasil). Nomor WhatsApp Anda tidak digunakan lagi untuk notifikasi.
        </Alert>
      ) : !valid ? (
        <Alert tone="danger" title="Tautan tidak valid">Tautan ini tidak valid atau sudah rusak. Gunakan tautan terbaru dari email Anda, atau ajukan permintaan lewat halaman privasi.</Alert>
      ) : (
        <Card className="space-y-4">
          <p className="text-slate-700">Konfirmasi bahwa Anda ingin berhenti menerima pesan dari kami selain <strong>bukti transaksi</strong>. Bukti transaksi tetap dikirim karena merupakan catatan pembayaran Anda.</p>
          <form action={unsubscribeAction}>
            <input type="hidden" name="t" value={t} />
            <SubmitButton pendingLabel="Menyimpan…">Ya, berhenti menerima pesan</SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
