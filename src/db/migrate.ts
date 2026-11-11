import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/** Applies SQL migrations using the direct (unpooled) connection when available. */
export async function runMigrations(url: string): Promise<void> {
  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./src/db/migrations" });
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL(_DIRECT) is required");
  runMigrations(url)
    .then(() => console.log("Migrations applied"))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
