import "server-only";
import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";
import { sha256 } from "@/lib/utils/security";

/**
 * Redis is cache / rate-limit only (PostgreSQL is the source of truth).
 * When Upstash env is absent we fall back to a per-process in-memory store (dev/test only).
 */
let redis: Redis | null | undefined;
function client(): Redis | null {
  if (redis === undefined) {
    const env = getEnv();
    redis =
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
        : null;
  }
  return redis;
}

const memory = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = client();
    if (r) return (await r.get<T>(key)) ?? null;
    const v = memGet(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null; // cache failure must never break a request
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const r = client();
    if (r) await r.set(key, JSON.stringify(value), { ex: ttlSeconds });
    else memory.set(key, { value: JSON.stringify(value), expiresAt: Date.now() + ttlSeconds * 1000 });
  } catch {
    /* ignore */
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    const r = client();
    if (r) await r.del(...keys);
    else keys.forEach((k) => memory.delete(k));
  } catch {
    /* ignore */
  }
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  try {
    const r = client();
    if (r) {
      const keys = await r.keys(`${prefix}*`);
      if (keys.length) await r.del(...keys);
    } else {
      for (const k of [...memory.keys()]) if (k.startsWith(prefix)) memory.delete(k);
    }
  } catch {
    /* ignore */
  }
}

/** Read-through cache for public, non-personal data only. */
export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return typeof hit === "string" ? (JSON.parse(hit) as T) : hit;
  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

export type RateLimitResult = { allowed: boolean; remaining: number };

/** Fixed-window limiter. Keys are hashed so raw IP/email never reach Redis. */
export async function rateLimit(scope: string, identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const key = `rl:${scope}:${sha256(identifier).slice(0, 32)}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  try {
    const r = client();
    let count: number;
    if (r) {
      count = await r.incr(key);
      if (count === 1) await r.expire(key, windowSeconds);
    } else {
      const cur = Number(memGet(key) ?? 0) + 1;
      memory.set(key, { value: String(cur), expiresAt: Date.now() + windowSeconds * 1000 });
      count = cur;
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit }; // fail open: limiter outage must not block donations
  }
}
