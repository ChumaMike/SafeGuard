import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { evidence } from "@/server/db/schema";
import { Problem } from "@/server/domain/errors";
import { can } from "@/server/domain/permissions";
import { handleRouteError } from "@/server/http";
import { getCurrentUser } from "@/server/auth/session";
import { storage } from "@/server/storage";

/** Private evidence. Only staff with evidence.view may stream a file; nothing lives under /public. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user, "evidence.view")) throw new Problem(403, "Staff sign-in required to view evidence");

    const { id } = await ctx.params;
    const row = await db.select().from(evidence).where(eq(evidence.id, id)).get();
    if (!row) throw new Problem(404, "Evidence not found");
    const data = await storage().get(row.storageKey);
    if (!data) throw new Problem(404, "Evidence file missing");
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": row.mime,
        "content-length": String(data.byteLength),
        "cache-control": "private, max-age=300",
        "content-disposition": `inline; filename="${row.id}.jpg"`,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
