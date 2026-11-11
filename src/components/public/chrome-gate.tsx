"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The public site chrome (header, footer, page container) wraps every page except the admin panel,
 * which brings its own shell (see app/admin/layout.tsx).
 */
export function ChromeGate({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return <>{children}</>;
  return (
    <>
      {header}
      <main id="main" tabIndex={-1} className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-16 pt-8 outline-none">
        {children}
      </main>
      {footer}
    </>
  );
}
