# 04 — Frontend guide

## Public screens (no login, 18px base text, under 300 KB per page)

1. `/report` — 3 steps. (1) Photo, optional, taken from where you stand, category chips, safe-distance warning. (2) Description, "near a school, clinic or taxi rank?", "anyone hurt?" → shows "Call 10177 or 112 now". (3) Municipality, suburb, street, nearest landmark, optional coarse GPS after a tap. Then the duplicate check, then a confirmation with a big reference, Copy, Track, and what happens next.
2. `/track/[ref]` — lookup box, category and suburb, public status, two big lines (Interim protection, Repair), the protection clock, last update, three sighting buttons, poster link, honest footer. Polls `/api/v1/public/cases/[ref]` every 5 s.
3. `/poster/[ref]` — printable A4 with hazard stripes, category, landmark, QR code to the track page, the reference and the protection line. Print stylesheet.
4. `/safety` — emergency numbers (10177, 112), how to report safely, what the app does and doesn't do, privacy.

## Ops screens (login required; the guard redirects to `/login`)

5. `/login` with the demo role switcher.
6. `/home` role tabs. Community worker: Nearby, Triage, Protect. Ops manager: Dashboard, Cases, Assign. Field team: Jobs, Record, History. Reviewer: To verify, Reviewed. Each tab is a filtered case list, longest-unprotected first.
7. `/dashboard` — tiles: Uncontained or unassessed · Recorded awaiting verification · Protected (verified) · Past make-safe due date · Resolved · Need a repair crew. Warning when repairs are recorded but not verified. "Exposed now" queue with live clocks. Ward list sorted by days unprotected, near-school flagged.
8. `/cases/[id]` — header (ref, source, status badge), facts list incl. `municipal_ref`, two-outcome tracker with the clock, role-gated actions, evidence thumbnails, vertical timeline (newest first, `aria-current="step"` on the latest). Actions the role can't take are shown locked with the reason ("Verify protection: only the reviewer"). Forms: triage, record protection or repair (≥1 photo), review (approve / reject with reason), assign repair, dismiss or reopen with a reason.

## Shared components (`src/components/case`, `forms`, `layout`)

`StatusBadge`, `OutcomeTracker`, `ProtectionClock`, `Timeline`, `CaseCard`, `PhotoPicker`, `LockedAction`, `DemoBanner`. Fixture showcase at `/dev/components`.

## Design tokens (`src/app/globals.css`)

- Navy `#14202E`, brand amber `#F2B630`, action blue `#2459C9`.
- Status: red `#B42323` (uncontained), amber `#8F5600` (recorded), green `#1B6E45` (verified), each with a tinted background. Every status has an icon and a word, never colour alone.
- 44px tap targets, sticky bottom submit on mobile, `prefers-reduced-motion` respected, light and dark themes, system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`), `ui-monospace` for reference numbers.

## Accessibility

`role="status"` on badges that change, `role="alert"` for the running clock on uncontained cases, `aria-current="step"` on the newest timeline item, labels + `aria-describedby` for errors, `<h1 tabindex="-1">` focus after client navigation.
