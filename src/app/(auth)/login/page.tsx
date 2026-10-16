import Link from "next/link";
import { redirect } from "next/navigation";
import { DEMO_ACCOUNTS } from "@/server/auth/demo";
import { getCurrentUser } from "@/server/auth/session";
import { ROLE_LABEL, STAFF_ROLES } from "@/lib/contracts/labels";
import { demoEnterAction } from "@/server/actions/auth";
import { safeNext } from "@/lib/safe-next";
import { initials } from "@/components/layout/UserPill";

export const metadata = { title: "Choose who you are" };

const ROLE_BLURB: Record<(typeof STAFF_ROLES)[number], string> = {
  community_worker: "Triage new reports and record barriers",
  ops_manager: "Dashboard, assign repair crews, dismiss or reopen",
  field_team: "Record barriers and repairs with photos",
  reviewer: "The only role that can verify protection or a repair",
};

/**
 * One tap, no password. The four people are fictional and anyone at the laptop can be any of them.
 * Server-side permissions still apply to whoever is chosen.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="hero-gradient min-h-dvh text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        <header className="flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-160.png" alt="SafeGuard SA" width={80} height={80} className="size-20 rounded-2xl bg-white p-1 shadow-lg" />
          <h1 className="text-3xl font-bold">Who are you today?</h1>
          <p className="text-sm text-white/75">
            Demo sign-in, no password. Residents never need an account:{" "}
            <Link href="/report" className="underline">report a hazard</Link>, <Link href="/map" className="underline">see the map</Link> or{" "}
            <Link href="/track" className="underline">track a case</Link>.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl bg-status-red-bg p-3 text-sm text-status-red">
            {error}
          </p>
        )}

        <section aria-labelledby="demo" className="rounded-2xl bg-card p-4 text-foreground shadow-xl">
          <h2 id="demo" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">DEMO · simulated roles · all data fictional</h2>
          <ul className="mt-3 grid gap-2">
            {STAFF_ROLES.map((role) => (
              <li key={role}>
                <form action={demoEnterAction.bind(null, role, next)}>
                  <button type="submit" className="tap flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-3 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md">
                    <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white ring-2 ring-brand/70">
                      {initials(DEMO_ACCOUNTS[role].displayName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{DEMO_ACCOUNTS[role].displayName}</span>
                      <span className="block text-xs text-muted-foreground">{DEMO_ACCOUNTS[role].blurb} · {ROLE_BLURB[role]}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">{ROLE_LABEL[role]}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Switch person at any time from the yellow banner. Permissions are enforced on the server for whoever you pick.</p>
        </section>
      </div>
    </div>
  );
}
