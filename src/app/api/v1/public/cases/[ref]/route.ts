import { NextResponse } from "next/server";
import { Problem } from "@/server/domain/errors";
import { handleRouteError } from "@/server/http";
import { publicCaseByRef } from "@/server/services/publicCases";

export async function GET(_req: Request, ctx: { params: Promise<{ ref: string }> }) {
  try {
    const { ref } = await ctx.params;
    const view = await publicCaseByRef(decodeURIComponent(ref));
    if (!view) throw new Problem(404, "No case with that reference");
    return NextResponse.json(view, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return handleRouteError(e);
  }
}
