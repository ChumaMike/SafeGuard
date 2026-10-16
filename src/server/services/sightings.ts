import "server-only";
import { and, eq, like, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { caseEvents, cases, type Case } from "@/server/db/schema";
import type { SightingKind } from "@/lib/contracts/enums";
import { appendEvent } from "@/server/domain/events";
import { Problem } from "@/server/domain/errors";
import { transitionIn } from "@/server/domain/workflow";

export interface SightingResult {
  case: Case;
  replayed: boolean;
  reopened: boolean;
}

/**
 * Community sighting on a public case. Always logged (labelled community-reported) and bumps
 * interest_count. A sighting can never move a case towards safe. `barrier_gone` on a protected or
 * repair_pending case runs the transition back to uncontained; on any other status it is only logged.
 */
export async function recordSighting(
  ref: string,
  kind: SightingKind,
  idempotencyKey: string,
  now: Date = new Date(),
  observedAt?: string,
): Promise<SightingResult> {
  return db.transaction(async (tx) => {
    const c = await tx.select().from(cases).where(eq(cases.ref, ref)).get();
    if (!c) throw new Problem(404, "No case with that reference");

    const replay = await tx
      .select({ id: caseEvents.id })
      .from(caseEvents)
      .where(
        and(
          eq(caseEvents.caseId, c.id),
          eq(caseEvents.eventType, "sighting"),
          like(caseEvents.payloadJson, `%"idempotencyKey":"${idempotencyKey}"%`),
        ),
      )
      .get();
    if (replay) return { case: c, replayed: true, reopened: false };

    const actor = { kind: "public_sighting" as const, sightingKind: kind };
    await appendEvent(tx, {
      caseId: c.id,
      eventType: "sighting",
      actor,
      now,
      payload: {
        kind,
        idempotencyKey,
        communityReported: true,
        observedAt: observedAt ?? now.toISOString(),
        submittedAt: now.toISOString(),
        officialInspection: false,
      },
    });

    let updated = await tx
      .update(cases)
      .set({ interestCount: sql`${cases.interestCount} + 1`, updatedAt: now.toISOString() })
      .where(eq(cases.id, c.id))
      .returning()
      .get();

    let reopened = false;
    if (kind === "barrier_gone" && (c.status === "protected" || c.status === "repair_pending")) {
      updated = await transitionIn(tx, c.id, "uncontained", actor, { sightingKind: kind }, now);
      reopened = true;
    }

    return { case: updated, replayed: false, reopened };
  });
}
