import { dispatchNotifications, retryFailedNotifications } from "@/services/notifications.service";
import { runSignedJob } from "../_run";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return runSignedJob(request, async (body) => {
    const p = body as { logIds?: string[]; sweep?: boolean };
    if (p.sweep) return { retried: await retryFailedNotifications() };
    await dispatchNotifications(p.logIds ?? []);
    return { dispatched: p.logIds?.length ?? 0 };
  });
}
