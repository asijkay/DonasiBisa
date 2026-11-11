import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { brandConfig, campaigns, donations, donors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { buildDonationReceipt } from "@/lib/pdf/donation-receipt";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

/** Receipt PDF: only for SUCCEEDED donations, and only for the owning donor or an authorized admin. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ donationCode: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const { donationCode } = await ctx.params;

    const [row] = await db
      .select({ d: donations, ownerUserId: donors.userId, campaignTitle: campaigns.title })
      .from(donations)
      .innerJoin(donors, eq(donors.id, donations.donorId))
      .innerJoin(campaigns, eq(campaigns.id, donations.campaignId))
      .where(and(eq(donations.donationCode, donationCode), eq(donations.status, "SUCCEEDED")))
      .limit(1);

    const allowed = row && (row.ownerUserId === user.id || hasPermission(user.roles, "transaction:read"));
    if (!row || !allowed || !row.d.paidAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }); // no existence leak

    const [brand] = await db.select().from(brandConfig).limit(1);
    const pdf = await buildDonationReceipt({
      brandName: brand?.brandName ?? "Platform Donasi",
      contactEmail: brand?.contactEmail,
      contactWhatsapp: brand?.contactWhatsapp,
      address: brand?.address,
      donationCode: row.d.donationCode,
      paidAt: row.d.paidAt,
      campaignTitle: row.campaignTitle,
      amount: row.d.amount,
      donorName: row.d.donorNameSnapshot,
      isAnonymous: row.d.isAnonymous,
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bukti-donasi-${row.d.donationCode}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
