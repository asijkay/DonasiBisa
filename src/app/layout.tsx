import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getBrand } from "@/services/brand.service";
import { getCurrentUser } from "@/lib/auth/session";
import { AppBackground } from "@/components/public/app-background";
import { CookieBanner } from "@/components/public/cookie-banner";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";

// Pages read live data (campaigns, sessions); never prerender them at build time.
export const dynamic = "force-dynamic";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: { default: brand.brandName, template: `%s · ${brand.brandName}` },
    description: brand.tagline ?? "Platform donasi online",
    icons: brand.faviconUrl ? { icon: brand.faviconUrl } : undefined,
  };
}

const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("theme")||sessionStorage.getItem("theme")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

const HEX = /^#[0-9a-fA-F]{6}$/;
const safeColor = (v: string, fallback: string) => (HEX.test(v) ? v : fallback);

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [brand, user] = await Promise.all([getBrand(), getCurrentUser().catch(() => null)]);
  // Colors are validated against #RRGGBB before being interpolated into CSS.
  const css = `:root{--brand-primary:${safeColor(brand.primaryColor, "#0064db")};--brand-secondary:${safeColor(brand.secondaryColor, "#062246")};--brand-accent:${safeColor(brand.accentColor, "#ff6b57")};--brand-bg:${safeColor(brand.backgroundColor, "#ffffff")}}`;
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {/* Resolve the theme before first paint (default = device setting) to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppBackground />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
          Lewati ke konten
        </a>
        <SiteHeader brand={brand} user={user} />
        <main id="main" tabIndex={-1} className="mx-auto outline-none min-h-[60vh] max-w-6xl px-4 pb-16 pt-8">
          {children}
        </main>
        <SiteFooter brand={brand} />
        <CookieBanner />
      </body>
    </html>
  );
}
