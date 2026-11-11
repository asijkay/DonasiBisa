"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconBell, IconCard, IconChart, IconClock, IconGrid, IconHand, IconList, IconLock, IconMail, IconNews, IconPalette, IconShield, IconUsers,
} from "@/components/public/icons";

const ICONS = {
  dashboard: IconGrid, campaign: IconHand, news: IconNews, payment: IconCard, transactions: IconChart, donors: IconUsers,
  templates: IconMail, notifLog: IconBell, paymentLog: IconList, dataRequests: IconShield, audit: IconClock, brand: IconPalette, users: IconLock,
} as const;
export type NavIcon = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: NavIcon };
export type NavGroup = { title: string; items: NavItem[] };

/** Hiding links is UX only; every page and action re-checks permission on the server. */
export function AdminNavLinks({ groups }: { groups: NavGroup[] }): ReactNode {
  const path = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/45">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const active = i.href === "/admin" ? path === "/admin" : path === i.href || path.startsWith(`${i.href}/`);
              const Icon = ICONS[i.icon];
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" : "text-white/70 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {active && <span aria-hidden className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-accent-fixed" />}
                    <Icon width={18} height={18} className={active ? "text-brand-light" : "text-white/55 group-hover:text-white/85"} />
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
