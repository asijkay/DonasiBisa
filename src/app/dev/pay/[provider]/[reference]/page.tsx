import { notFound, redirect } from "next/navigation";
import { Alert, Button, Card, PageHeading } from "@/components/ui";
import { simulatorEnabled } from "@/lib/payments/simulator";
import { simGet, simSendWebhook, type SimStatus } from "@/lib/payments/simulator-gateway";
import { formatIDR } from "@/lib/utils/format";

type P = { params: Promise<{ provider: string; reference: string }> };

async function act(provider: string, reference: string, status: SimStatus, times: number): Promise<void> {
  "use server";
  if (!simulatorEnabled()) notFound();
  const sim = simGet(provider, reference);
  if (!sim) notFound();
  // Duplicate delivery simulation re-sends the SAME event id/body.
  const eventId = crypto.randomUUID();
  for (let i = 0; i < times; i++) await simSendWebhook(sim, status, { eventId });
  redirect(`/payment/${reference.replace(/-\d+$/, "")}`);
}

export default async function SimulatorPayPage({ params }: P) {
  if (!simulatorEnabled()) notFound();
  const { provider, reference: raw } = await params;
  const reference = decodeURIComponent(raw);
  const sim = simGet(provider, reference);
  if (!sim) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading title="Simulator gateway" />
      <Alert tone="warning" title="DEV ONLY — bukan pembayaran sungguhan">
        Halaman ini menggantikan halaman {provider === "MIDTRANS" ? "Midtrans Snap" : "Xendit"} saat APP_ENV=development. Tombol di bawah mengirim webhook bertanda tangan ke endpoint asli aplikasi.
      </Alert>
      <Card className="mt-4 space-y-4">
        <p className="text-sm">Referensi <span className="font-mono">{sim.reference}</span> · {sim.channel}</p>
        <p className="text-2xl font-bold">{formatIDR(sim.amount)}</p>
        <div className="grid gap-2">
          <form action={act.bind(null, provider, reference, "settlement", 1)}><Button className="w-full">Bayar berhasil</Button></form>
          <form action={act.bind(null, provider, reference, "settlement", 2)}><Button variant="secondary" className="w-full">Bayar berhasil (webhook terkirim 2×)</Button></form>
          <form action={act.bind(null, provider, reference, "pending", 1)}><Button variant="secondary" className="w-full">Kirim status pending</Button></form>
          <form action={act.bind(null, provider, reference, "failed", 1)}><Button variant="danger" className="w-full">Gagal</Button></form>
          <form action={act.bind(null, provider, reference, "expired", 1)}><Button variant="danger" className="w-full">Kedaluwarsa</Button></form>
        </div>
      </Card>
    </div>
  );
}
