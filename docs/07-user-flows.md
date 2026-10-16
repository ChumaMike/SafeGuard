# 07 — User flows: who does what, on which screen, and what they see

This is the flow spec both tabs build against. It merges the master build prompt (which wins on any conflict) with the team's 3-person plan, concept proposal and visual deck. The thread through every flow: **a report is not protection, and recorded is not verified.**

## The cast (all fictional)

| Role | Person | Logs in? | Home after login |
|---|---|---|---|
| Resident / parent | anonymous | No | `/report`, `/track/[ref]` |
| Community worker | Thandi M., school safety rep | One tap on `/login` | `/home` → Nearby · Triage · Protect |
| Ops manager | Sipho K., ward coordinator | Yes | `/home` → Dashboard · Cases · Assign |
| Field team | Field Team B | Yes | `/home` → Jobs · Record · History |
| Reviewer | L. Naidoo, authorised inspector | Yes | `/home` → To verify · Reviewed |

Every ops screen shows the yellow **DEMO · simulated roles · all data fictional** banner with the role switcher.

---

## Flow 1 — Resident reports a hazard (`/report`)

**Where they are:** standing at a safe distance from an open manhole, on a phone, probably on prepaid data.

1. **Step 1 of 3 — What is dangerous?**
   Category chips: Open manhole · Sinkhole · Exposed wires · Sewage leak · Collapsed pavement · Other.
   Photo is optional. The picker says: *"Take the photo from where you stand. Do not go closer to the hazard."* The phone shrinks the photo to ≤1280 px / ~200 KB and the server strips EXIF and GPS.
   Safe-distance warning is always visible: *"Never approach exposed electricity, open pits, unstable ground or sewer openings."*
2. **Step 2 of 3 — Tell us more.**
   Description (10+ characters). *"Is it near a school, clinic or taxi rank?"* (yes/no → `near_school`). *"Is anyone hurt right now?"* → **yes** shows a red alert: **Call 10177 or 112 now** (tap-to-call). The form still submits.
3. **Step 3 of 3 — Where is it?**
   Municipality, suburb, street (optional), **nearest landmark (required)** — *"opposite the school gate"* beats GPS, because a resident standing at a safe distance is not standing on the hole. Optional *Use my location (approximate)* button (coarse GPS, after a tap, never on load). Optional contact (staff-only, never public). Optional *official municipal reference* if they already have one; the app never invents one.
4. **Duplicate check.** If an open case with the same category exists in the same suburb (or within 150 m) from the last 14 days, the resident sees *"Is it this one?"* with the ref, landmark and distance.
   - **Yes, same hazard** → a `still_open` sighting is logged on that case and they land on its track page. No new case.
   - **No, a different one** → the report is submitted with `confirmNotDuplicate`.
5. **Confirmation.** Big reference `SG-2026-0016` (monospace), **Copy**, **Track this report**, and *What happens next*: a community worker or coordinator reviews it; a field team may record a barrier; **a reviewer must verify** before anything turns green; the clock has started. Also: *"Also report it to your municipality's call centre and keep their reference number — you can add it to this case."*

**Display rule:** the first thing the track page says is *"Received — Not made safe."* Never "logged" or "in progress" as if that meant safe.

---

## Flow 2 — Resident or parent follows the case (`/track/[ref]`)

1. Opens the link from the confirmation, the poster's QR, or types the reference in `/track`.
2. Sees, in this order:
   - Reference and *Open manhole · Freedom Park, City of Johannesburg*.
   - **Public status**: Received · Being assessed · Protection in place (verified) · Resolved · Closed.
   - **Two big lines, never one status:**
     *Interim protection:* Not yet · Barrier recorded, not yet checked · Verified.
     *Repair:* Not yet · Crew assigned · Repair recorded, not yet checked · Verified.
   - **Protection clock**: red *"Unprotected for 9d 4h"* while running; green *"Made safe after 2d 3h"* when a reviewer has verified protection. Footnote: counted from the first report on SafeGuard SA, not from how old the hazard is.
   - Last update time.
3. **Three sighting buttons** (no login): *Still open* · *Barrier is there* · *Barrier gone*, with *"When did you see this?"* (now, or an earlier time). Each is logged on the timeline as **community-reported, not an official inspection**, with observed-at and submitted-at.
   - A sighting can never move a case towards safe.
   - **Barrier gone** on a protected case sends it back to *uncontained*, clears the verified flag and **restarts the clock**. The page updates within 5 seconds.
4. Link to the printable poster. Honest footer: *"SafeGuard SA records and tracks. It does not certify safety or replace municipal or emergency services."*

The page polls `/api/v1/public/cases/[ref]` every 5 seconds, so the live demo moment works: a judge scans the poster, the reviewer taps Verify, the judge's phone turns green.

What the public never sees: photos, names, phone numbers, exact coordinates, internal notes.

---

## Flow 2b — Anyone looks at the map (`/map`)

Every non-dismissed case as a pin, rounded to about 100 m so nobody's home is marked. Red: nobody has verified a barrier. Amber: barrier recorded, not yet checked. Green: made safe or resolved, verified. Bigger pin: near a school. Tap a pin for the reference, landmark, clock and a link to the public page. The list below the map is sorted longest-unprotected first and works offline; the tiles need internet.

## Flow 3 — Community worker claims and triages (`/home` → Triage, `/cases/[id]`)

Thandi (school safety rep) opens *Triage*: unassessed and under-review cases, longest-unprotected first, near-school cases flagged.

1. Opens the case. Header: ref, *Public report*, status badge **Unassessed** (red, inbox icon). Facts: category, landmark, suburb, reported time, municipal ref (*Not recorded* until someone enters one).
2. Taps **Claim for review** → `under_review`.
3. **Triage form**: confirm category; likelihood 1–5 × impact 1–5 → severity shown live (e.g. 5 × 5 = 25, *critical*); owner (herself or Sipho); make-safe deadline pre-filled from severity (≥15 → 24 h, 8–14 → 3 days, ≤7 → 7 days) and editable; optional municipal reference.
4. Submit → **Uncontained**. The timeline shows *Owner and make-safe deadline set*.

She can also **record protection** herself (Flow 5) if she placed cones, but she can never verify.

---

## Flow 4 — Ops manager runs the ward (`/dashboard`, `/home` → Cases, Assign)

Sipho's dashboard tiles: **Uncontained or unassessed** · **Recorded, awaiting verification** · **Protected (verified)** · **Past make-safe due date** · **Resolved** · **Need a repair crew**. A warning strip appears when repairs are recorded but not verified (*"2 repairs recorded, 0 verified — nothing is fixed until the reviewer says so"*).

- **Exposed now** queue: live clocks, near-school flag, longest first.
- **Ward list**: one row per suburb, sorted by days unprotected, near-school count.
- On a case he can: triage, **dismiss** (reason required), **assign a repair crew** (crew + due date; only once protection is verified), **reopen** a resolved case (reason), or **mark uncontained** (reason) when he knows the barrier is gone.
- Locked actions are shown, not hidden: *"Verify protection: only the reviewer."*

---

## Flow 5 — Field team records a barrier, later a repair (`/home` → Jobs, Record)

Field Team B sees *Jobs*: uncontained cases (make-safe work) and repair-pending cases assigned to a crew.

1. On an **uncontained** case: **Record protection** — description (*"Cones, tape and a steel plate over the hole"*) and **at least one photo** (the server rejects the action with *"Needs: a description and at least 1 photo"*).
2. Status → **Barrier recorded** (amber, dashed circle). The case card and track page say *Barrier recorded, not yet checked*. The clock keeps running. **Recorded ≠ verified.**
3. Later, on a **repair_pending** case: **Record repair** with photo → **Repair recorded** (amber). Still not fixed until verified.

Field team cannot triage, assign or verify. Those actions appear locked with the reason.

---

## Flow 6 — Reviewer verifies, or sends it back (`/home` → To verify)

L. Naidoo sees *To verify*: cases in `protection_recorded` and `repair_recorded`.

1. Opens the case. Sees the evidence thumbnails, the field team's description, and the timeline.
2. **Review protection**: *Approve* → **Protected (verified)** (green, filled tick). The **clock stops**: *"Made safe after 2d 3h"*. The poster and track page flip to *Verified*. Or *Reject* with a reason → back to **Under review**; the clock keeps running.
3. **Review closure** (after the crew records the repair): *Approve* → **Resolved (verified)**, reinspection due in 90 days. *Reject* with reason → **Under review**, protection flags stay intact.
4. Can **reopen** a resolved case and **mark uncontained**.

Only the reviewer can verify. Everyone else's Verify button is locked, and the server action returns 403 if called anyway.

---

## Flow 7 — The barrier disappears (public → everyone)

A resident taps **Barrier gone** on a protected case. The case returns to **Uncontained**, `protection_verified_at` is cleared, open repair work is superseded, the clock restarts from now, and the timeline reads *Barrier gone: case back to uncontained — Clock restarted*, labelled community-reported. The dashboard's Uncontained tile goes up by one. This is why sign-off is repeatable, not a one-time tick.

---

## Flow 8 — The poster (`/poster/[ref]`)

Printed A4 for the physical barrier: hazard stripes, **DANGER · OPEN MANHOLE**, landmark, the reference in large monospace, a QR to the track page, and the protection line (*Barrier recorded — NOT yet verified* / *Protection verified* / *Not made safe*). Caption: *"Scan to see the live status or to report that the barrier is gone."*

---

## Display language (use these words, not synonyms)

| Moment | What the UI says |
|---|---|
| First report | Received — Not made safe |
| Community sighting | Still open · community sighting, observed 10:04, submitted 10:08 · not an official inspection |
| Field action | Barrier recorded — awaiting verification |
| Reviewer approves protection | Protection verified by the reviewer — clock stopped |
| Reviewer rejects | Sent back for review — reason shown |
| Crew records repair | Repair recorded, not yet checked |
| Reviewer approves closure | Resolved (verified) — reinspection due in 90 days |
| Barrier gone | Back to uncontained — clock restarted |

Never: "safe", "fixed", "closed" or "complete" without "verified" next to it. Never a municipal reference the staff or resident did not type in.

---

## Ship gates (from the team plan, kept)

1. A hazard can be created and retrieved after refresh.
2. A community sighting appears on the same case with observed-at and submitted-at.
3. A field action cannot set protection verified without a reviewer.
4. An ordinary user cannot call the reviewer action successfully (403).
5. The same scripted demo runs twice without developer intervention.
