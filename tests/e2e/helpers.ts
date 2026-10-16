import { expect, type Page, type APIRequestContext } from "@playwright/test";

export const DEMO_PEOPLE = {
  community_worker: "Thandi M.",
  ops_manager: "Sipho K.",
  field_team: "Field Team B",
  reviewer: "L. Naidoo",
} as const;

export type Role = keyof typeof DEMO_PEOPLE;

/** Enter the ops area as a seeded demo person via the login page's role buttons. */
export async function loginAs(page: Page, role: Role) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(DEMO_PEOPLE[role]) }).click();
  await page.waitForURL(/\/(home|cases|dashboard)/);
  await expect(page.getByText("DEMO · simulated roles")).toBeVisible();
}

/** Switch role from the banner without logging out. */
export async function switchRole(page: Page, role: Role) {
  await page.getByLabel("Switch demo role").selectOption(role);
  await page.waitForURL(/\/(home|cases|dashboard)/);
  await expect(page.getByText(new RegExp(DEMO_PEOPLE[role]))).toBeVisible();
}

export async function resetDemo(request: APIRequestContext) {
  const r = await request.post("/api/v1/admin/reset-demo");
  expect(r.ok()).toBeTruthy();
}

export async function caseIdByRef(request: APIRequestContext, page: Page, ref: string): Promise<string> {
  // The public API never exposes ids, so find the case through the ops list.
  await page.goto("/home?tab=nearby");
  const link = page.locator(`a[href^="/cases/"]:has-text("${ref}")`).first();
  if ((await link.count()) === 0) {
    await page.goto("/home?tab=cases");
  }
  const href = await page.locator(`a[href^="/cases/"]:has-text("${ref}")`).first().getAttribute("href");
  if (!href) throw new Error(`No case card for ${ref}`);
  return href.replace("/cases/", "");
}

/** A tiny real JPEG for uploads. */
export function tinyJpeg(): Buffer {
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "base64",
  );
}
