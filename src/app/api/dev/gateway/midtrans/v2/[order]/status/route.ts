import { NextResponse } from "next/server";
import { simulatorEnabled } from "@/lib/payments/simulator";
import { midtransSignature } from "@/lib/payments/providers/midtrans";
import { SIM_MIDTRANS_SERVER_KEY } from "@/lib/payments/simulator";
import { simGet } from "@/lib/payments/simulator-gateway";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ order: string }> }) {
  if (!simulatorEnabled()) return new NextResponse("Not found", { status: 404 });
  const { order } = await ctx.params;
  const p = simGet("MIDTRANS", order);
  if (!p) return NextResponse.json({ status_code: "404", status_message: "Transaction doesn't exist." }, { status: 404 });
  const n = {
    order_id: p.reference,
    status_code: p.status === "pending" ? "201" : "200",
    gross_amount: `${p.amount}.00`,
    transaction_status: p.status === "settlement" ? "settlement" : p.status === "failed" ? "deny" : p.status === "expired" ? "expire" : "pending",
    transaction_id: `sim-${p.reference}`,
    payment_type: p.channel,
    fraud_status: "accept",
    currency: "IDR",
  };
  return NextResponse.json({ ...n, signature_key: midtransSignature(n, SIM_MIDTRANS_SERVER_KEY) });
}
