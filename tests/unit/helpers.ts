import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/server/db/client";
import { actions, assignments, cases, evidence, reviews, users, type Case } from "@/server/db/schema";
import type { CaseStatus, StaffRole } from "@/lib/contracts/enums";
import type { Actor } from "@/server/domain/workflow";

let refSeq = 1000;

export const NOW = new Date("2026-10-16T10:00:00.000Z");
export const NINE_DAYS_AGO = new Date(NOW.getTime() - 9 * 24 * 3600 * 1000);

export async function setupDb() {
  await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
}

const userIds: Partial<Record<StaffRole, string>> = {};

export async function user(role: StaffRole): Promise<Actor> {
  if (!userIds[role]) {
    const row = await db
      .insert(users)
      .values({
        email: `${role}@test.local`,
        passwordHash: "x",
        displayName: role,
        role,
      })
      .returning()
      .get();
    userIds[role] = row.id;
  }
  return { kind: "user", user: { id: userIds[role]!, role } };
}

export function userId(actor: Actor): string {
  if (actor.kind !== "user") throw new Error("not a user actor");
  return actor.user.id;
}

/** Test setup only: inserts a case directly in the given status. Production code never does this. */
export async function makeCase(status: CaseStatus, overrides: Partial<Case> = {}): Promise<Case> {
  refSeq += 1;
  const n = String(refSeq).padStart(4, "0");
  return db
    .insert(cases)
    .values({
      ref: `SG-2026-${n}`,
      hazardCategory: "open_manhole",
      title: "Test hazard",
      description: "An open manhole used in tests",
      municipality: "City of Johannesburg",
      suburb: "Freedom Park",
      landmark: "near the school gate",
      status,
      clockStartedAt: NINE_DAYS_AGO.toISOString(),
      createdAt: NINE_DAYS_AGO.toISOString(),
      updatedAt: NINE_DAYS_AGO.toISOString(),
      ...overrides,
    })
    .returning()
    .get();
}

export async function addAction(
  caseId: string,
  type: "protection" | "correction",
  by: Actor,
  opts: { withPhoto?: boolean; description?: string } = {},
) {
  const a = await db
    .insert(actions)
    .values({
      caseId,
      type,
      description: opts.description ?? "Cones and tape placed around the hole",
      performedBy: userId(by),
    })
    .returning()
    .get();
  if (opts.withPhoto ?? true) {
    await db.insert(evidence).values({
      caseId,
      actionId: a.id,
      storageKey: `${a.id}.jpg`,
      mime: "image/jpeg",
      bytes: 1234,
      sha256: "deadbeef",
      uploadedBy: userId(by),
    });
  }
  return a;
}

export async function addReview(
  caseId: string,
  stage: "protection" | "closure",
  decision: "approved" | "rejected",
  by: Actor,
  reason?: string,
) {
  return db
    .insert(reviews)
    .values({ caseId, stage, decision, reason: reason ?? null, reviewerId: userId(by) })
    .returning()
    .get();
}

export async function addRepairAssignment(caseId: string, by: Actor, crewLabel = "Field Team B") {
  return db
    .insert(assignments)
    .values({
      caseId,
      crewLabel,
      stage: "repair",
      dueDate: new Date(NOW.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      assignedBy: userId(by),
    })
    .returning()
    .get();
}

export const ALL_STAFF: StaffRole[] = ["community_worker", "ops_manager", "field_team", "reviewer"];
