import Link from "next/link";
import type { BrandDTO } from "@/services/brand.service";
import type { SessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CookieSettingsButton } from "./cookie-banner";

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
          <ThemeToggle className="hidden sm:inline-flex" />
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

          <MobileMenu>
            {NAV.map((n) => (<Link key={n.href} href={n.href} className={`${link} block`}>{n.label}</Link>))}
            <hr className="my-2 border-slate-200" />
            <div className="flex items-center justify-between px-3 py-1 text-sm font-medium text-slate-700">Tema <ThemeToggle /></div>
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
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ brand }: { brand: BrandDTO }) {
  const l = "rounded underline-offset-2 hover:text-white hover:underline";
  return (
    <footer className="band-navy text-white/90">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1">
          <p className="text-lg font-bold text-white">{brand.brandName}</p>
          {brand.tagline && <p className="text-sm">{brand.tagline}</p>}
          {brand.legalName && <p className="text-sm">{brand.legalName}{brand.legalForm ? ` (${brand.legalForm})` : ""}</p>}
          {brand.registrationNumber && <p className="text-xs text-white/80">No. pengesahan: {brand.registrationNumber}</p>}
          {brand.address && <p className="text-sm">{brand.address}</p>}
        </div>
        <nav aria-label="Jelajahi" className="space-y-2 text-sm">
          <p className="font-semibold text-white">Jelajahi</p>
          <ul className="space-y-1.5">
            <li><Link className={l} href="/campaigns">Semua campaign</Link></li>
            <li><Link className={l} href="/news">Berita &amp; update</Link></li>
            <li><Link className={l} href="/#faq">Pertanyaan umum</Link></li>
            <li><Link className={l} href="/tentang">Tentang &amp; Kontak</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal dan privasi" className="space-y-2 text-sm">
          <p className="font-semibold text-white">Legal &amp; privasi</p>
          <ul className="space-y-1.5">
            <li><Link className={l} href="/terms">Syarat Layanan</Link></li>
            <li><Link className={l} href="/privacy">Kebijakan Privasi</Link></li>
            <li><Link className={l} href="/refund">Pengembalian Dana</Link></li>
            <li><Link className={l} href="/cookies">Kebijakan Cookie</Link></li>
            <li><Link className={l} href="/permintaan-data">Permintaan data pribadi</Link></li>
            <li><CookieSettingsButton className={`${l} text-left`} /></li>
          </ul>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Kontak &amp; aksesibilitas</p>
          {brand.contactEmail && <p><a className={l} href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a></p>}
          {brand.contactWhatsapp && <p>WhatsApp {brand.contactWhatsapp}</p>}
          <p><Link className={l} href="/aksesibilitas">Pernyataan aksesibilitas</Link></p>
          <p><Link className={l} href="/kredit-foto">Kredit foto</Link></p>
          <p className="pt-2 text-xs text-white/80">Tidak ada biaya tambahan: yang Anda bayar sama dengan nominal donasi. Data donatur tidak ditampilkan ke publik.</p>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/80">{brand.footerText ?? `© ${new Date().getFullYear()} ${brand.brandName}`}</div>
    </footer>
  );
}
