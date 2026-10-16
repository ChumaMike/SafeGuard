import type { CaseStatus } from "@/lib/contracts/enums";

export interface ClockSource {
  status: CaseStatus | string;
  clockStartedAt: string;
  protectionVerifiedAt: string | null;
  closureVerifiedAt: string | null;
}

export interface ClockState {
  startedAt: string;
  stoppedAt: string | null;
  /** false for dismissed cases: the clock is not shown */
  active: boolean;
}

/**
 * The protection clock starts at clock_started_at (created_at, reset on every return to
 * uncontained) and stops at protection_verified_at, or closure_verified_at if that comes first.
 */
export function clockState(c: ClockSource): ClockState {
  const stoppedAt = earliest(c.protectionVerifiedAt, c.closureVerifiedAt);
  return { startedAt: c.clockStartedAt, stoppedAt, active: c.status !== "dismissed" };
}

export function clockElapsedMs(state: Pick<ClockState, "startedAt" | "stoppedAt">, now: Date = new Date()): number {
  const start = Date.parse(state.startedAt);
  const end = state.stoppedAt ? Date.parse(state.stoppedAt) : now.getTime();
  return Math.max(0, end - start);
}

/** "9d 4h", "4h 12m", "12m", "under a minute". */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "under a minute";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function clockLabel(state: ClockState, now: Date = new Date()): string {
  const d = formatDuration(clockElapsedMs(state, now));
  return state.stoppedAt ? `Made safe after ${d}` : `Unprotected for ${d}`;
}

export const CLOCK_FOOTNOTE = "Counted from the first report on SafeGuard SA, not from how old the hazard is.";

function earliest(a: string | null, b: string | null): string | null {
  if (a && b) return Date.parse(a) <= Date.parse(b) ? a : b;
  return a ?? b ?? null;
}
