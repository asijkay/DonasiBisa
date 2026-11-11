import "server-only";
import { db, type Tx } from "@/db";
import { auditLogs } from "@/db/schema";
import { sanitizePayload } from "@/lib/utils/security";

/** Append-only audit trail. Pass a transaction to commit atomically with the change. */
export async function writeAudit(
  executor: Tx | typeof db,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Promise<void> {
  await executor.insert(auditLogs).values({
    actorUserId,
    action,
    entityType,
    entityId,
    beforeData: before ? (sanitizePayload(before) as Record<string, unknown>) : null,
    afterData: after ? (sanitizePayload(after) as Record<string, unknown>) : null,
  });
}
