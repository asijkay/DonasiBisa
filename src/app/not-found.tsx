import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-slate-600">Tautan yang Anda buka tidak tersedia atau sudah tidak aktif.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <ButtonLink href="/">Kembali ke beranda</ButtonLink>
        <ButtonLink href="/campaigns" variant="secondary">Lihat kampanye</ButtonLink>
      </div>
      <p className="mt-4 text-sm"><Link href="/news" className="font-semibold text-brand-ink underline-offset-2 hover:underline">Baca berita &amp; update</Link></p>
    </div>
  );
}
