import "server-only";
import * as z from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { Problem, toProblemDetails } from "@/server/domain/errors";

/** Runs an action body and converts thrown Problems (or Zod errors) into an ActionResult. */
export async function wrap<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    if (e instanceof Problem) return fail(e.toJSON());
    if (e instanceof z.ZodError) {
      const flat = z.flattenError(e);
      return fail({
        type: "about:blank",
        title: "Please check the form",
        status: 400,
        errors: flat.fieldErrors as Record<string, string[]>,
      });
    }
    // Next.js redirect()/notFound() throw special errors that must pass through.
    if (typeof e === "object" && e !== null && "digest" in e) throw e;
    console.error(e);
    return fail(toProblemDetails(e));
  }
}

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

export function formObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
