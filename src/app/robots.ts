import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/payment/", "/dev/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
