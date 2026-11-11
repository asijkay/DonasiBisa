import postgres from "postgres";
import { runMigrations } from "../src/db/migrate";

const BASE = process.env.TEST_DATABASE_ADMIN_URL ?? "postgresql://postgres:postgres@localhost:5433/postgres";
export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/donasibisa_test";

/** Creates the throwaway test database (if needed) and applies migrations. */
export default async function setup(): Promise<void> {
  const admin = postgres(BASE, { max: 1 });
  try {
    const name = new URL(TEST_DB_URL).pathname.slice(1);
    const rows = await admin`select 1 from pg_database where datname = ${name}`;
    if (!rows.length) await admin.unsafe(`create database "${name}"`);
  } finally {
    await admin.end();
  }
  await runMigrations(TEST_DB_URL);
}
