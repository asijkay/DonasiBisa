import { NextResponse } from "next/server";
import { listPublicCampaigns } from "@/services/campaigns.service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ data: await listPublicCampaigns() });
}
