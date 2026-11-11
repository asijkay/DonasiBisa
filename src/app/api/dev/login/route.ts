import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { isDevelopment } from "@/lib/env";
import { afterVerifiedLogin } from "@/lib/auth/after-login";
import { normalizeEmail } from "@/lib/utils/contact";

export const runtime = "nodejs";

/**
 * DEV ONLY (APP_ENV=development): creates a real Auth.js database session for an e-mail without Google.
 * It runs the same post-login logic (admin bootstrap by allowlist, donor linking) as the Google flow.
 * Returns 404 in every other environment.
 */
export async function POST(request: NextRequest) {
  if (!isDevelopment()) return new NextResponse("Not found", { status: 404 });
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.redirect(new URL("/login?error=email", request.url), 303);

  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) [user] = await db.insert(users).values({ email, name: email.split("@")[0], emailVerified: new Date() }).returning();
  await afterVerifiedLogin(user.id);

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await db.insert(sessions).values({ sessionToken: token, userId: user.id, expires });

  const callback = String(form.get("callbackUrl") ?? "/account");
  const target = callback.startsWith("/") && !callback.startsWith("//") ? callback : "/account";
  const res = NextResponse.redirect(new URL(target, request.url), 303);
  res.cookies.set("authjs.session-token", token, { httpOnly: true, sameSite: "lax", path: "/", expires, secure: false });
  return res;
}
