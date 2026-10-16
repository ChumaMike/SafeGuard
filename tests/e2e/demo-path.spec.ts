import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import sharp from "sharp";
import { loginAs, resetDemo, type Role } from "./helpers";

/**
 * The 8-step demo path from docs/06-demo-script.md, run on a fresh report and on the hero case,
 * then the "barrier gone" beat on another protected case. Every request that is not to the local
 * server is blocked and counted, which is how we prove the path works with Wi-Fi off.
 */

test.describe.configure({ mode: "serial" });

let external: string[] = [];

async function guardOffline(context: BrowserContext) {
  external = [];
  await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => {
    external.push(route.request().url());
    return route.abort();
  });
}

async function photo(): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const buffer = await sharp({ create: { width: 320, height: 240, channels: 3, background: "#6b7280" } }).jpeg().toBuffer();
  return { name: "site.jpg", mimeType: "image/jpeg", buffer };
}

async function switchTo(page: Page, role: Role) {
  await page.getByLabel("Switch demo role").selectOption(role);
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Switch demo role")).toHaveValue(role);
}

async function openCase(page: Page, ref: string, tab: string) {
  await page.goto(`/home?tab=${tab}`);
  await page.locator(`a[href^="/cases/"]:has-text("${ref}")`).first().click();
  await expect(page.getByText(ref).first()).toBeVisible();
  return page.url();
}

async function statusIs(page: Page, label: string) {
  await expect(page.getByRole("status").filter({ hasText: label }).first()).toBeVisible({ timeout: 15_000 });
}

async function recordWithPhoto(page: Page, button: string, description: string) {
  await page.getByRole("button", { name: button, exact: true }).click();
  await page.getByLabel("What was done").fill(description);
  await page.locator('input[type="file"][capture]').setInputFiles(await photo());
  await expect(page.getByText(/1 of 5 photos/)).toBeVisible();
  await page.getByRole("button", { name: /Record (barrier|repair) — awaiting verification/ }).click();
}

/** Steps 2–7 from a case that is already uncontained (or unassessed when claimAndTriage is true). */
async function runWorkflow(page: Page, context: BrowserContext, ref: string, opts: { claimAndTriage: boolean }) {
  // 2. Community worker claims and triages
  await loginAs(page, "community_worker");
  await openCase(page, ref, opts.claimAndTriage ? "triage" : "protect");
  const caseUrl = page.url();
  if (opts.claimAndTriage) {
    await page.getByRole("button", { name: "Claim for review" }).click();
    await statusIs(page, "Under review");
    await page.getByRole("button", { name: "Triage and set deadline" }).click();
    await page.getByRole("button", { name: "Mark uncontained and set deadline" }).click();
  }
  await statusIs(page, "Uncontained");
  await expect(page.getByText(/Unprotected for/).first()).toBeVisible();

  // A judge's phone is already on the track page.
  const judge = await context.newPage();
  await judge.goto(`/track/${ref}`);
  await expect(judge.getByText("Not yet").first()).toBeVisible();

  // 3. Field team records a barrier with a photo
  await switchTo(page, "field_team");
  await recordWithPhoto(page, "Record protection", "Steel plate over the hole, cones and danger tape around it.");
  await statusIs(page, "Barrier recorded");
  await expect(judge.getByText("Barrier recorded, not yet checked").first()).toBeVisible({ timeout: 7_000 });
  await expect(judge.getByText(/Unprotected for/).first()).toBeVisible();

  // 4. Reviewer verifies protection: clock stops, judge's phone flips within 5 s
  await switchTo(page, "reviewer");
  await page.getByRole("button", { name: "Verify protection", exact: true }).click();
  await page.getByRole("button", { name: /Verify protection — stop the clock/ }).click();
  await statusIs(page, "Protected (verified)");
  await expect(page.getByText(/Made safe after/).first()).toBeVisible();
  await expect(judge.getByText("Protection in place (verified)").first()).toBeVisible({ timeout: 7_000 });
  await expect(judge.getByText(/Made safe after/).first()).toBeVisible();
  const poster = await context.newPage();
  await poster.goto(`/poster/${ref}`);
  await expect(poster.getByText("PROTECTION VERIFIED")).toBeVisible();
  await poster.close();

  // 5. Ops manager assigns the repair
  await switchTo(page, "ops_manager");
  await page.getByRole("button", { name: "Assign repair crew", exact: true }).click();
  await page.getByRole("button", { name: /Assign crew — repair pending/ }).click();
  await statusIs(page, "Repair pending");
  await expect(judge.getByText("Crew assigned").first()).toBeVisible({ timeout: 7_000 });

  // 6. Field team records the repair
  await switchTo(page, "field_team");
  await recordWithPhoto(page, "Record repair", "New cast-iron cover fitted and frame re-set in concrete.");
  await statusIs(page, "Repair recorded");
  await expect(judge.getByText("Repair recorded, not yet checked").first()).toBeVisible({ timeout: 7_000 });

  // 7. Reviewer verifies closure
  await switchTo(page, "reviewer");
  await page.getByRole("button", { name: "Verify closure", exact: true }).click();
  await page.getByRole("button", { name: /Verify closure — resolve the case/ }).click();
  await statusIs(page, "Resolved (verified)");
  await expect(judge.getByText("Resolved").first()).toBeVisible({ timeout: 7_000 });
  await expect(judge.getByText("Verified").first()).toBeVisible();
  await judge.close();

  // History shows the whole story, newest first, with the latest marked current
  await expect(page.locator('[data-testid="timeline"] li[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByText("Fixed (verified)")).toBeVisible();
  return caseUrl;
}

test.beforeEach(async ({ context }) => {
  await guardOffline(context);
});

test("reset the demo first", async ({ request }) => {
  await resetDemo(request);
});

test("full path on a fresh resident report (SG-2026-0016)", async ({ page, context }) => {
  // 1. Resident reports
  await page.goto("/report");
  await page.getByRole("radio", { name: "Open manhole" }).check({ force: true });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("What did you see?").fill("Open manhole on the footpath to the school, no cover, water inside.");
  await page.getByRole("radiogroup").filter({ has: page.getByText("Yes") }).first().getByText("Yes").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Suburb or township").fill("Zondi");
  await page.getByLabel("Nearest landmark").fill("next to the spaza shop on the corner");
  await page.getByRole("button", { name: "Submit report" }).click();

  const refEl = page.getByText(/SG-2026-\d{4}/).first();
  await expect(refEl).toBeVisible({ timeout: 15_000 });
  const ref = (await refEl.textContent())!.match(/SG-2026-\d{4}/)![0];
  expect(ref).toBe("SG-2026-0016");
  await expect(page.getByText("Received — Not made safe")).toBeVisible();

  await page.goto(`/track/${ref}`);
  await expect(page.getByText("Received").first()).toBeVisible();
  await expect(page.getByText("Not yet")).toHaveCount(2);
  await expect(page.getByText(/Unprotected for/).first()).toBeVisible();

  await runWorkflow(page, context, ref, { claimAndTriage: true });
  expect(external, `external requests attempted: ${external.join(", ")}`).toHaveLength(0);
});

test("full path on the hero case SG-2026-0014", async ({ page, context }) => {
  await runWorkflow(page, context, "SG-2026-0014", { claimAndTriage: false });
  expect(external).toHaveLength(0);
});

test("barrier gone: a resident sends a protected case back to uncontained and the clock restarts", async ({ page }) => {
  await page.goto("/track/SG-2026-0012");
  await expect(page.getByText("Protection in place (verified)").first()).toBeVisible();
  await expect(page.getByText(/Made safe after/).first()).toBeVisible();
  await page.getByRole("button", { name: "Barrier gone" }).click();
  await expect(page.getByText(/back to uncontained and the clock has restarted/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Being assessed").first()).toBeVisible();
  await expect(page.getByText(/Unprotected for under a minute/).first()).toBeVisible();
  await expect(page.getByText("Not yet").first()).toBeVisible();
  expect(external).toHaveLength(0);
});

test("reset-demo restores the 7 seed cases", async ({ request }) => {
  await resetDemo(request);
  const r = await request.get("/api/v1/public/cases/SG-2026-0012");
  expect((await r.json()).protection).toBe("verified");
  expect((await request.get("/api/v1/public/cases/SG-2026-0016")).status()).toBe(404);
  const ops = await request.get("/api/v1/public/cases/SG-2026-0014");
  expect((await ops.json()).public_status).toBe("Being assessed");
});
