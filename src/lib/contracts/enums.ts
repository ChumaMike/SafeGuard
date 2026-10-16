import * as z from "zod";
import {
  ACTION_TYPES,
  CASE_STATUSES,
  DECISIONS,
  EVENT_TYPES,
  HAZARD_CATEGORIES,
  REVIEW_STAGES,
  ROLES,
  SIGHTING_KINDS,
  SOURCE_TYPES,
  STAFF_ROLES,
  type ActionType as ActionTypeT,
  type CaseStatus as CaseStatusT,
  type Decision as DecisionT,
  type EventType as EventTypeT,
  type HazardCategory as HazardCategoryT,
  type ReviewStage as ReviewStageT,
  type Role as RoleT,
  type SightingKind as SightingKindT,
  type SourceType as SourceTypeT,
  type StaffRole as StaffRoleT,
} from "./labels";

// Labels, const arrays and the string-literal types live in ./labels (zod-free, client-safe).
export * from "./labels";

export const Role = z.enum(ROLES);
export const StaffRole = z.enum(STAFF_ROLES);
export const CaseStatus = z.enum(CASE_STATUSES);
export const HazardCategory = z.enum(HAZARD_CATEGORIES);
export const SourceType = z.enum(SOURCE_TYPES);
export const SightingKind = z.enum(SIGHTING_KINDS);
export const ActionType = z.enum(ACTION_TYPES);
export const ReviewStage = z.enum(REVIEW_STAGES);
export const Decision = z.enum(DECISIONS);
export const EventType = z.enum(EVENT_TYPES);

// The zod consts above shadow the star re-export for these names, so the string-literal types
// are re-declared here under the same names (value + type merging).
export type Role = RoleT;
export type StaffRole = StaffRoleT;
export type CaseStatus = CaseStatusT;
export type HazardCategory = HazardCategoryT;
export type SourceType = SourceTypeT;
export type SightingKind = SightingKindT;
export type ActionType = ActionTypeT;
export type ReviewStage = ReviewStageT;
export type Decision = DecisionT;
export type EventType = EventTypeT;
