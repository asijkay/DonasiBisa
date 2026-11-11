"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FieldError, Input, Label, Textarea, cn } from "@/components/ui";
import { formatIDR } from "@/lib/utils/format";

type Props = {
  slug: string;
  amountMode: "OPEN_AMOUNT" | "CLOSED_AMOUNT";
  options: Array<{ id: string; amount: number; label: string | null }>;
  min: number;
  max: number;
};

type Issue = { path: string; message: string };

export function DonateForm({ slug, amountMode, options, min, max }: Props) {
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [optionId, setOptionId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const fieldError = (p: string) => issues.find((i) => i.path === p || i.path.endsWith(p))?.message;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    setIssues([]);
    const body = {
      campaignSlug: slug,
      amount: amountMode === "OPEN_AMOUNT" ? Number(amount.replace(/\D/g, "")) || null : null,
      amountOptionId: amountMode === "CLOSED_AMOUNT" ? optionId || null : null,
      donor: {
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        whatsapp: String(fd.get("whatsapp") ?? ""),
        whatsappOptIn: fd.get("whatsappOptIn") === "on",
      },
      message: String(fd.get("message") ?? "") || null,
      isAnonymous: fd.get("isAnonymous") === "on",
    };
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { donationCode?: string; message?: string; issues?: Issue[] };
      if (!res.ok || !json.donationCode) {
        idempotencyKey.current = crypto.randomUUID(); // a corrected resubmission is a new attempt
        setError(json.message ?? "Gagal membuat donasi.");
        setIssues(json.issues ?? []);
        setSubmitting(false);
        return;
      }
      router.push(`/donate/${slug}/payment?code=${encodeURIComponent(json.donationCode)}`);
    } catch {
      idempotencyKey.current = crypto.randomUUID();
      setError("Koneksi bermasalah. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={submitting}>
      {error && <Alert tone="danger">{error}</Alert>}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Nominal donasi</legend>
        {amountMode === "CLOSED_AMOUNT" ? (
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Pilih nominal">
            {options.map((o) => (
              <label key={o.id} className={cn("cursor-pointer rounded-lg border p-3 text-center text-sm transition", optionId === o.id ? "border-brand bg-brand/10 ring-2 ring-brand" : "border-slate-300 hover:bg-slate-50")}>
                <input type="radio" name="amountOption" value={o.id} checked={optionId === o.id} onChange={() => setOptionId(o.id)} className="sr-only" />
                <span className="block font-semibold">{formatIDR(o.amount)}</span>
                {o.label && <span className="text-xs text-slate-600">{o.label}</span>}
              </label>
            ))}
          </div>
        ) : (
          <div>
            <Label htmlFor="amount" hint={`(min ${formatIDR(min)}, maks ${formatIDR(max)})`}>Nominal (Rp)</Label>
            <Input id="amount" inputMode="numeric" autoComplete="off" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} aria-invalid={!!fieldError("amount")} />
            <div className="mt-2 flex flex-wrap gap-2">
              {[25000, 50000, 100000, 250000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50">
                  {formatIDR(v)}
                </button>
              ))}
            </div>
          </div>
        )}
        <FieldError>{fieldError("amount") ?? fieldError("amountOptionId")}</FieldError>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nama lengkap</Label>
          <Input id="name" name="name" autoComplete="name" required aria-invalid={!!fieldError("name")} />
          <FieldError>{fieldError("donor.name")}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fieldError("email")} />
          <FieldError>{fieldError("donor.email")}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="whatsapp" hint="(contoh 081234567890)">Nomor WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" required aria-invalid={!!fieldError("whatsapp")} />
          <FieldError>{fieldError("donor.whatsapp")}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="message" hint="(opsional)">Pesan atau doa</Label>
        <Textarea id="message" name="message" rows={3} maxLength={500} />
      </div>

      <div className="space-y-3 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="isAnonymous" className="mt-1 h-4 w-4" />
          <span>Sembunyikan nama saya (donasi anonim)</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="whatsappOptIn" className="mt-1 h-4 w-4" />
          <span>Saya setuju menerima notifikasi transaksi melalui WhatsApp. (Tanpa persetujuan, hanya email yang dikirim.)</span>
        </label>
      </div>

      <p className="text-xs text-slate-500">Data Anda hanya digunakan untuk memproses donasi dan mengirim konfirmasi, serta tidak ditampilkan ke publik.</p>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Memproses…" : "Lanjut ke pembayaran"}
      </Button>
    </form>
  );
}
