// The staff dashboard, used the way staff would: clicking, filtering and opening homes.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear()); // start every test from the same made-up data
  await page.reload();
});

const rows = page => page.locator("#homes tr");
const highCount = page => page.evaluate(() => {
  const ctx = { openReports: window.DATA.reports.filter(r => r.status !== "Closed").map(r => r.homeId) };
  return window.DATA.homes.filter(h => window.RISK.score(h, ctx).band === "High").length;
});

test("says it's a prototype with made-up data", async ({ page }) => {
  await expect(page.locator(".banner")).toContainText("made-up data");
});

test("the page loads with no errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.reload();
  await expect(page.locator(".glance-card")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test.describe("Where to act first", () => {
  test("shows six cards, and the high risk card is flagged Act now", async ({ page }) => {
    await expect(page.locator(".glance-card")).toHaveCount(6);
    const high = page.locator('[data-glance="high"]');
    await expect(high).toContainText("Act now");
    await expect(high.locator(".g-count")).toHaveText(String(await highCount(page)));
  });

  test("clicking High risk homes shows only high risk homes", async ({ page }) => {
    await page.locator('[data-glance="high"]').click();
    await expect(rows(page)).toHaveCount(await highCount(page));
    for (const badge of await page.locator("#homes .badge").allTextContents()) expect(badge).toMatch(/^High/);
    await expect(page.locator("#active-filter")).toContainText("high risk homes");
  });

  test("Show all homes undoes the card's filter", async ({ page }) => {
    const all = await rows(page).count();
    await page.locator('[data-glance="high"]').click();
    await page.locator("#clear-filter").click();
    await expect(rows(page)).toHaveCount(all);
    await expect(page.locator("#active-filter")).toBeHidden();
  });

  test("clicking Not heard from in over a year shows that many homes", async ({ page }) => {
    const card = page.locator('[data-glance="nocontact"]');
    const count = Number(await card.locator(".g-count").textContent());
    await card.click();
    await expect(rows(page)).toHaveCount(count);
  });

  test("the Awaab's Law card opens Reports from tenants", async ({ page }) => {
    await page.locator('[data-glance="checks"]').click();
    await expect(page).toHaveURL(/#reports$/);
    await expect(page.locator("#tab-reports")).toBeVisible();
  });

  test("the cards work with a keyboard", async ({ page }) => {
    await page.locator('[data-glance="high"]').focus();
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveCount(await highCount(page));
  });

  test("the trend chart has a summary in words", async ({ page }) => {
    await expect(page.locator("#trend-chart svg")).toBeVisible();
    await expect(page.locator("#trend-summary")).toContainText("High risk homes");
  });
});

test.describe("Risk by area", () => {
  test("every area shows its traffic light in words, not just colour", async ({ page }) => {
    const areas = page.locator("#heatmap button");
    await expect(areas).toHaveCount(8);
    for (const tag of await page.locator("#heatmap .light-tag").allTextContents()) expect(tag).toMatch(/Red|Amber|Green/);
  });

  test("choosing an area shows only its homes", async ({ page }) => {
    const area = page.locator("#heatmap button").first();
    const name = (await area.locator(".area-name").textContent()).trim();
    await area.click();
    await expect(area).toHaveAttribute("aria-pressed", "true");
    const shown = await page.locator("#homes tr td:nth-child(3)").allTextContents();
    expect(shown.length).toBeGreaterThan(0);
    shown.forEach(a => expect(a.trim()).toBe(name));
  });
});

test.describe("A home's details", () => {
  test("show why it's flagged, a suggested action, and a reminder that staff decide", async ({ page }) => {
    await page.locator("#homes [data-home]").first().click();
    const detail = page.locator("#detail");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Why this home is flagged");
    await expect(detail).toContainText("Suggested action");
    await expect(detail).toContainText("This is a guide, not a decision");
  });

  test("the highest risk home is at the top of the list", async ({ page }) => {
    const points = (await page.locator("#homes .badge").allTextContents()).map(t => Number(t.split("·")[1]));
    expect(points[0]).toBe(Math.max(...points));
  });
});

test("fits a phone screen without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  const tooWide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(tooWide).toBe(false);
});
