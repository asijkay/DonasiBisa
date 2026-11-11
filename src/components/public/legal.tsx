import type { ReactNode } from "react";
import { PageNav } from "./page-nav";
import { Alert } from "@/components/ui";
import type { BrandDTO } from "@/services/brand.service";
import { LEGAL_LAST_UPDATED } from "@/lib/consent";

export function LegalPage({ title, intro, sections, children, crumb }: { title: string; intro: string; sections: Array<{ id: string; title: string }>; children: ReactNode; crumb: string }) {
  return (
    <article className="mx-auto max-w-3xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: crumb }]} />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Terakhir diperbarui: {LEGAL_LAST_UPDATED}</p>
      <p className="mt-4 text-slate-700">{intro}</p>
      <nav aria-label="Daftar isi" className="mt-6 rounded-2xl border border-slate-200 bg-card p-4">
        <p className="mb-2 text-sm font-bold text-slate-900">Daftar isi</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {sections.map((s) => (<li key={s.id}><a className="inline-block py-1 text-brand-ink underline-offset-2 hover:underline" href={`#${s.id}`}>{s.title}</a></li>))}
        </ol>
      </nav>
      <div className="legal mt-8 space-y-8">{children}</div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="scroll-mt-24">
      <h2 id={`h-${id}`} className="mb-3 text-xl font-bold text-slate-900">{title}</h2>
      <div className="space-y-3 leading-relaxed text-slate-700 [&_a]:text-brand-ink [&_a]:underline [&_li]:ml-1 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6 [&_strong]:text-slate-900 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:text-left [&_table]:text-sm [&_td]:border [&_td]:border-slate-200 [&_td]:p-2.5 [&_td]:align-top [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

/** Controller / business identity, read from Brand Config (admin → Brand). */
export function BusinessDetails({ brand, showAdminHint = false }: { brand: BrandDTO; showAdminHint?: boolean }) {
  const rows: Array<[string, string | null]> = [
    ["Nama penyelenggara", brand.legalName ?? brand.brandName],
    ["Bentuk badan", brand.legalForm],
    ["Nomor pengesahan / izin", brand.registrationNumber],
    ["NPWP", brand.taxId],
    ["Alamat", brand.address],
    ["Email", brand.contactEmail],
    ["WhatsApp", brand.contactWhatsapp],
    ["Kontak privasi", brand.privacyContactEmail ?? brand.contactEmail],
  ];
  const filled = rows.filter(([, v]) => !!v);
  const incomplete = !brand.legalName || !brand.address || !(brand.privacyContactEmail ?? brand.contactEmail);
  return (
    <div className="not-prose space-y-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-2xl border border-slate-200 bg-card p-4 text-sm">
        {filled.map(([k, v]) => (<div key={k} className="contents"><dt className="font-semibold text-slate-900">{k}</dt><dd className="text-slate-700">{v}</dd></div>))}
      </dl>
      {incomplete && showAdminHint && <Alert tone="warning" title="Informasi belum lengkap (hanya terlihat oleh admin)">Detail badan hukum, alamat, atau kontak privasi belum dilengkapi pengelola. Pengelola dapat mengisinya di Admin → Brand.</Alert>}
    </div>
  );
}
