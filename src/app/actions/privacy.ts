"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { rateLimit } from "@/lib/cache/redis";
import { DomainError } from "@/services/campaigns.service";
import { createDataRequest, eraseAccount, unsubscribeDonor } from "@/services/privacy.service";
import { signOut } from "@/lib/auth/auth";
import { z } from "zod";

export async function unsubscribeAction(fd: FormData): Promise<void> {
  const token = String(fd.get("t") ?? "");
  const donorId = verifyUnsubscribeToken(token);
  if (!donorId) redirect("/unsubscribe?t=invalid");
  await unsubscribeDonor(donorId);
  redirect("/unsubscribe?done=1");
}

const requestSchema = z.object({
  type: z.enum(["ACCESS", "DELETE"]),
  email: z.string().trim().max(254).pipe(z.email("Email tidak valid")),
  details: z.string().trim().max(1000).optional(),
  confirm: z.literal("on", { error: "Centang pernyataan bahwa email tersebut milik Anda." }),
});

/** Guest data request (access / erasure). Stored for manual verification by an admin — never executed blindly. */
export async function submitDataRequestAction(fd: FormData): Promise<void> {
  const parsed = requestSchema.safeParse({ type: fd.get("type"), email: fd.get("email"), details: fd.get("details") || undefined, confirm: fd.get("confirm") ?? "off" });
  if (!parsed.success) redirect(`/permintaan-data?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid.")}`);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit("data-request", `${ip}:${parsed.data.email}`, 3, 3600);
  if (!limited.allowed) redirect("/permintaan-data?error=" + encodeURIComponent("Terlalu banyak permintaan. Coba lagi nanti."));
  await createDataRequest({ type: parsed.data.type, email: parsed.data.email, details: parsed.data.details });
  redirect("/permintaan-data?sent=1");
}

/** Self-service erasure for a signed-in donor: anonymise donor data and delete the login account. */
export async function eraseAccountAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Faccount");
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "HAPUS") redirect("/account?error=" + encodeURIComponent('Ketik "HAPUS" untuk mengonfirmasi.') + "#privasi");
  try {
    await eraseAccount(user.id);
  } catch (e) {
    if (e instanceof DomainError) redirect("/account?error=" + encodeURIComponent(e.message) + "#privasi");
    throw e;
  }
  await signOut({ redirectTo: "/?deleted=1" });
}
