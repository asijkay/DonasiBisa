import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function sha512(input: string): string {
  return createHash("sha512").update(input).digest("hex");
}

/** Constant-time string comparison; false on length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Unguessable public donation code, e.g. DON-7H2K9QWX4MPA (60 bits of entropy). */
export function generateDonationCode(): string {
  const bytes = randomBytes(12);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `DON-${out}`;
}

/** Only absolute HTTPS URLs (or http for localhost in dev) are acceptable for redirects/images. */
export function isSafeHttpUrl(value: string, opts: { allowLocalhostHttp?: boolean } = {}): boolean {
  try {
    const u = new URL(value);
    if (u.protocol === "https:") return true;
    return !!opts.allowLocalhostHttp && u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

/** Remove well-known sensitive keys from provider payloads before persisting/logging. */
const SENSITIVE_KEY = /(signature|token|secret|password|authorization|card|cvv|cvc|pan|masked_card|bin|api[_-]?key)/i;
export function sanitizePayload(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitizePayload(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : sanitizePayload(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}
