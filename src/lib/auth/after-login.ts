import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, users } from "@/db/schema";
import { adminAllowlist } from "@/lib/env";
import { normalizeEmail } from "@/lib/utils/contact";
import { linkDonorToUser } from "@/services/donors.service";
import { writeAudit } from "@/services/audit.service";

/**
 * Runs after every successful login with a VERIFIED email:
 *  1. marks the user's email verified,
 *  2. bootstraps SUPER_ADMIN for allowlisted emails,
 *  3. links a matching guest donor profile.
 * Roles are never taken from the identity provider or the browser.
 */
export async function afterVerifiedLogin(userId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.email) return;
  const now = new Date();
  if (!user.emailVerified) {
    await db.update(users).set({ emailVerified: now, updatedAt: now }).where(eq(users.id, userId));
    user.emailVerified = now;
  }
  if (adminAllowlist().includes(normalizeEmail(user.email))) {
    const inserted = await db
      .insert(userRoles)
      .values({ userId, role: "SUPER_ADMIN" })
      .onConflictDoNothing()
      .returning({ id: userRoles.id });
    if (inserted.length) await writeAudit(db, userId, "admin.bootstrap", "user", userId, null, { role: "SUPER_ADMIN" });
  }
  await linkDonorToUser(user);
}
