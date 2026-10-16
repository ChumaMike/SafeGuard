import type { HazardCategory } from "./enums";

export type PublicStatus =
  | "Received"
  | "Being assessed"
  | "Protection in place (verified)"
  | "Resolved"
  | "Closed";

export type ProtectionTrack = "not_yet" | "recorded" | "verified";
export type RepairTrack = "not_yet" | "assigned" | "recorded" | "verified";

export const PROTECTION_LABEL: Record<ProtectionTrack, string> = {
  not_yet: "Not yet",
  recorded: "Barrier recorded, not yet checked",
  verified: "Verified",
};

export const REPAIR_LABEL: Record<RepairTrack, string> = {
  not_yet: "Not yet",
  assigned: "Crew assigned",
  recorded: "Repair recorded, not yet checked",
  verified: "Verified",
};

/** Exactly what the public may see. Nothing else. */
export interface PublicCaseView {
  ref: string;
  hazard_category: HazardCategory;
  suburb: string;
  municipality: string;
  public_status: PublicStatus;
  protection: ProtectionTrack;
  repair: RepairTrack;
  clock: { started_at: string; stopped_at: string | null };
  last_update: string;
}

export const PUBLIC_VIEW_KEYS = [
  "ref",
  "hazard_category",
  "suburb",
  "municipality",
  "public_status",
  "protection",
  "repair",
  "clock",
  "last_update",
] as const;
