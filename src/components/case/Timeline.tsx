import type { ComponentType } from "react";
import {
  ArrowRightLeft,
  Camera,
  ClipboardCheck,
  Eye,
  FilePlus2,
  MessageSquareText,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, SIGHTING_LABEL, STATUS_LABEL, type CaseStatus, type Role, type SightingKind } from "@/lib/contracts/enums";
import { formatDateTime } from "@/lib/format";
import { StatusBadge, type Tone } from "./StatusBadge";

export interface TimelineItem {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorName: string | null;
  actorRole: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface Rendered {
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  detail?: string;
  chip?: { tone: Tone; label: string };
  community?: boolean;
}

function roleLabel(role: string): string {
  return ROLE_LABEL[role as Role] ?? role;
}

function render(e: TimelineItem): Rendered {
  const p = e.payload;
  const to = e.toStatus as CaseStatus | null;
  switch (e.eventType) {
    case "created":
      return { Icon: FilePlus2, title: "Reported by a resident", detail: "Clock started", chip: { tone: "red", label: "Not made safe" }, community: true };
    case "sighting": {
      const kind = String(p.kind ?? "still_open") as SightingKind;
      const tone: Tone = kind === "barrier_present" ? "amber" : "red";
      return { Icon: Eye, title: `Community sighting: ${SIGHTING_LABEL[kind] ?? kind}`, detail: "Reported by a member of the public. Does not change the verified status.", chip: { tone, label: "Community-reported" }, community: true };
    }
    case "assigned":
      return p.stage === "repair"
        ? { Icon: Users, title: `Repair crew assigned: ${String(p.crewLabel ?? "")}`, detail: p.dueDate ? `Due ${formatDateTime(String(p.dueDate))}` : undefined }
        : { Icon: UserCheck, title: "Owner and make-safe deadline set", detail: p.dueDate ? `Make safe by ${formatDateTime(String(p.dueDate))} · severity ${String(p.severity ?? "")}` : undefined };
    case "action_recorded":
      return p.type === "protection"
        ? { Icon: ShieldCheck, title: "Barrier recorded", detail: String(p.description ?? ""), chip: { tone: "amber", label: "Recorded, not yet checked" } }
        : { Icon: Wrench, title: "Repair recorded", detail: String(p.description ?? ""), chip: { tone: "amber", label: "Recorded, not yet checked" } };
    case "evidence_added":
      return { Icon: Camera, title: "Photo added", detail: "EXIF and location data removed on upload" };
    case "review_recorded": {
      const approved = p.decision === "approved";
      const stage = p.stage === "closure" ? "repair" : "protection";
      return approved
        ? { Icon: ClipboardCheck, title: `Reviewer verified the ${stage}`, chip: { tone: "green", label: "Verified" } }
        : { Icon: TriangleAlert, title: `Reviewer rejected the ${stage}`, detail: p.reason ? String(p.reason) : undefined, chip: { tone: "red", label: "Rejected" } };
    }
    case "status_changed": {
      const reason = p.reason ? String(p.reason) : undefined;
      if (to === "uncontained" && p.sightingKind === "barrier_gone") {
        return { Icon: TriangleAlert, title: "Barrier gone: case back to uncontained", detail: "Protection is no longer verified. Clock restarted.", chip: { tone: "red", label: "Clock restarted" }, community: true };
      }
      if (to === "protected") return { Icon: ShieldCheck, title: "Made safe (verified)", detail: "Clock stopped", chip: { tone: "green", label: "Verified" } };
      if (to === "resolved") return { Icon: ClipboardCheck, title: "Fixed (verified)", detail: "Reinspection scheduled in 90 days", chip: { tone: "green", label: "Verified" } };
      return { Icon: ArrowRightLeft, title: `${e.fromStatus ? STATUS_LABEL[e.fromStatus as CaseStatus] ?? e.fromStatus : "—"} → ${to ? STATUS_LABEL[to] ?? to : "—"}`, detail: reason };
    }
    case "note":
      return { Icon: MessageSquareText, title: "Note", detail: String(p.note ?? p.municipalRef ?? "") };
    default:
      return { Icon: ArrowRightLeft, title: e.eventType };
  }
}

interface TimelineProps {
  events: TimelineItem[];
  className?: string;
}

/** Newest first. The latest item carries aria-current="step". */
export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No history yet.</p>;
  return (
    <ol className={cn("relative ms-3 border-s-2 border-border", className)}>
      {events.map((e, i) => {
        const r = render(e);
        const who = r.community ? "Community" : e.actorName ?? roleLabel(e.actorRole);
        return (
          <li key={e.id} aria-current={i === 0 ? "step" : undefined} className="relative mb-6 ms-6 last:mb-0">
            <span className={cn("absolute -start-[1.95rem] top-0.5 flex size-7 items-center justify-center rounded-full border bg-background", i === 0 && "ring-2 ring-ring/40")}>
              <r.Icon className="size-4" aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-tight">{r.title}</h3>
              {r.chip && <StatusBadge tone={r.chip.tone} label={r.chip.label} size="sm" Icon={r.chip.tone === "green" ? ShieldCheck : r.chip.tone === "red" ? TriangleAlert : Camera} />}
            </div>
            {r.detail && <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium">{who}</span>
              {!r.community && <span> · {roleLabel(e.actorRole)}</span>}
              <span> · </span>
              <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
