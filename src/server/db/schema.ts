import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const uuid = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(uuid),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["community_worker", "ops_manager", "field_team", "reviewer"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
  expiresAt: text("expires_at").notNull(),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey().$defaultFn(uuid),
  name: text("name").notNull(),
  municipality: text("municipality").notNull(),
  ward: text("ward"),
  suburb: text("suburb").notNull(),
  street: text("street"),
  landmark: text("landmark"),
  lat: real("lat"),
  lng: real("lng"),
});

export const counters = sqliteTable("counters", {
  name: text("name").primaryKey(),
  value: integer("value").notNull().default(0),
});

export const cases = sqliteTable(
  "cases",
  {
    id: text("id").primaryKey().$defaultFn(uuid),
    ref: text("ref").notNull(),
    sourceType: text("source_type", { enum: ["public_report", "internal_finding", "official_finding"] })
      .notNull()
      .default("public_report"),
    hazardCategory: text("hazard_category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    locationId: text("location_id").references(() => locations.id),
    municipality: text("municipality").notNull(),
    ward: text("ward"),
    suburb: text("suburb").notNull(),
    street: text("street"),
    landmark: text("landmark").notNull(),
    lat: real("lat"),
    lng: real("lng"),
    nearSchool: integer("near_school", { mode: "boolean" }).notNull().default(false),
    anyoneHurt: integer("anyone_hurt", { mode: "boolean" }).notNull().default(false),
    status: text("status", {
      enum: [
        "unassessed",
        "under_review",
        "uncontained",
        "protection_recorded",
        "protected",
        "repair_pending",
        "repair_recorded",
        "resolved",
        "dismissed",
      ],
    })
      .notNull()
      .default("unassessed"),
    likelihood: integer("likelihood"),
    impact: integer("impact"),
    severity: integer("severity"),
    ownerUserId: text("owner_user_id").references(() => users.id),
    dueDate: text("due_date"),
    clockStartedAt: text("clock_started_at").notNull(),
    protectionVerifiedAt: text("protection_verified_at"),
    protectionVerifiedBy: text("protection_verified_by").references(() => users.id),
    closureVerifiedAt: text("closure_verified_at"),
    closureVerifiedBy: text("closure_verified_by").references(() => users.id),
    reinspectDue: text("reinspect_due"),
    duplicateOf: text("duplicate_of"),
    interestCount: integer("interest_count").notNull().default(0),
    idempotencyKey: text("idempotency_key"),
    municipalRef: text("municipal_ref"),
    reporterContact: text("reporter_contact"),
    createdAt: text("created_at").notNull().$defaultFn(nowIso),
    updatedAt: text("updated_at").notNull().$defaultFn(nowIso),
  },
  (t) => [
    uniqueIndex("cases_ref_idx").on(t.ref),
    uniqueIndex("cases_idempotency_idx").on(t.idempotencyKey),
    index("cases_status_idx").on(t.status),
    index("cases_suburb_idx").on(t.suburb),
  ],
);

/** Append-only. Never UPDATE or DELETE rows here. */
export const caseEvents = sqliteTable(
  "case_events",
  {
    id: text("id").primaryKey().$defaultFn(uuid),
    caseId: text("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    eventType: text("event_type", {
      enum: [
        "created",
        "status_changed",
        "assigned",
        "action_recorded",
        "evidence_added",
        "review_recorded",
        "sighting",
        "note",
      ],
    }).notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    actorUserId: text("actor_user_id").references(() => users.id),
    actorRole: text("actor_role").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().$defaultFn(nowIso),
  },
  (t) => [uniqueIndex("case_events_case_seq_idx").on(t.caseId, t.seq)],
);

export const actions = sqliteTable("actions", {
  id: text("id").primaryKey().$defaultFn(uuid),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["protection", "correction"] }).notNull(),
  description: text("description").notNull(),
  performedBy: text("performed_by").references(() => users.id),
  performedAt: text("performed_at").notNull().$defaultFn(nowIso),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey().$defaultFn(uuid),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  actionId: text("action_id").references(() => actions.id),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  sha256: text("sha256").notNull(),
  caption: text("caption"),
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey().$defaultFn(uuid),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  assigneeUserId: text("assignee_user_id").references(() => users.id),
  crewLabel: text("crew_label").notNull(),
  assignedBy: text("assigned_by").references(() => users.id),
  stage: text("stage", { enum: ["protection", "repair"] }).notNull(),
  dueDate: text("due_date").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
  supersededAt: text("superseded_at"),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(uuid),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  stage: text("stage", { enum: ["protection", "closure"] }).notNull(),
  decision: text("decision", { enum: ["approved", "rejected"] }).notNull(),
  reason: text("reason"),
  reviewerId: text("reviewer_id").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(uuid),
  caseId: text("case_id").references(() => cases.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  recipientLabel: text("recipient_label").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(nowIso),
});

export type User = typeof users.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type CaseEvent = typeof caseEvents.$inferSelect;
export type Action = typeof actions.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Location = typeof locations.$inferSelect;
