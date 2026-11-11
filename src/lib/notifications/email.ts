import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";

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

export function emailConfigured(): boolean {
  const env = getEnv();
  return env.NOTIFICATIONS_EMAIL_ENABLED && !!env.SMTP_USER && !!env.SMTP_APP_PASSWORD;
}

export const smtpEmailProvider: EmailProvider = {
  async send({ to, subject, text, html }) {
    const env = getEnv();
    const info = await getTransporter().sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS ?? env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return { messageId: info.messageId };
  },
};
