import "server-only";
import { NextResponse } from "next/server";
import { verifyQstashRequest } from "@/lib/qstash/queue";

/** All internal job routes reject anything without a valid QStash signature. */
export async function runSignedJob(request: Request, job: (body: unknown) => Promise<unknown>): Promise<NextResponse> {
  const raw = await request.text();
  if (!(await verifyQstashRequest(request, raw))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const body: unknown = raw ? JSON.parse(raw) : {};
    return NextResponse.json({ ok: true, result: await job(body) });
  } catch (e) {
    console.error("[job] failed", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 }); // QStash retries
  }
}
