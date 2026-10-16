import type { StaffRole } from "@/lib/contracts/enums";

export type PermissionAction =
  | "case.view"
  | "case.triage"
  | "case.dismiss"
  | "case.assign_repair"
  | "case.record_protection"
  | "case.record_repair"
  | "case.verify"
  | "case.reopen"
  | "case.mark_uncontained"
  | "dashboard.view"
  | "evidence.view";

const STAFF: StaffRole[] = ["community_worker", "ops_manager", "field_team", "reviewer"];

/** Permissions as data. Checked server-side everywhere; hiding a button is never access control. */
export const CAN: Record<PermissionAction, readonly StaffRole[]> = {
  "case.view": STAFF,
  "case.triage": ["community_worker", "ops_manager"],
  "case.dismiss": ["ops_manager"],
  "case.assign_repair": ["ops_manager"],
  "case.record_protection": ["community_worker", "field_team"],
  "case.record_repair": ["field_team"],
  "case.verify": ["reviewer"],
  "case.reopen": ["reviewer", "ops_manager"],
  "case.mark_uncontained": ["ops_manager", "reviewer"],
  "dashboard.view": ["ops_manager", "reviewer"],
  "evidence.view": STAFF,
};

export interface Principal {
  id: string;
  role: StaffRole;
  displayName?: string;
}

export function can(user: Principal | null | undefined, action: PermissionAction): boolean {
  if (!user) return false;
  return CAN[action].includes(user.role);
}

export function allowedRoles(action: PermissionAction): readonly StaffRole[] {
  return CAN[action];
}
