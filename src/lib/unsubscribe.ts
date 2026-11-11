import "server-only";
import { createHmac } from "node:crypto";
import { getEnv } from "@/lib/env";
import { safeEqual } from "@/lib/utils/security";

const b64 = (s: string) => Buffer.from(s).toString("base64url");

function sign(payload: string): string {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(`unsubscribe:${payload}`).digest("base64url");
}

/** Stateless, tamper-proof token (donor id + HMAC). It can only unsubscribe — never reveals data. */
export function createUnsubscribeToken(donorId: string): string {
  const p = b64(donorId);
  return `${p}.${sign(p)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [p, sig] = token.split(".");
  if (!p || !sig || !safeEqual(sig, sign(p))) return null;
  const id = Buffer.from(p, "base64url").toString();
  return /^[0-9a-f-]{36}$/.test(id) ? id : null;
}

export function unsubscribeUrl(donorId: string): string {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/unsubscribe?t=${createUnsubscribeToken(donorId)}`;
}

/** RFC 8058 one-click endpoint (POST) referenced from the List-Unsubscribe header. */
export function unsubscribeApiUrl(donorId: string): string {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/api/unsubscribe?t=${createUnsubscribeToken(donorId)}`;
}
