import "server-only";
import { getEnv } from "@/lib/env";
import { midtransSignature } from "./providers/midtrans";
import { SIM_MIDTRANS_SERVER_KEY, SIM_XENDIT_WEBHOOK_TOKEN } from "./simulator";
import { randomUUID } from "node:crypto";

/**
 * DEV-ONLY gateway simulator state. It stands in for Midtrans/Xendit so the real adapters,
 * signature verification and settlement run end-to-end without credentials.
 * Never reachable unless APP_ENV=development and PAYMENT_SIMULATOR=true.
 */
export type SimStatus = "pending" | "settlement" | "failed" | "expired";
type SimPayment = { provider: "MIDTRANS" | "XENDIT"; reference: string; amount: number; channel: string; status: SimStatus; paymentRequestId: string };

const g = globalThis as unknown as { __simGateway?: Map<string, SimPayment> };
const store = (g.__simGateway ??= new Map<string, SimPayment>());

export function simRegister(p: Omit<SimPayment, "status">): void {
  store.set(`${p.provider}:${p.reference}`, { ...p, status: "pending" });
}
export function simGet(provider: string, reference: string): SimPayment | undefined {
  return store.get(`${provider}:${reference}`);
}
export function simFindByPaymentRequestId(id: string): SimPayment | undefined {
  return [...store.values()].find((p) => p.paymentRequestId === id);
}

export function simPayUrl(provider: string, reference: string): string {
  return `${getEnv().NEXT_PUBLIC_APP_URL}/dev/pay/${provider}/${encodeURIComponent(reference)}`;
}

/** Builds and POSTs a correctly signed webhook to our own endpoint (exactly what a provider would do). */
export async function simSendWebhook(p: SimPayment, status: SimStatus, opts: { eventId?: string } = {}): Promise<Response> {
  const base = getEnv().NEXT_PUBLIC_APP_URL;
  p.status = status;
  if (p.provider === "MIDTRANS") {
    const n = {
      order_id: p.reference,
      status_code: status === "pending" ? "201" : "200",
      gross_amount: `${p.amount}.00`,
      transaction_status: status === "settlement" ? "settlement" : status === "failed" ? "deny" : status === "expired" ? "expire" : "pending",
      transaction_id: `sim-${p.reference}`,
      payment_type: p.channel,
      fraud_status: "accept",
      currency: "IDR",
      transaction_time: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    const body = JSON.stringify({ ...n, signature_key: midtransSignature(n, SIM_MIDTRANS_SERVER_KEY) });
    return fetch(`${base}/api/webhooks/midtrans`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  }
  const xs = status === "settlement" ? "SUCCEEDED" : status === "failed" ? "FAILED" : status === "expired" ? "EXPIRED" : "PENDING";
  const body = JSON.stringify({
    event: `payment.${xs.toLowerCase()}`,
    data: { reference_id: p.reference, payment_request_id: p.paymentRequestId, status: xs, request_amount: p.amount, currency: "IDR", channel_code: p.channel, updated: new Date().toISOString() },
  });
  return fetch(`${base}/api/webhooks/xendit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-callback-token": SIM_XENDIT_WEBHOOK_TOKEN, "webhook-id": opts.eventId ?? randomUUID() },
    body,
  });
}
