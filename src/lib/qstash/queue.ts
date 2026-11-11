import "server-only";
import { Client, Receiver } from "@upstash/qstash";
import { getEnv } from "@/lib/env";

export type JobName = "notifications" | "expire-payments" | "campaign-lifecycle";

/** In-process handlers used when QStash is not configured (dev/test). Registered by the job modules. */
const localHandlers = new Map<JobName, (payload: unknown) => Promise<unknown>>();

export function registerLocalHandler(name: JobName, handler: (payload: unknown) => Promise<unknown>): void {
  localHandlers.set(name, handler);
}

export function qstashConfigured(): boolean {
  return !!getEnv().QSTASH_TOKEN;
}

/**
 * Enqueue a background job. With QStash configured the job is delivered over HTTPS to
 * /api/internal/jobs/<name> (signature-verified). Otherwise it runs in-process, fire-and-forget,
 * so failures can never alter the caller's outcome.
 */
export async function enqueueJob(name: JobName, payload: unknown): Promise<void> {
  const env = getEnv();
  if (env.QSTASH_TOKEN) {
    try {
      const client = new Client({ token: env.QSTASH_TOKEN, baseUrl: env.QSTASH_URL });
      await client.publishJSON({
        url: `${env.NEXT_PUBLIC_APP_URL}/api/internal/jobs/${name}`,
        body: payload as Record<string, unknown>,
        retries: 3,
      });
      return;
    } catch (e) {
      console.error(`[qstash] publish ${name} failed; falling back to inline`, (e as Error).message);
    }
  }
  const handler = localHandlers.get(name);
  if (handler) {
    void handler(payload).catch((e) => console.error(`[job:${name}] failed`, (e as Error).message));
  }
}

/** Verify an inbound QStash request. Returns false when unsigned/invalid or keys are missing. */
export async function verifyQstashRequest(request: Request, rawBody: string): Promise<boolean> {
  const env = getEnv();
  if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) return false;
  const signature = request.headers.get("upstash-signature");
  if (!signature) return false;
  const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  try {
    return await receiver.verify({ signature, body: rawBody });
  } catch {
    return false;
  }
}
