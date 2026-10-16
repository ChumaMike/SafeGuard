import * as z from "zod";
import { ActionType, Decision, HazardCategory, ReviewStage, SightingKind, StaffRole } from "./enums";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

/** Lenient boolean for form data ("on", "true", "1", true). */
export const FormBool = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["on", "true", "1", "yes"].includes(v.toLowerCase());
  return false;
}, z.boolean());

const optionalNumber = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

export const PublicReportInput = z.object({
  hazardCategory: HazardCategory,
  description: trimmed(10, 2000),
  municipality: trimmed(2, 120),
  suburb: trimmed(2, 120),
  street: optionalText(160),
  landmark: trimmed(3, 200),
  nearSchool: FormBool.default(false),
  anyoneHurt: FormBool.default(false),
  lat: optionalNumber.pipe(z.number().min(-35).max(-22).optional()),
  lng: optionalNumber.pipe(z.number().min(16).max(33).optional()),
  contact: optionalText(120),
  municipalRef: optionalText(80),
  idempotencyKey: z.uuid().optional(),
  confirmNotDuplicate: FormBool.default(false),
});
export type PublicReportInput = z.infer<typeof PublicReportInput>;

export const SightingInput = z.object({
  kind: SightingKind,
  idempotencyKey: z.uuid(),
  /** When the person saw it. Defaults to submission time. Kept separate from submitted_at. */
  observedAt: z.iso.datetime({ offset: true }).or(z.iso.datetime()).optional(),
});
export type SightingInput = z.infer<typeof SightingInput>;

const rating = z.coerce.number().int().min(1).max(5);

export const TriageInput = z.object({
  hazardCategory: HazardCategory,
  likelihood: rating,
  impact: rating,
  ownerId: trimmed(1, 64),
  dueDate: z.iso.datetime({ offset: true }).or(z.iso.datetime()),
  municipalRef: optionalText(80),
});
export type TriageInput = z.infer<typeof TriageInput>;

export const RecordActionInput = z.object({
  type: ActionType,
  description: trimmed(5, 1000),
});
export type RecordActionInput = z.infer<typeof RecordActionInput>;

export const ReviewInput = z
  .object({
    stage: ReviewStage,
    decision: Decision,
    reason: optionalText(1000),
  })
  .refine((v) => v.decision === "approved" || (v.reason && v.reason.length >= 3), {
    message: "Needs: a reason for rejecting",
    path: ["reason"],
  });
export type ReviewInput = z.infer<typeof ReviewInput>;

export const AssignRepairInput = z.object({
  crewLabel: trimmed(2, 80),
  dueDate: z.iso.datetime({ offset: true }).or(z.iso.datetime()),
});
export type AssignRepairInput = z.infer<typeof AssignRepairInput>;

export const ReasonInput = z.object({ reason: trimmed(3, 1000) });
export type ReasonInput = z.infer<typeof ReasonInput>;

export const LoginInput = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const DemoRoleInput = z.object({ role: StaffRole });
