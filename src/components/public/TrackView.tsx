"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, MapPin, Printer, ShieldOff, ShieldCheck, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HAZARD_LABEL, SIGHTING_LABEL, type SightingKind } from "@/lib/contracts/labels";
import type { PublicCaseView } from "@/lib/contracts/public-view";
import { formatDateTime } from "@/lib/format";
import { addSighting } from "@/server/actions/public";
import { OutcomeTracker } from "@/components/case/OutcomeTracker";
import { StatusBadge, type Tone } from "@/components/case/StatusBadge";

const POLL_MS = 5_000;

function statusTone(v: PublicCaseView): Tone {
  if (v.public_status === "Resolved" || v.public_status === "Protection in place (verified)") return "green";
  if (v.public_status === "Closed") return "neutral";
  return v.protection === "recorded" ? "amber" : "red";
}

export function TrackView({ initial }: { initial: PublicCaseView }) {
  const [view, setView] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [observed, setObserved] = useState<"now" | "earlier">("now");
  const [observedAt, setObservedAt] = useState<string>("");
  const [pending, start] = useTransition();

  // Poll the public route every 5 seconds while the tab is visible, so a reviewer's verification
  // shows up on a judge's phone without a refresh.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/v1/public/cases/${encodeURIComponent(view.ref)}`, { cache: "no-store" });
        if (r.ok) setView(await r.json());
      } catch {
        /* offline: keep showing the last known state */
      }
    };
    timer = setInterval(tick, POLL_MS);
    return () => clearInterval(timer);
  }, [view.ref]);

  function sight(kind: SightingKind) {
    setNotice(null);
    const iso = observed === "earlier" && observedAt ? new Date(observedAt).toISOString() : undefined;
    start(async () => {
      const r = await addSighting(view.ref, kind, crypto.randomUUID(), iso);
      if (!r.ok) return setNotice(r.problem.title);
      setView(r.data.view);
      setNotice(
        r.data.reopened
          ? "Thank you. The case is back to uncontained and the clock has restarted. This is logged as a community sighting, not an official inspection."
          : "Thank you. Logged as a community sighting (not an official inspection). It does not change the verified status.",
      );
    });
  }

  const active = view.public_status !== "Closed";
  const clock = { startedAt: view.clock.started_at, stoppedAt: view.clock.stopped_at, active };

  return (
    <article className="flex flex-col gap-5" aria-live="polite">
      <header className="flex flex-col gap-2">
        <p className="ref text-3xl font-bold">{view.ref}</p>
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {HAZARD_LABEL[view.hazard_category] ?? view.hazard_category} · {view.suburb}, {view.municipality}
        </p>
        <div>
          <StatusBadge
            tone={statusTone(view)}
            label={view.public_status}
            Icon={statusTone(view) === "green" ? ShieldCheck : statusTone(view) === "amber" ? Clock3 : ShieldOff}
            size="lg"
            live
          />
        </div>
      </header>

      <OutcomeTracker protection={view.protection} repair={view.repair} clock={clock} />

      <p className="text-sm text-muted-foreground">
        Last update <time dateTime={view.last_update}>{formatDateTime(view.last_update)}</time>
      </p>

      {active && (
        <section aria-labelledby="sightings" className="rounded-xl border bg-card p-4">
          <h2 id="sightings" className="flex items-center gap-2 font-bold">
            <Eye className="size-5" aria-hidden /> Have you seen it? Tell us.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Community sightings are shown on the case history as community-reported. They are not an official inspection and can never mark a hazard safe.
          </p>
          <fieldset className="mt-3">
            <legend className="text-sm font-medium">When did you see this?</legend>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <label className={cn("tap flex cursor-pointer items-center rounded-lg border px-3 text-sm", observed === "now" && "border-primary ring-2 ring-primary")}>
                <input type="radio" name="observed" className="sr-only" checked={observed === "now"} onChange={() => setObserved("now")} /> Just now
              </label>
              <label className={cn("tap flex cursor-pointer items-center rounded-lg border px-3 text-sm", observed === "earlier" && "border-primary ring-2 ring-primary")}>
                <input type="radio" name="observed" className="sr-only" checked={observed === "earlier"} onChange={() => setObserved("earlier")} /> Earlier
              </label>
              {observed === "earlier" && (
                <input type="datetime-local" aria-label="Time you saw it" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} className="tap rounded-lg border bg-background px-2 text-sm" />
              )}
            </div>
          </fieldset>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(["still_open", "barrier_present", "barrier_gone"] as SightingKind[]).map((k) => (
              <button
                key={k}
                type="button"
                disabled={pending}
                onClick={() => sight(k)}
                className={cn(
                  "tap rounded-xl border px-3 py-3 font-semibold hover:bg-accent disabled:opacity-60",
                  k === "barrier_gone" && "border-status-red/50 text-status-red",
                  k === "barrier_present" && "border-status-amber/50 text-status-amber",
                )}
              >
                {SIGHTING_LABEL[k]}
              </button>
            ))}
          </div>
          {notice && (
            <p role="status" className="mt-3 rounded-lg bg-status-green-bg p-3 text-sm text-status-green">
              {notice}
            </p>
          )}
        </section>
      )}

      <p>
        <Link href={`/poster/${view.ref}`} className="tap inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-medium hover:bg-accent">
          <Printer className="size-5" aria-hidden /> Printable poster for the site
        </Link>
      </p>

      <footer className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What this page can and cannot tell you</p>
        <p className="mt-1">
          "Recorded" means someone wrote it down. "Verified" means an authorised reviewer checked it. The clock counts from the first report on SafeGuard SA. SafeGuard SA
          records and tracks; it does not certify safety or replace municipal or emergency services.
        </p>
      </footer>
    </article>
  );
}
