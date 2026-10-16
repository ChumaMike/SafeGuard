import { ROLE_LABEL, type StaffRole } from "@/lib/contracts/labels";
import { cn } from "@/lib/utils";

const ROLE_RING: Record<StaffRole, string> = {
  community_worker: "ring-status-amber/60",
  ops_manager: "ring-action/60",
  field_team: "ring-status-neutral/60",
  reviewer: "ring-status-green/70",
};

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N} ]/gu, "").split(" ").filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Who is signed in, visible on every ops screen. */
export function UserPill({ displayName, role, compact }: { displayName: string; role: StaffRole; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border bg-background py-1 pe-3 ps-1 text-sm shadow-sm")}>
      <span
        aria-hidden
        className={cn("flex size-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white ring-2", ROLE_RING[role])}
      >
        {initials(displayName)}
      </span>
      <span className="leading-tight">
        <span className="block font-semibold">{displayName}</span>
        {!compact && <span className="block text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>}
      </span>
    </span>
  );
}
