import Link from "next/link";
import { redirect } from "next/navigation";
import { DEMO_ACCOUNTS } from "@/server/auth/demo";
import { getCurrentUser } from "@/server/auth/session";
import { ROLE_LABEL, STAFF_ROLES } from "@/lib/contracts/labels";
import { demoEnterAction } from "@/server/actions/auth";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Choose who you are" };

const ROLE_BLURB: Record<(typeof STAFF_ROLES)[number], string> = {
  community_worker: "Triage new reports and record barriers",
  ops_manager: "Dashboard, assign repair crews, dismiss or reopen",
  field_team: "Record barriers and repairs with photos",
  reviewer: "The only role that can verify protection or a repair",
};

/**
 * One tap, no password. This is a demo: the four people are fictional and anyone at the laptop can
 * be any of them. Server-side permissions still apply to whoever is chosen.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-160.png" alt="SafeGuard SA" width={72} height={72} className="size-18 rounded-xl" />
        <h1 className="text-2xl font-bold">Who are you today?</h1>
        <p className="text-sm text-muted-foreground">
          Demo sign-in, no password. Residents never need an account: <Link href="/report" className="underline">report a hazard</Link>,{" "}
          <Link href="/map" className="underline">see the map</Link> or <Link href="/track" className="underline">track a case</Link>.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-status-red-bg p-3 text-sm text-status-red">
          {error}
        </p>
      )}

      <section aria-labelledby="demo" className="rounded-xl border-2 border-brand/60 bg-brand/10 p-4">
        <h2 id="demo" className="font-bold">DEMO · simulated roles · all data fictional</h2>
        <ul className="mt-3 grid gap-2">
          {STAFF_ROLES.map((role) => (
            <li key={role}>
              <form action={demoEnterAction.bind(null, role, next)}>
                <button type="submit" className="tap flex w-full items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3 text-left hover:bg-accent">
                  <span className="min-w-0">
                    <span className="block font-semibold">{DEMO_ACCOUNTS[role].displayName}</span>
                    <span className="block text-xs text-muted-foreground">{DEMO_ACCOUNTS[role].blurb} · {ROLE_BLURB[role]}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">{ROLE_LABEL[role]}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">You can switch person at any time from the yellow banner. Permissions are enforced on the server for whoever you pick.</p>
      </section>
    </div>
  );
}
