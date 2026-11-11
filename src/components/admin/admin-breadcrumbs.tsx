"use client";

import { usePathname } from "next/navigation";
import { PageNav, type Crumb } from "@/components/public/page-nav";

const LABELS: Record<string, string> = {
  admin: "Admin",
  campaigns: "Campaign",
  news: "Berita",
  "payment-methods": "Metode pembayaran",
  transactions: "Transaksi",
  donors: "Donatur",
  "notification-templates": "Template notifikasi",
  "notification-logs": "Log notifikasi",
  "payment-logs": "Log pembayaran",
  "audit-logs": "Audit log",
  "data-requests": "Permintaan data",
  brand: "Brand",
  users: "Pengguna admin",
  new: "Baru",
};

/** Builds crumbs from the URL. Dynamic ids are shown as "Detail". */
export function AdminBreadcrumbs() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return null; // dashboard needs no trail
  const crumbs: Crumb[] = [{ label: "Beranda", href: "/" }];
  parts.forEach((seg, i) => {
    crumbs.push({ label: LABELS[seg] ?? "Detail", href: `/${parts.slice(0, i + 1).join("/")}` });
  });
  return <PageNav crumbs={crumbs} />;
}
