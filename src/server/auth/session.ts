import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { sessions, users, type User } from "@/server/db/schema";
import type { StaffRole } from "@/lib/contracts/enums";
import { Problem } from "@/server/domain/errors";
import { can, type PermissionAction, type Principal } from "@/server/domain/permissions";

export const SESSION_COOKIE = "sg_session";

const ttlHours = () => Number(process.env.SESSION_TTL_HOURS ?? 12);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export interface SessionUser extends Principal {
  email: string;
  displayName: string;
  role: StaffRole;
}

function toSessionUser(u: User): SessionUser {
  return { id: u.id, email: u.email, displayName: u.displayName, role: u.role };
}

/** Creates a DB-backed session and returns the opaque token for the cookie. */
export async function createSession(userId: string, now: Date = new Date()): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlHours() * 3600 * 1000).toISOString(),
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlHours() * 3600,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function userForToken(token: string, now: Date = new Date()): Promise<SessionUser | null> {
  const row = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, now.toISOString()), eq(users.active, true)))
    .get();
  return row ? toSessionUser(row.user) : null;
}

/** The current staff user for this request, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  return userForToken(token);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Problem(401, "Sign in required");
  return user;
}

export async function requirePermission(action: PermissionAction): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, action)) throw new Problem(403, `Your role (${user.role}) cannot do this`);
  return user;
}
