import { beforeAll, describe, expect, it } from "vitest";
import type { SessionUser } from "@/server/auth/session";
import { Problem } from "@/server/domain/errors";
import * as svc from "@/server/services/caseActions";
import { makeCase, setupDb, user, userId } from "./helpers";

beforeAll(setupDb);

async function session(role: SessionUser["role"]): Promise<SessionUser> {
  const actor = await user(role);
  return { id: userId(actor), role, email: `${role}@test.local`, displayName: role };
}

async function expect403(p: Promise<unknown>) {
  await expect(p).rejects.toBeInstanceOf(Problem);
  await expect(p).rejects.toMatchObject({ status: 403 });
}

describe("service-layer permission gates (what the server actions call)", () => {
  it("field_team calling reviewCase directly gets 403 before anything is written", async () => {
    const c = await makeCase("protection_recorded");
    await expect403(svc.reviewCase(await session("field_team"), c.id, { stage: "protection", decision: "approved", reason: undefined }));
  });

  it("community_worker cannot assign a repair crew", async () => {
    const c = await makeCase("protected", { protectionVerifiedAt: new Date().toISOString() });
    await expect403(svc.assignRepair(await session("community_worker"), c.id, { crewLabel: "Field Team B", dueDate: new Date().toISOString() }));
  });

  it("reviewer cannot dismiss", async () => {
    const c = await makeCase("under_review");
    await expect403(svc.dismissCase(await session("reviewer"), c.id, "no"));
  });

  it("field_team cannot triage", async () => {
    const c = await makeCase("under_review");
    const ops = await session("ops_manager");
    await expect403(
      svc.triageCase(await session("field_team"), c.id, {
        hazardCategory: "open_manhole",
        likelihood: 5,
        impact: 5,
        ownerId: ops.id,
        dueDate: new Date().toISOString(),
        municipalRef: undefined,
      }),
    );
  });

  it("reviewer approving protection stops the clock", async () => {
    const reviewer = await session("reviewer");
    const c = await makeCase("protection_recorded");
    const u = await svc.reviewCase(reviewer, c.id, { stage: "protection", decision: "approved", reason: undefined });
    expect(u.status).toBe("protected");
    expect(u.protectionVerifiedAt).not.toBeNull();
    expect(u.protectionVerifiedBy).toBe(reviewer.id);
  });

  it("reviewer rejecting sends the case back to review with the reason", async () => {
    const reviewer = await session("reviewer");
    const c = await makeCase("repair_recorded", { protectionVerifiedAt: new Date().toISOString() });
    const u = await svc.reviewCase(reviewer, c.id, { stage: "closure", decision: "rejected", reason: "Cover is loose" });
    expect(u.status).toBe("under_review");
    expect(u.protectionVerifiedAt).not.toBeNull();
  });

  it("recordAction without a photo returns 422 and writes nothing", async () => {
    const field = await session("field_team");
    const c = await makeCase("uncontained");
    const fd = new FormData();
    await expect(svc.recordAction(field, c.id, { type: "protection", description: "Cones placed" }, fd)).rejects.toMatchObject({
      status: 422,
      title: "Needs: a description and at least 1 photo",
    });
  });
});
