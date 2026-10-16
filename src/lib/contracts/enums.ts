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

// The zod consts above shadow the star re-export for these names; re-export the types explicitly
// so `import type { CaseStatus } from "@/lib/contracts/enums"` keeps working.
export type {
  ActionType,
  CaseStatus,
  Decision,
  EventType,
  HazardCategory,
  ReviewStage,
  Role,
  SightingKind,
  SourceType,
  StaffRole,
} from "./labels";
