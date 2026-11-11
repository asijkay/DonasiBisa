import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

const ITEMS: Array<{ href: string; label: string; perm: Permission | null }> = [
  { href: "/admin", label: "Dashboard", perm: null },
  { href: "/admin/campaigns", label: "Campaign", perm: "campaign:read" },
  { href: "/admin/news", label: "Berita", perm: "news:read" },
  { href: "/admin/payment-methods", label: "Metode pembayaran", perm: "payment:read" },
  { href: "/admin/transactions", label: "Transaksi", perm: "transaction:read" },
  { href: "/admin/donors", label: "Donatur", perm: "donor:read" },
  { href: "/admin/notification-templates", label: "Template notifikasi", perm: "notification:read" },
  { href: "/admin/notification-logs", label: "Log notifikasi", perm: "notification:read" },
  { href: "/admin/payment-logs", label: "Log pembayaran", perm: "payment:read" },
  { href: "/admin/data-requests", label: "Permintaan data", perm: "admin:manage" },
  { href: "/admin/audit-logs", label: "Audit log", perm: "admin:manage" },
  { href: "/admin/brand", label: "Brand", perm: "brand:configure" },
  { href: "/admin/users", label: "Pengguna admin", perm: "admin:manage" },
];

/** Hiding links is UX only; every page and action re-checks permission on the server. */
export function AdminNav({ user }: { user: SessionUser }) {
  return (
    <nav aria-label="Navigasi admin" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {ITEMS.filter((i) => !i.perm || hasPermission(user.roles, i.perm)).map((i) => (
        <Link key={i.href} href={i.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
