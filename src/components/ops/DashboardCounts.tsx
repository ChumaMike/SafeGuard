"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CircleCheckBig, CircleDashed, Clock3, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardCounts as Counts } from "@/server/services/dashboard";

type Tone = "red" | "amber" | "green" | "neutral";

const TILES: { key: keyof Counts; label: string; hint: string; tone: Tone; Icon: typeof Clock3 }[] = [
  { key: "uncontainedOrUnassessed", label: "Uncontained or unassessed", hint: "People exposed right now", tone: "red", Icon: AlertTriangle },
  { key: "pastMakeSafeDue", label: "Past make-safe due date", hint: "Deadline missed, still unprotected", tone: "red", Icon: Clock3 },
  { key: "recordedAwaitingVerification", label: "Recorded, awaiting verification", hint: "Barriers and repairs the reviewer must check", tone: "amber", Icon: CircleDashed },
  { key: "protectedVerified", label: "Protected (verified)", hint: "Made safe, repair still open", tone: "green", Icon: ShieldCheck },
  { key: "resolved", label: "Resolved (verified)", hint: "Fixed and checked", tone: "green", Icon: CircleCheckBig },
  { key: "needRepairCrew", label: "Need a repair crew", hint: "Protected, no crew assigned yet", tone: "neutral", Icon: Users },
];

const TONE = {
  red: { bg: "bg-status-red-bg", fg: "text-status-red", ring: "border-status-red/25" },
  amber: { bg: "bg-status-amber-bg", fg: "text-status-amber", ring: "border-status-amber/25" },
  green: { bg: "bg-status-green-bg", fg: "text-status-green", ring: "border-status-green/25" },
  neutral: { bg: "bg-status-neutral-bg", fg: "text-status-neutral", ring: "border-border" },
} as const;

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
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {TILES.map((t) => {
          const tone = TONE[t.tone];
          return (
            <div key={t.key} className={cn("flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm", tone.ring)}>
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone.bg, tone.fg)}>
                <t.Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <dd className={cn("text-3xl font-bold leading-none tabular-nums", tone.fg)} aria-live="polite">
                  {counts[t.key]}
                </dd>
                <dt className="mt-1 text-sm font-medium leading-tight">{t.label}</dt>
                <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{t.hint}</p>
              </div>
            </div>
          );
        })}
      </dl>
      {counts.repairsRecordedNotVerified > 0 && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl border border-status-amber/40 bg-status-amber-bg p-3 text-sm font-medium text-status-amber shadow-sm">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          {counts.repairsRecordedNotVerified} repair{counts.repairsRecordedNotVerified === 1 ? "" : "s"} recorded but not verified. Nothing is fixed until the reviewer says so.
        </p>
      )}
    </div>
  );
}
