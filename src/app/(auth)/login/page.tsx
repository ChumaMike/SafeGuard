import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { DEMO_ACCOUNTS, isDemoMode } from "@/server/auth/demo";
import { getCurrentUser } from "@/server/auth/session";
import { ROLE_LABEL, StaffRole } from "@/lib/contracts/enums";
import { demoEnterAction } from "@/server/actions/auth";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Staff sign-in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);
  const user = await getCurrentUser();
  if (user) redirect(next);
  const demo = isDemoMode();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-160.png" alt="SafeGuard SA" width={72} height={72} className="size-18 rounded-xl" />
        <h1 className="text-2xl font-bold">Staff sign-in</h1>
        <p className="text-sm text-muted-foreground">Residents do not need an account. <Link href="/report" className="underline">Report a hazard</Link> or <Link href="/track" className="underline">track one</Link>.</p>
      </header>

      {demo && (
        <section aria-labelledby="demo" className="rounded-xl border-2 border-brand/60 bg-brand/10 p-4">
          <h2 id="demo" className="font-bold">DEMO · simulated roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">Fictional people. Pick a role to enter as them; you can switch roles at any time from the banner.</p>
          <ul className="mt-3 grid gap-2">
            {StaffRole.options.map((role) => (
              <li key={role}>
                <form action={demoEnterAction.bind(null, role, next)}>
                  <button type="submit" className="tap flex w-full items-center justify-between rounded-lg border bg-background px-4 py-2 text-left hover:bg-accent">
                    <span>
                      <span className="block font-semibold">{DEMO_ACCOUNTS[role].displayName}</span>
                      <span className="block text-xs text-muted-foreground">{DEMO_ACCOUNTS[role].blurb}</span>
                    </span>
                    <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">{ROLE_LABEL[role]}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="pw" className="rounded-xl border bg-card p-4">
        <h2 id="pw" className="font-bold">Sign in with email</h2>
        <LoginForm next={next} />
      </section>
    </div>
  );
}
