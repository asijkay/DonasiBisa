import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a script nonce (production only: the dev server needs eval for HMR).
 * Scripts run only if they carry the nonce, so injected inline scripts are blocked ('strict-dynamic' lets Next's own
 * nonce'd bootstrap load its chunks). style-src keeps 'unsafe-inline' because React `style={{}}` attributes (progress
 * bars, charts) are inline styles; injected styles cannot execute code. No third-party origin is allowed except images
 * the admin links to. The nonce is forwarded as `x-nonce` for the one inline script we ship (theme, see app/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  if (process.env.NODE_ENV !== "production") return NextResponse.next({ request: { headers: requestHeaders } });

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  requestHeaders.set("Content-Security-Policy", csp); // Next reads the nonce from the request header to tag its scripts
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
