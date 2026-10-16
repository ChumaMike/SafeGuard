import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { assignments, caseEvents } from "@/server/db/schema";
import { transition, RULES, type Actor } from "@/server/domain/workflow";
import { Problem } from "@/server/domain/errors";
import type { CaseStatus, StaffRole } from "@/lib/contracts/enums";
import {
  ALL_STAFF,
  NOW,
  addAction,
  addRepairAssignment,
  addReview,
  makeCase,
  setupDb,
  user,
  userId,
} from "./helpers";

beforeAll(setupDb);

async function expectProblem(p: Promise<unknown>, status: number, titleMatch?: string | RegExp) {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(Problem);
    const pr = e as Problem;
    expect(pr.status).toBe(status);
    if (titleMatch) expect(pr.title).toMatch(titleMatch);
    return pr;
  }
  throw new Error(`expected a ${status} problem but the transition succeeded`);
}

/** Every row of the table: from, to, allowed roles, how to satisfy the guard, and the guard message. */
interface Row {
  from: CaseStatus;
  to: CaseStatus;
  roles: StaffRole[];
  guardMessage?: string;
  setup?: (caseId: string, actor: Actor) => Promise<Record<string, unknown>>;
}

const ROWS: Row[] = [
  { from: "unassessed", to: "under_review", roles: ["community_worker", "ops_manager"] },
  {
    from: "under_review",
    to: "uncontained",
    roles: ["community_worker", "ops_manager"],
    guardMessage: "Needs: category, severity, owner and due date",
    setup: async (_id, actor) => ({
      patch: {
        hazardCategory: "open_manhole",
        likelihood: 4,
        impact: 5,
        severity: 20,
        ownerUserId: userId(actor),
        dueDate: NOW.toISOString(),
      },
    }),
  },
  {
    from: "under_review",
    to: "dismissed",
    roles: ["ops_manager"],
    guardMessage: "Needs: a reason",
    setup: async () => ({ reason: "Already repaired by the owner" }),
  },
  {
    from: "uncontained",
    to: "protection_recorded",
    roles: ["field_team", "community_worker"],
    guardMessage: "Needs: a description and at least 1 photo",
    setup: async (id, actor) => ({ actionId: (await addAction(id, "protection", actor)).id }),
  },
  {
    from: "protection_recorded",
    to: "protected",
    roles: ["reviewer"],
    guardMessage: "Needs: an approved review (stage = protection)",
    setup: async (id, actor) => ({ reviewId: (await addReview(id, "protection", "approved", actor)).id }),
  },
  {
    from: "protection_recorded",
    to: "under_review",
    roles: ["reviewer"],
    guardMessage: "Needs: a reason for rejecting",
    setup: async () => ({ reason: "Barrier is on the wrong side of the hole" }),
  },
  {
    from: "protected",
    to: "repair_pending",
    roles: ["ops_manager"],
    guardMessage: "Needs: a crew and a due date",
    setup: async (id, actor) => ({ assignmentId: (await addRepairAssignment(id, actor)).id }),
  },
  {
    from: "repair_pending",
    to: "repair_recorded",
    roles: ["field_team"],
    guardMessage: "Needs: a description and at least 1 photo",
    setup: async (id, actor) => ({ actionId: (await addAction(id, "correction", actor)).id }),
  },
  {
    from: "repair_recorded",
    to: "resolved",
    roles: ["reviewer"],
    guardMessage: "Needs: an approved review (stage = closure)",
    setup: async (id, actor) => ({ reviewId: (await addReview(id, "closure", "approved", actor)).id }),
  },
  {
    from: "repair_recorded",
    to: "under_review",
    roles: ["reviewer"],
    guardMessage: "Needs: a reason for rejecting",
    setup: async () => ({ reason: "Cover not seated properly" }),
  },
  {
    from: "resolved",
    to: "under_review",
    roles: ["reviewer", "ops_manager"],
    guardMessage: "Needs: a reopen reason",
    setup: async () => ({ reason: "Cover stolen again" }),
  },
  { from: "protected", to: "uncontained", roles: ["ops_manager", "reviewer"] },
  { from: "repair_pending", to: "uncontained", roles: ["ops_manager", "reviewer"] },
];

describe("transition table coverage", () => {
  it("tests every rule in RULES", () => {
    const keys = Object.keys(RULES).sort();
    const tested = ROWS.map((r) => `${r.from}->${r.to}`).sort();
    expect(tested).toEqual(keys);
    expect(keys).toHaveLength(13);
  });
});

describe.each(ROWS)("$from → $to", (row) => {
  for (const role of row.roles) {
    it(`is allowed for ${role} when the guard is satisfied`, async () => {
      const actor = await user(role);
      const c = await makeCase(row.from, row.from === "protected" ? { protectionVerifiedAt: NOW.toISOString() } : {});
      const payload = row.setup ? await row.setup(c.id, actor) : {};
      const updated = await transition(c.id, row.to, actor, payload, NOW);
      expect(updated.status).toBe(row.to);

      const events = await db.select().from(caseEvents).where(eq(caseEvents.caseId, c.id));
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("status_changed");
      expect(events[0].fromStatus).toBe(row.from);
      expect(events[0].toStatus).toBe(row.to);
      expect(events[0].seq).toBe(1);
      expect(events[0].actorRole).toBe(role);
    });
  }

  for (const role of ALL_STAFF.filter((r) => !row.roles.includes(r))) {
    it(`is forbidden (403) for ${role}`, async () => {
      const actor = await user(role);
      const c = await makeCase(row.from);
      const payload = row.setup ? await row.setup(c.id, await user(row.roles[0])) : {};
      const pr = await expectProblem(transition(c.id, row.to, actor, payload, NOW), 403, /^Only the /);
      for (const allowed of row.roles) {
        expect(pr.title.toLowerCase()).toContain(allowed.replace("_", " "));
      }
      const events = await db.select().from(caseEvents).where(eq(caseEvents.caseId, c.id));
      expect(events).toHaveLength(0);
    });
  }

  if (row.guardMessage) {
    it(`returns 422 "${row.guardMessage}" when the guard is not satisfied`, async () => {
      const actor = await user(row.roles[0]);
      const c = await makeCase(row.from);
      await expectProblem(transition(c.id, row.to, actor, {}, NOW), 422, row.guardMessage);
    });
  }
});

describe("invalid moves", () => {
  it("returns 409 for a pair that is not in the table", async () => {
    const actor = await user("reviewer");
    const c = await makeCase("unassessed");
    await expectProblem(transition(c.id, "resolved", actor, {}, NOW), 409, "Can't move from unassessed to resolved");
  });

  it("returns 404 for an unknown case", async () => {
    const actor = await user("reviewer");
    await expectProblem(transition("nope", "under_review", actor, {}, NOW), 404);
  });
});

describe("403 message names the allowed roles", () => {
  it("says only the reviewer can verify protection", async () => {
    const c = await makeCase("protection_recorded");
    await expectProblem(
      transition(c.id, "protected", await user("field_team"), {}, NOW),
      403,
      "Only the reviewer can verify protection",
    );
  });
});

describe("guards on evidence", () => {
  it("record protection without a photo is rejected with 422", async () => {
    const field = await user("field_team");
    const c = await makeCase("uncontained");
    const a = await addAction(c.id, "protection", field, { withPhoto: false });
    await expectProblem(
      transition(c.id, "protection_recorded", field, { actionId: a.id }, NOW),
      422,
      "Needs: a description and at least 1 photo",
    );
  });

  it("verify protection with a rejected review fails", async () => {
    const reviewer = await user("reviewer");
    const c = await makeCase("protection_recorded");
    const r = await addReview(c.id, "protection", "rejected", reviewer, "no");
    await expectProblem(transition(c.id, "protected", reviewer, { reviewId: r.id }, NOW), 422);
  });

  it("verify closure with a protection-stage review fails", async () => {
    const reviewer = await user("reviewer");
    const c = await makeCase("repair_recorded");
    const r = await addReview(c.id, "protection", "approved", reviewer);
    await expectProblem(transition(c.id, "resolved", reviewer, { reviewId: r.id }, NOW), 422);
  });
});

describe("effects", () => {
  it("verifying protection sets protection_verified_at/by", async () => {
    const reviewer = await user("reviewer");
    const c = await makeCase("protection_recorded");
    const r = await addReview(c.id, "protection", "approved", reviewer);
    const u = await transition(c.id, "protected", reviewer, { reviewId: r.id }, NOW);
    expect(u.protectionVerifiedAt).toBe(NOW.toISOString());
    expect(u.protectionVerifiedBy).toBe(userId(reviewer));
    expect(u.closureVerifiedAt).toBeNull();
  });

  it("verifying closure sets closure_verified_at/by and reinspect_due = +90 days", async () => {
    const reviewer = await user("reviewer");
    const c = await makeCase("repair_recorded", { protectionVerifiedAt: NOW.toISOString() });
    const r = await addReview(c.id, "closure", "approved", reviewer);
    const u = await transition(c.id, "resolved", reviewer, { reviewId: r.id }, NOW);
    expect(u.closureVerifiedAt).toBe(NOW.toISOString());
    expect(u.closureVerifiedBy).toBe(userId(reviewer));
    expect(u.reinspectDue).toBe(new Date(NOW.getTime() + 90 * 24 * 3600 * 1000).toISOString());
    expect(u.protectionVerifiedAt).toBe(NOW.toISOString());
  });

  it("rejecting a repair keeps the protection flags", async () => {
    const reviewer = await user("reviewer");
    const c = await makeCase("repair_recorded", { protectionVerifiedAt: NOW.toISOString() });
    const u = await transition(c.id, "under_review", reviewer, { reason: "not fixed" }, NOW);
    expect(u.protectionVerifiedAt).toBe(NOW.toISOString());
  });
});

describe("barrier gone", () => {
  const sighting: Actor = { kind: "public_sighting", sightingKind: "barrier_gone" };

  it("on a protected case → uncontained, verified fields cleared, clock restarted", async () => {
    const reviewer = await user("reviewer");
    const c = await makeCase("protected", {
      protectionVerifiedAt: "2026-10-10T08:00:00.000Z",
      protectionVerifiedBy: userId(reviewer),
    });
    const u = await transition(c.id, "uncontained", sighting, {}, NOW);
    expect(u.status).toBe("uncontained");
    expect(u.protectionVerifiedAt).toBeNull();
    expect(u.protectionVerifiedBy).toBeNull();
    expect(u.clockStartedAt).toBe(NOW.toISOString());

    const events = await db.select().from(caseEvents).where(eq(caseEvents.caseId, c.id));
    expect(events[0].actorRole).toBe("resident");
    expect(events[0].actorUserId).toBeNull();
    expect(JSON.parse(events[0].payloadJson)).toMatchObject({ sightingKind: "barrier_gone", communityReported: true });
  });

  it("on a repair_pending case supersedes the open repair assignment", async () => {
    const ops = await user("ops_manager");
    const c = await makeCase("repair_pending", { protectionVerifiedAt: "2026-10-10T08:00:00.000Z" });
    const a = await addRepairAssignment(c.id, ops);
    const u = await transition(c.id, "uncontained", sighting, {}, NOW);
    expect(u.status).toBe("uncontained");
    const after = await db.select().from(assignments).where(eq(assignments.id, a.id)).get();
    expect(after?.supersededAt).toBe(NOW.toISOString());
  });

  it("a still_open sighting can never move a case", async () => {
    const c = await makeCase("protected", { protectionVerifiedAt: NOW.toISOString() });
    await expectProblem(
      transition(c.id, "uncontained", { kind: "public_sighting", sightingKind: "still_open" }, {}, NOW),
      403,
    );
  });

  it("a public sighting can never move a case towards safe", async () => {
    const c = await makeCase("uncontained");
    await expectProblem(transition(c.id, "protection_recorded", sighting, {}, NOW), 403);
    const c2 = await makeCase("protection_recorded");
    await expectProblem(transition(c2.id, "protected", sighting, {}, NOW), 403);
  });

  it("barrier_gone on a status that is not protected/repair_pending is a 409", async () => {
    const c = await makeCase("uncontained");
    await expectProblem(transition(c.id, "uncontained", sighting, {}, NOW), 409);
  });
});

describe("event sequence", () => {
  it("increments seq per case across several transitions", async () => {
    const cw = await user("community_worker");
    const c = await makeCase("unassessed");
    await transition(c.id, "under_review", cw, {}, NOW);
    await transition(
      c.id,
      "uncontained",
      cw,
      {
        patch: { severity: 12, likelihood: 3, impact: 4, ownerUserId: userId(cw), dueDate: NOW.toISOString() },
      },
      NOW,
    );
    const events = await db.select().from(caseEvents).where(eq(caseEvents.caseId, c.id)).orderBy(caseEvents.seq);
    expect(events.map((e) => e.seq)).toEqual([1, 2]);
    expect(events.map((e) => e.toStatus)).toEqual(["under_review", "uncontained"]);
  });
});
