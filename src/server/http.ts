import { NextResponse } from "next/server";
import * as z from "zod";
import { Problem, toProblemDetails, type ProblemDetails } from "@/server/domain/errors";

export function problemResponse(p: ProblemDetails, headers?: HeadersInit): NextResponse {
  return NextResponse.json(p, {
    status: p.status,
    headers: { "content-type": "application/problem+json", ...(headers ?? {}) },
  });
}

/** Turns any thrown error into an RFC 9457 response. Unknown errors become a 500 without leaking details. */
export function handleRouteError(e: unknown): NextResponse {
  if (e instanceof Problem) return problemResponse(e.toJSON());
  console.error(e);
  return problemResponse(toProblemDetails(e));
}

export function validationProblem(error: z.ZodError): Problem {
  const flat = z.flattenError(error);
  return new Problem(400, "Validation failed", undefined, flat.fieldErrors as Record<string, string[]>);
}

export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw validationProblem(r.error);
  return r.data;
}

/** Reads JSON or multipart/urlencoded bodies into a plain object. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const j = await req.json().catch(() => null);
    return typeof j === "object" && j !== null ? (j as Record<string, unknown>) : {};
  }
  if (type.includes("form")) {
    const fd = await req.formData();
    return formDataToObject(fd);
  }
  return {};
}

export function formDataToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
