import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db/client";
import { formatRef, nextRef, normaliseRef, setRefCounter } from "@/server/domain/reference";
import { setupDb } from "./helpers";

beforeAll(setupDb);

describe("reference numbers", () => {
  it("formats SG-2026-NNNN", () => {
    expect(formatRef(16, 2026)).toBe("SG-2026-0016");
    expect(formatRef(3, 2026)).toBe("SG-2026-0003");
  });

  it("continues from the seeded counter", async () => {
    await setRefCounter(db, 15);
    const now = new Date("2026-10-16T10:00:00.000Z");
    expect(await nextRef(db, now)).toBe("SG-2026-0016");
    expect(await nextRef(db, now)).toBe("SG-2026-0017");
  });

  it("normalises user input", () => {
    expect(normaliseRef(" sg-2026-0014 ")).toBe("SG-2026-0014");
    expect(normaliseRef("SG 2026 0014")).toBe("SG-2026-0014");
    expect(normaliseRef("abc")).toBeNull();
  });
});
