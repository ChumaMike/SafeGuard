"use server";

import { PublicReportInput, SightingInput } from "@/lib/contracts/inputs";
import type { ActionResult } from "@/lib/action-result";
import { toPublicView } from "@/server/domain/publicView";
import type { PublicCaseView } from "@/lib/contracts/public-view";
import { createPublicReport, type DuplicateCandidate } from "@/server/services/cases";
import { recordSighting } from "@/server/services/sightings";
import { formObject, parse, wrap } from "./_wrap";

export type SubmitReportData =
  | { kind: "created"; ref: string; replayed: boolean }
  | { kind: "possible_duplicate"; possibleDuplicates: DuplicateCandidate[] };

export async function submitPublicReport(formData: FormData): Promise<ActionResult<SubmitReportData>> {
  return wrap(async () => {
    const input = parse(PublicReportInput, formObject(formData));
    const result = await createPublicReport(input);
    if (result.kind === "possible_duplicate") return { kind: "possible_duplicate", possibleDuplicates: result.possibleDuplicates };
    return { kind: "created", ref: result.case.ref, replayed: result.replayed };
  });
}

export async function addSighting(
  ref: string,
  kind: string,
  idempotencyKey: string,
): Promise<ActionResult<{ reopened: boolean; replayed: boolean; view: PublicCaseView }>> {
  return wrap(async () => {
    const input = parse(SightingInput, { kind, idempotencyKey });
    const r = await recordSighting(ref, input.kind, input.idempotencyKey);
    return { reopened: r.reopened, replayed: r.replayed, view: toPublicView(r.case) };
  });
}

/** The resident says "yes, that's the same hole": log a still_open sighting on the existing case. */
export async function confirmDuplicateSighting(ref: string, idempotencyKey: string) {
  return addSighting(ref, "still_open", idempotencyKey);
}
