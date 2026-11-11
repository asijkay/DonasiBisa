import { getEnv } from "@/lib/env";
import { safeEqual, sanitizePayload, sha256 } from "@/lib/utils/security";
import { mapXenditStatus } from "../status-mapper";
import { SIM_XENDIT_SECRET_KEY, SIM_XENDIT_WEBHOOK_TOKEN, simulatorBaseUrl, simulatorEnabled } from "../simulator";
import {
  WebhookPayloadError,
  WebhookVerificationError,
  type CreateCheckoutInput,
  type NormalizedCheckout,
  type NormalizedPaymentEvent,
  type PaymentGatewayAdapter,
} from "../types";

type XenditAction = { type?: string; descriptor?: string; value?: string };
type XenditPayment = {
  id?: string;
  payment_id?: string;
  payment_request_id?: string;
  reference_id?: string;
  status?: string;
  request_amount?: number;
  amount?: number;
  currency?: string;
  channel_code?: string;
  actions?: XenditAction[];
  expires_at?: string;
  channel_properties?: { expires_at?: string };
  updated?: string;
  created?: string;
};

function secretKey(): string | undefined {
  return simulatorEnabled() ? SIM_XENDIT_SECRET_KEY : getEnv().XENDIT_SECRET_KEY;
}
function webhookToken(): string | undefined {
  return simulatorEnabled() ? SIM_XENDIT_WEBHOOK_TOKEN : getEnv().XENDIT_WEBHOOK_TOKEN;
}
function baseUrl(): string {
  return simulatorEnabled() ? `${simulatorBaseUrl()}/xendit` : "https://api.xendit.co";
}
function authHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

function parseDate(v?: string): Date | undefined {
  const d = v ? new Date(v) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

function toEvent(p: XenditPayment, externalEventId: string, eventType: string, raw: unknown): NormalizedPaymentEvent {
  if (!p.reference_id || !p.status) throw new WebhookPayloadError("Missing reference_id/status");
  return {
    provider: "XENDIT",
    externalEventId,
    providerReference: p.reference_id,
    providerPaymentId: p.payment_request_id ?? p.id,
    eventType,
    status: mapXenditStatus(p.status),
    amount: p.request_amount ?? p.amount,
    currency: p.currency ?? "IDR",
    paymentMethod: p.channel_code,
    occurredAt: p.updated ? new Date(p.updated) : undefined,
    payloadSanitized: sanitizePayload(raw) as Record<string, unknown>,
  };
}

export const xenditAdapter: PaymentGatewayAdapter = {
  provider: "XENDIT",

  isConfigured() {
    if (simulatorEnabled()) return true;
    const env = getEnv();
    return env.PAYMENTS_XENDIT_ENABLED && !!env.XENDIT_SECRET_KEY && !!env.XENDIT_WEBHOOK_TOKEN;
  },

  async createCheckout(input: CreateCheckoutInput): Promise<NormalizedCheckout> {
    const key = secretKey();
    if (!key) throw new Error("Xendit is not configured");
    const isVa = input.channelCode.toUpperCase().includes("VIRTUAL_ACCOUNT");
    const body = {
      reference_id: input.reference,
      type: "PAY",
      country: "ID",
      currency: "IDR",
      request_amount: input.amount,
      capture_method: "AUTOMATIC",
      channel_code: input.channelCode,
      channel_properties: isVa
        ? { display_name: input.donor.name.slice(0, 50).toUpperCase() }
        : { success_return_url: input.successUrl, failure_return_url: input.failureUrl, cancel_return_url: input.pendingUrl },
      description: input.description.slice(0, 100),
    };
    const res = await fetch(`${baseUrl()}/v3/payment_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(key),
        "api-version": getEnv().XENDIT_API_VERSION,
        "idempotency-key": input.reference,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as XenditPayment & { message?: string; error_code?: string };
    if (!res.ok || !json.payment_request_id) {
      throw new Error(`Xendit create payment request failed (${res.status}): ${json.error_code ?? json.message ?? "unknown"}`);
    }
    const actions = json.actions ?? [];
    const redirect = actions.find((a) => a.type === "REDIRECT_CUSTOMER" && a.value);
    const va = actions.find((a) => a.descriptor === "VIRTUAL_ACCOUNT_NUMBER");
    const qr = actions.find((a) => a.descriptor === "QR_STRING");
    return {
      provider: "XENDIT",
      providerReference: input.reference,
      providerPaymentId: json.payment_request_id,
      checkoutUrl: redirect?.value,
      expiresAt: parseDate(json.expires_at ?? json.channel_properties?.expires_at),
      initialStatus: "PENDING",
      instructionData: {
        title: va ? "Transfer ke Virtual Account" : qr ? "Scan kode QR" : "Lanjutkan pembayaran",
        accountNumber: va?.value,
        rawPublicFields: qr?.value ? { qrString: qr.value } : undefined,
        actions: redirect?.value ? [{ label: "Lanjutkan pembayaran", url: redirect.value }] : undefined,
      },
      rawSafeMetadata: { channelCode: input.channelCode },
    };
  },

  async verifyAndNormalizeWebhook(rawBody, headers) {
    const token = webhookToken();
    const received = headers.get("x-callback-token");
    if (!token || !received || !safeEqual(received, token)) throw new WebhookVerificationError("Invalid callback token");
    let parsed: { event?: string; data?: XenditPayment } & XenditPayment;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new WebhookPayloadError("Body is not valid JSON");
    }
    const data = parsed.data ?? parsed;
    // No stable event id is guaranteed → prefer webhook-id header, else canonical body hash.
    const eventId = headers.get("webhook-id") ?? `hash:${sha256(rawBody)}`;
    return toEvent(data, eventId, parsed.event ?? `payment.${(data.status ?? "unknown").toLowerCase()}`, parsed);
  },

  async getPaymentStatus(reference, providerPaymentId) {
    const key = secretKey();
    if (!key || !providerPaymentId) return null;
    const res = await fetch(`${baseUrl()}/v3/payment_requests/${encodeURIComponent(providerPaymentId)}`, {
      headers: { Authorization: authHeader(key), "api-version": getEnv().XENDIT_API_VERSION },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) return null;
    const p = (await res.json().catch(() => null)) as XenditPayment | null;
    if (!res.ok || !p?.status) return null;
    p.reference_id = p.reference_id ?? reference;
    return toEvent(p, `poll:${sha256(`${providerPaymentId}:${p.status}`)}`, `status.${p.status.toLowerCase()}`, p);
  },
};
