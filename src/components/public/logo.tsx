/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import type { BrandDTO } from "@/services/brand.service";
import { cn } from "@/components/ui";

/**
 * Brand logo. Uses the admin-configured logo URL when set (single image); otherwise the bundled
 * DonasiBisa light/dark variants, switched by the visitor's color scheme.
 */
export function BrandLogo({ brand, className, priority = false }: { brand: BrandDTO; className?: string; priority?: boolean }) {
  if (brand.logoUrl) {
    return <img src={brand.logoUrl} alt={brand.brandName} className={cn("w-auto object-contain", className)} />;
  }
  return (
    <>
      <Image src="/brand/logo-light.png" alt={brand.brandName} width={1600} height={397} sizes="200px" priority={priority} className={cn("w-auto dark:hidden", className)} />
      <Image src="/brand/logo-dark.png" alt={brand.brandName} width={1600} height={425} sizes="200px" priority={priority} className={cn("hidden w-auto dark:block", className)} />
    </>
  );
}

/** Round avatar with the brand mark as placeholder (profile photo missing or failing). */
export function Avatar({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  return (
    <Image
      src={src || "/brand/placeholder.png"}
      alt={name ? `Foto profil ${name}` : "Foto profil"}
      width={size}
      height={size}
      unoptimized={!!src}
      className="rounded-full bg-slate-100 object-cover"
      style={{ width: size, height: size }}
    />
  );
}
