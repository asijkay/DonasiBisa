/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { cn } from "@/components/ui";

/**
 * Cover images are admin-supplied URLs (MVP); a neutral gradient is shown when absent. Files served from this site
 * go through next/image (resized, WebP); remote URLs stay plain <img> so we never proxy arbitrary hosts.
 */
export function CoverImage({ src, alt, className, sizes = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw", priority = false }: { src?: string | null; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) {
    return (
      <div aria-hidden className={cn("flex items-center justify-center bg-gradient-to-br from-brand-soft to-brand/20", className)}>
        <Image src="/brand/icon-192.png" alt="" width={96} height={96} className="h-16 w-16 opacity-70" />
      </div>
    );
  }
  if (src.startsWith("/")) {
    return <Image src={src} alt={alt} width={1200} height={800} sizes={sizes} priority={priority} quality={70} className={cn("object-cover", className)} />;
  }
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} className={cn("object-cover", className)} />;
}
