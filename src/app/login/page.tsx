import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui";
import { PageNav } from "@/components/public/page-nav";
import { GoogleButton } from "@/components/public/google-button";
import { IconCheck, IconLock } from "@/components/public/icons";
import { getCurrentUser } from "@/lib/auth/session";
import { getBrand } from "@/services/brand.service";
import { signInWithGoogleAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Masuk" };

const PERKS = ["Lihat riwayat dan total donasi Anda", "Unduh bukti donasi PDF kapan saja", "Donasi guest sebelumnya otomatis terhubung", "Tanpa password: cukup akun Google Anda"];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl = "/account", error } = await searchParams;
  const next = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/account";
  if (await getCurrentUser()) redirect(next);
  const brand = await getBrand();

  return (
    <div>
      <PageNav crumbs={[{ label: "Beranda", href: "/" }, { label: "Masuk" }]} />
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-card shadow-xl shadow-brand/10 lg:grid-cols-[1.05fr_1fr]">
        <aside className="band-navy relative hidden flex-col justify-between overflow-hidden p-8 text-white lg:flex">
          <Image src="/images/landing/hero.webp" alt="" width={1600} height={1067} className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
          <div className="relative">
            <span className="inline-block rounded-xl bg-white/95 px-3 py-2"><Image src="/brand/logo-light.png" alt={brand.brandName} width={1600} height={397} className="h-8 w-auto" /></span>
          </div>
          <div className="relative space-y-4">
            <h2 className="text-2xl font-extrabold leading-tight">Satu akun, semua jejak kebaikan Anda</h2>
            <ul className="space-y-2.5 text-sm text-white/90">
              {PERKS.map((p) => (<li key={p} className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20"><IconCheck width={12} height={12} strokeWidth={3} /></span>{p}</li>))}
            </ul>
          </div>
        </aside>

        <section className="flex flex-col justify-center gap-6 p-8 sm:p-10">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Masuk ke {brand.brandName}</h1>
            <p className="mt-2 text-sm text-slate-600">Masuk dengan Google untuk melihat riwayat donasi dan mengunduh bukti donasi. Anda <strong>tidak perlu masuk</strong> untuk berdonasi.</p>
          </div>
          {error && <Alert tone="danger">Login gagal. Pastikan email Google Anda terverifikasi, lalu coba lagi.</Alert>}
          <form action={signInWithGoogleAction}>
            <input type="hidden" name="callbackUrl" value={next} />
            <GoogleButton />
          </form>
          <p className="flex items-start gap-2 text-xs text-slate-500"><IconLock width={14} height={14} className="mt-0.5 shrink-0" /> Kami hanya menerima nama, email, dan foto profil Anda. Kami tidak menyimpan password Google.</p>
        </section>
      </div>
    </div>
  );
}
