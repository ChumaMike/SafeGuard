export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** Severity = likelihood (1–5) × impact (1–5). */
export function severityFrom(likelihood: number, impact: number): number {
  const l = clamp(likelihood);
  const i = clamp(impact);
  return l * i;
}

export type SeverityBand = "critical" | "high" | "low";

export function severityBand(severity: number): SeverityBand {
  if (severity >= 15) return "critical";
  if (severity >= 8) return "high";
  return "low";
}

/** Default make-safe deadline: ≥15 → 24 hours, 8–14 → 3 days, ≤7 → 7 days. */
export function makeSafeDeadlineMs(severity: number): number {
  const band = severityBand(severity);
  if (band === "critical") return 24 * HOUR;
  if (band === "high") return 3 * DAY;
  return 7 * DAY;
}

export function defaultDueDate(severity: number, now: Date = new Date()): string {
  return new Date(now.getTime() + makeSafeDeadlineMs(severity)).toISOString();
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}
