import { NextResponse } from "next/server";
import { PublicReportInput } from "@/lib/contracts/inputs";
import { Problem } from "@/server/domain/errors";
import { formDataToObject, handleRouteError, parseOrThrow, problemResponse, readBody } from "@/server/http";
import { attachPublicPhotos, photosFromFormData } from "@/server/services/evidence";
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

    let body: Record<string, unknown>;
    let photos: File[] = [];
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const fd = await req.formData();
      body = formDataToObject(fd);
      photos = photosFromFormData(fd).slice(0, 2);
    } else {
      body = await readBody(req);
    }
    const headerKey = req.headers.get("idempotency-key");
    if (headerKey && !body.idempotencyKey) body.idempotencyKey = headerKey;

    const input = parseOrThrow(PublicReportInput, body);
    const result = await createPublicReport(input);

    if (result.kind === "possible_duplicate") {
      return NextResponse.json({ status: "possible_duplicate", possibleDuplicates: result.possibleDuplicates }, { status: 200 });
    }

    if (!result.replayed && photos.length > 0) await attachPublicPhotos(result.case.id, photos);

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
