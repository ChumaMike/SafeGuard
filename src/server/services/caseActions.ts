import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { actions, assignments, cases, reviews, type Case } from "@/server/db/schema";
import type { AssignRepairInput, RecordActionInput, ReviewInput, TriageInput } from "@/lib/contracts/inputs";
import { appendEvent } from "@/server/domain/events";
import { Problem } from "@/server/domain/errors";
import { can, type PermissionAction } from "@/server/domain/permissions";
import { defaultDueDate, severityFrom } from "@/server/domain/severity";
import { transitionIn } from "@/server/domain/workflow";
import type { SessionUser } from "@/server/auth/session";
import { photosFromFormData, storePhoto } from "./evidence";
import { requireCase } from "./cases";

const asActor = (user: SessionUser) => ({ kind: "user" as const, user: { id: user.id, role: user.role, displayName: user.displayName } });

function assertCan(user: SessionUser, action: PermissionAction) {
  if (!can(user, action)) throw new Problem(403, `Your role (${user.role}) cannot do this`);
}

/** unassessed → under_review */
export async function claimCase(user: SessionUser, caseId: string, now = new Date()): Promise<Case> {
  assertCan(user, "case.triage");
  return db.transaction((tx) => transitionIn(tx, caseId, "under_review", asActor(user), {}, now));
}

/** under_review → uncontained, writing the triage fields in the same transaction. */
export async function triageCase(user: SessionUser, caseId: string, input: TriageInput, now = new Date()): Promise<Case> {
  assertCan(user, "case.triage");
  const severity = severityFrom(input.likelihood, input.impact);
  return db.transaction(async (tx) => {
    await appendEvent(tx, {
      caseId,
      eventType: "assigned",
      actor: asActor(user),
      now,
      payload: { stage: "protection", ownerId: input.ownerId, dueDate: input.dueDate, severity },
    });
    return transitionIn(
      tx,
      caseId,
      "uncontained",
      asActor(user),
      {
        patch: {
          hazardCategory: input.hazardCategory,
          likelihood: input.likelihood,
          impact: input.impact,
          severity,
          ownerUserId: input.ownerId,
          dueDate: input.dueDate,
          ...(input.municipalRef ? { municipalRef: input.municipalRef } : {}),
        },
      },
      now,
    );
  });
}

export function suggestedDueDate(likelihood: number, impact: number, now = new Date()): string {
  return defaultDueDate(severityFrom(likelihood, impact), now);
}

export async function dismissCase(user: SessionUser, caseId: string, reason: string, now = new Date()): Promise<Case> {
  assertCan(user, "case.dismiss");
  return db.transaction((tx) => transitionIn(tx, caseId, "dismissed", asActor(user), { reason }, now));
}

/**
 * Records a protection or correction action with its photos, then transitions.
 * The guard inside transition() re-checks that the action exists and has ≥1 photo.
 */
export async function recordAction(
  user: SessionUser,
  caseId: string,
  input: RecordActionInput,
  formData: FormData,
  now = new Date(),
): Promise<Case> {
  assertCan(user, input.type === "protection" ? "case.record_protection" : "case.record_repair");
  const files = photosFromFormData(formData);
  if (files.length === 0) throw new Problem(422, "Needs: a description and at least 1 photo");

  return db.transaction(async (tx) => {
    await requireCase(caseId, tx);
    const action = await tx
      .insert(actions)
      .values({
        caseId,
        type: input.type,
        description: input.description,
        performedBy: user.id,
        performedAt: now.toISOString(),
        createdAt: now.toISOString(),
      })
      .returning()
      .get();

    for (const f of files) {
      await storePhoto(tx, f, { caseId, actionId: action.id, uploadedBy: user.id }, asActor(user), now);
    }

    await appendEvent(tx, {
      caseId,
      eventType: "action_recorded",
      actor: asActor(user),
      now,
      payload: { actionId: action.id, type: input.type, description: input.description, photos: files.length },
    });

    const to = input.type === "protection" ? "protection_recorded" : "repair_recorded";
    return transitionIn(tx, caseId, to, asActor(user), { actionId: action.id }, now);
  });
}

/** Reviewer approves or rejects protection/closure. */
export async function reviewCase(user: SessionUser, caseId: string, input: ReviewInput, now = new Date()): Promise<Case> {
  assertCan(user, "case.verify");
  return db.transaction(async (tx) => {
    const review = await tx
      .insert(reviews)
      .values({
        caseId,
        stage: input.stage,
        decision: input.decision,
        reason: input.reason ?? null,
        reviewerId: user.id,
        createdAt: now.toISOString(),
      })
      .returning()
      .get();

    await appendEvent(tx, {
      caseId,
      eventType: "review_recorded",
      actor: asActor(user),
      now,
      payload: { reviewId: review.id, stage: input.stage, decision: input.decision, reason: input.reason ?? null },
    });

    if (input.decision === "approved") {
      const to = input.stage === "protection" ? "protected" : "resolved";
      return transitionIn(tx, caseId, to, asActor(user), { reviewId: review.id }, now);
    }
    return transitionIn(tx, caseId, "under_review", asActor(user), { reviewId: review.id, reason: input.reason }, now);
  });
}

/** protected → repair_pending */
export async function assignRepair(user: SessionUser, caseId: string, input: AssignRepairInput, now = new Date()): Promise<Case> {
  assertCan(user, "case.assign_repair");
  return db.transaction(async (tx) => {
    await tx
      .update(assignments)
      .set({ supersededAt: now.toISOString() })
      .where(and(eq(assignments.caseId, caseId), eq(assignments.stage, "repair"), isNull(assignments.supersededAt)));

    const a = await tx
      .insert(assignments)
      .values({
        caseId,
        crewLabel: input.crewLabel,
        stage: "repair",
        dueDate: input.dueDate,
        assignedBy: user.id,
        createdAt: now.toISOString(),
      })
      .returning()
      .get();

    await appendEvent(tx, {
      caseId,
      eventType: "assigned",
      actor: asActor(user),
      now,
      payload: { stage: "repair", assignmentId: a.id, crewLabel: input.crewLabel, dueDate: input.dueDate },
    });

    return transitionIn(tx, caseId, "repair_pending", asActor(user), { assignmentId: a.id }, now);
  });
}

export async function reopenCase(user: SessionUser, caseId: string, reason: string, now = new Date()): Promise<Case> {
  assertCan(user, "case.reopen");
  return db.transaction((tx) => transitionIn(tx, caseId, "under_review", asActor(user), { reason }, now));
}

export async function markUncontained(user: SessionUser, caseId: string, reason: string, now = new Date()): Promise<Case> {
  assertCan(user, "case.mark_uncontained");
  return db.transaction(async (tx) => {
    await appendEvent(tx, { caseId, eventType: "note", actor: asActor(user), now, payload: { note: reason } });
    return transitionIn(tx, caseId, "uncontained", asActor(user), { reason }, now);
  });
}

export async function setMunicipalRef(user: SessionUser, caseId: string, municipalRef: string, now = new Date()): Promise<Case> {
  assertCan(user, "case.view");
  return db.transaction(async (tx) => {
    await requireCase(caseId, tx);
    await appendEvent(tx, {
      caseId,
      eventType: "note",
      actor: asActor(user),
      now,
      payload: { municipalRef, note: "Municipal reference recorded" },
    });
    return tx
      .update(cases)
      .set({ municipalRef, updatedAt: now.toISOString() })
      .where(eq(cases.id, caseId))
      .returning()
      .get();
  });
}
