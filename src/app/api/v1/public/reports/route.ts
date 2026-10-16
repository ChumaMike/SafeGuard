import { NextResponse } from "next/server";
import { PublicReportInput } from "@/lib/contracts/inputs";
import { Problem } from "@/server/domain/errors";
import { handleRouteError, parseOrThrow, problemResponse, readBody } from "@/server/http";
import { FIFTEEN_MINUTES, checkRateLimit, clientIp } from "@/server/rate-limit";
import { createPublicReport } from "@/server/services/cases";

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(`reports:${clientIp(req)}`, 10, FIFTEEN_MINUTES);
    if (!rl.ok) {
      return problemResponse(new Problem(429, "Too many reports from this connection. Try again later.").toJSON(), {
        "retry-after": String(rl.retryAfterSeconds),
      });
    }

    const body = await readBody(req);
    const headerKey = req.headers.get("idempotency-key");
    if (headerKey && !body.idempotencyKey) body.idempotencyKey = headerKey;

    const input = parseOrThrow(PublicReportInput, body);
    const result = await createPublicReport(input);

    if (result.kind === "possible_duplicate") {
      return NextResponse.json({ status: "possible_duplicate", possibleDuplicates: result.possibleDuplicates }, { status: 200 });
    }

    return NextResponse.json(
      {
        status: "created",
        ref: result.case.ref,
        trackPath: `/track/${result.case.ref}`,
        replayed: result.replayed,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleRouteError(e);
  }
}
