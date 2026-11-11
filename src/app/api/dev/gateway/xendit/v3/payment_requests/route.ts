import { NextResponse } from "next/server";
import { simulatorEnabled, SIM_XENDIT_SECRET_KEY } from "@/lib/payments/simulator";
import { simPayUrl, simRegister } from "@/lib/payments/simulator-gateway";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!simulatorEnabled()) return new NextResponse("Not found", { status: 404 });
  const expected = `Basic ${Buffer.from(`${SIM_XENDIT_SECRET_KEY}:`).toString("base64")}`;
  if (request.headers.get("authorization") !== expected) return NextResponse.json({ error_code: "INVALID_API_KEY" }, { status: 401 });
  const body = (await request.json()) as { reference_id: string; request_amount: number; channel_code: string };
  const id = `prq-sim-${body.reference_id}`;
  simRegister({ provider: "XENDIT", reference: body.reference_id, amount: body.request_amount, channel: body.channel_code, paymentRequestId: id });
  return NextResponse.json(
    {
      payment_request_id: id,
      reference_id: body.reference_id,
      status: "REQUIRES_ACTION",
      currency: "IDR",
      request_amount: body.request_amount,
      channel_code: body.channel_code,
      actions: [{ type: "REDIRECT_CUSTOMER", descriptor: "WEB_URL", value: simPayUrl("XENDIT", body.reference_id) }],
    },
    { status: 201 },
  );
}
