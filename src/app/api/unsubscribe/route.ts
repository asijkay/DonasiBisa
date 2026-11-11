import { NextResponse, type NextRequest } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { unsubscribeDonor } from "@/services/privacy.service";

export const runtime = "nodejs";

/**
 * RFC 8058 one-click unsubscribe target (`List-Unsubscribe-Post`). POST only: a GET (e.g. link
 * prefetchers) must never change state — the human-facing confirmation lives at /unsubscribe.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const donorId = verifyUnsubscribeToken(token);
  if (!donorId) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  await unsubscribeDonor(donorId);
  return NextResponse.json({ ok: true });
}
