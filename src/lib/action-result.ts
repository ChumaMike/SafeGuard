import type { ProblemDetails } from "@/server/domain/errors";

export type { ProblemDetails };

/** Every server action returns this shape so forms can render problems without try/catch. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; problem: ProblemDetails };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (problem: ProblemDetails): ActionResult<never> => ({ ok: false, problem });

export function fieldError(problem: ProblemDetails | undefined, field: string): string | undefined {
  return problem?.errors?.[field]?.[0];
}
