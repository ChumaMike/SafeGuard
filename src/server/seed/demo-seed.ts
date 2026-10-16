import { createHash, randomUUID } from "node:crypto";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { db, type Tx } from "@/server/db/client";
import {
  actions,
  assignments,
  caseEvents,
  cases,
  counters,
  evidence,
  locations,
  notifications,
  reviews,
  sessions,
  users,
  type Case,
} from "@/server/db/schema";
import type { HazardCategory, StaffRole } from "@/lib/contracts/enums";
import { HAZARD_LABEL } from "@/lib/contracts/enums";
import { DEMO_ACCOUNTS, demoPassword } from "@/server/auth/demo";
import { hashPassword } from "@/server/auth/password";
import { appendEvent, type Actor } from "@/server/domain/events";
import { setRefCounter } from "@/server/domain/reference";
import { defaultDueDate, severityFrom } from "@/server/domain/severity";
import { transitionIn } from "@/server/domain/workflow";
import { storage } from "@/server/storage";

const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;

export interface SeedSummary {
  users: number;
  cases: number;
  refs: string[];
  seededAt: string;
}

/**
 * Restores the fictional demo data set. Every case history is driven through transitionIn()
 * with back-dated timestamps, so the audit trail is exactly what the real workflow produces.
 * All people, places and references are fictional.
 */
export async function seedDemo(now: Date = new Date()): Promise<SeedSummary> {
  await wipe();

  const password = await hashPassword(demoPassword());
  const staff = {} as Record<StaffRole, Actor & { kind: "user" }>;

  await db.transaction(async (tx) => {
    for (const role of Object.keys(DEMO_ACCOUNTS) as StaffRole[]) {
      const acct = DEMO_ACCOUNTS[role];
      const u = await tx
        .insert(users)
        .values({ email: acct.email, passwordHash: password, displayName: acct.displayName, role })
        .returning()
        .get();
      staff[role] = { kind: "user", user: { id: u.id, role, displayName: u.displayName } };
    }
  });

  const refs: string[] = [];
  const at = (daysAgo: number, hoursAgo = 0) => new Date(now.getTime() - daysAgo * DAY - hoursAgo * HOUR);

  // ---- SG-2026-0003 · resolved (40 days old) --------------------------------------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0003",
      title: "Collapsed manhole cover",
      category: "open_manhole",
      suburb: "Dobsonville",
      landmark: "corner of Elias Motsoaledi Rd",
      street: "Elias Motsoaledi Rd",
      description: "Manhole cover has caved in on the corner. Hole is about half a metre wide, right at the pedestrian crossing.",
      lat: -26.2185,
      lng: 27.8683,
      createdAt: at(40),
    });
    await transitionIn(tx, c.id, "under_review", staff.ops_manager, {}, at(39, 6));
    await triage(tx, c.id, staff.ops_manager, { likelihood: 4, impact: 4, owner: staff.ops_manager }, at(39, 5));
    const prot = await action(tx, c.id, "protection", staff.field_team, "Steel plate placed over the hole, cones and tape around it.", at(38, 4));
    await transitionIn(tx, c.id, "protection_recorded", staff.field_team, { actionId: prot }, at(38, 4));
    await review(tx, c.id, "protection", "approved", staff.reviewer, null, at(38, 2));
    await assign(tx, c.id, staff.ops_manager, "Field Team B", at(37), at(30));
    const rep = await action(tx, c.id, "correction", staff.field_team, "New cast-iron cover fitted and frame re-set in concrete.", at(32, 3));
    await transitionIn(tx, c.id, "repair_recorded", staff.field_team, { actionId: rep }, at(32, 3));
    await review(tx, c.id, "closure", "approved", staff.reviewer, null, at(31, 5));
    refs.push(c.ref);
  });

  // ---- SG-2026-0007 · repair recorded, not verified (30 days) ----------------------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0007",
      title: "Missing stormwater lid",
      category: "open_manhole",
      suburb: "Kliptown",
      landmark: "outside the taxi rank",
      description: "Stormwater drain lid is missing on the pavement outside the taxi rank. Lots of foot traffic in the morning.",
      lat: -26.2831,
      lng: 27.8892,
      createdAt: at(30),
    });
    await transitionIn(tx, c.id, "under_review", staff.community_worker, {}, at(29, 8));
    await triage(tx, c.id, staff.ops_manager, { likelihood: 3, impact: 4, owner: staff.ops_manager }, at(29, 7));
    const prot = await action(tx, c.id, "protection", staff.field_team, "Barricade and danger tape placed around the drain.", at(28, 2));
    await transitionIn(tx, c.id, "protection_recorded", staff.field_team, { actionId: prot }, at(28, 2));
    await review(tx, c.id, "protection", "approved", staff.reviewer, null, at(27, 6));
    await assign(tx, c.id, staff.ops_manager, "Field Team B", at(26), at(19));
    const rep = await action(tx, c.id, "correction", staff.field_team, "Replacement concrete lid fitted.", at(5, 3));
    await transitionIn(tx, c.id, "repair_recorded", staff.field_team, { actionId: rep }, at(5, 3));
    refs.push(c.ref);
  });

  // ---- SG-2026-0009 · repair recorded, not verified (21 days) ----------------------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0009",
      title: "Sewage overflow by footpath",
      category: "sewage_leak",
      suburb: "Eldorado Park",
      landmark: "footpath behind the clinic",
      description: "Sewage is overflowing from a manhole onto the footpath behind the clinic. People step through it to reach the gate.",
      lat: -26.2934,
      lng: 27.9121,
      createdAt: at(21),
    });
    await transitionIn(tx, c.id, "under_review", staff.ops_manager, {}, at(20, 9));
    await triage(tx, c.id, staff.ops_manager, { likelihood: 4, impact: 4, owner: staff.ops_manager }, at(20, 8));
    const prot = await action(tx, c.id, "protection", staff.field_team, "Footpath closed with barriers; temporary walkway marked on the grass.", at(19, 5));
    await transitionIn(tx, c.id, "protection_recorded", staff.field_team, { actionId: prot }, at(19, 5));
    await review(tx, c.id, "protection", "approved", staff.reviewer, null, at(19, 2));
    await assign(tx, c.id, staff.ops_manager, "Field Team B", at(18), at(11));
    const rep = await action(tx, c.id, "correction", staff.field_team, "Blockage cleared downstream, manhole sealed and area disinfected.", at(3, 6));
    await transitionIn(tx, c.id, "repair_recorded", staff.field_team, { actionId: rep }, at(3, 6));
    refs.push(c.ref);
  });

  // ---- SG-2026-0011 · protection recorded, awaiting verification (6 days) -----------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0011",
      title: "Sinkhole on road verge",
      category: "sinkhole",
      suburb: "Roodepoort",
      landmark: "near the bus stop on Main Rd",
      street: "Main Rd",
      description: "Ground has opened up on the verge next to the bus stop. About a metre across and getting bigger after the rain.",
      lat: -26.1625,
      lng: 27.8721,
      createdAt: at(6),
    });
    await transitionIn(tx, c.id, "under_review", staff.community_worker, {}, at(5, 10));
    await triage(tx, c.id, staff.community_worker, { likelihood: 5, impact: 4, owner: staff.community_worker }, at(5, 9));
    const prot = await action(tx, c.id, "protection", staff.field_team, "Fenced off with mesh panels and warning signs on both sides.", at(4, 7));
    await transitionIn(tx, c.id, "protection_recorded", staff.field_team, { actionId: prot }, at(4, 7));
    refs.push(c.ref);
  });

  // ---- SG-2026-0012 · repair pending, Field Team C (4 days) --------------------------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0012",
      title: "Exposed cable at pavement",
      category: "exposed_wires",
      suburb: "Orlando East",
      landmark: "opposite the community hall",
      description: "A thick cable is sticking out of a broken kerb box opposite the community hall. Insulation looks damaged.",
      lat: -26.2472,
      lng: 27.9241,
      createdAt: at(4),
    });
    await transitionIn(tx, c.id, "under_review", staff.ops_manager, {}, at(3, 22));
    await triage(tx, c.id, staff.ops_manager, { likelihood: 3, impact: 3, owner: staff.ops_manager }, at(3, 21));
    const prot = await action(tx, c.id, "protection", staff.field_team, "Cover box placed over the cable, cones and tape around it.", at(3, 2));
    await transitionIn(tx, c.id, "protection_recorded", staff.field_team, { actionId: prot }, at(3, 2));
    await review(tx, c.id, "protection", "approved", staff.reviewer, null, at(2, 20));
    await assign(tx, c.id, staff.ops_manager, "Field Team C", at(2), new Date(now.getTime() + 5 * DAY));
    refs.push(c.ref);
  });

  // ---- SG-2026-0014 · HERO: uncontained, 9 days, near a school -------------------------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0014",
      title: "Open manhole near Kgotso Primary (fictional school)",
      category: "open_manhole",
      suburb: "Freedom Park",
      landmark: "about 400 m from the school gate",
      description: "Open manhole on the path learners use to walk to Kgotso Primary. No cover, no barrier. Water at the bottom after rain.",
      nearSchool: true,
      lat: -26.3031,
      lng: 27.8752,
      createdAt: at(9),
    });
    await transitionIn(tx, c.id, "under_review", staff.community_worker, {}, at(8, 2));
    await triage(tx, c.id, staff.community_worker, { likelihood: 5, impact: 5, owner: staff.community_worker }, at(7));
    for (const daysAgo of [5, 3, 1]) {
      await appendEvent(tx, {
        caseId: c.id,
        eventType: "sighting",
        actor: { kind: "public_sighting", sightingKind: "still_open" },
        now: at(daysAgo, 3),
        payload: { kind: "still_open", idempotencyKey: randomUUID(), communityReported: true },
      });
    }
    await tx.update(cases).set({ interestCount: 3, updatedAt: at(1, 3).toISOString() }).where(eq(cases.id, c.id));
    refs.push(c.ref);
  });

  // ---- SG-2026-0015 · unassessed (20 hours) --------------------------------------------------
  await db.transaction(async (tx) => {
    const c = await createCase(tx, {
      ref: "SG-2026-0015",
      title: "Open manhole on footpath",
      category: "open_manhole",
      suburb: "Meadowlands",
      landmark: "path to the station",
      description: "Manhole with no cover on the footpath people use to get to the station. Hard to see in the dark.",
      lat: -26.2176,
      lng: 27.9003,
      createdAt: at(0, 20),
    });
    refs.push(c.ref);
  });

  await setRefCounter(db, 15);

  return { users: 4, cases: refs.length, refs, seededAt: now.toISOString() };
}

// ------------------------------------------------------------------------------------------

async function wipe() {
  await db.transaction(async (tx) => {
    await tx.delete(caseEvents);
    await tx.delete(evidence);
    await tx.delete(actions);
    await tx.delete(assignments);
    await tx.delete(reviews);
    await tx.delete(notifications);
    await tx.delete(cases);
    await tx.delete(sessions);
    await tx.delete(users);
    await tx.delete(locations);
    await tx.delete(counters);
  });
  const dir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./data/uploads");
  try {
    for (const f of await readdir(dir)) {
      if (f.endsWith(".jpg")) await rm(path.join(dir, f), { force: true });
    }
  } catch {
    /* no upload dir yet */
  }
}

interface CreateCaseInput {
  ref: string;
  title: string;
  category: HazardCategory;
  suburb: string;
  landmark: string;
  street?: string;
  description: string;
  nearSchool?: boolean;
  lat: number;
  lng: number;
  createdAt: Date;
}

async function createCase(tx: Tx, input: CreateCaseInput): Promise<Case> {
  const iso = input.createdAt.toISOString();
  const row = await tx
    .insert(cases)
    .values({
      ref: input.ref,
      sourceType: "public_report",
      hazardCategory: input.category,
      title: input.title,
      description: input.description,
      municipality: "City of Johannesburg",
      suburb: input.suburb,
      street: input.street ?? null,
      landmark: input.landmark,
      lat: input.lat,
      lng: input.lng,
      nearSchool: input.nearSchool ?? false,
      status: "unassessed",
      clockStartedAt: iso,
      createdAt: iso,
      updatedAt: iso,
    })
    .returning()
    .get();
  await appendEvent(tx, {
    caseId: row.id,
    eventType: "created",
    actor: { kind: "public_reporter" },
    toStatus: "unassessed",
    now: input.createdAt,
    payload: { source: "public_report", nearSchool: input.nearSchool ?? false },
  });
  return row;
}

async function triage(
  tx: Tx,
  caseId: string,
  by: Actor & { kind: "user" },
  t: { likelihood: number; impact: number; owner: Actor & { kind: "user" } },
  when: Date,
) {
  const severity = severityFrom(t.likelihood, t.impact);
  const dueDate = defaultDueDate(severity, when);
  await appendEvent(tx, {
    caseId,
    eventType: "assigned",
    actor: by,
    now: when,
    payload: { stage: "protection", ownerId: t.owner.user.id, dueDate, severity },
  });
  return transitionIn(
    tx,
    caseId,
    "uncontained",
    by,
    { patch: { likelihood: t.likelihood, impact: t.impact, severity, ownerUserId: t.owner.user.id, dueDate } },
    when,
  );
}

async function action(
  tx: Tx,
  caseId: string,
  type: "protection" | "correction",
  by: Actor & { kind: "user" },
  description: string,
  when: Date,
): Promise<string> {
  const a = await tx
    .insert(actions)
    .values({ caseId, type, description, performedBy: by.user.id, performedAt: when.toISOString(), createdAt: when.toISOString() })
    .returning()
    .get();
  await seedPhoto(tx, caseId, a.id, by, when, type === "protection" ? "BARRIER · demo photo" : "REPAIR · demo photo");
  await appendEvent(tx, {
    caseId,
    eventType: "action_recorded",
    actor: by,
    now: when,
    payload: { actionId: a.id, type, description, photos: 1 },
  });
  return a.id;
}

async function review(
  tx: Tx,
  caseId: string,
  stage: "protection" | "closure",
  decision: "approved" | "rejected",
  by: Actor & { kind: "user" },
  reason: string | null,
  when: Date,
) {
  const r = await tx
    .insert(reviews)
    .values({ caseId, stage, decision, reason, reviewerId: by.user.id, createdAt: when.toISOString() })
    .returning()
    .get();
  await appendEvent(tx, {
    caseId,
    eventType: "review_recorded",
    actor: by,
    now: when,
    payload: { reviewId: r.id, stage, decision, reason },
  });
  const to = decision === "approved" ? (stage === "protection" ? "protected" : "resolved") : "under_review";
  return transitionIn(tx, caseId, to, by, { reviewId: r.id, reason: reason ?? undefined }, when);
}

async function assign(tx: Tx, caseId: string, by: Actor & { kind: "user" }, crewLabel: string, when: Date, dueDate: Date) {
  const a = await tx
    .insert(assignments)
    .values({
      caseId,
      crewLabel,
      stage: "repair",
      dueDate: dueDate.toISOString(),
      assignedBy: by.user.id,
      createdAt: when.toISOString(),
    })
    .returning()
    .get();
  await appendEvent(tx, {
    caseId,
    eventType: "assigned",
    actor: by,
    now: when,
    payload: { stage: "repair", assignmentId: a.id, crewLabel, dueDate: dueDate.toISOString() },
  });
  return transitionIn(tx, caseId, "repair_pending", by, { assignmentId: a.id }, when);
}

/** A generated placeholder JPEG so every action has real evidence on disk. Clearly labelled as demo. */
async function seedPhoto(tx: Tx, caseId: string, actionId: string, by: Actor & { kind: "user" }, when: Date, label: string) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="100%" height="100%" fill="#2b3440"/>
      <g fill="#F2B630" font-family="sans-serif" text-anchor="middle">
        <text x="600" y="380" font-size="56" font-weight="700">${label}</text>
        <text x="600" y="450" font-size="30">All demo data is fictional</text>
      </g>
      <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#F2B630" stroke-width="12" stroke-dasharray="48 24"/>
    </svg>`,
  );
  const jpeg = await sharp(svg).jpeg({ quality: 70 }).toBuffer();
  const id = randomUUID();
  const key = `${id}.jpg`;
  await storage().put(key, jpeg);
  await tx.insert(evidence).values({
    id,
    caseId,
    actionId,
    storageKey: key,
    mime: "image/jpeg",
    bytes: jpeg.byteLength,
    sha256: createHash("sha256").update(jpeg).digest("hex"),
    caption: "Demo evidence (generated)",
    uploadedBy: by.user.id,
    createdAt: when.toISOString(),
  });
  await appendEvent(tx, {
    caseId,
    eventType: "evidence_added",
    actor: by,
    now: when,
    payload: { evidenceId: id, actionId, bytes: jpeg.byteLength },
  });
}

export async function seedSummary() {
  const rows = await db.select({ ref: cases.ref, status: cases.status, title: cases.title }).from(cases).orderBy(sql`${cases.ref}`);
  return rows;
}

export { HAZARD_LABEL };
