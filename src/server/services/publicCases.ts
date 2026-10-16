import "server-only";
import { toPublicView } from "@/server/domain/publicView";
import { normaliseRef } from "@/server/domain/reference";
import type { PublicCaseView } from "@/lib/contracts/public-view";
import { getCaseByRef } from "./cases";

/** The only way the public reads a case: whitelist projection or nothing. */
export async function publicCaseByRef(refInput: string): Promise<PublicCaseView | null> {
  const ref = normaliseRef(refInput);
  if (!ref) return null;
  const c = await getCaseByRef(ref);
  return c ? toPublicView(c) : null;
}

export interface PublicMapPoint extends PublicCaseView {
  /** Rounded to ~100 m. Null when the reporter gave only a landmark. */
  lat: number | null;
  lng: number | null;
  landmark: string;
  near_school: boolean;
}

/** Every case that is not dismissed, as public projections with approximate coordinates. */
export async function publicMapPoints(): Promise<PublicMapPoint[]> {
  const { db } = await import("@/server/db/client");
  const { cases } = await import("@/server/db/schema");
  const { ne } = await import("drizzle-orm");
  const rows = await db.select().from(cases).where(ne(cases.status, "dismissed")).orderBy(cases.clockStartedAt);
  const round = (n: number | null) => (n === null ? null : Math.round(n * 1000) / 1000);
  return rows.map((c) => ({
    ...toPublicView(c),
    lat: round(c.lat),
    lng: round(c.lng),
    landmark: c.landmark,
    near_school: c.nearSchool,
  }));
}
