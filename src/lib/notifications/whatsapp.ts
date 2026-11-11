import "server-only";
import { getEnv } from "@/lib/env";

export interface WhatsappProvider {
  send(msg: { to: string; message: string }): Promise<{ messageId?: string }>;
}

export class NotificationSendError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "NotificationSendError";
  }
}

export function whatsappConfigured(): boolean {
  const env = getEnv();
  return env.NOTIFICATIONS_WHATSAPP_ENABLED && !!env.FONNTE_TOKEN;
}

/** Fonnte "send message" API. Token is server-side only and never logged. */
export const fonnteProvider: WhatsappProvider = {
  async send({ to, message }) {
    const token = getEnv().FONNTE_TOKEN;
    if (!token) throw new NotificationSendError("FONNTE_TOKEN missing", false);
    const body = new URLSearchParams({ target: to.replace(/^\+/, ""), message });
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as { status?: boolean; reason?: string; id?: string[] };
    if (!res.ok || json.status === false) {
      // Invalid number / device problems are not worth retrying forever.
      const reason = json.reason ?? `HTTP ${res.status}`;
      throw new NotificationSendError(`Fonnte: ${reason}`, res.status >= 500 || res.status === 429);
    }
    return { messageId: json.id?.[0] };
  },
};
