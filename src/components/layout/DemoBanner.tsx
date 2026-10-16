import { FlaskConical } from "lucide-react";
import { ROLE_LABEL, type StaffRole } from "@/lib/contracts/enums";
import { DemoRoleSwitcher } from "./DemoRoleSwitcher";

interface DemoBannerProps {
  currentRole?: StaffRole;
  displayName?: string;
  demoMode: boolean;
}

/** Shown on every ops screen. Never implies real officials or municipalities used the product. */
export function DemoBanner({ currentRole, displayName, demoMode }: DemoBannerProps) {
  return (
    <div role="note" className="no-print flex flex-wrap items-center justify-between gap-2 bg-brand px-4 py-2 text-sm text-navy">
      <span className="inline-flex items-center gap-2 font-semibold">
        <FlaskConical className="size-4" aria-hidden />
        DEMO · simulated roles · all data fictional
      </span>
      <span className="flex items-center gap-3">
        {currentRole && (
          <span>
            {displayName} · {ROLE_LABEL[currentRole]}
          </span>
        )}
        {demoMode && currentRole && <DemoRoleSwitcher currentRole={currentRole} />}
      </span>
    </div>
  );
}
