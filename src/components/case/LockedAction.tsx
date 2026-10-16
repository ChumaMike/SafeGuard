import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockedActionProps {
  label: string;
  reason: string;
  className?: string;
}

/**
 * An action the current role cannot take. Shown, not hidden, so the workflow stays legible.
 * This is presentation only: the server action behind it still returns 403.
 */
export function LockedAction({ label, reason, className }: LockedActionProps) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${reason}`}
      className={cn("tap flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-muted-foreground", className)}
    >
      <Lock className="size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <span className="font-medium">{label}</span>
        <span className="block text-xs">{reason}</span>
      </div>
    </div>
  );
}
