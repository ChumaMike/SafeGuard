# 06 — Demo script

## Seed cases (fictional, fixed references)

| Ref | Title | Suburb · landmark | State |
|---|---|---|---|
| SG-2026-0003 | Collapsed manhole cover | Dobsonville · corner of Elias Motsoaledi Rd | resolved (40 days old) |
| SG-2026-0007 | Missing stormwater lid | Kliptown · outside the taxi rank | repair_recorded, not verified (30 days) |
| SG-2026-0009 | Sewage overflow by footpath | Eldorado Park · footpath behind the clinic | repair_recorded, not verified (21 days) |
| SG-2026-0011 | Sinkhole on road verge | Roodepoort · near the bus stop on Main Rd | protection_recorded (6 days) |
| SG-2026-0012 | Exposed cable at pavement | Orlando East · opposite the community hall | repair_pending, Field Team C (4 days) |
| SG-2026-0014 | Open manhole near Kgotso Primary (fictional school) | Freedom Park · about 400 m from the school gate | **hero**: uncontained, 9 days, 3 still_open sightings, near_school, make-safe due 6 days ago |
| SG-2026-0015 | Open manhole on footpath | Meadowlands · path to the station | unassessed (20 hours) |

Live reports continue from SG-2026-0016. `POST /api/v1/admin/reset-demo` restores this seed (`DEMO_MODE=true` only).

## The 8-step path (on SG-2026-0014 and on a fresh report)

1. Resident reports (`/report`). Reference shown; `/track/[ref]` says Received · Not yet · clock running.
2. Community worker claims and triages (category, likelihood × impact, owner, due date).
3. Field team records a barrier with a photo → "Barrier recorded, not yet checked".
4. Reviewer verifies protection → clock stops, poster and track page flip to Verified.
5. Ops manager assigns the repair (crew + due date).
6. Field team records the repair with a photo.
7. Reviewer verifies closure → Resolved, reinspection due in 90 days.
8. On another protected case, a resident reports "barrier gone" → back to uncontained, clock restarts.

## Pitch beats (about 90 seconds)

Problem (Khutsong) → "a report is not protection" → the live path above → dashboard gap (repairs recorded vs verified) → honest limits (simulated roles, simulated notifications, no municipal integration).

## Before the demo

`pnpm db:seed`, open `/dashboard` as ops manager, print the SG-2026-0014 poster, test the QR with a phone on the same hotspot, record a backup video.

## Presenters

Four people: two present the problem and the product, two run the demo. The timed script, hand-overs and judge questions are in `docs/08-pitch-script.md`. The deck's speaker notes carry the same cues.

## Fallbacks

- `pnpm db:restore` copies the committed `data/demo.db` over the live database (then restart `pnpm dev`).
- `POST /api/v1/admin/reset-demo` re-seeds in place and clears rate limits.
- `pnpm tsx scripts/screenshots.ts` regenerates the deck screenshots from a seeded server.
