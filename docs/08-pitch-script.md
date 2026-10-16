# 08 — Pitch script (four presenters, about 6½ minutes)

Two people present the problem and the product (slides 1–7). Two people run the live demo (slide 8 onward) and close. Every fact below is in the deck's speaker notes with its source. Nothing here claims real officials or municipalities used the product.

**Before you walk on:** `pnpm db:seed` done, `/dashboard` open as Sipho on the laptop, the SG-2026-0014 poster printed and on the judges' table, a phone on the same hotspot already on `/track/SG-2026-0014`, backup video on the desktop. Dark theme off on the projector.

| Time | Who | Slide | What happens |
|---|---|---|---|
| 0:00 | P1 | Cover | Hook |
| 0:20 | P1 | The human cost | Four numbers |
| 1:05 | P1 | The gap | Today vs the UK standard |
| 1:40 | P2 | Doesn't CityMender do this? | Market honesty |
| 2:10 | P2 | Meet SafeGuard SA | The one-slide product |
| 2:45 | P2 | How it works | Six steps and the loop |
| 3:15 | P3 | Live demo (slide stays up) | Report → triage → barrier → verify |
| 4:30 | P4 | Live demo | Assign → repair → verify → barrier gone → dashboard |
| 5:30 | P4 | Trust rules · Numbers · Built | Twenty seconds each |
| 6:30 | P4 | Pilot · Close | The ask, the line |

---

## Presenter 1 — the problem (0:00–1:40)

**Cover.** Stand still. Pause. Then:

> Last October a two-year-old drowned in an open manhole in Khutsong. Residents say they had reported open manholes for months. The report was logged. Nobody was protected. We are SafeGuard SA, and our whole product fits in one sentence: **a report is not protection.**

**The human cost.** Point at each number, one sentence each:

> Two years old: Khutsong, October 2025, after about two million rand had been spent covering manholes. Three months: a sinkhole beside Hlanganani Primary this July, reported months before, cordoned off only after a car nearly went in, less than a year after a six-million-rand repair at the same spot. Fifty percent: what a court held the City of Johannesburg liable for when a pedestrian fell into an uncovered manhole, because the agency had no records of what it had done. Twenty: active sinkholes on one municipal register, twelve of them in Khutsong.

> In every one of these, the hazard was known. Nobody owned the cheap step of making it safe while the repair waited.

**The gap.** Left box first:

> Today a report becomes a ticket and joins a repair queue. On CityMender the average fault takes a hundred and one days to resolve. The roads agency told the court it inspects lids twice a year. In between, people are exposed and nobody is counting.

Right box:

> This is not a new idea. UK highway codes treat a dangerous defect as two jobs with two clocks: make it safe within twenty-four hours, repair it within twenty-eight days. Making a hole safe is cheap and fast. Repairing it is slow. South Africa only tracks the slow one.

Hand over: "So does nothing like this exist here? [P2] checked."

## Presenter 2 — the product (1:40–3:15)

**Doesn't CityMender do this?** Be generous:

> CityMender is good. Reporting, reference numbers, ward routing, community updates: solved. Find and Fix gives you a municipal reference. FixLocal tells you who to shout at. None of them keep a public, verified record of whether a hazard has been *made safe*. That is the only thing we built.

**Meet SafeGuard SA.** Point left, right, down:

> Every hazard has two outcomes, tracked separately. Made safe: cones, a barricade, a plate. Fixed: the permanent repair. Each one goes recorded, then verified, and nothing turns green until an authorised reviewer approves it. Under both sits the protection clock. It starts at the first report, stops only when the barrier is verified, and restarts if a resident reports the barrier is gone. In Joburg, barriers get stolen. Sign-off has to be repeatable.

**How it works.** Fast, as a story:

> A resident reports from a safe distance, with a landmark, not GPS. A community worker triages: likelihood times impact sets a make-safe deadline of twenty-four hours, three days or seven. The field team records the barrier with a photo: *recorded, not yet checked*. The reviewer verifies: clock stops. The coordinator assigns a crew, the crew records the repair, the reviewer verifies again. Resolved, reinspection in ninety days. And the loop in red: "barrier gone" sends a protected case straight back to uncontained. Thirteen allowed moves; the server refuses everything else.

Hand over: "[P3] and [P4] will now run exactly this on a live case. Judges, the poster on your table opens the public page on your own phone."

## Presenter 3 — make it safe (3:15–4:30)

Laptop on `/report`. Phone (or a judge's phone) on the track page via the poster.

1. **Report.** "I am a parent standing across the road." Tap *Open manhole*, *Continue*. Description: "Open manhole on the path to the school, no cover." *Near a school: Yes.* *Anyone hurt: No.* Suburb Freedom Park, landmark "opposite the school gate". *Submit.*
   > Reference SG-2026-0016. Notice the first words: *Received — Not made safe.* Not "logged". Not "in progress".
2. **Track page.** Open `/track/SG-2026-0016` on the phone. "Two tracks, both *Not yet*, and the clock is already running."
3. **Claim and triage.** Banner → *Community worker (Thandi)*. Open the case from *Triage*. *Claim for review.* *Triage and set deadline*: likelihood 5, impact 5. "Twenty-five. Critical. Make safe within twenty-four hours, pre-filled." Submit. Badge: **Uncontained.**
4. **Record the barrier.** Banner → *Field team*. *Record protection*: "Steel plate, cones, tape", add a photo (demo photo on the desktop), submit. Badge: **Barrier recorded.** Point at the phone: "*Barrier recorded, not yet checked.* The clock is still running. Recorded is not verified."
5. **Verify.** Banner → *Reviewer (L. Naidoo)*. *Verify protection* → *Approve* → *Verify protection — stop the clock.* Badge: **Protected (verified).** Hold the phone up: within five seconds it reads *Protection in place (verified)* and *Made safe after …*. "That is the moment nobody else records."

Hand the laptop to P4: "Now we fix it. Then we break it."

## Presenter 4 — fix it, break it, close (4:30–6:45)

6. **Assign.** Banner → *Ops manager (Sipho)*. *Assign repair crew*, keep Field Team B, submit. **Repair pending.** Phone: *Crew assigned.*
7. **Record the repair.** Banner → *Field team*. *Record repair* with a photo. **Repair recorded.** "Still amber. Still not fixed."
8. **Verify closure.** Banner → *Reviewer*. *Verify closure* → *Approve*. **Resolved (verified).** "Reinspection in ninety days. Scroll the history: every step, who did it, newest first. Community sightings labelled as such."
9. **Barrier gone.** On the phone open `/track/SG-2026-0012` (protected, crew assigned). Tap *Barrier gone*.
   > Back to *Being assessed*. Protection: *Not yet*. Clock: *Unprotected for under a minute.* The repair assignment is superseded. A resident cannot mark anything safe, but they can tell us it is not.
10. **Dashboard.** Laptop → *Dashboard*. "Uncontained went up by one. And this strip: two repairs recorded but not verified. Other systems would call those fixed."

**Trust rules (20 s).** "Everything you saw is enforced on the server. We tested every forbidden move: a field team calling the verify action gets a 403. Hiding a button is never access control. The public page shows nine fields and nothing else."

**Numbers (20 s).** "A thirty-day pilot measures five things, starting with median days unprotected. On our fictional data: nine days, four hundred metres from a school. We are not claiming outcomes. We are claiming we can finally measure the thing that matters."

**Built (20 s).** "Thirteen transitions, a hundred and twenty tests, offline on this laptop, posters with a QR. Honest limits: simulated roles, no municipal integration, no SMS yet. The app documents barriers; only the responsible team installs them."

**Pilot (15 s).** "One school in Khutsong or Soweto, thirty days, with the governing body's agreement. Then one willing department or a private asset owner for the responder and verifier roles. The municipality is last, because they need the data first."

**Close.** Slow:

> Other apps tell you a fault was logged. SafeGuard SA shows whether people are protected while it waits to be fixed, and how long they have gone unprotected. Report the danger. Verify the protection. Thank you.

---

## If something breaks

- Role switcher not switching: refresh; the banner reloads the session.
- A form says *Needs: a description and at least 1 photo*: that is the rule working; add the photo.
- Case in a strange state: `POST /api/v1/admin/reset-demo` (or restart with `pnpm db:restore`) and continue from the hero case SG-2026-0014.
- Projector dies: play the backup video; narrate over it with the same script.

## Judge questions to practise

- **Doesn't CityMender do this?** It does civic reporting and community follow-up well. It has no made-safe status, no clock and no named authorised sign-off. We would partner before we would compete.
- **Who installs the barrier?** Only the responsible team. We document, never perform, that work.
- **What if government ignores it?** Schools and ward committees still get an evidence record with timestamps, which is exactly what the city lacked in Yende v CoJ.
- **Why trust residents?** Residents can never mark anything safe. Sightings are labelled, timestamped twice, and only ever move a case *away* from safe.
- **Revenue?** Private asset owners (estates, campuses, business parks) controlling their own manholes are the first paying dashboard. Unvalidated; the pilot tests it.
