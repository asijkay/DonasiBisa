import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Verification builds use NEXT_DIST_DIR=.next-verify so they never clobber a running `next dev` (.next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // Render <title>/<meta> in <head> for every client (not only known bots) instead of streaming them into <body>.
  htmlLimitedBots: /.*/,
  serverExternalPackages: ["postgres", "nodemailer", "pdf-lib"],
  images: { qualities: [70, 75], remotePatterns: [{ protocol: "https", hostname: "**" }] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Landing/brand images are not content-hashed, so cache for a week and revalidate in the background.
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
