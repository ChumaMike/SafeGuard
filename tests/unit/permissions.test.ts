import { describe, expect, it } from "vitest";
import { CAN, can } from "@/server/domain/permissions";
import type { StaffRole } from "@/lib/contracts/enums";

const u = (role: StaffRole) => ({ id: "x", role });

describe("permission matrix", () => {
  it("only the reviewer can verify", () => {
    expect(can(u("reviewer"), "case.verify")).toBe(true);
    for (const r of ["community_worker", "ops_manager", "field_team"] as StaffRole[]) {
      expect(can(u(r), "case.verify")).toBe(false);
    }
  });

  it("only ops_manager can dismiss and assign repair", () => {
    expect(CAN["case.dismiss"]).toEqual(["ops_manager"]);
    expect(CAN["case.assign_repair"]).toEqual(["ops_manager"]);
  });

  it("only field_team records repairs; community_worker and field_team record protection", () => {
    expect(CAN["case.record_repair"]).toEqual(["field_team"]);
    expect([...CAN["case.record_protection"]].sort()).toEqual(["community_worker", "field_team"]);
  });

  it("dashboard is for ops_manager and reviewer", () => {
    expect([...CAN["dashboard.view"]].sort()).toEqual(["ops_manager", "reviewer"]);
  });

  it("anonymous users can do nothing", () => {
    expect(can(null, "case.view")).toBe(false);
    expect(can(undefined, "evidence.view")).toBe(false);
  });

  it("has no facility_staff anywhere", () => {
    expect(JSON.stringify(CAN)).not.toContain("facility_staff");
  });
});
