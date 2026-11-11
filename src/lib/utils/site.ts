/** Public origin used for canonical URLs, Open Graph and the sitemap. Falls back to Vercel's production domain. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return (configured ?? "http://localhost:3000").replace(/\/$/, "");
}
