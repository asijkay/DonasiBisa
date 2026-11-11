import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/services/campaigns.service";
import { AuthzError } from "@/lib/auth/session";

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Maps known errors to safe JSON responses; unknown errors never leak details. */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Data tidak valid.", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  if (e instanceof DomainError) return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
  if (e instanceof AuthzError) return NextResponse.json({ error: e.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: e.message }, { status: e.status });
  console.error("[api] unhandled error", e instanceof Error ? e.message : e);
  return NextResponse.json({ error: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server." }, { status: 500 });
}

export function tooManyRequests(): NextResponse {
  return NextResponse.json({ error: "RATE_LIMITED", message: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429, headers: { "Retry-After": "60" } });
}
