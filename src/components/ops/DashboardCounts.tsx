"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CircleCheckBig, CircleDashed, Clock3, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardCounts as Counts } from "@/server/services/dashboard";

const TILES: { key: keyof Counts; label: string; tone: string; Icon: typeof Clock3 }[] = [
  { key: "uncontainedOrUnassessed", label: "Uncontained or unassessed", tone: "text-status-red", Icon: AlertTriangle },
  { key: "recordedAwaitingVerification", label: "Recorded, awaiting verification", tone: "text-status-amber", Icon: CircleDashed },
  { key: "protectedVerified", label: "Protected (verified)", tone: "text-status-green", Icon: ShieldCheck },
  { key: "pastMakeSafeDue", label: "Past make-safe due date", tone: "text-status-red", Icon: Clock3 },
  { key: "resolved", label: "Resolved (verified)", tone: "text-status-green", Icon: CircleCheckBig },
  { key: "needRepairCrew", label: "Need a repair crew", tone: "text-foreground", Icon: Users },
];

/** Tiles refresh every 15 seconds from /api/v1/dashboard/counts. */
export function DashboardCounts({ initial }: { initial: Counts }) {
  const [counts, setCounts] = useState(initial);
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/v1/dashboard/counts", { cache: "no-store" });
        if (r.ok) setCounts(await r.json());
      } catch {
        /* keep last known */
      }
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TILES.map((t) => (
          <div key={t.key} className="rounded-xl border bg-card p-4">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <t.Icon className={cn("size-4", t.tone)} aria-hidden /> {t.label}
            </dt>
            <dd className={cn("mt-1 text-3xl font-bold tabular-nums", t.tone)} aria-live="polite">
              {counts[t.key]}
            </dd>
          </div>
        ))}
      </dl>
      {counts.repairsRecordedNotVerified > 0 && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-status-amber/40 bg-status-amber-bg p-3 text-sm font-medium text-status-amber">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          {counts.repairsRecordedNotVerified} repair{counts.repairsRecordedNotVerified === 1 ? "" : "s"} recorded but not verified. Nothing is fixed until the reviewer says so.
        </p>
      )}
    </div>
  );
}
