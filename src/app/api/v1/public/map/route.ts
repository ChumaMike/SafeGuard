import { NextResponse } from "next/server";
import { handleRouteError } from "@/server/http";
import { publicMapPoints } from "@/server/services/publicCases";

/** Approximate pins (about 100 m) for every open or resolved case. Nothing personal. */
export async function GET() {
  try {
    const points = await publicMapPoints();
    return NextResponse.json({ points }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return handleRouteError(e);
  }
}
