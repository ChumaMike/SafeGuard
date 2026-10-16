import type { CaseStatus, StaffRole } from "@/lib/contracts/labels";

export interface OpsTab {
  key: string;
  label: string;
  description: string;
  /** Statuses shown in this tab. Empty means "link elsewhere". */
  statuses: CaseStatus[];
  href?: string;
  exposedOnly?: boolean;
}

/** Role home tabs. Each tab is a filtered case list, longest-unprotected first. */
export const OPS_TABS: Record<StaffRole, OpsTab[]> = {
  community_worker: [
    {
      key: "nearby",
      label: "Nearby",
      description: "Every open case in the ward, longest unprotected first.",
      statuses: ["unassessed", "under_review", "uncontained", "protection_recorded", "protected", "repair_pending", "repair_recorded"],
    },
    {
      key: "triage",
      label: "Triage",
      description: "New reports that need a category, severity, owner and make-safe deadline.",
      statuses: ["unassessed", "under_review"],
    },
    {
      key: "protect",
      label: "Protect",
      description: "Uncontained hazards: record cones or a barrier with a photo. A reviewer must still verify it.",
      statuses: ["uncontained"],
    },
  ],
  ops_manager: [
    { key: "dashboard", label: "Dashboard", description: "Tiles, exposed queue and ward list.", statuses: [], href: "/dashboard" },
    {
      key: "cases",
      label: "Cases",
      description: "All open cases, longest unprotected first.",
      statuses: ["unassessed", "under_review", "uncontained", "protection_recorded", "protected", "repair_pending", "repair_recorded"],
    },
    {
      key: "assign",
      label: "Assign",
      description: "Protection is verified. These need a repair crew and a due date.",
      statuses: ["protected"],
    },
  ],
  field_team: [
    {
      key: "jobs",
      label: "Jobs",
      description: "Repairs assigned to a crew. Record the work with a photo when done.",
      statuses: ["repair_pending"],
    },
    {
      key: "record",
      label: "Record",
      description: "Uncontained hazards waiting for a barrier. Record what you put up, with a photo.",
      statuses: ["uncontained"],
    },
    {
      key: "history",
      label: "History",
      description: "Work recorded. Amber means a reviewer has not checked it yet.",
      statuses: ["protection_recorded", "repair_recorded", "protected", "resolved"],
    },
  ],
  reviewer: [
    {
      key: "verify",
      label: "To verify",
      description: "Barriers and repairs recorded by field teams. Nothing turns green until you approve it.",
      statuses: ["protection_recorded", "repair_recorded"],
    },
    {
      key: "reviewed",
      label: "Reviewed",
      description: "Cases you have verified, plus anything sent back for review.",
      statuses: ["protected", "repair_pending", "resolved", "under_review"],
    },
  ],
};

export function tabsFor(role: StaffRole): OpsTab[] {
  return OPS_TABS[role];
}
