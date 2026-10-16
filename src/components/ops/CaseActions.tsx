"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, Lock, ShieldCheck, TriangleAlert, Users, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HAZARD_LABEL, HazardCategory, type CaseStatus, type StaffRole } from "@/lib/contracts/enums";
import type { ProblemDetails } from "@/lib/action-result";
import { toLocalInputValue } from "@/lib/format";
import {
  assignRepair,
  claimCase,
  dismissCase,
  markUncontained,
  recordAction,
  reopenCase,
  reviewCase,
  setMunicipalRef,
  triageCase,
} from "@/server/actions/cases";
import { LockedAction } from "@/components/case/LockedAction";
import { PhotoPicker } from "@/components/forms/PhotoPicker";

export interface ActionSpec {
  key: "claim" | "triage" | "dismiss" | "record_protection" | "review_protection" | "assign_repair" | "record_repair" | "review_closure" | "reopen" | "mark_uncontained";
  label: string;
  allowed: boolean;
  /** "Only the reviewer can verify protection" */
  lockedReason: string;
}

interface Props {
  caseId: string;
  status: CaseStatus;
  role: StaffRole;
  hazardCategory: string;
  actions: ActionSpec[];
  staff: { id: string; displayName: string; role: string }[];
  currentUserId: string;
  municipalRef: string | null;
}

type Open = ActionSpec["key"] | "municipal_ref" | null;

export function CaseActions({ caseId, hazardCategory, actions, staff, currentUserId, municipalRef }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; problem?: ProblemDetails }>) {
    setProblem(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        setProblem(r.problem ?? null);
        return;
      }
      setOpen(null);
      router.refresh();
    });
  }

  const allowed = actions.filter((a) => a.allowed);
  const locked = actions.filter((a) => !a.allowed);

  return (
    <section aria-labelledby="actions" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="actions" className="font-bold">Actions</h2>

      {allowed.length === 0 && locked.length === 0 && <p className="text-sm text-muted-foreground">No actions on a case in this state.</p>}

      <div className="flex flex-wrap gap-2">
        {allowed.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => (a.key === "claim" ? run(() => claimCase(caseId)) : setOpen(open === a.key ? null : a.key))}
            disabled={pending}
            aria-expanded={a.key === "claim" ? undefined : open === a.key}
            className={cn(
              "tap inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold disabled:opacity-60",
              a.key.startsWith("review") ? "bg-status-green text-white hover:opacity-90" : a.key === "dismiss" || a.key === "mark_uncontained" ? "border hover:bg-accent" : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            <ActionIcon k={a.key} /> {a.label}
          </button>
        ))}
        <button type="button" onClick={() => setOpen(open === "municipal_ref" ? null : "municipal_ref")} className="tap inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-accent">
          {municipalRef ? "Update municipal reference" : "Add municipal reference"}
        </button>
      </div>

      {locked.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {locked.map((a) => (
            <LockedAction key={a.key} label={a.label} reason={a.lockedReason} />
          ))}
        </div>
      )}

      {problem && (
        <p role="alert" className="rounded-lg border border-status-red/40 bg-status-red-bg p-3 text-sm text-status-red">
          <strong>{problem.title}</strong>
          {problem.errors && (
            <span className="block">
              {Object.entries(problem.errors)
                .map(([k, v]) => `${k}: ${v[0]}`)
                .join(" · ")}
            </span>
          )}
        </p>
      )}

      {open === "triage" && (
        <TriageForm hazardCategory={hazardCategory} staff={staff} currentUserId={currentUserId} pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => triageCase(caseId, fd))} />
      )}
      {(open === "record_protection" || open === "record_repair") && (
        <RecordForm type={open === "record_protection" ? "protection" : "correction"} pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => recordAction(caseId, fd))} />
      )}
      {(open === "review_protection" || open === "review_closure") && (
        <ReviewForm stage={open === "review_protection" ? "protection" : "closure"} pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => reviewCase(caseId, fd))} />
      )}
      {open === "assign_repair" && <AssignForm pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => assignRepair(caseId, fd))} />}
      {open === "dismiss" && <ReasonForm title="Dismiss this case" hint="Say why. The resident will see the case as Closed." pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => dismissCase(caseId, fd))} />}
      {open === "reopen" && <ReasonForm title="Reopen this case" hint="Say what changed. The case goes back to review." pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => reopenCase(caseId, fd))} />}
      {open === "mark_uncontained" && (
        <ReasonForm title="Mark uncontained" hint="Use this when you know the barrier is gone or inadequate. Protection stops being verified and the clock restarts." pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => markUncontained(caseId, fd))} />
      )}
      {open === "municipal_ref" && (
        <FormShell title="Official municipal reference" pending={pending} onCancel={() => setOpen(null)} onSubmit={(fd) => run(() => setMunicipalRef(caseId, fd))} submitLabel="Save reference">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Reference number given by the municipality</span>
            <input name="municipalRef" defaultValue={municipalRef ?? ""} required minLength={2} className="tap rounded-lg border bg-background px-3 font-mono" />
            <span className="text-xs text-muted-foreground">Only enter a number the municipality actually issued. Never invent one.</span>
          </label>
        </FormShell>
      )}
    </section>
  );
}

function ActionIcon({ k }: { k: ActionSpec["key"] }) {
  const cls = "size-4";
  switch (k) {
    case "claim":
    case "triage":
      return <ClipboardCheck className={cls} aria-hidden />;
    case "record_protection":
      return <ShieldCheck className={cls} aria-hidden />;
    case "record_repair":
      return <Wrench className={cls} aria-hidden />;
    case "review_protection":
    case "review_closure":
      return <Check className={cls} aria-hidden />;
    case "assign_repair":
      return <Users className={cls} aria-hidden />;
    case "dismiss":
      return <X className={cls} aria-hidden />;
    case "reopen":
    case "mark_uncontained":
      return <TriangleAlert className={cls} aria-hidden />;
    default:
      return <Lock className={cls} aria-hidden />;
  }
}

function FormShell({ title, children, pending, onCancel, onSubmit, submitLabel = "Save" }: { title: string; children: React.ReactNode; pending: boolean; onCancel: () => void; onSubmit: (fd: FormData) => void; submitLabel?: string }) {
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      <h3 className="font-bold">{title}</h3>
      {children}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="tap rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {pending ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="tap rounded-lg border px-4 py-2 font-medium hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}

function TriageForm({ hazardCategory, staff, currentUserId, pending, onCancel, onSubmit }: { hazardCategory: string; staff: Props["staff"]; currentUserId: string; pending: boolean; onCancel: () => void; onSubmit: (fd: FormData) => void }) {
  const [likelihood, setLikelihood] = useState(4);
  const [impact, setImpact] = useState(4);
  const severity = likelihood * impact;
  const band = severity >= 15 ? "critical · make safe within 24 hours" : severity >= 8 ? "high · make safe within 3 days" : "low · make safe within 7 days";
  const defaultDue = useMemo(() => {
    const ms = severity >= 15 ? 24 * 3600_000 : severity >= 8 ? 3 * 86_400_000 : 7 * 86_400_000;
    return toLocalInputValue(new Date(Date.now() + ms).toISOString());
  }, [severity]);
  const [due, setDue] = useState(defaultDue);
  const [touched, setTouched] = useState(false);
  const dueValue = touched ? due : defaultDue;

  return (
    <FormShell
      title="Triage: category, severity, owner, make-safe deadline"
      pending={pending}
      onCancel={onCancel}
      submitLabel="Mark uncontained and set deadline"
      onSubmit={(fd) => {
        fd.set("dueDate", new Date(String(fd.get("dueDateLocal"))).toISOString());
        onSubmit(fd);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Hazard category</span>
        <select name="hazardCategory" defaultValue={hazardCategory} className="tap rounded-lg border bg-background px-3">
          {HazardCategory.options.map((c) => (
            <option key={c} value={c}>{HAZARD_LABEL[c]}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Rating name="likelihood" label="Likelihood someone gets hurt (1–5)" value={likelihood} onChange={setLikelihood} />
        <Rating name="impact" label="How bad it would be (1–5)" value={impact} onChange={setImpact} />
      </div>
      <p className="rounded-lg bg-muted p-2 text-sm">
        Severity <strong className="tabular-nums">{likelihood} × {impact} = {severity}</strong> · {band}
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Responsible owner</span>
        <select name="ownerId" defaultValue={currentUserId} className="tap rounded-lg border bg-background px-3">
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.displayName} · {s.role.replace("_", " ")}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Make-safe deadline (pre-filled from severity, edit if needed)</span>
        <input type="datetime-local" name="dueDateLocal" value={dueValue} onChange={(e) => { setTouched(true); setDue(e.target.value); }} required className="tap rounded-lg border bg-background px-3" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Official municipal reference (optional)</span>
        <input name="municipalRef" className="tap rounded-lg border bg-background px-3 font-mono" placeholder="Only if the municipality issued one" />
      </label>
    </FormShell>
  );
}

function Rating({ name, label, value, onChange }: { name: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div role="radiogroup" className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={cn("tap flex flex-1 cursor-pointer items-center justify-center rounded-lg border font-semibold hover:bg-accent", value === n && "border-primary bg-primary/10 ring-2 ring-primary")}>
            <input type="radio" name={name} value={n} className="sr-only" checked={value === n} onChange={() => onChange(n)} />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RecordForm({ type, pending, onCancel, onSubmit }: { type: "protection" | "correction"; pending: boolean; onCancel: () => void; onSubmit: (fd: FormData) => void }) {
  const [photos, setPhotos] = useState<File[]>([]);
  return (
    <FormShell
      title={type === "protection" ? "Record protection (barrier, cones, plate)" : "Record the repair"}
      pending={pending}
      onCancel={onCancel}
      submitLabel={type === "protection" ? "Record barrier — awaiting verification" : "Record repair — awaiting verification"}
      onSubmit={(fd) => {
        fd.set("type", type);
        fd.delete("photos");
        for (const p of photos) fd.append("photos", p, p.name);
        onSubmit(fd);
      }}
    >
      <p className="rounded-lg bg-status-amber-bg p-2 text-sm text-status-amber">
        <strong>Recorded is not verified.</strong> This will show as "{type === "protection" ? "Barrier" : "Repair"} recorded, not yet checked" until the reviewer approves it.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">What was done</span>
        <textarea name="description" required minLength={5} rows={3} className="rounded-lg border bg-background px-3 py-2" placeholder={type === "protection" ? "e.g. Steel plate over the hole, cones and danger tape around it." : "e.g. New cast-iron cover fitted and frame re-set in concrete."} />
      </label>
      <PhotoPicker required max={5} label="Photo evidence (at least 1)" hint="Take it from a safe spot. Location data is removed on upload." onChange={setPhotos} />
    </FormShell>
  );
}

function ReviewForm({ stage, pending, onCancel, onSubmit }: { stage: "protection" | "closure"; pending: boolean; onCancel: () => void; onSubmit: (fd: FormData) => void }) {
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  return (
    <FormShell
      title={stage === "protection" ? "Review the barrier: is the site made safe?" : "Review the repair: is it fixed?"}
      pending={pending}
      onCancel={onCancel}
      submitLabel={decision === "approved" ? (stage === "protection" ? "Verify protection — stop the clock" : "Verify closure — resolve the case") : "Reject and send back for review"}
      onSubmit={(fd) => {
        fd.set("stage", stage);
        fd.set("decision", decision);
        onSubmit(fd);
      }}
    >
      <p className="text-sm text-muted-foreground">Inspect the evidence and, where possible, the site. Your decision is recorded in the case history with your name and role.</p>
      <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
        <label className={cn("tap flex cursor-pointer items-center gap-2 rounded-lg border px-3 font-semibold hover:bg-accent", decision === "approved" && "border-status-green bg-status-green-bg text-status-green ring-2 ring-status-green/40")}>
          <input type="radio" name="decisionPick" className="sr-only" checked={decision === "approved"} onChange={() => setDecision("approved")} />
          <Check className="size-5" aria-hidden /> Approve — verified
        </label>
        <label className={cn("tap flex cursor-pointer items-center gap-2 rounded-lg border px-3 font-semibold hover:bg-accent", decision === "rejected" && "border-status-red bg-status-red-bg text-status-red ring-2 ring-status-red/40")}>
          <input type="radio" name="decisionPick" className="sr-only" checked={decision === "rejected"} onChange={() => setDecision("rejected")} />
          <X className="size-5" aria-hidden /> Reject — not acceptable
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{decision === "rejected" ? "Reason for rejecting (required)" : "Notes (optional)"}</span>
        <textarea name="reason" rows={2} required={decision === "rejected"} minLength={decision === "rejected" ? 3 : undefined} className="rounded-lg border bg-background px-3 py-2" />
      </label>
    </FormShell>
  );
}

function AssignForm({ pending, onCancel, onSubmit }: { pending: boolean; onCancel: () => void; onSubmit: (fd: FormData) => void }) {
  const defaultDue = toLocalInputValue(new Date(Date.now() + 7 * 86_400_000).toISOString());
  return (
    <FormShell
      title="Assign a repair crew"
      pending={pending}
      onCancel={onCancel}
      submitLabel="Assign crew — repair pending"
      onSubmit={(fd) => {
        fd.set("dueDate", new Date(String(fd.get("dueDateLocal"))).toISOString());
        onSubmit(fd);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Crew</span>
        <input name="crewLabel" required minLength={2} defaultValue="Field Team B" className="tap rounded-lg border bg-background px-3" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Repair due</span>
        <input type="datetime-local" name="dueDateLocal" defaultValue={defaultDue} required className="tap rounded-lg border bg-background px-3" />
      </label>
    </FormShell>
  );
}

function ReasonForm({ title, hint, pending, onCancel, onSubmit }: { title: string; hint: string; pending: boolean; onCancel: () => void; onSubmit: (fd: FormData) => void }) {
  return (
    <FormShell title={title} pending={pending} onCancel={onCancel} onSubmit={onSubmit} submitLabel="Confirm">
      <p className="text-sm text-muted-foreground">{hint}</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Reason (required)</span>
        <textarea name="reason" required minLength={3} rows={2} className="rounded-lg border bg-background px-3 py-2" />
      </label>
    </FormShell>
  );
}
