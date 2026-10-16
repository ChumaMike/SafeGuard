"use server";

import { revalidatePath } from "next/cache";
import { AssignRepairInput, ReasonInput, RecordActionInput, ReviewInput, TriageInput } from "@/lib/contracts/inputs";
import type { ActionResult } from "@/lib/action-result";
import type { CaseStatus } from "@/lib/contracts/enums";
import { requireUser } from "@/server/auth/session";
import { Problem } from "@/server/domain/errors";
import * as svc from "@/server/services/caseActions";
import { formObject, parse, wrap } from "./_wrap";

export interface CaseActionData {
  id: string;
  ref: string;
  status: CaseStatus;
}

function done(c: { id: string; ref: string; status: CaseStatus }): CaseActionData {
  revalidatePath(`/cases/${c.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/home");
  return { id: c.id, ref: c.ref, status: c.status };
}

export async function claimCase(caseId: string): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => done(await svc.claimCase(await requireUser(), caseId)));
}

export async function triageCase(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const input = parse(TriageInput, formObject(formData));
    return done(await svc.triageCase(await requireUser(), caseId, input));
  });
}

export async function dismissCase(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const { reason } = parse(ReasonInput, formObject(formData));
    return done(await svc.dismissCase(await requireUser(), caseId, reason));
  });
}

export async function recordAction(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const input = parse(RecordActionInput, formObject(formData));
    return done(await svc.recordAction(await requireUser(), caseId, input, formData));
  });
}

export async function reviewCase(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const input = parse(ReviewInput, formObject(formData));
    return done(await svc.reviewCase(await requireUser(), caseId, input));
  });
}

export async function assignRepair(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const input = parse(AssignRepairInput, formObject(formData));
    return done(await svc.assignRepair(await requireUser(), caseId, input));
  });
}

export async function reopenCase(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const { reason } = parse(ReasonInput, formObject(formData));
    return done(await svc.reopenCase(await requireUser(), caseId, reason));
  });
}

export async function markUncontained(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const { reason } = parse(ReasonInput, formObject(formData));
    return done(await svc.markUncontained(await requireUser(), caseId, reason));
  });
}

export async function setMunicipalRef(caseId: string, formData: FormData): Promise<ActionResult<CaseActionData>> {
  return wrap(async () => {
    const value = String(formData.get("municipalRef") ?? "").trim();
    if (value.length < 2) throw new Problem(422, "Needs: a municipal reference");
    return done(await svc.setMunicipalRef(await requireUser(), caseId, value));
  });
}
