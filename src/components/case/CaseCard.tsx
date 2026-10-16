import Link from "next/link";
import { MapPin, School, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { HAZARD_LABEL, type CaseStatus, type HazardCategory } from "@/lib/contracts/enums";
import { clockState } from "@/lib/clock";
import { formatDate, isPast } from "@/lib/format";
import { ProtectionClock } from "./ProtectionClock";
import { StatusBadge } from "./StatusBadge";

export interface CaseCardData {
  id: string;
  ref: string;
  title: string;
  hazardCategory: string;
  suburb: string;
  landmark: string;
  status: CaseStatus;
  nearSchool: boolean;
  clockStartedAt: string;
  protectionVerifiedAt: string | null;
  closureVerifiedAt: string | null;
  dueDate: string | null;
  ownerName?: string | null;
  interestCount?: number;
}

interface CaseCardProps {
  c: CaseCardData;
  href?: string;
  className?: string;
}

export function CaseCard({ c, href = `/cases/${c.id}`, className }: CaseCardProps) {
  const clock = clockState(c);
  const overdue = !c.protectionVerifiedAt && isPast(c.dueDate) && !["resolved", "dismissed"].includes(c.status);
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ref text-xs text-muted-foreground">{c.ref}</p>
          <h3 className="truncate font-semibold leading-tight">{c.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {c.suburb} · {c.landmark}
            </span>
          </p>
        </div>
        <StatusBadge status={c.status} size="sm" className="shrink-0" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <ProtectionClock startedAt={clock.startedAt} stoppedAt={clock.stoppedAt} active={clock.active} size="sm" />
        <span className="text-muted-foreground">{HAZARD_LABEL[c.hazardCategory as HazardCategory] ?? c.hazardCategory}</span>
        {c.nearSchool && (
          <span className="inline-flex items-center gap-1 font-medium text-status-amber">
            <School className="size-4" aria-hidden /> Near a school
          </span>
        )}
        {overdue && (
          <span className="inline-flex items-center gap-1 font-medium text-status-red">
            <TriangleAlert className="size-4" aria-hidden /> Make-safe due {formatDate(c.dueDate)}
          </span>
        )}
        {typeof c.interestCount === "number" && c.interestCount > 0 && (
          <span className="text-muted-foreground">{c.interestCount} community sighting{c.interestCount === 1 ? "" : "s"}</span>
        )}
      </div>
    </Link>
  );
}
