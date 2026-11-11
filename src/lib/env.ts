import "server-only";
import { z } from "zod";

/** Case-insensitive boolean flag ("true"/"True"/"1"/"yes" → true). Unknown values are rejected. */
const bool = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(["true", "false", "1", "0", "yes", "no", ""]))
  .optional()
  .transform((v) => v === "true" || v === "1" || v === "yes");

const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const schema = z.object({
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16),
  ADMIN_EMAIL_ALLOWLIST: z.string().default(""),
  MIDTRANS_SERVER_KEY: optionalStr,
  MIDTRANS_CLIENT_KEY: optionalStr,
  MIDTRANS_IS_PRODUCTION: bool,
  PAYMENTS_MIDTRANS_ENABLED: bool,
  XENDIT_SECRET_KEY: optionalStr,
  XENDIT_WEBHOOK_TOKEN: optionalStr,
  XENDIT_API_VERSION: z.string().default("2024-11-11"),
  PAYMENTS_XENDIT_ENABLED: bool,
  PAYMENT_SIMULATOR: bool,
  UPSTASH_REDIS_REST_URL: optionalStr,
  UPSTASH_REDIS_REST_TOKEN: optionalStr,
  QSTASH_URL: optionalStr,
  QSTASH_TOKEN: optionalStr,
  QSTASH_CURRENT_SIGNING_KEY: optionalStr,
  QSTASH_NEXT_SIGNING_KEY: optionalStr,
  RESEND_API_KEY: optionalStr,
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: bool,
  SMTP_USER: optionalStr,
  SMTP_APP_PASSWORD: optionalStr,
  EMAIL_FROM_NAME: z.string().default("Donasi"),
  EMAIL_FROM_ADDRESS: optionalStr,
  NOTIFICATIONS_EMAIL_ENABLED: bool,
  FONNTE_TOKEN: optionalStr,
  NOTIFICATIONS_WHATSAPP_ENABLED: bool,
  MIN_DONATION_AMOUNT: z.coerce.number().int().positive().default(10000),
  MAX_DONATION_AMOUNT: z.coerce.number().int().positive().default(100_000_000),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server environment. Lazily parsed so `next build` works without secrets. */
export function getEnv(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Test helper. */
export function resetEnvCache(): void {
  cached = undefined;
}

/** Dev-only helpers (simulator, dev login) must never be reachable outside development. */
export function isDevelopment(): boolean {
  return getEnv().APP_ENV === "development";
}

export function adminAllowlist(): string[] {
  return getEnv()
    .ADMIN_EMAIL_ALLOWLIST.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True when real money can move (production Midtrans, or a non-development Xendit key). */
export function liveMoneyEnabled(): boolean {
  const env = getEnv();
  return env.MIDTRANS_IS_PRODUCTION || (!!env.XENDIT_SECRET_KEY && !env.XENDIT_SECRET_KEY.startsWith("xnd_development"));
}
