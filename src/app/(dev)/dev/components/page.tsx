import { notFound } from "next/navigation";
import { CaseCard } from "@/components/case/CaseCard";
import { LockedAction } from "@/components/case/LockedAction";
import { OutcomeTracker } from "@/components/case/OutcomeTracker";
import { ProtectionClock } from "@/components/case/ProtectionClock";
import { StatusBadge } from "@/components/case/StatusBadge";
import { Timeline, type TimelineItem } from "@/components/case/Timeline";
import { PhotoPicker } from "@/components/forms/PhotoPicker";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CASE_STATUSES } from "@/lib/contracts/labels";

export const metadata = { title: "Component showcase" };

const DAY = 24 * 3600 * 1000;
const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

const events: TimelineItem[] = [
  { id: "7", eventType: "status_changed", fromStatus: "protected", toStatus: "uncontained", actorName: null, actorRole: "resident", payload: { sightingKind: "barrier_gone", communityReported: true }, createdAt: iso(1 * 3600_000) },
  { id: "6", eventType: "sighting", fromStatus: null, toStatus: null, actorName: null, actorRole: "resident", payload: { kind: "barrier_gone" }, createdAt: iso(1 * 3600_000) },
  { id: "5", eventType: "review_recorded", fromStatus: null, toStatus: null, actorName: "L. Naidoo", actorRole: "reviewer", payload: { stage: "protection", decision: "approved" }, createdAt: iso(2 * DAY) },
  { id: "4", eventType: "evidence_added", fromStatus: null, toStatus: null, actorName: "Field Team B", actorRole: "field_team", payload: {}, createdAt: iso(3 * DAY) },
  { id: "3", eventType: "action_recorded", fromStatus: null, toStatus: null, actorName: "Field Team B", actorRole: "field_team", payload: { type: "protection", description: "Cones and tape around the hole." }, createdAt: iso(3 * DAY) },
  { id: "2", eventType: "assigned", fromStatus: null, toStatus: null, actorName: "Thandi M.", actorRole: "community_worker", payload: { stage: "protection", dueDate: iso(-1 * DAY), severity: 25 }, createdAt: iso(4 * DAY) },
  { id: "1", eventType: "created", fromStatus: null, toStatus: "unassessed", actorName: null, actorRole: "resident", payload: {}, createdAt: iso(5 * DAY) },
];

export default function ComponentsShowcase() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-dvh">
      <DemoBanner demoMode={false} currentRole="reviewer" displayName="L. Naidoo" />
      <main className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Component showcase (dev only)</h1>
          <ThemeToggle />
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">StatusBadge — every status, icon + word</h2>
          <div className="flex flex-wrap gap-2">
            {CASE_STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="red" label="Uncontained" />
            <StatusBadge tone="amber" label="Recorded" />
            <StatusBadge tone="green" label="Verified" />
            <StatusBadge tone="neutral" label="Community-reported" size="sm" />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">ProtectionClock</h2>
          <ProtectionClock startedAt={iso(9 * DAY + 4 * 3600_000)} size="lg" footnote />
          <ProtectionClock startedAt={iso(5 * DAY)} stoppedAt={iso(3 * DAY - 3 * 3600_000)} size="md" />
          <ProtectionClock startedAt={iso(12 * 60_000)} size="sm" />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">OutcomeTracker — two tracks, independent</h2>
          <OutcomeTracker protection="not_yet" repair="not_yet" clock={{ startedAt: iso(9 * DAY), stoppedAt: null, active: true }} />
          <OutcomeTracker protection="recorded" repair="not_yet" clock={{ startedAt: iso(6 * DAY), stoppedAt: null, active: true }} />
          <OutcomeTracker protection="verified" repair="assigned" clock={{ startedAt: iso(4 * DAY), stoppedAt: iso(3 * DAY), active: true }} />
          <OutcomeTracker protection="verified" repair="recorded" clock={{ startedAt: iso(30 * DAY), stoppedAt: iso(27 * DAY), active: true }} />
          <OutcomeTracker protection="verified" repair="verified" clock={{ startedAt: iso(40 * DAY), stoppedAt: iso(38 * DAY), active: true }} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">CaseCard</h2>
          <CaseCard
            href="#"
            c={{
              id: "x",
              ref: "SG-2026-0014",
              title: "Open manhole near Kgotso Primary (fictional school)",
              hazardCategory: "open_manhole",
              suburb: "Freedom Park",
              landmark: "about 400 m from the school gate",
              status: "uncontained",
              nearSchool: true,
              clockStartedAt: iso(9 * DAY),
              protectionVerifiedAt: null,
              closureVerifiedAt: null,
              dueDate: iso(6 * DAY),
              ownerName: "Thandi M.",
              interestCount: 3,
            }}
          />
          <CaseCard
            href="#"
            c={{
              id: "y",
              ref: "SG-2026-0012",
              title: "Exposed cable at pavement",
              hazardCategory: "exposed_wires",
              suburb: "Orlando East",
              landmark: "opposite the community hall",
              status: "repair_pending",
              nearSchool: false,
              clockStartedAt: iso(4 * DAY),
              protectionVerifiedAt: iso(3 * DAY),
              closureVerifiedAt: null,
              dueDate: iso(-5 * DAY),
            }}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Timeline — newest first</h2>
          <Timeline events={events} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">LockedAction</h2>
          <LockedAction label="Verify protection" reason="Only the reviewer can verify protection" />
          <LockedAction label="Assign repair crew" reason="Only the ops manager can assign a repair crew" />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">PhotoPicker</h2>
          <form onSubmit={undefined}>
            <PhotoPicker required hint="Take the photo from where you stand. Do not go closer to the hazard." />
          </form>
        </section>
      </main>
    </div>
  );
}
