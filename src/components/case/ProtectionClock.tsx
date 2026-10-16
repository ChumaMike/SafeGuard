"use client";

import { useEffect, useState } from "react";
import { Clock3, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOCK_FOOTNOTE, clockLabel, type ClockState } from "@/lib/clock";

interface ProtectionClockProps extends Partial<ClockState> {
  startedAt: string;
  stoppedAt?: string | null;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  /** Show the "counted from the first report" footnote. */
  footnote?: boolean;
  className?: string;
}

/**
 * Running: "Unprotected for 9d 4h" in red. Stopped: "Made safe after 2d 3h" in green.
 * The text re-renders every 30 seconds without touching the rest of the page.
 */
export function ProtectionClock({ startedAt, stoppedAt = null, active = true, size = "md", footnote, className }: ProtectionClockProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const running = active && !stoppedAt;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [running]);

  if (!active) return null;

  const label = clockLabel({ startedAt, stoppedAt }, now);
  const Icon = running ? Clock3 : ShieldCheck;
  const sizeClass = size === "sm" ? "text-sm gap-1.5" : size === "lg" ? "text-2xl gap-2.5 font-bold" : "text-base gap-2 font-semibold";
  const iconClass = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5";

  return (
    <div className={cn("flex flex-col", className)}>
      <span
        role="status"
        aria-live="polite"
        data-running={running}
        className={cn("inline-flex items-center", sizeClass, running ? "text-status-red" : "text-status-green")}
      >
        <Icon className={cn(iconClass, "shrink-0")} aria-hidden />
        <span suppressHydrationWarning>{label}</span>
      </span>
      {footnote && <span className="mt-1 text-xs text-muted-foreground">{CLOCK_FOOTNOTE}</span>}
    </div>
  );
}
