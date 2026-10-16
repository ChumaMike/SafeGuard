import { mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db, libsql } from "../src/server/db/client";

async function main() {
  mkdirSync("./data/uploads", { recursive: true });
  await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
  const mode = await libsql.execute("PRAGMA journal_mode");
  console.log(`Migrated ${process.env.DATABASE_URL ?? "file:./data/safeguard.db"} (journal_mode=${mode.rows[0]?.journal_mode})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
