import * as z from "zod";

export const Role = z.enum(["resident", "community_worker", "ops_manager", "field_team", "reviewer"]);
export type Role = z.infer<typeof Role>;

export const StaffRole = z.enum(["community_worker", "ops_manager", "field_team", "reviewer"]);
export type StaffRole = z.infer<typeof StaffRole>;

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Resident",
  community_worker: "Community worker",
  ops_manager: "Ops manager",
  field_team: "Field team",
  reviewer: "Reviewer",
};

export const CaseStatus = z.enum([
  "unassessed",
  "under_review",
  "uncontained",
  "protection_recorded",
  "protected",
  "repair_pending",
  "repair_recorded",
  "resolved",
  "dismissed",
]);
export type CaseStatus = z.infer<typeof CaseStatus>;

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

export const HazardCategory = z.enum([
  "open_manhole",
  "sinkhole",
  "exposed_wires",
  "sewage_leak",
  "collapsed_pavement",
  "other",
]);
export type HazardCategory = z.infer<typeof HazardCategory>;

export const HAZARD_LABEL: Record<HazardCategory, string> = {
  open_manhole: "Open manhole",
  sinkhole: "Sinkhole",
  exposed_wires: "Exposed wires",
  sewage_leak: "Sewage leak",
  collapsed_pavement: "Collapsed pavement",
  other: "Other hazard",
};

export const SourceType = z.enum(["public_report", "internal_finding", "official_finding"]);
export type SourceType = z.infer<typeof SourceType>;

export const SightingKind = z.enum(["still_open", "barrier_present", "barrier_gone"]);
export type SightingKind = z.infer<typeof SightingKind>;

export const SIGHTING_LABEL: Record<SightingKind, string> = {
  still_open: "Still open",
  barrier_present: "Barrier is there",
  barrier_gone: "Barrier gone",
};

export const ActionType = z.enum(["protection", "correction"]);
export type ActionType = z.infer<typeof ActionType>;

export const ReviewStage = z.enum(["protection", "closure"]);
export type ReviewStage = z.infer<typeof ReviewStage>;

export const Decision = z.enum(["approved", "rejected"]);
export type Decision = z.infer<typeof Decision>;

export const EventType = z.enum([
  "created",
  "status_changed",
  "assigned",
  "action_recorded",
  "evidence_added",
  "review_recorded",
  "sighting",
  "note",
]);
export type EventType = z.infer<typeof EventType>;
