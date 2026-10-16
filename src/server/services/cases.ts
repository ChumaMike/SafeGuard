import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, ne, not, sql } from "drizzle-orm";
import { db, type DbOrTx } from "@/server/db/client";
import {
  actions,
  assignments,
  caseEvents,
  cases,
  evidence,
  reviews,
  users,
  type Action,
  type Assignment,
  type Case,
  type CaseEvent,
  type Evidence,
  type Review,
} from "@/server/db/schema";
import { HAZARD_LABEL, type CaseStatus, type HazardCategory } from "@/lib/contracts/enums";
import type { PublicReportInput } from "@/lib/contracts/inputs";
import { appendEvent } from "@/server/domain/events";
import { nextRef } from "@/server/domain/reference";
import { Problem } from "@/server/domain/errors";

export const ACTIVE_STATUSES: CaseStatus[] = [
  "unassessed",
  "under_review",
  "uncontained",
  "protection_recorded",
  "protected",
  "repair_pending",
  "repair_recorded",
];

export const EXPOSED_STATUSES: CaseStatus[] = ["unassessed", "under_review", "uncontained", "protection_recorded"];

export const DAY_MS = 24 * 3600 * 1000;

/** Great-circle distance in metres. */
export function haversineMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface DuplicateCandidate {
  id: string;
  ref: string;
  title: string;
  suburb: string;
  landmark: string;
  status: CaseStatus;
  distanceMetres: number | null;
  createdAt: string;
}

/**
 * Open cases with the same category, within 150 m when both have coordinates, or in the same
 * suburb when they don't, created in the last 14 days.
 */
export async function findDuplicates(
  input: Pick<PublicReportInput, "hazardCategory" | "suburb" | "lat" | "lng">,
  now: Date = new Date(),
  tx: DbOrTx = db,
): Promise<DuplicateCandidate[]> {
  const since = new Date(now.getTime() - 14 * DAY_MS).toISOString();
  const rows = await tx
    .select()
    .from(cases)
    .where(
      and(
        eq(cases.hazardCategory, input.hazardCategory),
        inArray(cases.status, ACTIVE_STATUSES),
        gte(cases.createdAt, since),
        sql`lower(${cases.suburb}) = lower(${input.suburb})`,
      ),
    )
    .orderBy(desc(cases.createdAt));

  const hasCoords = typeof input.lat === "number" && typeof input.lng === "number";
  return rows
    .map((c) => {
      const distance =
        hasCoords && c.lat !== null && c.lng !== null
          ? haversineMetres(input.lat!, input.lng!, c.lat, c.lng)
          : null;
      return { c, distance };
    })
    .filter(({ c, distance }) => {
      if (hasCoords && c.lat !== null && c.lng !== null) return distance !== null && distance <= 150;
      return true; // same suburb, no coordinates on one side
    })
    .map(({ c, distance }) => ({
      id: c.id,
      ref: c.ref,
      title: c.title,
      suburb: c.suburb,
      landmark: c.landmark,
      status: c.status,
      distanceMetres: distance === null ? null : Math.round(distance),
      createdAt: c.createdAt,
    }));
}

export type CreateReportResult =
  | { kind: "created"; case: Case; replayed: boolean }
  | { kind: "possible_duplicate"; possibleDuplicates: DuplicateCandidate[] };

/** Creates a public report. Idempotency-Key replays; duplicates are offered unless confirmed. */
export async function createPublicReport(input: PublicReportInput, now: Date = new Date()): Promise<CreateReportResult> {
  if (input.idempotencyKey) {
    const existing = await db.select().from(cases).where(eq(cases.idempotencyKey, input.idempotencyKey)).get();
    if (existing) return { kind: "created", case: existing, replayed: true };
  }

  if (!input.confirmNotDuplicate) {
    const possibleDuplicates = await findDuplicates(input, now);
    if (possibleDuplicates.length > 0) return { kind: "possible_duplicate", possibleDuplicates };
  }

  const created = await db.transaction(async (tx) => {
    const ref = await nextRef(tx, now);
    const iso = now.toISOString();
    const row = await tx
      .insert(cases)
      .values({
        ref,
        sourceType: "public_report",
        hazardCategory: input.hazardCategory,
        title: `${HAZARD_LABEL[input.hazardCategory as HazardCategory] ?? "Hazard"} · ${input.landmark}`,
        description: input.description,
        municipality: input.municipality,
        suburb: input.suburb,
        street: input.street ?? null,
        landmark: input.landmark,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        nearSchool: input.nearSchool,
        anyoneHurt: input.anyoneHurt,
        status: "unassessed",
        clockStartedAt: iso,
        idempotencyKey: input.idempotencyKey ?? null,
        municipalRef: input.municipalRef ?? null,
        reporterContact: input.contact ?? null,
        createdAt: iso,
        updatedAt: iso,
      })
      .returning()
      .get();

    await appendEvent(tx, {
      caseId: row.id,
      eventType: "created",
      actor: { kind: "public_reporter" },
      toStatus: "unassessed",
      now,
      payload: { source: "public_report", nearSchool: input.nearSchool, anyoneHurt: input.anyoneHurt },
    });
    return row;
  });

  return { kind: "created", case: created, replayed: false };
}

export async function getCaseByRef(ref: string, tx: DbOrTx = db): Promise<Case | null> {
  return (await tx.select().from(cases).where(eq(cases.ref, ref)).get()) ?? null;
}

export async function getCaseById(id: string, tx: DbOrTx = db): Promise<Case | null> {
  return (await tx.select().from(cases).where(eq(cases.id, id)).get()) ?? null;
}

export async function requireCase(id: string, tx: DbOrTx = db): Promise<Case> {
  const c = await getCaseById(id, tx);
  if (!c) throw new Problem(404, "Case not found");
  return c;
}

export interface CaseListFilter {
  statuses?: CaseStatus[];
  overdueOnly?: boolean;
  exposedOnly?: boolean;
  suburb?: string;
  limit?: number;
}

export interface CaseListItem extends Case {
  ownerName: string | null;
}

/** Longest-unprotected first. */
export async function listCases(filter: CaseListFilter = {}, now: Date = new Date()): Promise<CaseListItem[]> {
  const conds = [];
  if (filter.statuses?.length) conds.push(inArray(cases.status, filter.statuses));
  if (filter.exposedOnly) conds.push(inArray(cases.status, EXPOSED_STATUSES));
  if (filter.overdueOnly) {
    conds.push(inArray(cases.status, ACTIVE_STATUSES));
    conds.push(isNull(cases.protectionVerifiedAt));
    conds.push(sql`${cases.dueDate} IS NOT NULL AND ${cases.dueDate} < ${now.toISOString()}`);
  }
  if (filter.suburb) conds.push(sql`lower(${cases.suburb}) = lower(${filter.suburb})`);

  const rows = await db
    .select({ c: cases, ownerName: users.displayName })
    .from(cases)
    .leftJoin(users, eq(cases.ownerUserId, users.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(cases.clockStartedAt))
    .limit(filter.limit ?? 200);

  return rows.map((r) => ({ ...r.c, ownerName: r.ownerName ?? null }));
}

export interface TimelineEvent extends CaseEvent {
  actorName: string | null;
  payload: Record<string, unknown>;
}

export interface CaseDetail {
  case: Case;
  ownerName: string | null;
  actions: (Action & { evidence: Evidence[]; performedByName: string | null })[];
  evidence: Evidence[];
  assignments: Assignment[];
  reviews: (Review & { reviewerName: string | null })[];
  events: TimelineEvent[];
  openRepairAssignment: Assignment | null;
}

export async function getCaseDetail(id: string): Promise<CaseDetail | null> {
  const c = await getCaseById(id);
  if (!c) return null;

  const [ownerRow, actionRows, evidenceRows, assignmentRows, reviewRows, eventRows] = await Promise.all([
    c.ownerUserId ? db.select({ name: users.displayName }).from(users).where(eq(users.id, c.ownerUserId)).get() : null,
    db
      .select({ a: actions, performedByName: users.displayName })
      .from(actions)
      .leftJoin(users, eq(actions.performedBy, users.id))
      .where(eq(actions.caseId, id))
      .orderBy(desc(actions.performedAt)),
    db.select().from(evidence).where(eq(evidence.caseId, id)).orderBy(desc(evidence.createdAt)),
    db.select().from(assignments).where(eq(assignments.caseId, id)).orderBy(desc(assignments.createdAt)),
    db
      .select({ r: reviews, reviewerName: users.displayName })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.caseId, id))
      .orderBy(desc(reviews.createdAt)),
    db
      .select({ e: caseEvents, actorName: users.displayName })
      .from(caseEvents)
      .leftJoin(users, eq(caseEvents.actorUserId, users.id))
      .where(eq(caseEvents.caseId, id))
      .orderBy(desc(caseEvents.seq)),
  ]);

  return {
    case: c,
    ownerName: ownerRow?.name ?? null,
    actions: actionRows.map((r) => ({
      ...r.a,
      performedByName: r.performedByName ?? null,
      evidence: evidenceRows.filter((e) => e.actionId === r.a.id),
    })),
    evidence: evidenceRows,
    assignments: assignmentRows,
    reviews: reviewRows.map((r) => ({ ...r.r, reviewerName: r.reviewerName ?? null })),
    events: eventRows.map((r) => ({
      ...r.e,
      actorName: r.actorName ?? null,
      payload: safeJson(r.e.payloadJson),
    })),
    openRepairAssignment:
      assignmentRows.find((a) => a.stage === "repair" && a.supersededAt === null) ?? null,
  };
}

export async function listStaff(): Promise<{ id: string; displayName: string; role: string }[]> {
  return db
    .select({ id: users.id, displayName: users.displayName, role: users.role })
    .from(users)
    .where(and(eq(users.active, true), not(eq(users.role, "reviewer"))))
    .orderBy(asc(users.displayName));
}

export async function countOpenSuburbs(): Promise<number> {
  const row = await db
    .select({ n: sql<number>`count(distinct ${cases.suburb})` })
    .from(cases)
    .where(and(inArray(cases.status, ACTIVE_STATUSES), ne(cases.status, "dismissed")))
    .get();
  return row?.n ?? 0;
}

function safeJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
