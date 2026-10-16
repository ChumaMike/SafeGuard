# 09 — Workflow scripts (click by click)

Read these aloud or follow them with the mouse. Each script says who you are, where you click, what the screen must show, and what to say. Who you are is always visible: the pill in the header shows the signed-in person and role, and the yellow banner's dropdown switches person in one tap.

Start every rehearsal with the seed: `pnpm db:seed` (or `POST /api/v1/admin/reset-demo`).

---

## Script A — Resident reports a hazard (no sign-in)

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | Home → **Report a hazard** | Step 1 of 3, category chips, amber "Stay where you are" | "I am a parent across the road from the hole." |
| 2 | **Open manhole** → *(optional)* Take a photo → **Continue** | Step 2 | "The photo is shrunk on the phone and the location data is stripped." |
| 3 | Type a description → **Near a school? Yes** → **Anyone hurt? No** → **Continue** | Step 3 | "If I said yes, it would show 10177 and 112 first." |
| 4 | Suburb `Freedom Park`, landmark `opposite the school gate` → **Submit report** | Either a duplicate card or the confirmation | "A landmark beats GPS: I am not standing on the hole." |
| 5 | If "Is it this one?" appears: **No, it is a different one** (or **Yes, same hazard**) | Confirmation with big `SG-2026-0016` and **Received — Not made safe** | "Not logged. Not in progress. Not made safe." |
| 6 | **Track this report** | Two tracks both *Not yet*, red clock running | "The clock has started." |

## Script B — Community worker triages (Thandi M.)

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | `/login` → **Thandi M.** | My work, tabs Nearby · Triage · Protect; pill says Thandi M. · Community worker | "Thandi is the school safety rep." |
| 2 | **Triage** tab → open `SG-2026-0016` | Status **Unassessed** (red), Actions: Claim for review | |
| 3 | **Claim for review** | Status **Under review** | |
| 4 | **Triage and set deadline** → likelihood 5, impact 5 | "Severity 5 × 5 = 25 · critical · make safe within 24 hours", deadline pre-filled | "Severity sets the deadline. She can edit it." |
| 5 | **Mark uncontained and set deadline** | Status **Uncontained**, history gains "Owner and make-safe deadline set" | "Still exposed. Now someone owns it." |

Locked for Thandi: Verify protection, Assign repair crew, Dismiss. They are shown with the reason, not hidden.

## Script C — Field team records a barrier (Field Team B)

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | Banner dropdown → **Field team** | Same case, pill says Field Team B | |
| 2 | **Record protection** | Amber note: "Recorded is not verified" | |
| 3 | Type `Steel plate over the hole, cones and tape` → **Take a photo** (pick any JPEG) → wait for "1 of 5 photos" | | "No photo, no record. The server refuses it." |
| 4 | **Record barrier — awaiting verification** | Status **Barrier recorded** (amber); clock still red | "Recorded. Not verified. People are still counted as exposed." |

Try it: switch to **Reviewer** later; as Field Team the **Verify protection** action is locked with "only the reviewer".

## Script D — Reviewer verifies protection (L. Naidoo)

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | Banner → **Reviewer** | Pill: L. Naidoo · Reviewer; green **Verify protection** button | "The only person who can turn this green." |
| 2 | **Verify protection** → **Approve — verified** → **Verify protection — stop the clock** | Status **Protected (verified)**; clock turns green "Made safe after …" | Hold up the phone on the track page: it flips within 5 seconds. |

Reject path: **Reject — not acceptable** → reason → back to **Under review**, clock keeps running.

## Script E — Ops manager assigns the repair (Sipho K.)

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | Banner → **Ops manager** | Pill: Sipho K. · Ops manager | "Protection is verified; now the slow part." |
| 2 | **Assign repair crew** → keep Field Team B → **Assign crew — repair pending** | Status **Repair pending**; public page says *Crew assigned* | |

## Script F — Crew records the repair, reviewer closes

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | Banner → **Field team** → **Record repair** → description + photo → **Record repair — awaiting verification** | Status **Repair recorded** (amber) | "Still not fixed." |
| 2 | Banner → **Reviewer** → **Verify closure** → **Approve** → **Verify closure — resolve the case** | Status **Resolved (verified)**; facts show *Reinspect due* in 90 days | "Verified twice: made safe, then fixed." |
| 3 | Scroll **History** | Newest first, every actor and role, community sightings labelled | |

## Script G — Barrier gone (any resident)

| Step | Click | Screen shows | Say |
|---|---|---|---|
| 1 | Phone → `/track/SG-2026-0012` | *Protection in place (verified)*, green clock | "This one was made safe four days ago." |
| 2 | **Barrier gone** | Green notice "back to uncontained and the clock has restarted"; status *Being assessed*; protection *Not yet*; red clock "under a minute" | "Covers get stolen. Sign-off has to be repeatable." |
| 3 | Laptop → **Dashboard** | Uncontained tile up by one; map pin for Orlando East turns red | |

## Script H — Dashboard tour (Sipho K. or L. Naidoo)

1. **Dashboard**: six tiles; the amber strip "2 repairs recorded but not verified". Say: "Other systems would call those fixed."
2. **Where the hazards are**: the map. Red pins are unprotected, bigger pins are near a school. Click the Freedom Park pin → popup → "Open the public page".
3. **Exposed now**: cards with live clocks, longest first.
4. **By suburb**: sorted by days unprotected.

## Switching person

Yellow banner → dropdown → pick a person. The page reloads as them, the pill updates, and the actions you may take change. Anyone else's actions stay visible but locked, with the reason. Calling a locked action directly returns 403 from the server.

## Reset

`POST /api/v1/admin/reset-demo` or `pnpm db:restore` + restart. Both return to the seven seed cases and clear rate limits.
