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

/** Module-level singleton (survives HMR in dev). */
export const db: Database = globalForDb.__db ?? (globalForDb.__db = create());

export async function closeDb(): Promise<void> {
  await globalForDb.__pg?.end({ timeout: 5 });
  globalForDb.__pg = undefined;
  globalForDb.__db = undefined;
}
