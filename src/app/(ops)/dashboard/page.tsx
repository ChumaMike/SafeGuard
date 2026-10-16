import Link from "next/link";
import { redirect } from "next/navigation";
import { School } from "lucide-react";
import { CaseCard } from "@/components/case/CaseCard";
import { DashboardCounts } from "@/components/ops/DashboardCounts";
import { formatDuration } from "@/lib/clock";
import { getCurrentUser } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { dashboardCounts, exposedQueue, wardList } from "@/server/services/dashboard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user, "dashboard.view")) {
    return (
      <div className="rounded-xl border border-dashed p-6">
        <h1 className="text-xl font-bold">Dashboard: only the ops manager or reviewer</h1>
        <p className="mt-1 text-muted-foreground">Your role ({user.role}) sees its own work on <Link href="/home" className="underline">Home</Link>.</p>
      </div>
    );
  }

  const [counts, exposed, wards] = await Promise.all([dashboardCounts(), exposedQueue(), wardList()]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">Ward safety dashboard</h1>
        <p className="text-sm text-muted-foreground">Who is still exposed, for how long, and what has actually been verified.</p>
      </header>

      <DashboardCounts initial={counts} />

      <section aria-labelledby="exposed" className="flex flex-col gap-3">
        <h2 id="exposed" className="text-lg font-bold">Exposed now</h2>
        <p className="text-sm text-muted-foreground">No verified protection yet. Longest unprotected first. Clocks are live.</p>
        {exposed.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">Nobody is exposed right now.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {exposed.map((c) => (
              <li key={c.id}>
                <CaseCard c={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="wards" className="flex flex-col gap-3">
        <h2 id="wards" className="text-lg font-bold">By suburb</h2>
        <p className="text-sm text-muted-foreground">Sorted by the longest time anyone has been unprotected. Near-school cases flagged.</p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th scope="col" className="px-3 py-2">Suburb</th>
                <th scope="col" className="px-3 py-2">Open</th>
                <th scope="col" className="px-3 py-2">Exposed</th>
                <th scope="col" className="px-3 py-2">Longest unprotected</th>
                <th scope="col" className="px-3 py-2">Near a school</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => (
                <tr key={`${w.municipality}-${w.suburb}`} className="border-t">
                  <td className="px-3 py-2">
                    <span className="font-medium">{w.suburb}</span>
                    <span className="block text-xs text-muted-foreground">{w.municipality}</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{w.openCases}</td>
                  <td className="px-3 py-2 tabular-nums">{w.exposedCases}</td>
                  <td className="px-3 py-2">{w.exposedCases > 0 ? <span className="font-semibold text-status-red">{formatDuration(w.longestUnprotectedMs)}</span> : <span className="text-status-green">Protected</span>}</td>
                  <td className="px-3 py-2">
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
