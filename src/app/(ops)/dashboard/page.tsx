import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPinned, School } from "lucide-react";
import { CaseCard } from "@/components/case/CaseCard";
import { DashboardCounts } from "@/components/ops/DashboardCounts";
import { HazardMapLoader } from "@/components/public/HazardMapLoader";
import { formatDuration } from "@/lib/clock";
import { getCurrentUser } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { dashboardCounts, exposedQueue, wardList } from "@/server/services/dashboard";
import { publicMapPoints } from "@/server/services/publicCases";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user, "dashboard.view")) {
    return (
      <div className="rounded-2xl border border-dashed p-6">
        <h1 className="text-xl font-bold">Dashboard: only the ops manager or reviewer</h1>
        <p className="mt-1 text-muted-foreground">Your role ({user.role}) sees its own work on <Link href="/home" className="underline">My work</Link>.</p>
      </div>
    );
  }

  const [counts, exposed, wards, points] = await Promise.all([dashboardCounts(), exposedQueue(), wardList(), publicMapPoints()]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-action">Ward safety</p>
          <h1 className="text-3xl font-bold tracking-tight">Who is still exposed, and what has actually been verified</h1>
        </div>
        <Link href="/map" className="tap inline-flex items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium shadow-sm hover:bg-accent">
          <MapPinned className="size-4" aria-hidden /> Full-screen map
        </Link>
      </header>

      <DashboardCounts initial={counts} />

      <section aria-labelledby="map" className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="map" className="text-lg font-bold">Where the hazards are</h2>
          <ul className="flex flex-wrap gap-2 text-xs" aria-label="Legend">
            <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-status-red" aria-hidden /> Unprotected</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-status-amber" aria-hidden /> Recorded, not checked</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-status-green" aria-hidden /> Verified</li>
            <li className="inline-flex items-center gap-1.5"><School className="size-3.5 text-status-amber" aria-hidden /> Bigger pin = near a school</li>
          </ul>
        </div>
        <HazardMapLoader points={points} />
      </section>

      <section aria-labelledby="exposed" className="flex flex-col gap-3">
        <div>
          <h2 id="exposed" className="text-lg font-bold">Exposed now</h2>
          <p className="text-sm text-muted-foreground">No verified protection yet. Longest unprotected first. Clocks are live.</p>
        </div>
        {exposed.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">Nobody is exposed right now.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {exposed.map((c) => (
              <li key={c.id}>
                <CaseCard c={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="wards" className="flex flex-col gap-3">
        <div>
          <h2 id="wards" className="text-lg font-bold">By suburb</h2>
          <p className="text-sm text-muted-foreground">Sorted by the longest time anyone has been unprotected. Near-school cases flagged.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Suburb</th>
                <th scope="col" className="px-4 py-3">Open</th>
                <th scope="col" className="px-4 py-3">Exposed</th>
                <th scope="col" className="px-4 py-3">Longest unprotected</th>
                <th scope="col" className="px-4 py-3">Near a school</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => (
                <tr key={`${w.municipality}-${w.suburb}`} className="border-t">
                  <td className="px-4 py-3">
                    <span className="font-medium">{w.suburb}</span>
                    <span className="block text-xs text-muted-foreground">{w.municipality}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{w.openCases}</td>
                  <td className="px-4 py-3 tabular-nums">{w.exposedCases}</td>
                  <td className="px-4 py-3">{w.exposedCases > 0 ? <span className="font-semibold text-status-red">{formatDuration(w.longestUnprotectedMs)}</span> : <span className="text-status-green">Protected</span>}</td>
                  <td className="px-4 py-3">
                    {w.nearSchool > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-status-amber">
                        <School className="size-4" aria-hidden /> {w.nearSchool}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
