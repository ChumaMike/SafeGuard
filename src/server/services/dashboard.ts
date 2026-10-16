import "server-only";
import { and, asc, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { cases, type Case } from "@/server/db/schema";
import { ACTIVE_STATUSES, EXPOSED_STATUSES } from "./cases";

export interface DashboardCounts {
  uncontainedOrUnassessed: number;
  recordedAwaitingVerification: number;
  protectedVerified: number;
  pastMakeSafeDue: number;
  resolved: number;
  needRepairCrew: number;
  repairsRecordedNotVerified: number;
  total: number;
}

export async function dashboardCounts(now: Date = new Date()): Promise<DashboardCounts> {
  const iso = now.toISOString();
  const row = await db
    .select({
      uncontainedOrUnassessed: sql<number>`sum(case when ${cases.status} in ('unassessed','under_review','uncontained') then 1 else 0 end)`,
      recordedAwaitingVerification: sql<number>`sum(case when ${cases.status} in ('protection_recorded','repair_recorded') then 1 else 0 end)`,
      protectedVerified: sql<number>`sum(case when ${cases.protectionVerifiedAt} is not null and ${cases.status} in ('protected','repair_pending','repair_recorded') then 1 else 0 end)`,
      pastMakeSafeDue: sql<number>`sum(case when ${cases.dueDate} is not null and ${cases.dueDate} < ${iso} and ${cases.protectionVerifiedAt} is null and ${cases.status} in ('under_review','uncontained','protection_recorded') then 1 else 0 end)`,
      resolved: sql<number>`sum(case when ${cases.status} = 'resolved' then 1 else 0 end)`,
      needRepairCrew: sql<number>`sum(case when ${cases.status} = 'protected' then 1 else 0 end)`,
      repairsRecordedNotVerified: sql<number>`sum(case when ${cases.status} = 'repair_recorded' then 1 else 0 end)`,
      total: sql<number>`count(*)`,
    })
    .from(cases)
    .get();

  return {
    uncontainedOrUnassessed: Number(row?.uncontainedOrUnassessed ?? 0),
    recordedAwaitingVerification: Number(row?.recordedAwaitingVerification ?? 0),
    protectedVerified: Number(row?.protectedVerified ?? 0),
    pastMakeSafeDue: Number(row?.pastMakeSafeDue ?? 0),
    resolved: Number(row?.resolved ?? 0),
    needRepairCrew: Number(row?.needRepairCrew ?? 0),
    repairsRecordedNotVerified: Number(row?.repairsRecordedNotVerified ?? 0),
    total: Number(row?.total ?? 0),
  };
}

/** Cases where people are exposed right now, longest-unprotected first. */
export async function exposedQueue(limit = 20): Promise<Case[]> {
  return db
    .select()
    .from(cases)
    .where(and(inArray(cases.status, EXPOSED_STATUSES), isNull(cases.protectionVerifiedAt)))
    .orderBy(asc(cases.clockStartedAt))
    .limit(limit);
}

export interface WardRow {
  suburb: string;
  municipality: string;
  openCases: number;
  exposedCases: number;
  nearSchool: number;
  longestUnprotectedMs: number;
}

/** One row per suburb (the ward proxy in this MVP), sorted by days unprotected. */
export async function wardList(now: Date = new Date()): Promise<WardRow[]> {
  const rows = await db
    .select()
    .from(cases)
    .where(inArray(cases.status, ACTIVE_STATUSES));

  const bySuburb = new Map<string, WardRow>();
  for (const c of rows) {
    const key = `${c.municipality}::${c.suburb}`;
    const row = bySuburb.get(key) ?? {
      suburb: c.suburb,
      municipality: c.municipality,
      openCases: 0,
      exposedCases: 0,
      nearSchool: 0,
      longestUnprotectedMs: 0,
    };
    row.openCases += 1;
    const exposed = c.protectionVerifiedAt === null && (EXPOSED_STATUSES as string[]).includes(c.status);
    if (exposed) {
      row.exposedCases += 1;
      row.longestUnprotectedMs = Math.max(row.longestUnprotectedMs, now.getTime() - Date.parse(c.clockStartedAt));
    }
    if (c.nearSchool) row.nearSchool += 1;
    bySuburb.set(key, row);
  }
  return [...bySuburb.values()].sort((a, b) => b.longestUnprotectedMs - a.longestUnprotectedMs);
}
