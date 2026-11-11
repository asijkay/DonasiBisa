import "server-only";
import { db } from "@/db";
import { brandConfig } from "@/db/schema";
import { cacheDel, cached } from "@/lib/cache/redis";
import { CacheKeys } from "@/lib/cache/cache-keys";
import type { z } from "zod";
import type { brandInputSchema } from "@/lib/validation/schemas";
import { writeAudit } from "./audit.service";

export type BrandDTO = {
  brandName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  address: string | null;
  website: string | null;
  ctaLabel: string;
  socialLinks: Record<string, string>;
  footerText: string | null;
};

/** Neutral fallback used until the singleton row exists. Never hardcode these in components. */
const FALLBACK: BrandDTO = {
  brandName: "DonasiBisa",
  tagline: null,
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0064db",
  secondaryColor: "#062246",
  accentColor: "#fc9f27",
  backgroundColor: "#ffffff",
  contactEmail: null,
  contactWhatsapp: null,
  address: null,
  website: null,
  ctaLabel: "Donasi Sekarang",
  socialLinks: {},
  footerText: null,
};

export async function getBrand(): Promise<BrandDTO> {
  try {
    return await cached(CacheKeys.brand, 60, async () => {
      const [row] = await db.select().from(brandConfig).limit(1);
      if (!row) return FALLBACK;
      return JSON.parse(JSON.stringify({ ...FALLBACK, ...row })) as BrandDTO;
    });
  } catch {
    return FALLBACK; // never take the whole site down for branding
  }
}

export async function saveBrand(input: z.infer<typeof brandInputSchema>, actorId: string): Promise<void> {
  const [before] = await db.select().from(brandConfig).limit(1);
  const values = {
    brandName: input.brandName,
    tagline: input.tagline ?? null,
    logoUrl: input.logoUrl ?? null,
    faviconUrl: input.faviconUrl ?? null,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    backgroundColor: input.backgroundColor,
    contactEmail: input.contactEmail ?? null,
    contactWhatsapp: input.contactWhatsapp ?? null,
    address: input.address ?? null,
    website: input.website ?? null,
    ctaLabel: input.ctaLabel,
    footerText: input.footerText ?? null,
    socialLinks: input.socialLinks,
    updatedAt: new Date(),
  };
  await db.insert(brandConfig).values(values).onConflictDoUpdate({ target: brandConfig.singleton, set: values });
  await writeAudit(db, actorId, "brand.update", "brand", null, before ? { brandName: before.brandName } : null, { brandName: input.brandName });
  await cacheDel(CacheKeys.brand);
}
