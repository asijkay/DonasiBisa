import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getBrand } from "@/services/brand.service";
import { getCurrentUser } from "@/lib/auth/session";
import { AppBackground } from "@/components/public/app-background";
import { CookieBanner } from "@/components/public/cookie-banner";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { ChromeGate } from "@/components/public/chrome-gate";

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
/** Picks dark or white text for a solid background by WCAG relative luminance, so no text color is hardcoded per brand. */
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#0b0f14" : "#ffffff";
}
const safeColor = (v: string, fallback: string) => (HEX.test(v) ? v : fallback);

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [brand, user] = await Promise.all([getBrand(), getCurrentUser().catch(() => null)]);
  // Colors are validated against #RRGGBB before being interpolated into CSS.
  const css = `:root{--brand-primary:${safeColor(brand.primaryColor, "#0064db")};--brand-secondary:${safeColor(brand.secondaryColor, "#062246")};--brand-accent:${safeColor(brand.accentColor, "#ff6b57")};--brand-bg:${safeColor(brand.backgroundColor, "#ffffff")};--on-accent:${readableOn(safeColor(brand.accentColor, "#ff6b57"))}}`;
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
        <ChromeGate header={<SiteHeader brand={brand} user={user} />} footer={<SiteFooter brand={brand} />}>
          {children}
        </ChromeGate>
        <CookieBanner />
      </body>
    </html>
  );
}
