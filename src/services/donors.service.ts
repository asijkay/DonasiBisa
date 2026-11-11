import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { donors } from "@/db/schema";
import { normalizeEmail } from "@/lib/utils/contact";

type DonorInput = { name: string; email: string; whatsapp: string | null; whatsappOptIn: boolean };

/** `whatsapp` must already be null unless the donor opted in (see createDonation). */

/** One donor profile per normalized email; latest contact details win. */
export async function upsertDonor(tx: Tx, input: DonorInput) {
  const normalized = normalizeEmail(input.email);
  const [donor] = await tx
    .insert(donors)
    .values({
      fullName: input.name,
      email: input.email.trim(),
      normalizedEmail: normalized,
      whatsappNumber: input.whatsapp,
      whatsappOptIn: input.whatsappOptIn,
    })
    .onConflictDoUpdate({
      target: donors.normalizedEmail,
      set: {
        fullName: input.name,
        email: input.email.trim(),
        whatsappNumber: input.whatsapp,
        whatsappOptIn: input.whatsappOptIn,
        updatedAt: new Date(),
      },
    })
    .returning();
  return donor;
}

/**
 * Links an unlinked donor profile to a user ONLY when the Google email is verified and matches the
 * normalized donor email. Never merges on unverified email.
 */
export async function linkDonorToUser(user: { id: string; email?: string | null; emailVerified?: Date | null }): Promise<boolean> {
  if (!user.email || !user.emailVerified) return false;
  const normalized = normalizeEmail(user.email);
  const [existing] = await db.select({ id: donors.id }).from(donors).where(eq(donors.userId, user.id)).limit(1);
  if (existing) return false;
  const updated = await db
    .update(donors)
    .set({ userId: user.id, updatedAt: new Date() })
    .where(and(eq(donors.normalizedEmail, normalized), isNull(donors.userId)))
    .returning({ id: donors.id });
  return updated.length > 0;
}
