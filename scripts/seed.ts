try {
  process.loadEnvFile(".env.local");
} catch {
  /* fall back to process env */
}

async function main() {
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  const { db } = await import("../src/server/db/client");
  const { seedDemo, seedSummary } = await import("../src/server/seed/demo-seed");

  await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
  const summary = await seedDemo();
  console.log(`Seeded ${summary.users} staff accounts and ${summary.cases} cases at ${summary.seededAt}`);
  for (const row of await seedSummary()) {
    console.log(`  ${row.ref}  ${row.status.padEnd(20)}  ${row.title}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
