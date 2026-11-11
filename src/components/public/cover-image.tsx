/* eslint-disable @next/next/no-img-element */
import { cn } from "@/components/ui";

/** Cover images are admin-supplied URLs (MVP); a neutral gradient is shown when absent. */
export function CoverImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src) return <div aria-hidden className={cn("bg-gradient-to-br from-brand/20 to-brand-accent/20", className)} />;
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
