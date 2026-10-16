/**
 * Copies the freshly seeded local database to data/demo.db, the committed last-resort fallback for
 * the expo laptop. Run after `pnpm db:seed`. Restore with: cp data/demo.db data/safeguard.db
 */
import { copyFileSync, existsSync, rmSync } from "node:fs";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* fall back to process env */
}

async function main() {
  const { libsql } = await import("../src/server/db/client");
  // Fold the WAL into the main file so the copy is complete on its own.
  await libsql.execute("PRAGMA wal_checkpoint(TRUNCATE)");
  const src = (process.env.DATABASE_URL ?? "file:./data/safeguard.db").replace(/^file:/, "");
  if (!existsSync(src)) throw new Error(`${src} does not exist; run pnpm db:seed first`);
  for (const suffix of ["", "-wal", "-shm"]) rmSync(`./data/demo.db${suffix}`, { force: true });
  copyFileSync(src, "./data/demo.db");
  console.log(`Snapshot written to data/demo.db from ${src}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
