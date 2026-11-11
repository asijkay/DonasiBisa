"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, cn } from "@/components/ui";

type Method = { provider: "MIDTRANS" | "XENDIT"; channelCode: string; displayName: string; description: string | null };

export function PaymentPicker({ donationCode, methods }: { donationCode: string; methods: Method[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const key = (m: Method) => `${m.provider}:${m.channelCode}`;

  async function submit() {
    const m = methods.find((x) => key(x) === selected);
    if (!m || inFlight.current || submitting) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/donations/${encodeURIComponent(donationCode)}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: m.provider, channelCode: m.channelCode }),
      });
      const json = (await res.json()) as { payment?: { checkoutUrl: string | null }; message?: string };
      if (!res.ok || !json.payment) {
        setError(json.message ?? "Gagal membuat pembayaran.");
        inFlight.current = false;
        setSubmitting(false);
        return;
      }
      if (json.payment.checkoutUrl) window.location.assign(json.payment.checkoutUrl);
      else router.push(`/payment/${donationCode}`);
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <div role="radiogroup" aria-label="Metode pembayaran" className="grid gap-2">
        {methods.map((m) => (
          <label key={key(m)} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition", selected === key(m) ? "border-brand bg-brand/10 ring-2 ring-brand" : "border-slate-300 hover:bg-slate-50")}>
            <span>
              <span className="block font-medium">{m.displayName}</span>
              <span className="block text-xs text-slate-600">{m.provider === "MIDTRANS" ? "via Midtrans" : "via Xendit"}{m.description ? ` · ${m.description}` : ""}</span>
            </span>
            <input type="radio" name="method" value={key(m)} checked={selected === key(m)} onChange={() => setSelected(key(m))} className="h-4 w-4" />
          </label>
        ))}
      </div>
      <Button onClick={submit} disabled={!selected || submitting} className="w-full sm:w-auto">
        {submitting ? "Membuat pembayaran…" : "Bayar sekarang"}
      </Button>
    </div>
  );
}
