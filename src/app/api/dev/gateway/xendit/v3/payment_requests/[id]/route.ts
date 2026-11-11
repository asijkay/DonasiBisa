import { NextResponse } from "next/server";
import { simulatorEnabled } from "@/lib/payments/simulator";
import { simFindByPaymentRequestId } from "@/lib/payments/simulator-gateway";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!simulatorEnabled()) return new NextResponse("Not found", { status: 404 });
  const { id } = await ctx.params;
  const p = simFindByPaymentRequestId(id);
  if (!p) return NextResponse.json({ error_code: "DATA_NOT_FOUND" }, { status: 404 });
  const status = p.status === "settlement" ? "SUCCEEDED" : p.status === "failed" ? "FAILED" : p.status === "expired" ? "EXPIRED" : "REQUIRES_ACTION";
  return NextResponse.json({ payment_request_id: p.paymentRequestId, reference_id: p.reference, status, currency: "IDR", request_amount: p.amount, channel_code: p.channel });
}
