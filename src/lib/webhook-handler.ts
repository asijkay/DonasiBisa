import "server-only";
import { NextResponse } from "next/server";
import type { Provider } from "@/db/schema";
import { getAdapter } from "@/lib/payments/registry";
import { WebhookPayloadError, WebhookVerificationError } from "@/lib/payments/types";
import { applyPaymentEvent } from "@/services/payments.service";

/**
 * Shared webhook route logic. No session, no visitor rate limit; security comes from the provider's
 * signature/token, verified against the RAW body before anything touches the database.
 */
export async function handleWebhook(provider: Provider, request: Request): Promise<NextResponse> {
  const raw = await request.text();
  try {
    const event = await getAdapter(provider).verifyAndNormalizeWebhook(raw, request.headers);
    const result = await applyPaymentEvent(event);
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      console.warn(`[webhook:${provider}] rejected: invalid signature/token`);
      return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 401 });
    }
    if (e instanceof WebhookPayloadError) return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
    console.error(`[webhook:${provider}] processing error`, (e as Error).message);
    return NextResponse.json({ ok: false, error: "PROCESSING_ERROR" }, { status: 500 }); // provider will retry
  }
}
