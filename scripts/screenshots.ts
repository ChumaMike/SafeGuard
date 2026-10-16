/**
 * Captures the screenshots used in the pitch deck and docs from the running dev server.
 * Usage: pnpm dev (in another terminal) then `pnpm tsx scripts/screenshots.ts`
 * Output: docs/presentation/screenshots/*.png
 */
import { mkdirSync } from "node:fs";
import { chromium, devices, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/presentation/screenshots";

async function enterAs(page: Page, person: string) {
  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: new RegExp(person) }).click();
  await page.waitForURL(/\/home/);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // Reset to the seed so the pictures match the demo script.
  const ctx0 = await browser.newContext();
  await ctx0.request.post(`${BASE}/api/v1/admin/reset-demo`);
  await ctx0.close();

  // Phone screens
  const phone = await browser.newContext({ ...devices["Pixel 7"], colorScheme: "light" });
  const p = await phone.newPage();
  await p.goto(`${BASE}/report`);
  await p.getByRole("radio", { name: "Open manhole" }).check({ force: true });
  await p.screenshot({ path: `${OUT}/phone-report-step1.png`, fullPage: true });

  await p.goto(`${BASE}/track/SG-2026-0014`);
  await p.waitForSelector("text=Unprotected for");
  await p.screenshot({ path: `${OUT}/phone-track-uncontained.png`, fullPage: true });

  await p.goto(`${BASE}/track/SG-2026-0012`);
  await p.waitForSelector("text=Made safe after");
  await p.screenshot({ path: `${OUT}/phone-track-protected.png`, fullPage: true });

  await p.goto(`${BASE}/poster/SG-2026-0014`);
  await p.screenshot({ path: `${OUT}/phone-poster.png`, fullPage: true });
  await phone.close();

  // Desktop ops screens
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", deviceScaleFactor: 1.5 });
  const d = await desk.newPage();
  await enterAs(d, "Sipho K.");
  await d.goto(`${BASE}/dashboard`);
  await d.waitForSelector("text=Exposed now");
  await d.screenshot({ path: `${OUT}/desk-dashboard.png`, fullPage: false });

  await d.goto(`${BASE}/home?tab=cases`);
  await d.locator('a[href^="/cases/"]:has-text("SG-2026-0014")').first().click();
  await d.waitForSelector("text=History (newest first)");
  await d.screenshot({ path: `${OUT}/desk-case-hero.png`, fullPage: false });

  await d.getByLabel("Switch demo role").selectOption("reviewer");
  await d.waitForLoadState("networkidle");
  await d.goto(`${BASE}/home?tab=verify`);
  await d.locator('a[href^="/cases/"]:has-text("SG-2026-0011")').first().click();
  await d.waitForSelector("text=Verify protection");
  await d.screenshot({ path: `${OUT}/desk-case-verify.png`, fullPage: false });

  await d.goto(`${BASE}/home?tab=verify`);
  await d.screenshot({ path: `${OUT}/desk-home-reviewer.png`, fullPage: false });
  await desk.close();

  await browser.close();
  console.log(`Screenshots written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
