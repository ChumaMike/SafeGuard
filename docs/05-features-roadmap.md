# 05 — Features roadmap

## MVP (Phases 1–7)

Scaffold → domain layer with tests → server (auth, actions, routes, uploads, rate limits, seed) → shared UI → public screens → ops screens → demo path and hardening.

## Phase 8 extras, in this order

1. Live timers with severity SLA colours.
2. Simulated notification feed ("SMS to 07x… : your report SG-2026-0016 now shows Barrier recorded, not yet checked").
3. Before/after tiles: median time to verified protection; % of closures with a verified repair.
4. "+90 days" reinspection time-travel button.
5. Keyword category suggestion from the description (rules, not ML), labelled as a suggestion.
6. Offline report outbox (IndexedDB + sync on reconnect).

**Cut order if time runs short:** 6 → 4 → 3. Never cut the verified workflow, the clock or the sightings.

## Explicitly out of scope

Restaurants, retail, hospitals, `facility_staff`, checklists, live municipal integration, emergency dispatch, AI severity scores, "certified safe" wording, maps.
