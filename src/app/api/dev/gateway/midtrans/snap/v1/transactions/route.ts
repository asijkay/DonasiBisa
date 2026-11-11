import { NextResponse } from "next/server";
import { simulatorEnabled, SIM_MIDTRANS_SERVER_KEY } from "@/lib/payments/simulator";
import { simPayUrl, simRegister } from "@/lib/payments/simulator-gateway";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!simulatorEnabled()) return new NextResponse("Not found", { status: 404 });
  const expected = `Basic ${Buffer.from(`${SIM_MIDTRANS_SERVER_KEY}:`).toString("base64")}`;
  if (request.headers.get("authorization") !== expected) return NextResponse.json({ error_messages: ["Unauthorized"] }, { status: 401 });
  const body = (await request.json()) as { transaction_details: { order_id: string; gross_amount: number }; enabled_payments?: string[] };
  const { order_id, gross_amount } = body.transaction_details;
  simRegister({ provider: "MIDTRANS", reference: order_id, amount: gross_amount, channel: body.enabled_payments?.[0] ?? "qris", paymentRequestId: `sim-snap-${order_id}` });
  return NextResponse.json({ token: `sim-${order_id}`, redirect_url: simPayUrl("MIDTRANS", order_id) }, { status: 201 });
}
