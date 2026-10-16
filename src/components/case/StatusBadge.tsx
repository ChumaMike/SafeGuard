import type { ComponentType } from "react";
import { Ban, CircleCheckBig, CircleDashed, Clock3, Eye, Inbox, TriangleAlert, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type CaseStatus } from "@/lib/contracts/enums";

export type Tone = "red" | "amber" | "green" | "neutral";

interface IconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

const TONE_CLASS: Record<Tone, string> = {
  red: "bg-status-red-bg text-status-red border-status-red/30",
  amber: "bg-status-amber-bg text-status-amber border-status-amber/30",
  green: "bg-status-green-bg text-status-green border-status-green/30",
  neutral: "bg-status-neutral-bg text-status-neutral border-status-neutral/30",
};

export const STATUS_TONE: Record<CaseStatus, { tone: Tone; Icon: ComponentType<IconProps> }> = {
  unassessed: { tone: "red", Icon: Inbox },
  under_review: { tone: "red", Icon: Eye },
  uncontained: { tone: "red", Icon: TriangleAlert },
  protection_recorded: { tone: "amber", Icon: CircleDashed },
  protected: { tone: "green", Icon: CircleCheckBig },
  repair_pending: { tone: "green", Icon: Clock3 },
  repair_recorded: { tone: "amber", Icon: Wrench },
  resolved: { tone: "green", Icon: CircleCheckBig },
  dismissed: { tone: "neutral", Icon: Ban },
};

interface StatusBadgeProps {
  status?: CaseStatus;
  /** Override for non-status uses, e.g. "Recorded" / "Verified" chips. */
  tone?: Tone;
  label?: string;
  Icon?: ComponentType<IconProps>;
  /** Announce changes to assistive tech when the badge updates in place. */
  live?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Every status renders an icon plus a word. Colour is never the only signal. */
export function StatusBadge({ status, tone, label, Icon, live, size = "md", className }: StatusBadgeProps) {
  const spec = status ? STATUS_TONE[status] : undefined;
  const finalTone: Tone = tone ?? spec?.tone ?? "neutral";
  const FinalIcon = Icon ?? spec?.Icon ?? CircleDashed;
  const text = label ?? (status ? STATUS_LABEL[status] : "");
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-0.5 gap-1" : size === "lg" ? "text-base px-3.5 py-1.5 gap-2" : "text-sm px-2.5 py-1 gap-1.5";
  const iconSize = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";
  return (
    <span
      role={live ? "status" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border font-semibold leading-none whitespace-nowrap",
        TONE_CLASS[finalTone],
        sizeClass,
        className,
      )}
    >
      <FinalIcon className={cn(iconSize, "shrink-0")} aria-hidden />
      <span>{text}</span>
    </span>
  );
}

export const TONE_TEXT: Record<Tone, string> = {
  red: "text-status-red",
  amber: "text-status-amber",
  green: "text-status-green",
  neutral: "text-status-neutral",
};

export const TONE_BG: Record<Tone, string> = {
  red: "bg-status-red-bg",
  amber: "bg-status-amber-bg",
  green: "bg-status-green-bg",
  neutral: "bg-status-neutral-bg",
};
