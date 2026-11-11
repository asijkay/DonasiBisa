import "server-only";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { getEnv } from "@/lib/env";

export type Database = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { __pg?: ReturnType<typeof postgres>; __db?: Database };

function create(): Database {
  const client = postgres(getEnv().DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  globalForDb.__pg = client;
  return drizzle(client, { schema });
}

/** Real client, created on first use so importing this module never needs env (e.g. during `next build`). */
export function getDb(): Database {
  return (globalForDb.__db ??= create());
}

/** Lazy singleton facade (survives HMR in dev). */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real) as unknown;
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function closeDb(): Promise<void> {
  await globalForDb.__pg?.end({ timeout: 5 });
  globalForDb.__pg = undefined;
  globalForDb.__db = undefined;
}
