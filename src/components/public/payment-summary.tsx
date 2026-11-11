import type { DonationStatusView } from "@/services/donations.service";
import { Alert, ButtonLink, Card, StatusBadge } from "@/components/ui";
import { formatDateTime, formatIDR } from "@/lib/utils/format";
import { StatusPoller } from "./status-poller";

type Instructions = {
  title?: string;
  description?: string;
  accountNumber?: string;
  actions?: Array<{ label: string; url: string }>;
  rawPublicFields?: Record<string, string>;
};

export function PaymentSummary({ s }: { s: DonationStatusView }) {
  const pay = s.latestPayment;
  const ins = (pay?.instructions ?? null) as Instructions | null;
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">Kode donasi <strong className="text-slate-900">{s.donationCode}</strong></p>
          <StatusBadge status={s.status} />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-slate-600">Kampanye</dt><dd>{s.campaignTitle}</dd>
          <dt className="text-slate-600">Nominal</dt><dd className="font-semibold">{formatIDR(s.amount)}</dd>
          {pay && (<><dt className="text-slate-600">Metode</dt><dd>{pay.provider === "MIDTRANS" ? "Midtrans" : "Xendit"}</dd></>)}
          {pay?.expiresAt && (<><dt className="text-slate-600">Batas bayar</dt><dd>{formatDateTime(pay.expiresAt)}</dd></>)}
          {s.paidAt && (<><dt className="text-slate-600">Dibayar</dt><dd>{formatDateTime(s.paidAt)}</dd></>)}
        </dl>
      </Card>

      {s.status === "PENDING" && (
        <>
          <Alert tone="warning" title="Menunggu pembayaran">
            Pembayaran Anda belum dikonfirmasi. Status berubah menjadi berhasil hanya setelah kami menerima konfirmasi resmi dari penyedia pembayaran.
          </Alert>
          {ins && (
            <Card className="space-y-2 text-sm">
              {ins.title && <p className="font-semibold">{ins.title}</p>}
              {ins.description && <p className="text-slate-600">{ins.description}</p>}
              {ins.accountNumber && <p>Nomor VA: <strong className="font-mono">{ins.accountNumber}</strong></p>}
              {ins.rawPublicFields?.qrString && <p className="break-all font-mono text-xs">QR: {ins.rawPublicFields.qrString}</p>}
            </Card>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {pay?.checkoutUrl && <a href={pay.checkoutUrl} className="inline-flex rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:brightness-105">Lanjutkan pembayaran</a>}
            <StatusPoller donationCode={s.donationCode} currentStatus={s.status} />
          </div>
        </>
      )}

      {s.status === "SUCCEEDED" && (
        <Alert tone="success" title="Pembayaran berhasil">
          Terima kasih atas donasi Anda. Konfirmasi dikirim ke email Anda. Login dengan Google (email yang sama) untuk melihat riwayat dan mengunduh bukti donasi.
        </Alert>
      )}

      {(s.status === "FAILED" || s.status === "EXPIRED" || s.status === "CANCELLED") && (
        <>
          <Alert tone="danger" title={s.status === "EXPIRED" ? "Pembayaran kedaluwarsa" : "Pembayaran tidak berhasil"}>
            Transaksi ini tidak dapat dilanjutkan. Anda dapat membuat donasi baru.
          </Alert>
          <ButtonLink href={`/donate/${s.campaignSlug}`}>Buat donasi baru</ButtonLink>
        </>
      )}
      <ButtonLink variant="ghost" href={`/campaigns/${s.campaignSlug}`}>Kembali ke kampanye</ButtonLink>
    </div>
  );
}
