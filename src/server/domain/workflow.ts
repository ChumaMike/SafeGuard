import { and, count, eq, isNull } from "drizzle-orm";
import { db, type Tx } from "@/server/db/client";
import { actions, assignments, cases, evidence, reviews, type Case } from "@/server/db/schema";
import { ROLE_LABEL, type CaseStatus, type StaffRole, type SightingKind } from "@/lib/contracts/enums";
import { Problem } from "./errors";
import { appendEvent, actorUserId, type Actor } from "./events";
import { DAY } from "./severity";

export type { Actor } from "./events";

export interface TransitionPayload {
  reason?: string;
  actionId?: string;
  reviewId?: string;
  assignmentId?: string;
  sightingKind?: SightingKind;
  /** Fields written to the case in the same transaction (triage). */
  patch?: Partial<
    Pick<Case, "hazardCategory" | "likelihood" | "impact" | "severity" | "ownerUserId" | "dueDate" | "municipalRef">
  >;
}

interface Ctx {
  tx: Tx;
  current: Case;
  /** current + payload.patch, what the guard sees */
  merged: Case;
  actor: Actor;
  payload: TransitionPayload;
  now: Date;
}

type Guard = (ctx: Ctx) => Promise<string | null> | string | null;
type Effects = (ctx: Ctx) => Promise<Partial<Case>> | Partial<Case>;

interface Rule {
  roles: readonly StaffRole[];
  /** A public sighting of this kind may trigger the transition anonymously. */
  publicSighting?: SightingKind;
  /** Verb phrase for the 403 message: "Only the reviewer can <label>". */
  label: string;
  guard?: Guard;
  effects?: Effects;
}

const needsReason =
  (message: string): Guard =>
  ({ payload }) =>
    payload.reason && payload.reason.trim().length > 0 ? null : message;

const needsActionWithPhoto =
  (type: "protection" | "correction"): Guard =>
  async ({ tx, current, payload }) => {
    const message = "Needs: a description and at least 1 photo";
    if (!payload.actionId) return message;
    const action = await tx
      .select()
      .from(actions)
      .where(and(eq(actions.id, payload.actionId), eq(actions.caseId, current.id), eq(actions.type, type)))
      .get();
    if (!action || action.description.trim().length === 0) return message;
    const photos = await tx
      .select({ n: count() })
      .from(evidence)
      .where(and(eq(evidence.actionId, action.id), eq(evidence.caseId, current.id)))
      .get();
    return (photos?.n ?? 0) >= 1 ? null : message;
  };

const needsApprovedReview =
  (stage: "protection" | "closure"): Guard =>
  async ({ tx, current, payload }) => {
    const message = `Needs: an approved review (stage = ${stage})`;
    if (!payload.reviewId) return message;
    const review = await tx
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.id, payload.reviewId),
          eq(reviews.caseId, current.id),
          eq(reviews.stage, stage),
          eq(reviews.decision, "approved"),
        ),
      )
      .get();
    return review ? null : message;
  };

const needsRepairAssignment: Guard = async ({ tx, current, payload }) => {
  const message = "Needs: a crew and a due date";
  if (!payload.assignmentId) return message;
  const a = await tx
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.id, payload.assignmentId),
        eq(assignments.caseId, current.id),
        eq(assignments.stage, "repair"),
        isNull(assignments.supersededAt),
      ),
    )
    .get();
  return a && a.crewLabel.trim().length > 0 && a.dueDate ? null : message;
};

const needsTriageFields: Guard = ({ merged }) =>
  merged.hazardCategory && merged.severity && merged.ownerUserId && merged.dueDate
    ? null
    : "Needs: category, severity, owner and due date";

/** Barrier gone: protection is no longer verified, the clock restarts, open repair work is superseded. */
const backToUncontained: Effects = async ({ tx, current, now }) => {
  await tx
    .update(assignments)
    .set({ supersededAt: now.toISOString() })
    .where(and(eq(assignments.caseId, current.id), eq(assignments.stage, "repair"), isNull(assignments.supersededAt)));
  return {
    protectionVerifiedAt: null,
    protectionVerifiedBy: null,
    clockStartedAt: now.toISOString(),
  };
};

const key = (from: CaseStatus, to: CaseStatus) => `${from}->${to}`;

/** The transition table. Rows match docs/01-domain-and-workflow.md exactly. */
export const RULES: Readonly<Record<string, Rule>> = {
  [key("unassessed", "under_review")]: {
    roles: ["community_worker", "ops_manager"],
    label: "claim a case for review",
  },
  [key("under_review", "uncontained")]: {
    roles: ["community_worker", "ops_manager"],
    label: "triage a case",
    guard: needsTriageFields,
  },
  [key("under_review", "dismissed")]: {
    roles: ["ops_manager"],
    label: "dismiss a case",
    guard: needsReason("Needs: a reason"),
  },
  [key("uncontained", "protection_recorded")]: {
    roles: ["field_team", "community_worker"],
    label: "record protection",
    guard: needsActionWithPhoto("protection"),
  },
  [key("protection_recorded", "protected")]: {
    roles: ["reviewer"],
    label: "verify protection",
    guard: needsApprovedReview("protection"),
    effects: ({ actor, now }) => ({
      protectionVerifiedAt: now.toISOString(),
      protectionVerifiedBy: actorUserId(actor),
    }),
  },
  [key("protection_recorded", "under_review")]: {
    roles: ["reviewer"],
    label: "reject protection",
    guard: needsReason("Needs: a reason for rejecting"),
  },
  [key("protected", "repair_pending")]: {
    roles: ["ops_manager"],
    label: "assign a repair crew",
    guard: needsRepairAssignment,
  },
  [key("repair_pending", "repair_recorded")]: {
    roles: ["field_team"],
    label: "record a repair",
    guard: needsActionWithPhoto("correction"),
  },
  [key("repair_recorded", "resolved")]: {
    roles: ["reviewer"],
    label: "verify closure",
    guard: needsApprovedReview("closure"),
    effects: ({ actor, now }) => ({
      closureVerifiedAt: now.toISOString(),
      closureVerifiedBy: actorUserId(actor),
      reinspectDue: new Date(now.getTime() + 90 * DAY).toISOString(),
    }),
  },
  [key("repair_recorded", "under_review")]: {
    roles: ["reviewer"],
    label: "reject a repair",
    guard: needsReason("Needs: a reason for rejecting"),
  },
  [key("resolved", "under_review")]: {
    roles: ["reviewer", "ops_manager"],
    label: "reopen a case",
    guard: needsReason("Needs: a reopen reason"),
  },
  [key("protected", "uncontained")]: {
    roles: ["ops_manager", "reviewer"],
    publicSighting: "barrier_gone",
    label: "mark a case uncontained",
    effects: backToUncontained,
  },
  [key("repair_pending", "uncontained")]: {
    roles: ["ops_manager", "reviewer"],
    publicSighting: "barrier_gone",
    label: "mark a case uncontained",
    effects: backToUncontained,
  },
};

export function ruleFor(from: CaseStatus, to: CaseStatus): Rule | undefined {
  return RULES[key(from, to)];
}

/** Which statuses the given actor may move this case to right now (for the UI; never a security check). */
export function availableTransitions(status: CaseStatus, actor: Actor): CaseStatus[] {
  return Object.entries(RULES)
    .filter(([k, rule]) => k.startsWith(`${status}->`) && actorAllowed(rule, actor))
    .map(([k]) => k.split("->")[1] as CaseStatus);
}

function actorAllowed(rule: Rule, actor: Actor): boolean {
  if (actor.kind === "user") return rule.roles.includes(actor.user.role);
  if (actor.kind === "public_sighting") return rule.publicSighting === actor.sightingKind;
  return false;
}

function joinRoles(roles: readonly StaffRole[]): string {
  const names = roles.map((r) => ROLE_LABEL[r].toLowerCase());
  return `the ${names.join(" or ")}`;
}

/**
 * The only code path that changes cases.status. Runs inside the given transaction:
 * load → 409 if no rule → 403 if the actor may not → 422 if the guard fails →
 * append a status_changed event (seq = max + 1) → update the case.
 */
export async function transitionIn(
  tx: Tx,
  caseId: string,
  to: CaseStatus,
  actor: Actor,
  payload: TransitionPayload = {},
  now: Date = new Date(),
): Promise<Case> {
  const current = await tx.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!current) throw new Problem(404, "Case not found");

  const rule = ruleFor(current.status, to);
  if (!rule) throw new Problem(409, `Can't move from ${current.status} to ${to}`);

  if (!actorAllowed(rule, actor)) {
    throw new Problem(403, `Only ${joinRoles(rule.roles)} can ${rule.label}`);
  }

  const merged: Case = { ...current, ...(payload.patch ?? {}) };
  const ctx: Ctx = { tx, current, merged, actor, payload, now };

  if (rule.guard) {
    const failure = await rule.guard(ctx);
    if (failure) throw new Problem(422, failure);
  }

  const effects = rule.effects ? await rule.effects(ctx) : {};

  await appendEvent(tx, {
    caseId,
    eventType: "status_changed",
    actor,
    fromStatus: current.status,
    toStatus: to,
    now,
    payload: {
      ...(payload.reason ? { reason: payload.reason } : {}),
      ...(payload.actionId ? { actionId: payload.actionId } : {}),
      ...(payload.reviewId ? { reviewId: payload.reviewId } : {}),
      ...(payload.assignmentId ? { assignmentId: payload.assignmentId } : {}),
      ...(actor.kind === "public_sighting" ? { sightingKind: actor.sightingKind, communityReported: true } : {}),
    },
  });

  const updated = await tx
    .update(cases)
    .set({ ...(payload.patch ?? {}), ...effects, status: to, updatedAt: now.toISOString() })
    .where(eq(cases.id, caseId))
    .returning()
    .get();

  return updated;
}

export function transition(
  caseId: string,
  to: CaseStatus,
  actor: Actor,
  payload: TransitionPayload = {},
  now: Date = new Date(),
): Promise<Case> {
  return db.transaction((tx) => transitionIn(tx, caseId, to, actor, payload, now));
}
