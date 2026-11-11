import { NextResponse } from "next/server";
import { listPublishedNews } from "@/services/news.service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ data: await listPublishedNews(50) });
}
