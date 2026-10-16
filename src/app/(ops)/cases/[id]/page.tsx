import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Camera, MapPin, Printer, School, TriangleAlert } from "lucide-react";
import { OutcomeTracker } from "@/components/case/OutcomeTracker";
import { StatusBadge } from "@/components/case/StatusBadge";
import { Timeline } from "@/components/case/Timeline";
import { CaseActions, type ActionSpec } from "@/components/ops/CaseActions";
import { clockState } from "@/lib/clock";
import { HAZARD_LABEL, ROLE_LABEL, type CaseStatus, type HazardCategory, type StaffRole } from "@/lib/contracts/enums";
import { formatDateTime, isPast } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/session";
import { protectionTrack, repairTrack } from "@/server/domain/publicView";
import { ruleFor } from "@/server/domain/workflow";
import { getCaseDetail, listStaff } from "@/server/services/cases";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getCaseDetail(id);
  return { title: d ? d.case.ref : "Case" };
}

/** Which actions exist for this status, and whether this role may take them (server-side truth). */
function actionSpecs(status: CaseStatus, role: StaffRole): ActionSpec[] {
  const spec = (key: ActionSpec["key"], label: string, to: CaseStatus): ActionSpec | null => {
    const rule = ruleFor(status, to);
    if (!rule) return null;
    const names = rule.roles.map((r) => ROLE_LABEL[r].toLowerCase()).join(" or ");
    return { key, label, allowed: rule.roles.includes(role), lockedReason: `${label}: only the ${names}` };
  };
  const all: (ActionSpec | null)[] = [
    spec("claim", "Claim for review", "under_review"),
    spec("triage", "Triage and set deadline", "uncontained"),
    spec("dismiss", "Dismiss", "dismissed"),
    spec("record_protection", "Record protection", "protection_recorded"),
    spec("review_protection", "Verify protection", "protected"),
    spec("assign_repair", "Assign repair crew", "repair_pending"),
    spec("record_repair", "Record repair", "repair_recorded"),
    spec("review_closure", "Verify closure", "resolved"),
    spec("reopen", "Reopen", "under_review"),
    spec("mark_uncontained", "Mark uncontained (barrier gone)", "uncontained"),
  ];
  // "Reopen" only makes sense from resolved; the under_review rule from protection_recorded/repair_recorded is the review form's reject path.
  return all.filter((a): a is ActionSpec => {
    if (!a) return false;
    if (a.key === "reopen") return status === "resolved";
    if (a.key === "mark_uncontained") return status === "protected" || status === "repair_pending";
    return true;
  });
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [detail, staff] = await Promise.all([getCaseDetail(id), listStaff()]);
  if (!detail) notFound();
  const c = detail.case;
  const clock = clockState(c);
  const overdue = !c.protectionVerifiedAt && isPast(c.dueDate) && !["resolved", "dismissed"].includes(c.status);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="ref text-sm text-muted-foreground">{c.ref} · Public report</p>
            <h1 className="text-2xl font-bold leading-tight">{c.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden /> {c.landmark} · {c.suburb}, {c.municipality}
            </p>
          </div>
          <StatusBadge status={c.status} size="lg" live />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {c.nearSchool && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-amber-bg px-3 py-1 font-medium text-status-amber">
              <School className="size-4" aria-hidden /> Near a school
            </span>
          )}
          {overdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-red-bg px-3 py-1 font-medium text-status-red">
              <TriangleAlert className="size-4" aria-hidden /> Past make-safe deadline ({formatDateTime(c.dueDate)})
            </span>
          )}
          {c.anyoneHurt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-red-bg px-3 py-1 font-medium text-status-red">
              <TriangleAlert className="size-4" aria-hidden /> Reporter said someone was hurt
            </span>
          )}
          {c.interestCount > 0 && <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{c.interestCount} community sighting{c.interestCount === 1 ? "" : "s"}</span>}
        </div>
      </header>

      <OutcomeTracker protection={protectionTrack(c)} repair={repairTrack(c)} clock={clock} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="facts" className="rounded-xl border bg-card p-4">
            <h2 id="facts" className="font-bold">Facts</h2>
            <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Category</dt>
              <dd>{HAZARD_LABEL[c.hazardCategory as HazardCategory] ?? c.hazardCategory}</dd>
              <dt className="text-muted-foreground">Description</dt>
              <dd>{c.description}</dd>
              <dt className="text-muted-foreground">Reported</dt>
              <dd>{formatDateTime(c.createdAt)}</dd>
              <dt className="text-muted-foreground">Clock started</dt>
              <dd>{formatDateTime(c.clockStartedAt)}</dd>
              <dt className="text-muted-foreground">Severity</dt>
              <dd>{c.severity ? `${c.likelihood} × ${c.impact} = ${c.severity}` : "Not triaged yet"}</dd>
              <dt className="text-muted-foreground">Owner</dt>
              <dd>{detail.ownerName ?? "Not assigned"}</dd>
              <dt className="text-muted-foreground">Make-safe due</dt>
              <dd className={overdue ? "font-semibold text-status-red" : undefined}>{formatDateTime(c.dueDate)}</dd>
              <dt className="text-muted-foreground">Repair crew</dt>
              <dd>{detail.openRepairAssignment ? `${detail.openRepairAssignment.crewLabel} · due ${formatDateTime(detail.openRepairAssignment.dueDate)}` : "None assigned"}</dd>
              <dt className="text-muted-foreground">Municipal ref</dt>
              <dd className={c.municipalRef ? "ref" : "text-muted-foreground"}>{c.municipalRef ?? "Not recorded"}</dd>
              <dt className="text-muted-foreground">Reinspect due</dt>
              <dd>{formatDateTime(c.reinspectDue)}</dd>
              <dt className="text-muted-foreground">Reporter contact</dt>
              <dd className="text-muted-foreground">{c.reporterContact ? c.reporterContact : "Not given"} <span className="text-xs">(staff only)</span></dd>
            </dl>
            <p className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href={`/track/${c.ref}`} className="underline">Public track page</Link>
              <Link href={`/poster/${c.ref}`} className="inline-flex items-center gap-1 underline"><Printer className="size-4" aria-hidden /> Poster</Link>
            </p>
          </section>

          <CaseActions
            caseId={c.id}
            status={c.status}
            role={user.role}
            hazardCategory={c.hazardCategory}
            actions={actionSpecs(c.status, user.role)}
            staff={staff}
            currentUserId={user.id}
            municipalRef={c.municipalRef}
          />

          <section aria-labelledby="evidence" className="rounded-xl border bg-card p-4">
            <h2 id="evidence" className="flex items-center gap-2 font-bold">
              <Camera className="size-5" aria-hidden /> Evidence ({detail.evidence.length})
            </h2>
            {detail.evidence.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No photos yet.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {detail.evidence.map((e) => (
                  <li key={e.id}>
                    <a href={`/api/v1/evidence/${e.id}`} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/v1/evidence/${e.id}`} alt={e.caption ?? "Evidence photo"} loading="lazy" className="aspect-square w-full object-cover" />
                    </a>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{e.caption ?? formatDateTime(e.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Private. EXIF and GPS removed on upload. Never shown on the public page.</p>
          </section>
        </div>

        <section aria-labelledby="history" className="rounded-xl border bg-card p-4">
          <h2 id="history" className="font-bold">History (newest first)</h2>
          <p className="mb-4 text-xs text-muted-foreground">Append-only. Community sightings are labelled and never change the verified status.</p>
          <Timeline events={detail.events} />
        </section>
      </div>
    </div>
  );
}
