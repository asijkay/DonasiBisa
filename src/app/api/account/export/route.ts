import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { exportAccountData } from "@/services/privacy.service";

export const runtime = "nodejs";

/** Right of access/portability. Only the signed-in user's own data; never cached. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = await exportAccountData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="data-saya.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
