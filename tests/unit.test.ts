import { describe, expect, it } from "vitest";
import { canTransition, mapMidtransStatus, mapXenditStatus } from "../src/lib/payments/status-mapper";
import { midtransAdapter, midtransSignature } from "../src/lib/payments/providers/midtrans";
import { xenditAdapter } from "../src/lib/payments/providers/xendit";
import { WebhookVerificationError } from "../src/lib/payments/types";
import {
  canCampaignTransition,
  DomainError,
  getDonationBlockReason,
  resolveDonationAmount,
} from "../src/services/campaigns.service";
import { hasPermission } from "../src/lib/auth/permissions";
import { findUnknownPlaceholders, renderTemplate } from "../src/lib/notifications/render";
import { normalizeWhatsapp, slugify } from "../src/lib/utils/contact";
import { generateDonationCode, isSafeHttpUrl, sanitizePayload } from "../src/lib/utils/security";

const limits = { min: 10_000, max: 100_000_000 };

describe("amount validation", () => {
  it("open amount accepts valid and rejects under/over limit", () => {
    const c = { amountMode: "OPEN_AMOUNT" } as const;
    expect(resolveDonationAmount(c, [], { amount: 25_000 }, limits)).toBe(25_000);
    expect(() => resolveDonationAmount(c, [], { amount: 5_000 }, limits)).toThrow(DomainError);
    expect(() => resolveDonationAmount(c, [], { amount: 200_000_000 }, limits)).toThrow(DomainError);
    expect(() => resolveDonationAmount(c, [], { amount: null }, limits)).toThrow(DomainError);
    expect(() => resolveDonationAmount(c, [], { amount: 12_000.5 }, limits)).toThrow(DomainError);
  });

  it("closed amount accepts only an active preset and ignores free amounts", () => {
    const c = { amountMode: "CLOSED_AMOUNT" } as const;
    const opts = [
      { id: "a", amount: 50_000, isActive: true },
      { id: "b", amount: 100_000, isActive: false },
    ];
    expect(resolveDonationAmount(c, opts, { amountOptionId: "a" }, limits)).toBe(50_000);
    expect(() => resolveDonationAmount(c, opts, { amount: 50_000 }, limits)).toThrow(/Pilih/);
    expect(() => resolveDonationAmount(c, opts, { amountOptionId: "b" }, limits)).toThrow(DomainError);
    expect(() => resolveDonationAmount(c, opts, { amountOptionId: "a", amount: 1 }, limits)).toThrow(DomainError);
    expect(() => resolveDonationAmount(c, opts, { amountOptionId: "zzz" }, limits)).toThrow(DomainError);
  });
});

describe("campaign lifecycle rules", () => {
  const now = new Date("2026-01-10T00:00:00Z");
  const base = { status: "PUBLISHED", startsAt: null, endsAt: null, raisedAmount: 0, targetAmount: 100, autoCloseOnTarget: true } as const;
  it("blocks by status, dates and target", () => {
    expect(getDonationBlockReason(base, now)).toBeNull();
    expect(getDonationBlockReason({ ...base, status: "DRAFT" }, now)).toBe("NOT_PUBLISHED");
    expect(getDonationBlockReason({ ...base, status: "PAUSED" }, now)).toBe("PAUSED");
    expect(getDonationBlockReason({ ...base, status: "CLOSED" }, now)).toBe("CLOSED");
    expect(getDonationBlockReason({ ...base, status: "COMPLETED" }, now)).toBe("CLOSED");
    expect(getDonationBlockReason({ ...base, endsAt: new Date("2026-01-09T00:00:00Z") }, now)).toBe("ENDED");
    expect(getDonationBlockReason({ ...base, startsAt: new Date("2026-02-01T00:00:00Z") }, now)).toBe("NOT_STARTED");
    expect(getDonationBlockReason({ ...base, raisedAmount: 100 }, now)).toBe("TARGET_REACHED");
    expect(getDonationBlockReason({ ...base, raisedAmount: 100, autoCloseOnTarget: false }, now)).toBeNull();
  });
  it("state machine", () => {
    expect(canCampaignTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(canCampaignTransition("DRAFT", "CLOSED")).toBe(false);
    expect(canCampaignTransition("PAUSED", "PUBLISHED")).toBe(true);
    expect(canCampaignTransition("CLOSED", "PUBLISHED")).toBe(false);
    expect(canCampaignTransition("COMPLETED", "ARCHIVED")).toBe(true);
  });
});

describe("payment status mapping & monotonicity", () => {
  it("maps Midtrans statuses", () => {
    expect(mapMidtransStatus("settlement")).toBe("SUCCEEDED");
    expect(mapMidtransStatus("capture", "accept")).toBe("SUCCEEDED");
    expect(mapMidtransStatus("capture", "challenge")).toBe("PENDING");
    expect(mapMidtransStatus("pending")).toBe("PENDING");
    expect(mapMidtransStatus("deny")).toBe("FAILED");
    expect(mapMidtransStatus("expire")).toBe("EXPIRED");
    expect(mapMidtransStatus("cancel")).toBe("CANCELLED");
  });
  it("maps Xendit statuses", () => {
    expect(mapXenditStatus("SUCCEEDED")).toBe("SUCCEEDED");
    expect(mapXenditStatus("REQUIRES_ACTION")).toBe("PENDING");
    expect(mapXenditStatus("FAILED")).toBe("FAILED");
    expect(mapXenditStatus("EXPIRED")).toBe("EXPIRED");
    expect(mapXenditStatus("CANCELED")).toBe("CANCELLED");
  });
  it("never regresses terminal states", () => {
    expect(canTransition("PENDING", "SUCCEEDED")).toBe(true);
    expect(canTransition("SUCCEEDED", "PENDING")).toBe(false);
    expect(canTransition("SUCCEEDED", "FAILED")).toBe(false);
    expect(canTransition("SUCCEEDED", "REFUNDED")).toBe(true);
    expect(canTransition("EXPIRED", "SUCCEEDED")).toBe(false);
    expect(canTransition("PENDING", "PENDING")).toBe(false);
  });
});

describe("webhook verification", () => {
  const key = "SB-Mid-server-test";
  const body = (over: Record<string, string> = {}) => {
    const n = { order_id: "DON-1-1", status_code: "200", gross_amount: "50000.00", transaction_status: "settlement", transaction_id: "tx-1", ...over };
    return JSON.stringify({ ...n, signature_key: midtransSignature(n, key) });
  };
  it("Midtrans accepts a valid signature and normalizes amount", async () => {
    const ev = await midtransAdapter.verifyAndNormalizeWebhook(body(), new Headers());
    expect(ev.status).toBe("SUCCEEDED");
    expect(ev.amount).toBe(50000);
    expect(ev.providerReference).toBe("DON-1-1");
  });
  it("Midtrans rejects tampered amount or signature", async () => {
    const tampered = JSON.parse(body());
    tampered.gross_amount = "1.00";
    await expect(midtransAdapter.verifyAndNormalizeWebhook(JSON.stringify(tampered), new Headers())).rejects.toBeInstanceOf(WebhookVerificationError);
    const bad = JSON.parse(body());
    bad.signature_key = "00";
    await expect(midtransAdapter.verifyAndNormalizeWebhook(JSON.stringify(bad), new Headers())).rejects.toBeInstanceOf(WebhookVerificationError);
  });
  it("Xendit requires the callback token", async () => {
    const payload = JSON.stringify({ event: "payment.succeeded", data: { reference_id: "DON-1-1", status: "SUCCEEDED", request_amount: 50000, currency: "IDR", payment_request_id: "prq-1" } });
    const ok = await xenditAdapter.verifyAndNormalizeWebhook(payload, new Headers({ "x-callback-token": "test-callback-token" }));
    expect(ok.status).toBe("SUCCEEDED");
    expect(ok.amount).toBe(50000);
    await expect(xenditAdapter.verifyAndNormalizeWebhook(payload, new Headers({ "x-callback-token": "nope" }))).rejects.toBeInstanceOf(WebhookVerificationError);
    await expect(xenditAdapter.verifyAndNormalizeWebhook(payload, new Headers())).rejects.toBeInstanceOf(WebhookVerificationError);
    // identical body → identical event id (dedupe)
    const again = await xenditAdapter.verifyAndNormalizeWebhook(payload, new Headers({ "x-callback-token": "test-callback-token" }));
    expect(again.externalEventId).toBe(ok.externalEventId);
  });
});

describe("Xendit webhook payload shapes (per official docs)", () => {
  const h = new Headers({ "x-callback-token": "test-callback-token" });
  it("payment.capture, payment.failure and payment_request.expiry map to internal statuses", async () => {
    const cap = JSON.stringify({ event: "payment.capture", business_id: "b", created: "2026-08-26T07:28:23.731Z", data: { payment_id: "py-1", payment_request_id: "pr-1", reference_id: "DON-A-1", status: "SUCCEEDED", request_amount: 25000, currency: "IDR", channel_code: "DANA" } });
    const fail = JSON.stringify({ event: "payment.failure", data: { payment_id: "py-2", payment_request_id: "pr-2", reference_id: "DON-B-1", status: "FAILED", request_amount: 10000, currency: "IDR", channel_code: "QRIS", failure_code: "INSUFFICIENT_BALANCE" } });
    const exp = JSON.stringify({ event: "payment_request.expiry", data: { payment_request_id: "pr-3", reference_id: "DON-C-1", status: "EXPIRED", request_amount: 10000, currency: "IDR", channel_code: "BCA_VIRTUAL_ACCOUNT" } });
    expect(await xenditAdapter.verifyAndNormalizeWebhook(cap, h)).toMatchObject({ status: "SUCCEEDED", providerReference: "DON-A-1", providerPaymentId: "pr-1", amount: 25000, eventType: "payment.capture" });
    expect(await xenditAdapter.verifyAndNormalizeWebhook(fail, h)).toMatchObject({ status: "FAILED", providerReference: "DON-B-1" });
    expect(await xenditAdapter.verifyAndNormalizeWebhook(exp, h)).toMatchObject({ status: "EXPIRED", providerReference: "DON-C-1", eventType: "payment_request.expiry" });
  });
  it("also accepts a flat (unwrapped) payload", async () => {
    const flat = JSON.stringify({ event: "payment.capture", payment_request_id: "pr-9", reference_id: "DON-F-1", status: "SUCCEEDED", request_amount: 5000, currency: "IDR" });
    expect(await xenditAdapter.verifyAndNormalizeWebhook(flat, h)).toMatchObject({ status: "SUCCEEDED", providerReference: "DON-F-1" });
  });
});

describe("RBAC", () => {
  it("maps roles to permissions", () => {
    expect(hasPermission(["SUPER_ADMIN"], "brand:configure")).toBe(true);
    expect(hasPermission(["CAMPAIGN_ADMIN"], "campaign:write")).toBe(true);
    expect(hasPermission(["CAMPAIGN_ADMIN"], "payment:configure")).toBe(false);
    expect(hasPermission(["FINANCE_ADMIN"], "transaction:read")).toBe(true);
    expect(hasPermission(["FINANCE_ADMIN"], "campaign:write")).toBe(false);
    expect(hasPermission(["CONTENT_ADMIN"], "news:publish")).toBe(true);
    expect(hasPermission([], "campaign:read")).toBe(false);
  });
});

describe("notification templates", () => {
  it("renders allowlisted placeholders and escapes HTML", () => {
    expect(renderTemplate("Halo {{donor_name}}", { donor_name: "<b>Budi</b>" }, "html")).toBe("Halo &lt;b&gt;Budi&lt;/b&gt;");
    expect(renderTemplate("Halo {{donor_name}}", { donor_name: "Budi" }, "text")).toBe("Halo Budi");
    expect(renderTemplate("{{evil}}x", {}, "text")).toBe("x");
  });
  it("detects unknown placeholders", () => {
    expect(findUnknownPlaceholders("{{donor_name}} {{secret}}", "{{amount}}")).toEqual(["secret"]);
  });
});

describe("utils", () => {
  it("normalizes whatsapp numbers", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("+62 812 3456 7890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("81234567890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("12345")).toBeNull();
  });
  it("slugify, donation code, url safety, payload sanitizing", () => {
    expect(slugify("Bantu Pendidikan Anak!")).toBe("bantu-pendidikan-anak");
    expect(generateDonationCode()).toMatch(/^DON-[A-Z2-9]{12}$/);
    expect(generateDonationCode()).not.toBe(generateDonationCode());
    expect(isSafeHttpUrl("https://x.com/a")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("http://evil.com")).toBe(false);
    expect(isSafeHttpUrl("http://localhost:3000", { allowLocalhostHttp: true })).toBe(true);
    expect(sanitizePayload({ signature_key: "abc", order_id: "1", nested: { card_number: "4111" } })).toEqual({
      signature_key: "[redacted]",
      order_id: "1",
      nested: { card_number: "[redacted]" },
    });
  });
});
