import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { getBrand } from "@/services/brand.service";
import { signOutAction } from "@/app/actions/auth";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminFrame } from "@/components/admin/admin-frame";
import { AdminNavLinks, type NavGroup, type NavIcon } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/public/logo";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { IconExternal, IconLogout } from "@/components/public/icons";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

type Def = { href: string; label: string; icon: NavIcon; perm: Permission | null };
const GROUPS: Array<{ title: string; items: Def[] }> = [
  { title: "Ikhtisar", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", perm: null }] },
  {
    title: "Konten",
    items: [
      { href: "/admin/campaigns", label: "Campaign", icon: "campaign", perm: "campaign:read" },
      { href: "/admin/news", label: "Berita", icon: "news", perm: "news:read" },
    ],
  },
  {
    title: "Keuangan",
    items: [
      { href: "/admin/transactions", label: "Transaksi", icon: "transactions", perm: "transaction:read" },
      { href: "/admin/donors", label: "Donatur", icon: "donors", perm: "donor:read" },
      { href: "/admin/payment-methods", label: "Metode pembayaran", icon: "payment", perm: "payment:read" },
      { href: "/admin/payment-logs", label: "Log pembayaran", icon: "paymentLog", perm: "payment:read" },
    ],
  },
  {
    title: "Notifikasi",
    items: [
      { href: "/admin/notification-templates", label: "Template", icon: "templates", perm: "notification:read" },
      { href: "/admin/notification-logs", label: "Log notifikasi", icon: "notifLog", perm: "notification:read" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/data-requests", label: "Permintaan data", icon: "dataRequests", perm: "admin:manage" },
      { href: "/admin/audit-logs", label: "Audit log", icon: "audit", perm: "admin:manage" },
      { href: "/admin/brand", label: "Brand", icon: "brand", perm: "brand:configure" },
      { href: "/admin/users", label: "Pengguna admin", icon: "users", perm: "admin:manage" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [user, brand] = await Promise.all([requireAdminUser(), getBrand()]);
  const groups: NavGroup[] = GROUPS.map((g) => ({
    title: g.title,
    items: g.items.filter((i) => !i.perm || hasPermission(user.roles, i.perm)).map(({ href, label, icon }) => ({ href, label, icon })),
  })).filter((g) => g.items.length > 0);

  const sidebar = (
    <div className="flex min-h-full flex-col px-4 py-5">
      <Link href="/admin" aria-label={`${brand.brandName}: dashboard admin`} className="mb-7 block px-2">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt={brand.brandName} className="h-9 w-auto object-contain" />
        ) : (
          <Image src="/brand/logo-dark.png" alt={brand.brandName} width={1600} height={425} sizes="180px" className="h-9 w-auto" priority />
        )}
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/80">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-fixed" /> Panel admin
        </span>
      </Link>

      <AdminNavLinks groups={groups} />

      <div className="mt-auto space-y-3 pt-8">
        <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
          <Avatar src={user.image} name={user.name} size={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name ?? user.email}</p>
            <p className="truncate text-xs text-white/55">{user.roles.join(" · ").replaceAll("_", " ").toLowerCase()}</p>
          </div>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white">
            <IconLogout width={16} height={16} /> Keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <AdminFrame
      sidebar={sidebar}
      topbarRight={
        <>
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-card px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand-ink">
            Lihat situs <IconExternal width={14} height={14} />
          </Link>
        </>
      }
    >
      <AdminBreadcrumbs />
      {children}
    </AdminFrame>
  );
}
