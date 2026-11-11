"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The header "Donasi" button. Hidden on the checkout itself, where it would only lead people away from the form. */
export function HeaderCta({ label, className }: { label: string; className: string }) {
  const pathname = usePathname();
  if (pathname === "/donate" || pathname.startsWith("/donate/")) return null;
  return <Link href="/campaigns" className={className}>{label}</Link>;
}
