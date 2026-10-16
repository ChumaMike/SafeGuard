import type { StaffRole } from "@/lib/contracts/enums";

export const isDemoMode = () => (process.env.DEMO_MODE ?? "false").toLowerCase() === "true";

export const demoPassword = () => process.env.DEMO_PASSWORD ?? "safeguard-demo-2026";

/** Fictional demo people. Never real officials. */
export const DEMO_ACCOUNTS: Record<StaffRole, { email: string; displayName: string; blurb: string }> = {
  community_worker: {
    email: "community@demo.safeguard.test",
    displayName: "Thandi M.",
    blurb: "School safety rep",
  },
  ops_manager: {
    email: "ops@demo.safeguard.test",
    displayName: "Sipho K.",
    blurb: "Ward coordinator",
  },
  field_team: {
    email: "field@demo.safeguard.test",
    displayName: "Field Team B",
    blurb: "Maintenance crew",
  },
  reviewer: {
    email: "reviewer@demo.safeguard.test",
    displayName: "L. Naidoo",
    blurb: "Authorised inspector",
  },
};
