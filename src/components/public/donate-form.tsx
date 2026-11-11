"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FieldError, Input, Label, Spinner, Textarea, cn } from "@/components/ui";
import { formatIDR } from "@/lib/utils/format";

type Props = {
  slug: string;
  amountMode: "OPEN_AMOUNT" | "CLOSED_AMOUNT";
  options: Array<{ id: string; amount: number; label: string | null }>;
  min: number;
  max: number;
};

const AMOUNT_BTN = "rounded-xl border transition-all duration-200";
const AMOUNT_OFF = "border-slate-200 bg-card text-slate-700 hover:border-slate-400";
const AMOUNT_ON = "border-brand bg-brand/5 text-brand-ink";

type Issue = { path: string; message: string };

export function DonateForm({ slug, amountMode, options, min, max }: Props) {
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const inFlight = useRef(false); // synchronous guard against double tap/Enter
  const [optionId, setOptionId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [wa, setWa] = useState(false); // WhatsApp opt-in: the phone field is only asked for when ticked
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const chosen = amountMode === "CLOSED_AMOUNT" ? options.find((o) => o.id === optionId)?.amount : Number(amount) || undefined;
  const totalLabel = chosen ? formatIDR(chosen) : "pilih nominal terlebih dahulu";
  const fieldError = (p: string) => issues.find((i) => i.path === p || i.path.endsWith(p))?.message;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || submitting) return;
    inFlight.current = true;
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
        whatsapp: wa ? String(fd.get("whatsapp") ?? "") || null : null,
        whatsappOptIn: wa,
      },
      message: String(fd.get("message") ?? "") || null,
      isAnonymous: fd.get("isAnonymous") === "on",
      acceptedTerms: fd.get("acceptedTerms") === "on",
      ageConfirmed: fd.get("ageConfirmed") === "on",
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
        inFlight.current = false;
        setSubmitting(false);
        return;
      }
      router.push(`/donate/${slug}/payment?code=${encodeURIComponent(json.donationCode)}`);
    } catch {
      idempotencyKey.current = crypto.randomUUID();
      setError("Koneksi bermasalah. Silakan coba lagi.");
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={submitting}>
      {error && <Alert tone="danger">{error}</Alert>}

      <fieldset>
        <legend className="mb-4 text-sm font-semibold">Nominal donasi</legend>
        {amountMode === "CLOSED_AMOUNT" ? (
          <div className="grid gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Pilih nominal">
            {options.map((o) => (
              <label key={o.id} className={cn(AMOUNT_BTN, "block cursor-pointer p-4 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30", optionId === o.id ? AMOUNT_ON : AMOUNT_OFF)}>
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
            <div className="mt-4 flex flex-wrap gap-2">
              {[25000, 50000, 100000, 250000].map((v) => (
                <button key={v} type="button" aria-pressed={amount === String(v)} onClick={() => setAmount(String(v))} className={cn(AMOUNT_BTN, "px-4 py-2 text-xs", amount === String(v) ? AMOUNT_ON : AMOUNT_OFF)}>
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
      </div>

      <div>
        <Label htmlFor="message" hint="(opsional)">Pesan atau doa</Label>
        <Textarea id="message" name="message" rows={3} maxLength={500} />
      </div>

      <div className="space-y-4 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="isAnonymous" className="mt-1 h-4 w-4" />
          <span>Sembunyikan nama saya dari tampilan publik (donasi anonim).</span>
        </label>
        <div className="space-y-4">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} className="mt-1 h-4 w-4" aria-controls="wa-field" aria-expanded={wa} />
            <span>Kirimi saya notifikasi transaksi lewat WhatsApp <span className="text-slate-600">(opsional; nomor hanya diminta jika Anda memilih ini)</span>.</span>
          </label>
          {wa && (
            <div id="wa-field" className="ml-6">
              <Label htmlFor="whatsapp" hint="(contoh 081234567890)">Nomor WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" required aria-invalid={!!fieldError("whatsapp")} />
              <FieldError>{fieldError("whatsapp")}</FieldError>
            </div>
          )}
        </div>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 text-sm">
        <legend className="px-2 font-semibold">Persetujuan (wajib)</legend>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="ageConfirmed" required className="mt-1 h-4 w-4" aria-invalid={!!fieldError("ageConfirmed")} />
          <span>Saya berusia minimal 18 tahun, atau berdonasi dengan persetujuan dan pendampingan orang tua/wali.</span>
        </label>
        <FieldError>{fieldError("ageConfirmed")}</FieldError>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="acceptedTerms" required className="mt-1 h-4 w-4" aria-invalid={!!fieldError("acceptedTerms")} />
          <span>
            Saya telah membaca dan menyetujui <Link href="/terms" target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">Syarat Layanan</Link> dan{" "}
            <Link href="/privacy" target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">Kebijakan Privasi</Link> (terbuka di tab baru).
          </span>
        </label>
        <FieldError>{fieldError("acceptedTerms")}</FieldError>
      </fieldset>

      <div className="rounded-xl border border-slate-200 bg-brand-soft p-4 text-sm" aria-live="polite">
        <p className="font-semibold text-slate-900">Total yang Anda bayar: {totalLabel}</p>
        <p className="mt-0.5 text-slate-700">Sama dengan nominal donasi. Tidak ada biaya admin atau biaya tersembunyi dari kami.</p>
      </div>

      <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full py-3">
        {submitting ? (<><Spinner />Memproses donasi aman…</>) : "Lanjut ke pembayaran"}
      </Button>
    </form>
  );
}
