import type { NormalizedStatus } from "./types";

/** Midtrans transaction_status (+ fraud_status) → internal status. */
export function mapMidtransStatus(transactionStatus: string, fraudStatus?: string): NormalizedStatus {
  switch (transactionStatus) {
    case "capture":
      // capture + fraud "challenge" must not count as paid until accepted.
      return fraudStatus === "accept" || fraudStatus === undefined ? "SUCCEEDED" : "PENDING";
    case "settlement":
      return "SUCCEEDED";
    case "pending":
      return "PENDING";
    case "deny":
    case "failure":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    case "cancel":
      return "CANCELLED";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

/** Xendit payment request / payment status → internal status. */
export function mapXenditStatus(status: string): NormalizedStatus {
  switch (status.toUpperCase()) {
    case "SUCCEEDED":
    case "SUCCESS":
    case "PAID":
    case "SETTLED":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
    case "EXPIRED":
      return "EXPIRED";
    case "CANCELED":
    case "CANCELLED":
    case "VOIDED":
      return "CANCELLED";
    case "REFUNDED":
      return "REFUNDED";
    default:
      // PENDING, REQUIRES_ACTION, AUTHORIZED, ACCEPTING_PAYMENTS, ...
      return "PENDING";
  }
}

const TERMINAL: ReadonlySet<NormalizedStatus> = new Set(["SUCCEEDED", "FAILED", "EXPIRED", "CANCELLED", "REFUNDED"]);

export function isTerminal(status: string): boolean {
  return TERMINAL.has(status as NormalizedStatus);
}

/**
 * Monotonic state machine (TRD §5.2). PENDING/CREATED may move to any outcome;
 * SUCCEEDED may only move to REFUNDED; other terminal states are final.
 */
export function canTransition(from: string, to: NormalizedStatus): boolean {
  if (from === to) return false;
  if (from === "CREATED" || from === "PENDING") return to !== "PENDING";
  if (from === "SUCCEEDED") return to === "REFUNDED";
  return false;
}
