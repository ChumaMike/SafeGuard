import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/session";
import { handleRouteError } from "@/server/http";
import { dashboardCounts } from "@/server/services/dashboard";

export async function GET() {
  try {
    await requirePermission("dashboard.view");
    const counts = await dashboardCounts();
    return NextResponse.json(counts, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return handleRouteError(e);
  }
}
