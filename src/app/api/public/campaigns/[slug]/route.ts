import { NextResponse } from "next/server";
import { getPublicCampaign } from "@/services/campaigns.service";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const c = await getPublicCampaign(slug);
  if (!c) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ data: c });
}
