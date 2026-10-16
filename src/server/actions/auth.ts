"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { DemoRoleInput, LoginInput } from "@/lib/contracts/inputs";
import type { ActionResult } from "@/lib/action-result";
import { DEMO_ACCOUNTS, isDemoMode } from "@/server/auth/demo";
import { verifyPassword } from "@/server/auth/password";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  readSessionToken,
  requireUser,
  setSessionCookie,
} from "@/server/auth/session";
import { Problem } from "@/server/domain/errors";
import { formObject, parse, wrap } from "./_wrap";

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

export async function loginAction(_prev: ActionResult<undefined> | null, formData: FormData): Promise<ActionResult<undefined>> {
  const result = await wrap(async () => {
    const input = parse(LoginInput, formObject(formData));
    const user = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).get();
    if (!user || !user.active || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new Problem(401, "Email or password is not right");
    }
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return undefined;
  });
  if (result.ok) redirect(safeNext(formData.get("next")));
  return result;
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken();
  if (token) await destroySession(token);
  await clearSessionCookie();
  redirect("/login");
}

/** DEMO_MODE only: swap this session for the seeded account of another role. */
export async function demoSwitchRole(role: string, next?: string): Promise<ActionResult<{ role: string }>> {
  const result = await wrap(async () => {
    if (!isDemoMode()) throw new Problem(404, "Not found");
    const input = parse(DemoRoleInput, { role });
    const acct = DEMO_ACCOUNTS[input.role];
    const user = await db.select().from(users).where(eq(users.email, acct.email)).get();
    if (!user) throw new Problem(500, "Demo accounts are not seeded. Run pnpm db:seed.");
    const old = await readSessionToken();
    if (old) await destroySession(old);
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return { role: input.role };
  });
  if (result.ok) redirect(safeNext(next));
  return result;
}

export async function currentUserOrRedirect() {
  try {
    return await requireUser();
  } catch {
    redirect("/login");
  }
}

/** Form-action wrapper for the login page's role buttons (form actions must return void). */
export async function demoEnterAction(role: string, next: string | undefined, _formData: FormData): Promise<void> {
  const result = await demoSwitchRole(role, next); // redirects on success
  if (!result.ok) redirect(`/login?error=${encodeURIComponent(result.problem.title)}`);
}
