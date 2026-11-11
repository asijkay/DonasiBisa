import { NextResponse, type NextRequest } from "next/server";
import { donationInputSchema } from "@/lib/validation/schemas";
import { clientIp, errorResponse, tooManyRequests } from "@/lib/http";
import { rateLimit } from "@/lib/cache/redis";
import { normalizeEmail } from "@/lib/utils/contact";
import { createDonation } from "@/services/donations.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const input = donationInputSchema.parse(body);

    const byIp = await rateLimit("donation:ip", clientIp(request), 10, 60);
    const byEmail = await rateLimit("donation:email", normalizeEmail(input.donor.email), 5, 600);
    if (!byIp.allowed || !byEmail.allowed) return tooManyRequests();

    const donation = await createDonation(input, { idempotencyKey: request.headers.get("idempotency-key") });
    return NextResponse.json({ donationCode: donation.donationCode, status: donation.status, nextStep: "SELECT_PAYMENT" }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
