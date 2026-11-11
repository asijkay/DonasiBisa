/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { cn } from "@/components/ui";

/** Cover images are admin-supplied URLs (MVP); a neutral gradient is shown when absent. */
export function CoverImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div aria-hidden className={cn("flex items-center justify-center bg-gradient-to-br from-brand-soft to-brand/20", className)}>
        <Image src="/brand/icon-192.png" alt="" width={96} height={96} className="h-16 w-16 opacity-70" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
