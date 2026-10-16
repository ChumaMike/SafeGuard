import { describe, expect, it } from "vitest";
import { toPublicView } from "@/server/domain/publicView";
import { PUBLIC_VIEW_KEYS } from "@/lib/contracts/public-view";
import type { CaseStatus } from "@/lib/contracts/enums";

const base = {
  ref: "SG-2026-0014",
  hazardCategory: "open_manhole",
  suburb: "Freedom Park",
  municipality: "City of Johannesburg",
  status: "uncontained" as CaseStatus,
  clockStartedAt: "2026-10-07T06:00:00.000Z",
  protectionVerifiedAt: null,
  closureVerifiedAt: null,
  updatedAt: "2026-10-16T09:00:00.000Z",
  // things that must never leak:
  lat: -26.27,
  lng: 27.86,
  reporterContact: "071 000 0000",
  description: "secret notes",
  ownerUserId: "user-1",
};

describe("toPublicView", () => {
  it("returns exactly the whitelisted keys and nothing else", () => {
    const v = toPublicView(base);
    expect(Object.keys(v).sort()).toEqual([...PUBLIC_VIEW_KEYS].sort());
    expect(JSON.stringify(v)).not.toMatch(/lat|lng|071|secret|user-1/);
    expect(Object.keys(v.clock).sort()).toEqual(["started_at", "stopped_at"]);
  });

  it.each<[CaseStatus, string]>([
    ["unassessed", "Received"],
    ["under_review", "Being assessed"],
    ["uncontained", "Being assessed"],
    ["protection_recorded", "Being assessed"],
    ["protected", "Protection in place (verified)"],
    ["repair_pending", "Protection in place (verified)"],
    ["repair_recorded", "Protection in place (verified)"],
    ["resolved", "Resolved"],
    ["dismissed", "Closed"],
  ])("maps %s → %s", (status, expected) => {
    const verified = ["protected", "repair_pending", "repair_recorded", "resolved"].includes(status)
      ? "2026-10-09T09:00:00.000Z"
      : null;
    expect(toPublicView({ ...base, status, protectionVerifiedAt: verified }).public_status).toBe(expected);
  });

  it("protection track: not_yet → recorded → verified", () => {
    expect(toPublicView(base).protection).toBe("not_yet");
    expect(toPublicView({ ...base, status: "protection_recorded" }).protection).toBe("recorded");
    expect(toPublicView({ ...base, status: "protected", protectionVerifiedAt: "2026-10-09T09:00:00.000Z" }).protection).toBe("verified");
  });

  it("repair track: not_yet → assigned → recorded → verified", () => {
    const p = { ...base, protectionVerifiedAt: "2026-10-09T09:00:00.000Z" };
    expect(toPublicView({ ...p, status: "protected" }).repair).toBe("not_yet");
    expect(toPublicView({ ...p, status: "repair_pending" }).repair).toBe("assigned");
    expect(toPublicView({ ...p, status: "repair_recorded" }).repair).toBe("recorded");
    expect(toPublicView({ ...p, status: "resolved", closureVerifiedAt: "2026-10-15T09:00:00.000Z" }).repair).toBe("verified");
  });

  it("after barrier gone, protection goes back to not_yet", () => {
    expect(toPublicView({ ...base, status: "uncontained", protectionVerifiedAt: null }).protection).toBe("not_yet");
  });

  it("exposes the clock", () => {
    const v = toPublicView({ ...base, status: "protected", protectionVerifiedAt: "2026-10-09T09:00:00.000Z" });
    expect(v.clock).toEqual({ started_at: base.clockStartedAt, stopped_at: "2026-10-09T09:00:00.000Z" });
  });
});
