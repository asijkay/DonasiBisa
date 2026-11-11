import type { Metadata } from "next";
import Link from "next/link";
import { PageNav } from "@/components/public/page-nav";
import { BusinessDetails } from "@/components/public/legal";
import { getBrand } from "@/services/brand.service";

export const metadata: Metadata = { title: "Tentang & Kontak" };

export default async function AboutPage() {
  const brand = await getBrand();
  return (
    <div className="mx-auto max-w-3xl">
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Tentang & Kontak" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tentang &amp; Kontak</h1>
      <p className="mt-3 text-slate-700">{brand.brandName} adalah platform donasi online{brand.tagline ? ` — ${brand.tagline}` : ""}. Berikut identitas penyelenggara dan cara menghubungi kami.</p>
      <h2 className="mb-3 mt-8 text-xl font-bold text-slate-900">Detail bisnis</h2>
      <BusinessDetails brand={brand} />
      <h2 className="mb-3 mt-8 text-xl font-bold text-slate-900">Kebijakan</h2>
      <ul className="list-disc space-y-1.5 pl-6 text-slate-700">
        <li><Link className="text-brand-ink underline" href="/terms">Syarat Layanan</Link></li>
        <li><Link className="text-brand-ink underline" href="/privacy">Kebijakan Privasi</Link></li>
        <li><Link className="text-brand-ink underline" href="/refund">Kebijakan Pengembalian Dana</Link></li>
        <li><Link className="text-brand-ink underline" href="/cookies">Kebijakan Cookie</Link></li>
        <li><Link className="text-brand-ink underline" href="/aksesibilitas">Pernyataan Aksesibilitas</Link></li>
        <li><Link className="text-brand-ink underline" href="/permintaan-data">Permintaan data pribadi (akses / hapus)</Link></li>
      </ul>
    </div>
  );
}
