import type { CaseStatus, HazardCategory } from "@/lib/contracts/enums";
import type { ProtectionTrack, PublicCaseView, PublicStatus, RepairTrack } from "@/lib/contracts/public-view";
import { clockState } from "./clock";

export interface PublicViewSource {
  ref: string;
  hazardCategory: string;
  suburb: string;
  municipality: string;
  status: CaseStatus | string;
  clockStartedAt: string;
  protectionVerifiedAt: string | null;
  closureVerifiedAt: string | null;
  updatedAt: string;
}

const PUBLIC_STATUS: Record<CaseStatus, PublicStatus> = {
  unassessed: "Received",
  under_review: "Being assessed",
  uncontained: "Being assessed",
  protection_recorded: "Being assessed",
  protected: "Protection in place (verified)",
  repair_pending: "Protection in place (verified)",
  repair_recorded: "Protection in place (verified)",
  resolved: "Resolved",
  dismissed: "Closed",
};

export function protectionTrack(c: Pick<PublicViewSource, "status" | "protectionVerifiedAt">): ProtectionTrack {
  if (c.protectionVerifiedAt) return "verified";
  if (c.status === "protection_recorded") return "recorded";
  return "not_yet";
}

export function repairTrack(c: Pick<PublicViewSource, "status" | "closureVerifiedAt">): RepairTrack {
  if (c.closureVerifiedAt) return "verified";
  if (c.status === "repair_recorded") return "recorded";
  if (c.status === "repair_pending") return "assigned";
  return "not_yet";
}

/**
 * Whitelist projection for anonymous residents. Builds a fresh object with exactly these keys:
 * no lat/lng, names, phone numbers, photos or notes can leak through.
 */
export function toPublicView(c: PublicViewSource): PublicCaseView {
  const clock = clockState(c);
  return {
    ref: c.ref,
    hazard_category: c.hazardCategory as HazardCategory,
    suburb: c.suburb,
    municipality: c.municipality,
    public_status: PUBLIC_STATUS[c.status as CaseStatus] ?? "Being assessed",
    protection: protectionTrack(c),
    repair: repairTrack(c),
    clock: { started_at: clock.startedAt, stopped_at: clock.stoppedAt },
    last_update: c.updatedAt,
  };
}
