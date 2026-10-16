import { describe, expect, it } from "vitest";
import { DAY, HOUR, defaultDueDate, makeSafeDeadlineMs, severityBand, severityFrom } from "@/server/domain/severity";

describe("severity", () => {
  it("multiplies likelihood by impact", () => {
    expect(severityFrom(4, 5)).toBe(20);
    expect(severityFrom(1, 1)).toBe(1);
  });

  it("clamps to 1–5", () => {
    expect(severityFrom(9, 0)).toBe(5);
  });

  it("≥15 → 24 hours, 8–14 → 3 days, ≤7 → 7 days", () => {
    expect(makeSafeDeadlineMs(15)).toBe(24 * HOUR);
    expect(makeSafeDeadlineMs(25)).toBe(24 * HOUR);
    expect(makeSafeDeadlineMs(8)).toBe(3 * DAY);
    expect(makeSafeDeadlineMs(14)).toBe(3 * DAY);
    expect(makeSafeDeadlineMs(7)).toBe(7 * DAY);
    expect(makeSafeDeadlineMs(1)).toBe(7 * DAY);
    expect(severityBand(16)).toBe("critical");
  });

  it("defaultDueDate adds the deadline to now", () => {
    const now = new Date("2026-10-16T10:00:00.000Z");
    expect(defaultDueDate(20, now)).toBe("2026-10-17T10:00:00.000Z");
    expect(defaultDueDate(3, now)).toBe("2026-10-23T10:00:00.000Z");
  });
});
