/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { BrandDTO } from "@/services/brand.service";
import type { SessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";

export function SiteHeader({ brand, user }: { brand: BrandDTO; user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />}
          <span>{brand.brandName}</span>
        </Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/#campaign" className="rounded px-2 py-1 hover:bg-slate-100">Campaign</Link>
          <Link href="/news" className="rounded px-2 py-1 hover:bg-slate-100">Berita</Link>
          {user ? (
            <>
              {user.roles.length > 0 && <Link href="/admin" className="rounded px-2 py-1 hover:bg-slate-100">Admin</Link>}
              <Link href="/account" className="rounded px-2 py-1 hover:bg-slate-100">Akun</Link>
              <form action={signOutAction}>
                <button className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100" type="submit">Keluar</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded px-2 py-1 hover:bg-slate-100">Masuk</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ brand }: { brand: BrandDTO }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="font-semibold text-slate-900">{brand.brandName}</p>
          {brand.tagline && <p className="mt-1">{brand.tagline}</p>}
          {brand.address && <p className="mt-2">{brand.address}</p>}
        </div>
        <div className="space-y-1 sm:text-right">
          {brand.contactEmail && <p>{brand.contactEmail}</p>}
          {brand.contactWhatsapp && <p>WhatsApp {brand.contactWhatsapp}</p>}
          <p className="text-xs">Data pribadi donatur tidak ditampilkan ke publik. Pembayaran diproses oleh Midtrans/Xendit.</p>
          <p className="text-xs">{brand.footerText}</p>
        </div>
      </div>
    </footer>
  );
}
