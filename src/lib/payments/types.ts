import type { Provider } from "@/db/schema";

export type CreateCheckoutInput = {
  /** Unique merchant reference (order_id / reference_id) for this payment attempt. */
  reference: string;
  donationCode: string;
  amount: number;
  currency: "IDR";
  donor: { name: string; email: string; phone?: string };
  channelCode: string;
  description: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
};

export type NormalizedCheckout = {
  provider: Provider;
  providerReference: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
  expiresAt?: Date;
  instructionData?: {
    title?: string;
    description?: string;
    accountNumber?: string;
    qrImageUrl?: string;
    actions?: Array<{ label: string; url: string }>;
    rawPublicFields?: Record<string, string>;
  };
  initialStatus: "PENDING";
  rawSafeMetadata?: Record<string, unknown>;
};

/** Internal normalized payment outcome (never a raw provider status). */
export type NormalizedStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "CANCELLED" | "REFUNDED";

export type NormalizedPaymentEvent = {
  provider: Provider;
  /** Stable id for idempotency; derived from payload hash if provider has none. */
  externalEventId: string;
  providerReference: string;
  providerPaymentId?: string;
  eventType: string;
  status: NormalizedStatus;
  /** Amount in IDR reported by the provider (integer). */
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  occurredAt?: Date;
  /** Already sanitized payload, safe to persist. */
  payloadSanitized: Record<string, unknown>;
};

export class WebhookVerificationError extends Error {
  constructor(message = "Invalid webhook signature") {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

export class WebhookPayloadError extends Error {
  constructor(message = "Invalid webhook payload") {
    super(message);
    this.name = "WebhookPayloadError";
  }
}

export interface PaymentGatewayAdapter {
  readonly provider: Provider;
  /** True only if credentials are configured (and feature flag on). */
  isConfigured(): boolean;
  createCheckout(input: CreateCheckoutInput): Promise<NormalizedCheckout>;
  /** Throws WebhookVerificationError on bad signature/token. */
  verifyAndNormalizeWebhook(rawBody: string, headers: Headers): Promise<NormalizedPaymentEvent>;
  getPaymentStatus(reference: string, providerPaymentId?: string | null): Promise<NormalizedPaymentEvent | null>;
}
