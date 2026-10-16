"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, LocateFixed, Phone, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { HAZARD_LABEL, HazardCategory } from "@/lib/contracts/enums";
import type { ProblemDetails } from "@/lib/action-result";
import { confirmDuplicateSighting, submitPublicReport, type SubmitReportData } from "@/server/actions/public";
import type { DuplicateCandidate } from "@/server/services/cases";
import { PhotoPicker } from "./PhotoPicker";

const MUNICIPALITIES = [
  "City of Johannesburg",
  "City of Tshwane",
  "City of Ekurhuleni",
  "Merafong City",
  "Mogale City",
  "Rand West City",
  "Emfuleni",
  "Midvaal",
  "Lesedi",
];

interface Draft {
  hazardCategory: HazardCategory | "";
  description: string;
  nearSchool: boolean;
  anyoneHurt: boolean;
  municipality: string;
  municipalityOther: string;
  suburb: string;
  street: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  contact: string;
  municipalRef: string;
}

const EMPTY: Draft = {
  hazardCategory: "",
  description: "",
  nearSchool: false,
  anyoneHurt: false,
  municipality: "City of Johannesburg",
  municipalityOther: "",
  suburb: "",
  street: "",
  landmark: "",
  lat: null,
  lng: null,
  accuracy: null,
  contact: "",
  municipalRef: "",
};

type Stage = { kind: "form"; step: 1 | 2 | 3 } | { kind: "duplicates"; candidates: DuplicateCandidate[] } | { kind: "done"; ref: string; viaSighting?: boolean };

export function ReportForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [photos, setPhotos] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>({ kind: "form", step: 1 });
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [locating, setLocating] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => setIdempotencyKey(crypto.randomUUID()), []);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const err = (field: string) => problem?.errors?.[field]?.[0];
  const municipality = draft.municipality === "__other" ? draft.municipalityOther : draft.municipality;

  function buildFormData(confirmNotDuplicate: boolean): FormData {
    const fd = new FormData();
    fd.set("hazardCategory", draft.hazardCategory);
    fd.set("description", draft.description);
    fd.set("nearSchool", String(draft.nearSchool));
    fd.set("anyoneHurt", String(draft.anyoneHurt));
    fd.set("municipality", municipality);
    fd.set("suburb", draft.suburb);
    fd.set("street", draft.street);
    fd.set("landmark", draft.landmark);
    if (draft.lat !== null && draft.lng !== null) {
      fd.set("lat", String(draft.lat));
      fd.set("lng", String(draft.lng));
    }
    fd.set("contact", draft.contact);
    fd.set("municipalRef", draft.municipalRef);
    fd.set("idempotencyKey", idempotencyKey);
    fd.set("confirmNotDuplicate", String(confirmNotDuplicate));
    for (const p of photos) fd.append("photos", p, p.name);
    return fd;
  }

  function submit(confirmNotDuplicate = false) {
    setProblem(null);
    start(async () => {
      const r = await submitPublicReport(buildFormData(confirmNotDuplicate));
      if (!r.ok) {
        setProblem(r.problem);
        // Jump back to the step that owns the first field error.
        const f = Object.keys(r.problem.errors ?? {})[0];
        if (f === "hazardCategory") setStage({ kind: "form", step: 1 });
        else if (f === "description") setStage({ kind: "form", step: 2 });
        else setStage({ kind: "form", step: 3 });
        return;
      }
      const data: SubmitReportData = r.data;
      if (data.kind === "possible_duplicate") setStage({ kind: "duplicates", candidates: data.possibleDuplicates });
      else setStage({ kind: "done", ref: data.ref });
    });
  }

  function sameHazard(ref: string) {
    setProblem(null);
    start(async () => {
      const r = await confirmDuplicateSighting(ref, crypto.randomUUID());
      if (!r.ok) return setProblem(r.problem);
      setStage({ kind: "done", ref, viaSighting: true });
    });
  }

  function locate() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("lat", Number(pos.coords.latitude.toFixed(5)));
        set("lng", Number(pos.coords.longitude.toFixed(5)));
        set("accuracy", Math.round(pos.coords.accuracy));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }

  if (stage.kind === "done") {
    return <Confirmation ref_={stage.ref} viaSighting={stage.viaSighting} />;
  }

  if (stage.kind === "duplicates") {
    return (
      <section aria-labelledby="dup" className="flex flex-col gap-4">
        <h2 id="dup" className="text-xl font-bold">Is it this one?</h2>
        <p className="text-muted-foreground">Someone reported a similar hazard nearby recently. If it is the same one, we will add your sighting to it instead of opening a new case.</p>
        <ul className="flex flex-col gap-3">
          {stage.candidates.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-4">
              <p className="ref text-xs text-muted-foreground">{c.ref}</p>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-muted-foreground">
                {c.suburb} · {c.landmark}
                {c.distanceMetres !== null && ` · about ${c.distanceMetres} m from you`}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => sameHazard(c.ref)}
                className="tap mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                <Check className="size-5" aria-hidden /> Yes, same hazard
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="tap inline-flex items-center justify-center rounded-lg border px-4 py-2 font-semibold hover:bg-accent disabled:opacity-60"
        >
          No, it is a different one — submit my report
        </button>
        <ProblemBox problem={problem} />
      </section>
    );
  }

  const step = stage.step;
  const goto = (s: 1 | 2 | 3) => setStage({ kind: "form", step: s });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 3) goto((step + 1) as 2 | 3);
        else submit(false);
      }}
      noValidate
    >
      <ol className="flex items-center gap-2 text-sm" aria-label="Progress">
        {[1, 2, 3].map((s) => (
          <li key={s} aria-current={s === step ? "step" : undefined} className={cn("flex items-center gap-2", s !== step && "text-muted-foreground")}>
            <span className={cn("flex size-7 items-center justify-center rounded-full border font-semibold", s === step && "bg-primary text-primary-foreground border-primary", s < step && "bg-status-green-bg text-status-green border-status-green/40")}>
              {s < step ? <Check className="size-4" aria-hidden /> : s}
            </span>
            <span className="hidden sm:inline">{s === 1 ? "What" : s === 2 ? "Details" : "Where"}</span>
            {s < 3 && <span aria-hidden className="w-6 border-t" />}
          </li>
        ))}
      </ol>

      <div role="alert" className="flex items-start gap-3 rounded-xl border border-status-amber/40 bg-status-amber-bg p-3 text-sm text-status-amber">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          <strong>Stay where you are.</strong> Never approach exposed electricity, open pits, unstable ground or sewer openings. A photo from a distance is enough.
        </p>
      </div>

      {step === 1 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-xl font-bold">Step 1 of 3 — What is dangerous?</legend>
          <div role="radiogroup" aria-label="Hazard type" aria-describedby={err("hazardCategory") ? "cat-err" : undefined} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {HazardCategory.options.map((c) => (
              <label
                key={c}
                className={cn(
                  "tap flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-center font-medium hover:bg-accent",
                  draft.hazardCategory === c && "border-primary bg-primary/10 ring-2 ring-primary",
                )}
              >
                <input type="radio" name="hazardCategory" value={c} checked={draft.hazardCategory === c} onChange={() => set("hazardCategory", c)} className="sr-only" />
                {HAZARD_LABEL[c]}
              </label>
            ))}
          </div>
          {err("hazardCategory") && <p id="cat-err" className="text-sm text-status-red">Choose what kind of hazard it is.</p>}
          <PhotoPicker max={2} label="Photo (optional)" hint="Take the photo from where you stand. Do not go closer to the hazard." onChange={setPhotos} />
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-xl font-bold">Step 2 of 3 — Tell us more</legend>
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="font-medium">What did you see?</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              minLength={10}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              aria-describedby={err("description") ? "desc-err" : "desc-hint"}
              className="rounded-lg border bg-background px-3 py-2"
              placeholder="e.g. Open manhole on the footpath, no cover, water inside after the rain."
            />
            <p id="desc-hint" className="text-sm text-muted-foreground">At least 10 characters. Do not include people's names.</p>
            {err("description") && <p id="desc-err" className="text-sm text-status-red">Please describe the hazard in at least 10 characters.</p>}
          </div>

          <YesNo id="nearSchool" label="Is it near a school, clinic or taxi rank?" value={draft.nearSchool} onChange={(v) => set("nearSchool", v)} />
          <YesNo id="anyoneHurt" label="Is anyone hurt right now?" value={draft.anyoneHurt} onChange={(v) => set("anyoneHurt", v)} />
          {draft.anyoneHurt && (
            <div role="alert" className="rounded-xl border-2 border-status-red/40 bg-status-red-bg p-4 text-status-red">
              <p className="text-lg font-bold">Call 10177 or 112 now.</p>
              <p className="text-sm">SafeGuard SA is not an emergency service. Get help first, then finish this report.</p>
              <div className="mt-3 flex gap-2">
                <a href="tel:10177" className="tap inline-flex items-center gap-2 rounded-lg bg-status-red px-4 py-2 font-semibold text-white"><Phone className="size-5" aria-hidden /> Call 10177</a>
                <a href="tel:112" className="tap inline-flex items-center gap-2 rounded-lg border border-status-red px-4 py-2 font-semibold"><Phone className="size-5" aria-hidden /> Call 112</a>
              </div>
            </div>
          )}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="text-xl font-bold">Step 3 of 3 — Where is it?</legend>
          <Field id="municipality" label="Municipality" error={err("municipality")}>
            <select id="municipality" value={draft.municipality} onChange={(e) => set("municipality", e.target.value)} className="tap w-full rounded-lg border bg-background px-3">
              {MUNICIPALITIES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="__other">Other (type it)</option>
            </select>
          </Field>
          {draft.municipality === "__other" && (
            <Field id="municipalityOther" label="Municipality name" error={err("municipality")}>
              <input id="municipalityOther" value={draft.municipalityOther} onChange={(e) => set("municipalityOther", e.target.value)} className="tap w-full rounded-lg border bg-background px-3" />
            </Field>
          )}
          <Field id="suburb" label="Suburb or township" error={err("suburb") && "Please enter the suburb."}>
            <input id="suburb" required value={draft.suburb} onChange={(e) => set("suburb", e.target.value)} className="tap w-full rounded-lg border bg-background px-3" placeholder="e.g. Freedom Park" />
          </Field>
          <Field id="street" label="Street (optional)">
            <input id="street" value={draft.street} onChange={(e) => set("street", e.target.value)} className="tap w-full rounded-lg border bg-background px-3" />
          </Field>
          <Field id="landmark" label="Nearest landmark" hint="Something everyone knows: 'opposite the school gate', 'next to the taxi rank'." error={err("landmark") && "Please give a landmark (at least 3 characters)."}>
            <input id="landmark" required minLength={3} value={draft.landmark} onChange={(e) => set("landmark", e.target.value)} className="tap w-full rounded-lg border bg-background px-3" placeholder="e.g. about 400 m from the school gate" />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={locate} disabled={locating} className="tap inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-accent disabled:opacity-60">
              <LocateFixed className="size-5" aria-hidden /> {locating ? "Locating…" : "Use my location (approximate)"}
            </button>
            {draft.lat !== null && (
              <span className="text-sm text-status-green">Approximate location captured{draft.accuracy ? ` (±${draft.accuracy} m)` : ""}. This marks where you stand, not the hole.</span>
            )}
          </div>

          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer font-medium">Optional: contact and official reference</summary>
            <div className="mt-3 flex flex-col gap-3">
              <Field id="contact" label="Your phone or email (staff only, never public)">
                <input id="contact" value={draft.contact} onChange={(e) => set("contact", e.target.value)} className="tap w-full rounded-lg border bg-background px-3" autoComplete="tel" />
              </Field>
              <Field id="municipalRef" label="Official municipal reference, if you already have one" hint="Only enter a number the municipality gave you. We never invent one.">
                <input id="municipalRef" value={draft.municipalRef} onChange={(e) => set("municipalRef", e.target.value)} className="tap w-full rounded-lg border bg-background px-3 font-mono" />
              </Field>
            </div>
          </details>
        </fieldset>
      )}

      <ProblemBox problem={problem} />

      <div className="sticky-submit flex gap-3 pt-3">
        {step > 1 && (
          <button type="button" onClick={() => goto((step - 1) as 1 | 2)} className="tap rounded-xl border px-5 py-3 font-semibold hover:bg-accent">
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={pending || (step === 1 && !draft.hazardCategory)}
          className="tap flex-1 rounded-xl bg-primary px-5 py-3 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {step < 3 ? "Continue" : pending ? "Sending…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | false; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-status-red">{error}</p>}
    </div>
  );
}

function YesNo({ id, label, value, onChange }: { id: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      <div role="radiogroup" className="mt-1 flex gap-2">
        {[true, false].map((v) => (
          <label key={String(v)} className={cn("tap flex cursor-pointer items-center justify-center rounded-lg border px-5 font-medium hover:bg-accent", value === v && "border-primary bg-primary/10 ring-2 ring-primary")}>
            <input type="radio" name={id} className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            {v ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProblemBox({ problem }: { problem: ProblemDetails | null }) {
  if (!problem) return null;
  return (
    <div role="alert" className="rounded-xl border border-status-red/40 bg-status-red-bg p-3 text-sm text-status-red">
      <p className="font-semibold">{problem.title}</p>
      {problem.detail && <p>{problem.detail}</p>}
    </div>
  );
}

function Confirmation({ ref_, viaSighting }: { ref_: string; viaSighting?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(ref_);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }
  return (
    <section aria-labelledby="done" className="flex flex-col gap-5">
      <div className="rounded-2xl border bg-card p-5 text-center">
        <p className="text-sm font-medium text-muted-foreground">{viaSighting ? "Your sighting was added to" : "Your reference"}</p>
        <p id="done" className="ref mt-1 text-4xl font-bold">{ref_}</p>
        <p className="mt-2 text-status-red font-semibold">Received — Not made safe</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={copy} className="tap inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold hover:bg-accent">
            {copied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />} {copied ? "Copied" : "Copy reference"}
          </button>
          <Link href={`/track/${ref_}`} className="tap inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90">
            Track this report
          </Link>
        </div>
      </div>
      <div className="rounded-xl border p-4">
        <h2 className="font-bold">What happens next</h2>
        <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm">
          <li>A community worker or ward coordinator reviews the report and sets a make-safe deadline.</li>
          <li>A field team may put up a barrier. That shows as <strong>Barrier recorded, not yet checked</strong>.</li>
          <li>Only when an authorised reviewer checks it does it become <strong>Verified</strong> and the clock stops.</li>
          <li>The repair is tracked separately and also has to be verified.</li>
          <li>If the barrier disappears, tap <strong>Barrier gone</strong> on the track page. The clock restarts.</li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          Also report it to your municipality's call centre and keep their reference number. You can add it to this case later. This report is not an emergency dispatch.
        </p>
      </div>
    </section>
  );
}
