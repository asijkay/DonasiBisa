import type { MetadataRoute } from "next";
import { getBrand } from "@/services/brand.service";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrand();
  return {
    name: brand.brandName,
    short_name: brand.brandName,
    description: "Platform donasi online",
    start_url: "/",
    display: "standalone",
    background_color: brand.backgroundColor,
    theme_color: brand.primaryColor,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
