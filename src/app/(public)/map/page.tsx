import Link from "next/link";
import { MapPin, School } from "lucide-react";
import { HazardMapLoader } from "@/components/public/HazardMapLoader";
import { ProtectionClock } from "@/components/case/ProtectionClock";
import { StatusBadge, type Tone } from "@/components/case/StatusBadge";
import { HAZARD_LABEL } from "@/lib/contracts/labels";
import { publicMapPoints, type PublicMapPoint } from "@/server/services/publicCases";

export const metadata = { title: "Hazard map" };
export const dynamic = "force-dynamic";

function tone(p: PublicMapPoint): { tone: Tone; label: string } {
  if (p.public_status === "Resolved") return { tone: "green", label: "Resolved (verified)" };
  if (p.protection === "verified") return { tone: "green", label: "Made safe (verified)" };
  if (p.protection === "recorded") return { tone: "amber", label: "Barrier recorded, not yet checked" };
  return { tone: "red", label: "Unprotected" };
}

export default async function MapPage() {
  const points = await publicMapPoints();
  const exposed = points.filter((p) => p.protection === "not_yet" && p.public_status !== "Resolved").length;
  const unpinned = points.filter((p) => p.lat === null).length;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Hazards near you</h1>
        <p className="text-muted-foreground">
          Every reported hazard that has not been dismissed. Pins are approximate (about 100 m). Red means nobody has verified a barrier yet.
        </p>
      </header>

      <ul className="flex flex-wrap gap-2 text-sm" aria-label="Legend">
        <li className="inline-flex items-center gap-2 rounded-full border px-3 py-1"><span className="size-3 rounded-full bg-status-red" aria-hidden /> Unprotected ({exposed})</li>
        <li className="inline-flex items-center gap-2 rounded-full border px-3 py-1"><span className="size-3 rounded-full bg-status-amber" aria-hidden /> Barrier recorded, not yet checked</li>
        <li className="inline-flex items-center gap-2 rounded-full border px-3 py-1"><span className="size-3 rounded-full bg-status-green" aria-hidden /> Made safe or resolved (verified)</li>
        <li className="inline-flex items-center gap-2 rounded-full border px-3 py-1"><School className="size-4 text-status-amber" aria-hidden /> Bigger pin = near a school</li>
      </ul>

      <HazardMapLoader points={points} />

      <section aria-labelledby="list" className="flex flex-col gap-3">
        <h2 id="list" className="text-lg font-bold">All hazards, longest unprotected first</h2>
        {unpinned > 0 && <p className="text-sm text-muted-foreground">{unpinned} without a pin: the reporter gave a landmark only.</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {points.map((p) => {
            const t = tone(p);
            return (
              <li key={p.ref}>
                <Link href={`/track/${p.ref}`} className="block rounded-xl border bg-card p-4 hover:bg-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="ref text-xs text-muted-foreground">{p.ref}</p>
                      <p className="font-semibold">{HAZARD_LABEL[p.hazard_category] ?? p.hazard_category}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{p.landmark} · {p.suburb}</span>
                      </p>
                    </div>
                    <StatusBadge tone={t.tone} label={t.label} size="sm" className="shrink-0" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <ProtectionClock startedAt={p.clock.started_at} stoppedAt={p.clock.stopped_at} size="sm" />
                    {p.near_school && (
                      <span className="inline-flex items-center gap-1 font-medium text-status-amber">
                        <School className="size-4" aria-hidden /> Near a school
                      </span>
                    )}
                    {p.lat === null && <span className="text-muted-foreground">No pin</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        Map data © OpenStreetMap contributors. Locations are rounded so nobody's home is marked. No photos, names or contact details are shown here.
      </p>
    </div>
  );
}
