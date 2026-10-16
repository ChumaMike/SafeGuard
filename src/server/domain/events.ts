import { eq, max } from "drizzle-orm";
import type { DbOrTx } from "@/server/db/client";
import { caseEvents, type CaseEvent } from "@/server/db/schema";
import type { EventType, SightingKind, StaffRole } from "@/lib/contracts/enums";

export type Actor =
  | { kind: "user"; user: { id: string; role: StaffRole; displayName?: string } }
  | { kind: "public_sighting"; sightingKind: SightingKind }
  | { kind: "public_reporter" }
  | { kind: "system" };

export function actorRole(actor: Actor): string {
  switch (actor.kind) {
    case "user":
      return actor.user.role;
    case "public_sighting":
    case "public_reporter":
      return "resident";
    case "system":
      return "system";
  }
}

export function actorUserId(actor: Actor): string | null {
  return actor.kind === "user" ? actor.user.id : null;
}

export interface AppendEventInput {
  caseId: string;
  eventType: EventType;
  actor: Actor;
  fromStatus?: string | null;
  toStatus?: string | null;
  payload?: Record<string, unknown>;
  now?: Date;
}

/**
 * Appends one row to the append-only case_events log with seq = max + 1.
 * The UNIQUE (case_id, seq) index makes two concurrent writers collide instead of interleaving.
 */
export async function appendEvent(tx: DbOrTx, input: AppendEventInput): Promise<CaseEvent> {
  const row = await tx.select({ m: max(caseEvents.seq) }).from(caseEvents).where(eq(caseEvents.caseId, input.caseId)).get();
  const seq = (row?.m ?? 0) + 1;
  const created = await tx
    .insert(caseEvents)
    .values({
      caseId: input.caseId,
      seq,
      eventType: input.eventType,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actorUserId: actorUserId(input.actor),
      actorRole: actorRole(input.actor),
      payloadJson: JSON.stringify(input.payload ?? {}),
      createdAt: (input.now ?? new Date()).toISOString(),
    })
    .returning()
    .get();
  return created;
}
