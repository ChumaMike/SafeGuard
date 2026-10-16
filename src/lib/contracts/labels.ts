/**
 * Plain constants and display labels, safe for Client Components.
 * No zod here: this file must stay dependency-free so the browser bundle stays small.
 * The zod enums in ./enums.ts are built from these arrays.
 */

export const ROLES = ["resident", "community_worker", "ops_manager", "field_team", "reviewer"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = ["community_worker", "ops_manager", "field_team", "reviewer"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Resident",
  community_worker: "Community worker",
  ops_manager: "Ops manager",
  field_team: "Field team",
  reviewer: "Reviewer",
};

export const CASE_STATUSES = [
  "unassessed",
  "under_review",
  "uncontained",
  "protection_recorded",
  "protected",
  "repair_pending",
  "repair_recorded",
  "resolved",
  "dismissed",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  unassessed: "Unassessed",
  under_review: "Under review",
  uncontained: "Uncontained",
  protection_recorded: "Barrier recorded",
  protected: "Protected (verified)",
  repair_pending: "Repair pending",
  repair_recorded: "Repair recorded",
  resolved: "Resolved (verified)",
  dismissed: "Dismissed",
};

export const HAZARD_CATEGORIES = ["open_manhole", "sinkhole", "exposed_wires", "sewage_leak", "collapsed_pavement", "other"] as const;
export type HazardCategory = (typeof HAZARD_CATEGORIES)[number];

export const HAZARD_LABEL: Record<HazardCategory, string> = {
  open_manhole: "Open manhole",
  sinkhole: "Sinkhole",
  exposed_wires: "Exposed wires",
  sewage_leak: "Sewage leak",
  collapsed_pavement: "Collapsed pavement",
  other: "Other hazard",
};

export const SOURCE_TYPES = ["public_report", "internal_finding", "official_finding"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SIGHTING_KINDS = ["still_open", "barrier_present", "barrier_gone"] as const;
export type SightingKind = (typeof SIGHTING_KINDS)[number];

export const SIGHTING_LABEL: Record<SightingKind, string> = {
  still_open: "Still open",
  barrier_present: "Barrier is there",
  barrier_gone: "Barrier gone",
};

export const ACTION_TYPES = ["protection", "correction"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const REVIEW_STAGES = ["protection", "closure"] as const;
export type ReviewStage = (typeof REVIEW_STAGES)[number];

export const DECISIONS = ["approved", "rejected"] as const;
export type Decision = (typeof DECISIONS)[number];

export const EVENT_TYPES = [
  "created",
  "status_changed",
  "assigned",
  "action_recorded",
  "evidence_added",
  "review_recorded",
  "sighting",
  "note",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
