import Link from "next/link";
import type { BrandDTO } from "@/services/brand.service";
import type { SessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { BrandLogo } from "./logo";
import { IconMenu } from "./icons";

const NAV = [
  { href: "/campaigns", label: "Campaign" },
  { href: "/news", label: "Berita" },
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader({ brand, user }: { brand: BrandDTO; user: SessionUser | null }) {
  const link = "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-soft hover:text-brand-ink";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label={`${brand.brandName} — beranda`} className="flex items-center">
          <BrandLogo brand={brand} className="h-9 sm:h-10" priority />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (<Link key={n.href} href={n.href} className={link}>{n.label}</Link>))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.roles.length > 0 && <Link href="/admin" className={`${link} hidden sm:inline-flex`}>Admin</Link>}
              <Link href="/account" className={`${link} hidden sm:inline-flex`}>Akun</Link>
              <form action={signOutAction} className="hidden sm:block"><button className={link} type="submit">Keluar</button></form>
            </>
          ) : (
            <Link href="/login" className={`${link} hidden sm:inline-flex`}>Masuk</Link>
          )}
          <Link href="/campaigns" className="hidden rounded-xl bg-brand-accent px-4 py-2 text-sm font-bold text-on-accent transition hover:brightness-105 sm:inline-flex">
            {brand.ctaLabel}
          </Link>

          {/* Mobile menu: native <details>, keyboard accessible, no JS needed. */}
          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-800" aria-label="Buka menu">
              <IconMenu width={20} height={20} />
            </summary>
            <div className="absolute right-0 mt-2 w-60 space-y-1 rounded-2xl border border-slate-200 bg-card p-3 shadow-xl">
              {NAV.map((n) => (<Link key={n.href} href={n.href} className={`${link} block`}>{n.label}</Link>))}
              <hr className="my-2 border-slate-200" />
              {user ? (
                <>
                  {user.roles.length > 0 && <Link href="/admin" className={`${link} block`}>Admin</Link>}
                  <Link href="/account" className={`${link} block`}>Akun saya</Link>
                  <form action={signOutAction}><button className={`${link} block w-full text-left`} type="submit">Keluar</button></form>
                </>
              ) : (
                <Link href="/login" className={`${link} block`}>Masuk</Link>
              )}
              <Link href="/campaigns" className="mt-2 block rounded-xl bg-brand-accent px-4 py-2.5 text-center text-sm font-bold text-on-accent">{brand.ctaLabel}</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ brand }: { brand: BrandDTO }) {
  return (
    <footer className="mt-20 bg-brand-secondary text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div className="space-y-3">
          <p className="text-lg font-bold text-white">{brand.brandName}</p>
          {brand.tagline && <p className="text-sm text-white/80">{brand.tagline}</p>}
          {brand.address && <p className="text-sm">{brand.address}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Jelajahi</p>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-white hover:underline" href="/campaigns">Semua campaign</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/news">Berita &amp; update</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/#faq">Pertanyaan umum</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/kredit-foto">Kredit foto</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Kontak</p>
          {brand.contactEmail && <p>{brand.contactEmail}</p>}
          {brand.contactWhatsapp && <p>WhatsApp {brand.contactWhatsapp}</p>}
          <p className="text-xs text-white/60">Data pribadi donatur tidak ditampilkan ke publik. Pembayaran diproses oleh Midtrans dan Xendit.</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">{brand.footerText ?? `© ${new Date().getFullYear()} ${brand.brandName}`}</div>
    </footer>
  );
}
