# 02 — Data model (Drizzle, SQLite)

All tables in `src/server/db/schema.ts`. Timestamps are ISO-8601 text (UTC). Booleans are integers 0/1.

| Table | Key columns |
|---|---|
| `users` | id, email UNIQUE, password_hash, display_name, role (`community_worker`/`ops_manager`/`field_team`/`reviewer`), active |
| `sessions` | token_hash PK, user_id FK, created_at, expires_at |
| `locations` | id, name, municipality, ward, suburb, street, landmark, lat NULL, lng NULL |
| `counters` | name PK (`case_ref`), value |
| `cases` | id, **ref** UNIQUE (`SG-2026-NNNN`), source_type (`public_report` only in the MVP), hazard_category, title, description, location_id FK, lat NULL, lng NULL, **landmark** (required on public reports), **near_school** (bool), status, likelihood NULL, impact NULL, severity NULL, owner_user_id NULL, due_date NULL, **clock_started_at**, protection_verified_at/by, closure_verified_at/by, reinspect_due NULL, duplicate_of NULL, interest_count, idempotency_key UNIQUE NULL, **municipal_ref** NULL (official reference, entered by staff or resident, never invented), reporter_contact NULL (staff-only), anyone_hurt (bool), created_at, updated_at |
| `case_events` (append-only, never UPDATE/DELETE) | id, case_id, seq (UNIQUE with case_id), event_type (`created`/`status_changed`/`assigned`/`action_recorded`/`evidence_added`/`review_recorded`/`sighting`/`note`), from_status, to_status, actor_user_id NULL, actor_role, payload_json, created_at |
| `actions` | id, case_id, type (`protection`/`correction`), description, performed_by, performed_at, created_at |
| `evidence` | id (UUID = filename), case_id, action_id NULL, storage_key, mime, bytes, sha256, caption, uploaded_by NULL, created_at |
| `assignments` | id, case_id, assignee_user_id NULL, crew_label, assigned_by, stage (`protection`/`repair`), due_date, created_at, superseded_at NULL |
| `reviews` | id, case_id, stage (`protection`/`closure`), decision (`approved`/`rejected`), reason, reviewer_id, created_at |
| `notifications` (simulated feed, Phase 8) | id, case_id, channel, recipient_label, body, created_at |

Removed from the original plan: `checklist_templates`, `checklist_items`, `checklist_responses`, `checklist_answers`.

## Derived values

- **Dashboard counts** (`services/dashboard.ts`): uncontained-or-unassessed; recorded awaiting verification (`protection_recorded` + `repair_recorded`); protected (verified) (`protected` + `repair_pending` + `repair_recorded`); past make-safe due date (`due_date < now`, `protection_verified_at IS NULL`, active); resolved; need a repair crew (`protected`); repairs recorded but not verified (`repair_recorded`).
- **Clock** (`domain/clock.ts`): `clockState(case)` → `{ startedAt, stoppedAt | null }`; `stoppedAt = protection_verified_at ?? closure_verified_at`.
- **Public view** (`domain/publicView.ts`): see `01`.
