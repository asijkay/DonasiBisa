"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FieldError, Input, Label, Spinner, Textarea, cn } from "@/components/ui";
import { formatIDR } from "@/lib/utils/format";
import { normalizeWhatsapp } from "@/lib/utils/contact";

type Props = {
  slug: string;
  amountMode: "OPEN_AMOUNT" | "CLOSED_AMOUNT";
  options: Array<{ id: string; amount: number; label: string | null }>;
  min: number;
  max: number;
};

/** Which element receives focus for the first invalid field. */
const FOCUS_ID: Record<string, string> = { amount: "amount", amountOptionId: "amount-first", "donor.name": "name", "donor.email": "email", whatsapp: "whatsapp", ageConfirmed: "ageConfirmed", acceptedTerms: "acceptedTerms" };
const CHECK = "mt-0.5 h-5 w-5 shrink-0";
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
  const liveAmountError = amountMode === "OPEN_AMOUNT" && chosen !== undefined ? (chosen < min ? `Minimal ${formatIDR(min)}` : chosen > max ? `Maksimal ${formatIDR(max)}` : undefined) : undefined;
  const totalLabel = liveAmountError ? "—" : chosen ? formatIDR(chosen) : "pilih nominal terlebih dahulu";
  const fieldError = (p: string) => issues.find((i) => i.path === p || i.path.endsWith(p))?.message;
  const amountError = fieldError("amount") ?? fieldError("amountOptionId") ?? liveAmountError;

  /** Mirrors the server rules so obvious mistakes are caught before a request is made (the server still re-validates). */
  function validate(fd: FormData): Issue[] {
    const out: Issue[] = [];
    const text = (k: string) => String(fd.get(k) ?? "").trim();
    if (amountMode === "CLOSED_AMOUNT") {
      if (!optionId) out.push({ path: "amountOptionId", message: "Pilih salah satu nominal." });
    } else if (!chosen) out.push({ path: "amount", message: "Isi nominal donasi." });
    else if (liveAmountError) out.push({ path: "amount", message: liveAmountError });
    if (!text("name")) out.push({ path: "donor.name", message: "Nama wajib diisi." });
    if (!/^\S+@\S+\.\S+$/.test(text("email"))) out.push({ path: "donor.email", message: "Masukkan alamat email yang valid." });
    if (wa && !normalizeWhatsapp(text("whatsapp"))) out.push({ path: "whatsapp", message: "Masukkan nomor WhatsApp yang valid, contoh 081234567890." });
    if (fd.get("ageConfirmed") !== "on") out.push({ path: "ageConfirmed", message: "Konfirmasi usia diperlukan." });
    if (fd.get("acceptedTerms") !== "on") out.push({ path: "acceptedTerms", message: "Anda perlu menyetujui Syarat Layanan dan Kebijakan Privasi." });
    return out;
  }

  const clearIssue = (...paths: string[]) => setIssues((cur) => (cur.some((i) => paths.includes(i.path)) ? cur.filter((i) => !paths.includes(i.path)) : cur));
  const PATH_OF: Record<string, string> = { name: "donor.name", email: "donor.email", whatsapp: "whatsapp", ageConfirmed: "ageConfirmed", acceptedTerms: "acceptedTerms" };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || submitting) return;
    const fd = new FormData(e.currentTarget);
    const problems = validate(fd);
    if (problems.length > 0) {
      setError(null);
      setIssues(problems);
      document.getElementById(FOCUS_ID[problems[0].path] ?? "")?.focus();
      return;
    }
    inFlight.current = true;
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
    <form onSubmit={onSubmit} onChange={(e) => { const p = PATH_OF[(e.target as unknown as HTMLInputElement).name]; if (p) clearIssue(p); }} noValidate className="space-y-6" aria-busy={submitting}>
      {error && <Alert tone="danger">{error}</Alert>}

      <fieldset>
        <legend className="mb-4 text-sm font-semibold">Nominal donasi</legend>
        {amountMode === "CLOSED_AMOUNT" ? (
          <div className="grid gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Pilih nominal">
            {options.map((o) => (
              <label key={o.id} className={cn(AMOUNT_BTN, "block cursor-pointer p-4 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30", optionId === o.id ? AMOUNT_ON : AMOUNT_OFF)}>
                <input id={o.id === options[0]?.id ? "amount-first" : undefined} type="radio" name="amountOption" value={o.id} checked={optionId === o.id} onChange={() => { setOptionId(o.id); clearIssue("amountOptionId"); }} className="sr-only" />
                <span className="block font-semibold">{formatIDR(o.amount)}</span>
                {o.label && <span className="text-xs text-slate-600">{o.label}</span>}
              </label>
            ))}
          </div>
        ) : (
          <div>
            <Label htmlFor="amount" hint={`(min ${formatIDR(min)}, maks ${formatIDR(max)})`}>Nominal (Rp)</Label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">Rp</span>
              <Input id="amount" inputMode="numeric" autoComplete="off" placeholder="Nominal lain" className="pl-10" value={amount ? Number(amount).toLocaleString("id-ID") : ""} onChange={(e) => { setAmount(e.target.value.replace(/[^\d]/g, "")); clearIssue("amount"); }} aria-invalid={!!amountError} aria-describedby={amountError ? "amount-error" : undefined} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[25000, 50000, 100000, 250000].map((v) => (
                <button key={v} type="button" aria-pressed={amount === String(v)} onClick={() => { setAmount(String(v)); clearIssue("amount"); }} className={cn(AMOUNT_BTN, "px-4 py-2 text-xs", amount === String(v) ? AMOUNT_ON : AMOUNT_OFF)}>
                  {formatIDR(v)}
                </button>
              ))}
            </div>
          </div>
        )}
        <FieldError id="amount-error">{amountError}</FieldError>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nama lengkap</Label>
          <Input id="name" name="name" autoComplete="name" required aria-invalid={!!fieldError("donor.name")} aria-describedby={fieldError("donor.name") ? "name-error" : undefined} />
          <FieldError id="name-error">{fieldError("donor.name")}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!fieldError("donor.email")} aria-describedby={fieldError("donor.email") ? "email-error" : undefined} />
          <FieldError id="email-error">{fieldError("donor.email")}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="message" hint="(opsional)">Pesan atau doa</Label>
        <Textarea id="message" name="message" rows={3} maxLength={500} />
      </div>

      <div className="space-y-4 text-sm">
        <label className="flex items-start gap-3 py-1">
          <input type="checkbox" name="isAnonymous" className={CHECK} />
          <span>Sembunyikan nama saya dari tampilan publik (donasi anonim).</span>
        </label>
        <div className="space-y-4">
          <label className="flex items-start gap-3 py-1">
            <input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} className={CHECK} aria-controls="wa-field" aria-expanded={wa} />
            <span>Kirimi saya notifikasi transaksi lewat WhatsApp <span className="text-slate-600">(opsional; nomor hanya diminta jika Anda memilih ini)</span>.</span>
          </label>
          {wa && (
            <div id="wa-field" className="ml-6">
              <Label htmlFor="whatsapp" hint="(contoh 081234567890)">Nomor WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required aria-invalid={!!fieldError("whatsapp")} />
              <FieldError>{fieldError("whatsapp")}</FieldError>
            </div>
          )}
        </div>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 text-sm">
        <legend className="px-2 font-semibold">Persetujuan (wajib)</legend>
        <label className="flex items-start gap-3 py-1">
          <input id="ageConfirmed" type="checkbox" name="ageConfirmed" required className={CHECK} aria-invalid={!!fieldError("ageConfirmed")} />
          <span>Saya berusia minimal 18 tahun, atau berdonasi dengan persetujuan dan pendampingan orang tua/wali.</span>
        </label>
        <FieldError>{fieldError("ageConfirmed")}</FieldError>
        <label className="flex items-start gap-3 py-1">
          <input id="acceptedTerms" type="checkbox" name="acceptedTerms" required className={CHECK} aria-invalid={!!fieldError("acceptedTerms")} />
          <span>
            Saya telah membaca dan menyetujui <Link href="/terms" target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">Syarat Layanan</Link> dan{" "}
            <Link href="/privacy" target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">Kebijakan Privasi</Link> (terbuka di tab baru).
          </span>
        </label>
        <FieldError>{fieldError("acceptedTerms")}</FieldError>
      </fieldset>

      <div className="rounded-xl border border-slate-200 bg-brand-soft p-4 text-sm" aria-live="polite">
        <p className={cn("font-semibold", liveAmountError ? "text-red-700 dark:text-red-400" : "text-slate-900")}>Total yang Anda bayar: {totalLabel}{liveAmountError ? ` (${liveAmountError.toLowerCase()})` : ""}</p>
        <p className="mt-0.5 text-slate-700">Sama dengan nominal donasi. Tidak ada biaya admin atau biaya tersembunyi dari kami.</p>
      </div>

      <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full py-3">
        {submitting ? (<><Spinner />Memproses donasi aman…</>) : "Lanjut ke pembayaran"}
      </Button>
    </form>
  );
}
