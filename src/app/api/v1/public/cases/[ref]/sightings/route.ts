import { NextResponse } from "next/server";
import { SightingInput } from "@/lib/contracts/inputs";
import { Problem } from "@/server/domain/errors";
import { toPublicView } from "@/server/domain/publicView";
import { normaliseRef } from "@/server/domain/reference";
import { handleRouteError, parseOrThrow, problemResponse, readBody } from "@/server/http";
import { FIFTEEN_MINUTES, checkRateLimit, clientIp } from "@/server/rate-limit";
import { recordSighting } from "@/server/services/sightings";

export async function POST(req: Request, ctx: { params: Promise<{ ref: string }> }) {
  try {
    const { ref: raw } = await ctx.params;
    const ref = normaliseRef(decodeURIComponent(raw));
    if (!ref) throw new Problem(404, "No case with that reference");

    const rl = checkRateLimit(`sightings:${clientIp(req)}:${ref}`, 5, FIFTEEN_MINUTES);
    if (!rl.ok) {
      return problemResponse(new Problem(429, "Too many sightings for this case. Try again later.").toJSON(), {
        "retry-after": String(rl.retryAfterSeconds),
      });
    }

    const input = parseOrThrow(SightingInput, await readBody(req));
    const result = await recordSighting(ref, input.kind, input.idempotencyKey, new Date(), input.observedAt);
    return NextResponse.json(
      { status: result.replayed ? "replayed" : "recorded", reopened: result.reopened, case: toPublicView(result.case) },
      { status: result.replayed ? 200 : 201 },
    );
  } catch (e) {
    return handleRouteError(e);
  }
}
