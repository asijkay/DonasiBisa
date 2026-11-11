import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";
import { NotificationSendError } from "./whatsapp";

export interface EmailProvider {
  send(msg: { to: string; subject: string; text: string; html?: string }): Promise<{ messageId?: string }>;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_APP_PASSWORD },
    });
  }
  return transporter;
}

function fromHeader(defaultAddress: string): string {
  const env = getEnv();
  return `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS ?? defaultAddress}>`;
}

/** Resend (HTTP API). Without a verified domain it can only send from onboarding@resend.dev to the account owner. */
export const resendEmailProvider: EmailProvider = {
  async send({ to, subject, text, html }) {
    const key = getEnv().RESEND_API_KEY;
    if (!key) throw new NotificationSendError("RESEND_API_KEY missing", false);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromHeader("onboarding@resend.dev"), to: [to], subject, text, html }),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      // 4xx (invalid recipient, unverified domain, ...) is not worth retrying; 429/5xx is.
      throw new NotificationSendError(`Resend: ${json.message ?? `HTTP ${res.status}`}`, res.status === 429 || res.status >= 500);
    }
    return { messageId: json.id };
  },
};

export const smtpEmailProvider: EmailProvider = {
  async send({ to, subject, text, html }) {
    const info = await getTransporter().sendMail({ from: fromHeader(getEnv().SMTP_USER ?? ""), to, subject, text, html });
    return { messageId: info.messageId };
  },
};

/** Resend when its key is configured, otherwise Gmail/SMTP. */
export function getEmailProvider(): EmailProvider {
  return getEnv().RESEND_API_KEY ? resendEmailProvider : smtpEmailProvider;
}

export function emailConfigured(): boolean {
  const env = getEnv();
  return env.NOTIFICATIONS_EMAIL_ENABLED && (!!env.RESEND_API_KEY || (!!env.SMTP_USER && !!env.SMTP_APP_PASSWORD));
}
