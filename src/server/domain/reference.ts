import { eq, sql } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { counters } from "@/server/db/schema";

export const REF_COUNTER = "case_ref";

export function formatRef(n: number, year: number = new Date().getUTCFullYear()): string {
  return `SG-${year}-${String(n).padStart(4, "0")}`;
}

/** Atomically increments the case counter and returns the next reference, e.g. SG-2026-0016. */
export async function nextRef(tx: DbOrTx, now: Date = new Date()): Promise<string> {
  await tx
    .insert(counters)
    .values({ name: REF_COUNTER, value: 1 })
    .onConflictDoUpdate({ target: counters.name, set: { value: sql`${counters.value} + 1` } });
  const row = await tx.select({ value: counters.value }).from(counters).where(eq(counters.name, REF_COUNTER)).get();
  return formatRef(row?.value ?? 1, now.getUTCFullYear());
}

/** Used by the seed so live reports continue after the fixed references. */
export async function setRefCounter(tx: DbOrTx, value: number): Promise<void> {
  await tx
    .insert(counters)
    .values({ name: REF_COUNTER, value })
    .onConflictDoUpdate({ target: counters.name, set: { value } });
}

export const REF_PATTERN = /^SG-\d{4}-\d{4}$/;

export function normaliseRef(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  if (REF_PATTERN.test(cleaned)) return cleaned;
  // Accept "SG20260014" or "SG-2026-14" style variants.
  const loose = cleaned.match(/^SG-?(\d{4})-?(\d{1,4})$/);
  if (loose) return formatRef(Number(loose[2]), Number(loose[1]));
  // Accept "0014" or "14" and assume the current year.
  if (/^\d{1,4}$/.test(cleaned)) return formatRef(Number(cleaned));
  return null;
}
