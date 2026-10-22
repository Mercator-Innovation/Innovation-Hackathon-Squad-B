// The tenant's side: reporting a problem, and that staff see it.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/report.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("every question on the form has a label", async ({ page }) => {
  const unlabelled = await page.evaluate(() =>
    [...document.querySelectorAll("#report-form input:not([type=hidden]), #report-form textarea, #report-form select")]
      .filter(el => !el.labels || el.labels.length === 0 || !el.labels[0].textContent.trim())
      .map(el => el.id || el.name));
  expect(unlabelled).toEqual([]);
});

test("a tenant can send a report and gets a reference", async ({ page }) => {
  await page.getByLabel("Mould").check();
  await page.locator("#description").fill("Black mould on the bedroom wall.");
  await page.locator("#name").fill("Test Tenant");
  await page.locator("#address").fill("2 Kelburn Terrace");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.locator("#thanks")).toBeVisible();
  await expect(page.locator("#thanks-body")).toContainText(/R-\d{4}/);
});

test("the report shows up for staff, linked to the right home", async ({ page }) => {
  await page.getByLabel("Damp", { exact: true }).check();
  await page.locator("#address").fill("2 Kelburn Terrace");
  await page.getByRole("button", { name: /send/i }).click();
  const ref = (await page.locator("#thanks-body").textContent()).match(/R-\d{4}/)[0];

  await page.goto("/#reports");
  const card = page.locator("#reports-list .report-row", { hasText: ref });
  await expect(card).toBeVisible();
  await expect(card).toContainText("2 Kelburn Terrace");
});

test("sending a report makes that home score 2 points higher", async ({ page }) => {
  await page.goto("/");
  // A home with no reports yet, so the report's 2 points show
  const address = await page.evaluate(() => {
    const reported = new Set(window.DATA.reports.map(r => r.homeId));
    const h = window.DATA.homes.find(x => !reported.has(x.id));
    return h && h.address;
  });
  test.skip(!address, "every sample home already has a report");
  const points = () => page.evaluate(a => scored().find(h => h.address === a).risk.points, address);
  const before = await points();

  await page.goto("/report.html");
  await page.locator("#address").fill(address);
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.locator("#thanks")).toBeVisible();

  await page.goto("/");
  expect(await points()).toBe(before + 2);
});
