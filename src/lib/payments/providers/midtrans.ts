import { getEnv } from "@/lib/env";
import { safeEqual, sanitizePayload, sha256, sha512 } from "@/lib/utils/security";
import { mapMidtransStatus } from "../status-mapper";
import { SIM_MIDTRANS_SERVER_KEY, simulatorBaseUrl, simulatorEnabled } from "../simulator";
import {
  WebhookPayloadError,
  WebhookVerificationError,
  type CreateCheckoutInput,
  type NormalizedCheckout,
  type NormalizedPaymentEvent,
  type PaymentGatewayAdapter,
} from "../types";

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  currency?: string;
  transaction_time?: string;
};

function serverKey(): string | undefined {
  return simulatorEnabled() ? SIM_MIDTRANS_SERVER_KEY : getEnv().MIDTRANS_SERVER_KEY;
}

/**
 * Keys that may have signed a notification. Newer Midtrans accounts sign with the separate
 * "Signature Secret Key"; older ones sign with the Server Key. Either is accepted.
 */
function signingKeys(): string[] {
  if (simulatorEnabled()) return [SIM_MIDTRANS_SERVER_KEY];
  const env = getEnv();
  return [env.MIDTRANS_SIGNATURE_SECRET_KEY, env.MIDTRANS_SERVER_KEY].filter((k): k is string => !!k);
}

function bases(): { snap: string; api: string } {
  if (simulatorEnabled()) {
    const b = `${simulatorBaseUrl()}/midtrans`;
    return { snap: b, api: b };
  }
  return getEnv().MIDTRANS_IS_PRODUCTION
    ? { snap: "https://app.midtrans.com", api: "https://api.midtrans.com" }
    : { snap: "https://app.sandbox.midtrans.com", api: "https://api.sandbox.midtrans.com" };
}

function authHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

/** SHA-512(order_id + status_code + gross_amount + serverKey) per Midtrans docs. */
export function midtransSignature(n: Pick<MidtransNotification, "order_id" | "status_code" | "gross_amount">, key: string): string {
  return sha512(`${n.order_id ?? ""}${n.status_code ?? ""}${n.gross_amount ?? ""}${key}`);
}

function toEvent(n: MidtransNotification): NormalizedPaymentEvent {
  if (!n.order_id || !n.transaction_status) throw new WebhookPayloadError("Missing order_id/transaction_status");
  const amount = n.gross_amount !== undefined ? Math.round(Number(n.gross_amount)) : undefined;
  if (amount !== undefined && !Number.isFinite(amount)) throw new WebhookPayloadError("Invalid gross_amount");
  const status = mapMidtransStatus(n.transaction_status, n.fraud_status);
  return {
    provider: "MIDTRANS",
    externalEventId: `${n.transaction_id ?? n.order_id}:${n.transaction_status}:${n.fraud_status ?? ""}:${n.status_code ?? ""}`,
    providerReference: n.order_id,
    providerPaymentId: n.transaction_id,
    eventType: `transaction.${n.transaction_status}`,
    status,
    amount,
    currency: n.currency ?? "IDR",
    paymentMethod: n.payment_type,
    occurredAt: n.transaction_time ? new Date(`${n.transaction_time.replace(" ", "T")}+07:00`) : undefined,
    payloadSanitized: sanitizePayload(n) as Record<string, unknown>,
  };
}

export const midtransAdapter: PaymentGatewayAdapter = {
  provider: "MIDTRANS",

  isConfigured() {
    if (simulatorEnabled()) return true;
    const env = getEnv();
    return env.PAYMENTS_MIDTRANS_ENABLED && !!env.MIDTRANS_SERVER_KEY;
  },

  async createCheckout(input: CreateCheckoutInput): Promise<NormalizedCheckout> {
    const key = serverKey();
    if (!key) throw new Error("Midtrans is not configured");
    const body = {
      transaction_details: { order_id: input.reference, gross_amount: input.amount },
      item_details: [{ id: input.donationCode, price: input.amount, quantity: 1, name: input.description.slice(0, 50) }],
      customer_details: {
        first_name: input.donor.name.slice(0, 50),
        email: input.donor.email,
        phone: input.donor.phone,
      },
      ...(input.channelCode && input.channelCode !== "all" ? { enabled_payments: [input.channelCode] } : {}),
      callbacks: { finish: input.successUrl, error: input.failureUrl, pending: input.pendingUrl },
      credit_card: { secure: true },
    };
    const res = await fetch(`${bases().snap}/snap/v1/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: authHeader(key) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
    if (!res.ok || !json.redirect_url) {
      throw new Error(`Midtrans create transaction failed (${res.status}): ${(json.error_messages ?? []).join("; ")}`);
    }
    return {
      provider: "MIDTRANS",
      providerReference: input.reference,
      checkoutUrl: json.redirect_url,
      initialStatus: "PENDING",
      instructionData: {
        title: "Lanjutkan pembayaran di Midtrans",
        description: "Anda akan diarahkan ke halaman pembayaran Midtrans untuk menyelesaikan donasi.",
        actions: [{ label: "Lanjutkan pembayaran", url: json.redirect_url }],
      },
      rawSafeMetadata: { snapTokenIssued: !!json.token },
    };
  },

  async verifyAndNormalizeWebhook(rawBody) {
    const keys = signingKeys();
    if (keys.length === 0) throw new WebhookVerificationError("Midtrans is not configured");
    let n: MidtransNotification;
    try {
      n = JSON.parse(rawBody) as MidtransNotification;
    } catch {
      throw new WebhookPayloadError("Body is not valid JSON");
    }
    if (!n.signature_key || !n.order_id || !n.status_code || !n.gross_amount) {
      throw new WebhookVerificationError("Missing signature fields");
    }
    const received = n.signature_key;
    if (!keys.some((key) => safeEqual(midtransSignature(n, key), received))) throw new WebhookVerificationError();
    return toEvent(n);
  },

  async getPaymentStatus(reference) {
    const key = serverKey();
    if (!key) return null;
    const res = await fetch(`${bases().api}/v2/${encodeURIComponent(reference)}/status`, {
      headers: { Accept: "application/json", Authorization: authHeader(key) },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) return null;
    const n = (await res.json().catch(() => null)) as (MidtransNotification & { status_code?: string }) | null;
    if (!res.ok || !n?.transaction_status || n.status_code === "404") return null;
    n.order_id = n.order_id ?? reference;
    const ev = toEvent(n);
    // Status polls carry no unique event id: derive one so that polling is deduplicated by content.
    return { ...ev, externalEventId: `poll:${sha256(`${ev.externalEventId}`)}` };
  },
};
