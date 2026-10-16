import { Circle, CircleCheckBig, CircleDashed, ShieldCheck, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROTECTION_LABEL, REPAIR_LABEL, type ProtectionTrack, type RepairTrack } from "@/lib/contracts/public-view";
import type { ClockState } from "@/lib/clock";
import { ProtectionClock } from "./ProtectionClock";
import { TONE_TEXT, type Tone } from "./StatusBadge";

type Step = { key: string; label: string; state: "done" | "current" | "todo"; tone: Tone };

function protectionSteps(track: ProtectionTrack): Step[] {
  const order: ProtectionTrack[] = ["not_yet", "recorded", "verified"];
  const idx = order.indexOf(track);
  return [
    { key: "reported", label: "Reported", state: "done", tone: "neutral" },
    { key: "recorded", label: "Barrier recorded", state: idx >= 1 ? (idx === 1 ? "current" : "done") : "todo", tone: "amber" },
    { key: "verified", label: "Verified safe", state: idx >= 2 ? "current" : "todo", tone: "green" },
  ];
}

function repairSteps(track: RepairTrack): Step[] {
  const order: RepairTrack[] = ["not_yet", "assigned", "recorded", "verified"];
  const idx = order.indexOf(track);
  return [
    { key: "assigned", label: "Crew assigned", state: idx >= 1 ? (idx === 1 ? "current" : "done") : "todo", tone: "neutral" },
    { key: "recorded", label: "Repair recorded", state: idx >= 2 ? (idx === 2 ? "current" : "done") : "todo", tone: "amber" },
    { key: "verified", label: "Verified fixed", state: idx >= 3 ? "current" : "todo", tone: "green" },
  ];
}

function StepIcon({ step }: { step: Step }) {
  const cls = cn("size-6 shrink-0", step.state === "todo" ? "text-muted-foreground/60" : TONE_TEXT[step.tone]);
  if (step.state === "done" || (step.state === "current" && step.tone === "green")) return <CircleCheckBig className={cls} aria-hidden />;
  if (step.state === "current") return <CircleDashed className={cls} aria-hidden />;
  return <Circle className={cls} aria-hidden />;
}

function Track({ title, Icon, steps, headline, tone }: { title: string; Icon: typeof ShieldCheck; steps: Step[]; headline: string; tone: Tone }) {
  return (
    <section aria-label={title} className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {title}
      </div>
      <p className={cn("mb-4 text-lg font-bold leading-tight", TONE_TEXT[tone])}>{headline}</p>
      <ol className="flex items-start justify-between gap-2">
        {steps.map((s, i) => (
          <li
            key={s.key}
            aria-current={s.state === "current" ? "step" : undefined}
            className={cn("flex flex-1 flex-col items-center gap-1 text-center text-xs", i < steps.length - 1 && "relative")}
          >
            <StepIcon step={s} />
            <span className={cn(s.state === "todo" ? "text-muted-foreground" : "font-semibold")}>{s.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface OutcomeTrackerProps {
  protection: ProtectionTrack;
  repair: RepairTrack;
  clock: ClockState;
  className?: string;
}

/**
 * Two independent outcomes, never one status: "Made safe" and "Fixed". The protection clock sits
 * with the make-safe track because that is what it measures.
 */
export function OutcomeTracker({ protection, repair, clock, className }: OutcomeTrackerProps) {
  const protectionTone: Tone = protection === "verified" ? "green" : protection === "recorded" ? "amber" : "red";
  const repairTone: Tone = repair === "verified" ? "green" : repair === "recorded" ? "amber" : repair === "assigned" ? "neutral" : "neutral";
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <div className="flex flex-col gap-3">
        <Track title="Interim protection (made safe)" Icon={ShieldCheck} steps={protectionSteps(protection)} headline={PROTECTION_LABEL[protection]} tone={protectionTone} />
        <ProtectionClock startedAt={clock.startedAt} stoppedAt={clock.stoppedAt} active={clock.active} size="lg" footnote className="px-1" />
      </div>
      <Track title="Repair (fixed)" Icon={repair === "assigned" ? Users : Wrench} steps={repairSteps(repair)} headline={REPAIR_LABEL[repair]} tone={repairTone} />
    </div>
  );
}
