import { expect, test } from "@playwright/test";
import { loginAs, resetDemo, type Role } from "./helpers";

const TABS: Record<Role, string[]> = {
  community_worker: ["Nearby", "Triage", "Protect"],
  ops_manager: ["Dashboard", "Cases", "Assign"],
  field_team: ["Jobs", "Record", "History"],
  reviewer: ["To verify", "Reviewed"],
};
const ALL_TABS = [...new Set(Object.values(TABS).flat())];

test.beforeAll(async ({ request }) => {
  await resetDemo(request);
});

for (const role of Object.keys(TABS) as Role[]) {
  test(`${role} sees only its tabs and the demo banner`, async ({ page }) => {
    await loginAs(page, role);
    const nav = page.getByRole("navigation", { name: "Role tabs" });
    for (const t of TABS[role]) await expect(nav.getByRole("link", { name: t, exact: true })).toBeVisible();
    for (const t of ALL_TABS.filter((x) => !TABS[role].includes(x))) await expect(nav.getByRole("link", { name: t, exact: true })).toHaveCount(0);
    await expect(page.getByText("DEMO · simulated roles")).toBeVisible();
  });
}

test("field team sees Verify protection locked with the reason; reviewer sees it live", async ({ page }) => {
  await loginAs(page, "field_team");
  await page.goto("/home?tab=history");
  await page.locator('a[href^="/cases/"]:has-text("SG-2026-0011")').first().click();
  await expect(page.getByText("DEMO · simulated roles")).toBeVisible();
  await expect(page.getByRole("group", { name: /Verify protection: only the reviewer/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Verify protection" })).toHaveCount(0);

  await page.getByLabel("Switch demo role").selectOption("reviewer");
  await page.waitForURL(/\/cases\//);
  await expect(page.getByRole("button", { name: "Verify protection" })).toBeVisible();
});

test("dashboard is for ops manager and reviewer; counts match the seed", async ({ page, request }) => {
  await loginAs(page, "ops_manager");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Who is still exposed/ })).toBeVisible();
  await expect(page.getByText("DEMO · simulated roles")).toBeVisible();

  const counts = await (await page.request.get("/api/v1/dashboard/counts")).json();
  expect(counts).toMatchObject({
    uncontainedOrUnassessed: 2,
    recordedAwaitingVerification: 3,
    protectedVerified: 3,
    pastMakeSafeDue: 2,
    resolved: 1,
    needRepairCrew: 0,
    repairsRecordedNotVerified: 2,
    total: 7,
  });
  await expect(page.getByText(/2 repairs recorded but not verified/)).toBeVisible();

  // community worker is told the dashboard is not theirs
  await page.getByLabel("Switch demo role").selectOption("community_worker");
  await page.waitForURL(/\/home/);
  await page.goto("/dashboard");
  await expect(page.getByText(/only the ops manager or reviewer/)).toBeVisible();

  // and the counts route refuses them
  const forbidden = await page.request.get("/api/v1/dashboard/counts");
  expect(forbidden.status()).toBe(403);
  void request;
});

test("ops routes redirect to login without a session", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login\?next=%2Fhome/);
});
