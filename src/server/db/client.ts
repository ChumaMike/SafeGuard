import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/safeguard.db";

declare global {
  // eslint-disable-next-line no-var
  var __safeguardLibsql: Client | undefined;
}

function makeClient(): Client {
  const client = createClient({ url });
  if (url.startsWith("file:") && !url.includes(":memory:")) {
    // Fire and forget: WAL makes concurrent reads during writes safe for a local demo.
    void client.execute("PRAGMA journal_mode=WAL").catch(() => undefined);
    void client.execute("PRAGMA busy_timeout=5000").catch(() => undefined);
  }
  void client.execute("PRAGMA foreign_keys=ON").catch(() => undefined);
  return client;
}

// Reuse the client across Next.js hot reloads in development.
export const libsql: Client = globalThis.__safeguardLibsql ?? makeClient();
if (process.env.NODE_ENV !== "production") globalThis.__safeguardLibsql = libsql;

export const db = drizzle(libsql, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbOrTx = Db | Tx;
