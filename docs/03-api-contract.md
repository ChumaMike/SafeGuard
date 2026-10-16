# 03 — API contract

## Error shape (everywhere)

RFC 9457, `Content-Type: application/problem+json`:

```json
{ "type": "about:blank", "title": "Needs: a description and at least 1 photo", "status": 422, "detail": "...", "errors": { "field": ["message"] } }
```

Server actions return `{ ok: true, data } | { ok: false, problem }` with the same problem object.

## Server actions (`src/server/actions/*.ts`)

| Action | Who | Notes |
|---|---|---|
| `submitPublicReport(formData)` | resident | Runs the duplicate check unless `confirmNotDuplicate`; honours `idempotencyKey` |
| `confirmDuplicateSighting(ref, idempotencyKey)` | resident | Records a `still_open` sighting instead of a new case |
| `loginAction(formData)`, `logoutAction()` | staff | |
| `demoSwitchRole(role)` | staff, `DEMO_MODE` only | Swaps the session to the seeded account for that role |
| `claimCase(id)` | community_worker, ops_manager | unassessed → under_review |
| `triageCase(id, { hazardCategory, likelihood, impact, ownerId, dueDate })` | community_worker, ops_manager | under_review → uncontained |
| `dismissCase(id, reason)` | ops_manager | |
| `recordAction(id, formData{ type, description, photos[] })` | field_team, community_worker (protection); field_team (repair) | Uploads photos, inserts `actions`, then transitions |
| `reviewCase(id, { stage, decision, reason })` | reviewer | Inserts `reviews`, then transitions |
| `assignRepair(id, { crewLabel, dueDate })` | ops_manager | protected → repair_pending |
| `reopenCase(id, reason)` | reviewer, ops_manager | resolved → under_review |
| `markUncontained(id, reason)` | ops_manager, reviewer | protected/repair_pending → uncontained |

## Route handlers (`src/app/api/v1/…`)

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/v1/public/reports` | anyone, 10 / 15 min / IP | Create a public report (JSON or multipart). `Idempotency-Key` header or body field |
| `GET /api/v1/public/cases/[ref]` | anyone | Public projection; the track page polls every 5 s |
| `POST /api/v1/public/cases/[ref]/sightings` | anyone, 5 / 15 min / IP / case | `{ kind, idempotencyKey }` |
| `GET /api/v1/evidence/[id]` | staff with `evidence.view` | Streams the private file; 403 otherwise |
| `GET /api/v1/dashboard/counts` | ops_manager, reviewer | Live tiles |
| `POST /api/v1/admin/reset-demo` | `DEMO_MODE=true` only | Re-runs the seed and clears rate-limit buckets |

## Services (reads, called from Server Components)

`cases.list(filter, viewer)`, `cases.get(id, viewer)`, `cases.timeline(id)`, `cases.byRef(ref)`, `dashboard.counts()`, `dashboard.exposedQueue()`, `dashboard.wardList()`, `publicCases.byRef(ref)`.

## zod contracts (`src/lib/contracts/`)

`PublicReportInput`, `SightingInput`, `TriageInput`, `RecordActionInput`, `ReviewInput`, `AssignRepairInput`, `ReasonInput`, `LoginInput`, plus the enums `HazardCategory`, `CaseStatus`, `Role`.
