import { NextResponse, type NextRequest } from "next/server";
import { createPaymentSchema } from "@/lib/validation/schemas";
import { errorResponse, tooManyRequests } from "@/lib/http";
import { rateLimit } from "@/lib/cache/redis";
import { createPaymentForDonation } from "@/services/donations.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: { params: Promise<{ donationCode: string }> }) {
  try {
    const { donationCode } = await ctx.params;
    const limited = await rateLimit("payment:code", donationCode, 6, 60);
    if (!limited.allowed) return tooManyRequests();
    const input = createPaymentSchema.parse(await request.json().catch(() => null));
    const payment = await createPaymentForDonation(donationCode, input);
    return NextResponse.json({ donationCode, payment });
  } catch (e) {
    return errorResponse(e);
  }
}
