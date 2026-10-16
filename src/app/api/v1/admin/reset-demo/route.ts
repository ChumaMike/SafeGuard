import { NextResponse } from "next/server";
import { isDemoMode } from "@/server/auth/demo";
import { Problem } from "@/server/domain/errors";
import { handleRouteError } from "@/server/http";
import { resetRateLimits } from "@/server/rate-limit";
import { seedDemo } from "@/server/seed/demo-seed";

/** Restores the fictional seed. Only when DEMO_MODE=true. Also clears rate-limit buckets. */
export async function POST() {
  try {
    if (!isDemoMode()) throw new Problem(404, "Not found");
    const summary = await seedDemo();
    resetRateLimits();
    return NextResponse.json({ status: "reset", ...summary });
  } catch (e) {
    return handleRouteError(e);
  }
}
