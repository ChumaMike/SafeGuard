# 01 — Domain and workflow

## Roles (five)

| Role key | Demo person (fictional) | Can do |
|---|---|---|
| `resident` | Anonymous, no account | Report, track by reference, add sightings, view poster |
| `community_worker` | Thandi M., school safety rep | View cases, triage, record protection |
| `ops_manager` | Sipho K., ward coordinator | View, triage, dismiss, assign repair, reopen, dashboard |
| `field_team` | Field Team B | View, record protection, record repair |
| `reviewer` | L. Naidoo, authorised inspector | View, verify or reject protection and closure, reopen, dashboard |

There is no `facility_staff` role and no checklist feature.

## Statuses

`unassessed | under_review | uncontained | protection_recorded | protected | repair_pending | repair_recorded | resolved | dismissed`

Two independent verified flags live on the case: `protection_verified_at/by` and `closure_verified_at/by`. "Protected" is shown only when the first is set.

## Transition table (the only code path that changes `cases.status`)

| From | To | Roles | Guard (otherwise 422 with this message) |
|---|---|---|---|
| unassessed | under_review | community_worker, ops_manager | none |
| under_review | uncontained | community_worker, ops_manager | "Needs: category, severity, owner and due date" |
| under_review | dismissed | ops_manager | "Needs: a reason" |
| uncontained | protection_recorded | field_team, community_worker | "Needs: a description and at least 1 photo" |
| protection_recorded | protected | reviewer | approved review (stage = protection). Sets `protection_verified_at/by` |
| protection_recorded | under_review | reviewer | "Needs: a reason for rejecting" |
| protected | repair_pending | ops_manager | "Needs: a crew and a due date" |
| repair_pending | repair_recorded | field_team | "Needs: a description and at least 1 photo" |
| repair_recorded | resolved | reviewer | approved review (stage = closure). Sets `closure_verified_at/by`, `reinspect_due = +90 days` |
| repair_recorded | under_review | reviewer | "Needs: a reason for rejecting" |
| resolved | under_review | reviewer, ops_manager | "Needs: a reopen reason" |
| protected | uncontained | public sighting `barrier_gone`, ops_manager, reviewer | none. Clears `protection_verified_at/by`, sets `clock_started_at = now`, supersedes any open repair assignment |
| repair_pending | uncontained | public sighting `barrier_gone`, ops_manager, reviewer | same effects as the row above |

`transition(caseId, to, actor, payload)` in `src/server/domain/workflow.ts` runs inside one Drizzle transaction:

1. Load the case.
2. No rule for (from, to) → **409** "Can't move from X to Y".
3. Actor role not allowed → **403** naming the allowed roles, e.g. "Only the reviewer can verify protection".
4. Guard fails → **422** with the message in the table.
5. Insert a `case_events` row with `seq = max + 1` (UNIQUE `(case_id, seq)`), then update the case.

The actor is either a logged-in user (`{ kind: 'user', user }`) or an anonymous public sighting (`{ kind: 'public_sighting' }`, logged with `actor_role = resident`). Errors use RFC 9457 `application/problem+json`.

## Permissions (`src/server/domain/permissions.ts`, data not code)

| Action | Roles |
|---|---|
| `case.view` | community_worker, ops_manager, field_team, reviewer |
| `case.triage` | community_worker, ops_manager |
| `case.dismiss` | ops_manager |
| `case.assign_repair` | ops_manager |
| `case.record_protection` | community_worker, field_team |
| `case.record_repair` | field_team |
| `case.verify` | reviewer |
| `case.reopen` | reviewer, ops_manager |
| `case.mark_uncontained` | ops_manager, reviewer |
| `dashboard.view` | ops_manager, reviewer |
| `evidence.view` | same as `case.view` |

`can(user, action, case?)` is called server-side everywhere. Hiding a button is never access control.

## Triage severity and make-safe deadline

Severity = likelihood (1–5) × impact (1–5). Default make-safe due date: severity ≥ 15 → 24 hours; 8–14 → 3 days; ≤ 7 → 7 days. The triage form pre-fills this and lets staff edit it.

## Protection clock

- Starts at `clock_started_at`, which equals `created_at`, and is reset whenever a case goes back to `uncontained` from `protected` or `repair_pending`.
- Stops at `protection_verified_at`, or at `closure_verified_at` if that comes first.
- Shown on the dashboard, case cards, case detail and the public track page.
- Running: "Unprotected for 9d 4h" in red. Stopped: "Made safe after 2d 3h" in green. The text updates every 30 seconds without re-rendering the page.
- Copy under the clock: it counts from the first report on SafeGuard SA, not from how old the hazard is.

## Public view (whitelist only)

`toPublicView(case)` returns only: `ref, hazard_category, suburb, municipality, public_status, protection, repair, clock { started_at, stopped_at }, last_update`. No lat/lng, names, phone numbers, photos or notes.

| Internal status | `public_status` |
|---|---|
| unassessed | Received |
| under_review, uncontained, protection_recorded | Being assessed |
| protected, repair_pending, repair_recorded | Protection in place (verified) |
| resolved | Resolved |
| dismissed | Closed |

`protection`: `not_yet` "Not yet" · `recorded` "Barrier recorded, not yet checked" · `verified` "Verified".
`repair`: `not_yet` "Not yet" · `assigned` "Crew assigned" · `recorded` "Repair recorded, not yet checked" · `verified` "Verified".

## Sightings

`POST /api/v1/public/cases/[ref]/sightings` with `{ kind: "still_open" | "barrier_present" | "barrier_gone", idempotencyKey }`. No login. Rate limit 5 per 15 minutes per IP per case. Each sighting adds a `case_events` row of type `sighting`, labelled community-reported, and increments `interest_count`. A sighting can never move a case towards safe. `barrier_gone` on a `protected` or `repair_pending` case runs the transition back to `uncontained`; on any other status it is only logged.

## Intake

- Public report: `POST /api/v1/public/reports` plus a server action. `Idempotency-Key` UUID stored on `cases.idempotency_key`; the same key replays the stored 201. Rate limit 10 per 15 minutes per IP.
- Duplicate check before insert: an open case with the same category within 150 m (haversine, when coordinates exist) or the same suburb (when they don't), created in the last 14 days. Return `possibleDuplicates`. If the resident confirms it is the same one, record a `still_open` sighting on that case instead of creating a new one.
- Reference format `SG-2026-NNNN`, sequential from a counter table. Seed uses fixed refs; live reports continue from SG-2026-0016.
