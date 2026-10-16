import { describe, expect, it } from "vitest";
import { clockElapsedMs, clockLabel, clockState, formatDuration } from "@/server/domain/clock";

const NOW = new Date("2026-10-16T10:00:00.000Z");
const started = "2026-10-07T06:00:00.000Z"; // 9d 4h before NOW

describe("clock state", () => {
  it("runs from clock_started_at when nothing is verified", () => {
    const s = clockState({ status: "uncontained", clockStartedAt: started, protectionVerifiedAt: null, closureVerifiedAt: null });
    expect(s).toEqual({ startedAt: started, stoppedAt: null, active: true });
    expect(clockLabel(s, NOW)).toBe("Unprotected for 9d 4h");
  });

  it("stops at protection_verified_at", () => {
    const s = clockState({
      status: "protected",
      clockStartedAt: started,
      protectionVerifiedAt: "2026-10-09T09:00:00.000Z",
      closureVerifiedAt: null,
    });
    expect(s.stoppedAt).toBe("2026-10-09T09:00:00.000Z");
    expect(clockLabel(s, NOW)).toBe("Made safe after 2d 3h");
  });

  it("stops at closure_verified_at if that comes first", () => {
    const s = clockState({
      status: "resolved",
      clockStartedAt: started,
      protectionVerifiedAt: "2026-10-12T00:00:00.000Z",
      closureVerifiedAt: "2026-10-10T00:00:00.000Z",
    });
    expect(s.stoppedAt).toBe("2026-10-10T00:00:00.000Z");
  });

  it("restarts when clock_started_at is reset (barrier gone)", () => {
    const s = clockState({ status: "uncontained", clockStartedAt: NOW.toISOString(), protectionVerifiedAt: null, closureVerifiedAt: null });
    expect(clockElapsedMs(s, NOW)).toBe(0);
    expect(clockLabel(s, NOW)).toBe("Unprotected for under a minute");
  });

  it("is inactive for dismissed cases", () => {
    const s = clockState({ status: "dismissed", clockStartedAt: started, protectionVerifiedAt: null, closureVerifiedAt: null });
    expect(s.active).toBe(false);
  });
});

describe("formatDuration", () => {
  it("formats days, hours and minutes", () => {
    expect(formatDuration(9 * 86_400_000 + 4 * 3_600_000)).toBe("9d 4h");
    expect(formatDuration(4 * 3_600_000 + 12 * 60_000)).toBe("4h 12m");
    expect(formatDuration(12 * 60_000)).toBe("12m");
    expect(formatDuration(30_000)).toBe("under a minute");
  });
});
