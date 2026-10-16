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
