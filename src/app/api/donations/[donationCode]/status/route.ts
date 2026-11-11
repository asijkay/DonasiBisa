import { NextResponse, type NextRequest } from "next/server";
import { clientIp, errorResponse, tooManyRequests } from "@/lib/http";
import { rateLimit } from "@/lib/cache/redis";
import { getDonationStatus } from "@/services/donations.service";
import { reconcileLatestPaymentByCode } from "@/services/payments.service";

export const runtime = "nodejs";

/**
 * Public status lookup (no PII). `?verify=1` additionally performs a server-to-server provider
 * status check for a pending payment — the only way a browser can *prompt* settlement; the
 * browser still never supplies the outcome.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ donationCode: string }> }) {
  try {
    const { donationCode } = await ctx.params;
    const verify = request.nextUrl.searchParams.get("verify") === "1";
    const limited = await rateLimit(verify ? "status-verify" : "status", `${clientIp(request)}:${donationCode}`, verify ? 10 : 60, 60);
    if (!limited.allowed) return tooManyRequests();
    if (verify) await reconcileLatestPaymentByCode(donationCode).catch((e) => console.error("[status] reconcile failed", (e as Error).message));
    const status = await getDonationStatus(donationCode);
    if (!status) return NextResponse.json({ error: "NOT_FOUND", message: "Donasi tidak ditemukan." }, { status: 404 });
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
