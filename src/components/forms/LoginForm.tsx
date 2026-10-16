"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const problem = state && !state.ok ? state.problem : null;
  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="next" value={next ?? "/home"} />
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="tap rounded-lg border bg-background px-3" placeholder="reviewer@demo.safeguard.test" />
        {problem?.errors?.email && <p className="text-sm text-status-red">{problem.errors.email[0]}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="tap rounded-lg border bg-background px-3" />
      </div>
      {problem && !problem.errors && (
        <p role="alert" className="rounded-lg bg-status-red-bg p-2 text-sm text-status-red">{problem.title}</p>
      )}
      <button type="submit" disabled={pending} className="tap rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
