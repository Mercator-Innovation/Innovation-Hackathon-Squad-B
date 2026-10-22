// Track your report: a tenant enters their reference and sees how far things have got.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/track.html");
  await page.evaluate(() => { localStorage.clear(); localStorage.removeItem("healthier-homes-planner"); });
  await page.reload();
});

const track = async (page, ref) => {
  await page.locator("#ref").fill(ref);
  await page.locator("#track-form button[type=submit]").click();
};

test.describe("Reading the reference", () => {
  for (const [typed, ref] of [["R-0412", "R-0412"], ["r0412", "R-0412"], ["412", "R-0412"], [" R 0412 ", "R-0412"], ["abc", ""], ["", ""]]) {
    test(`"${typed}" is read as "${ref || "nothing"}"`, async ({ page }) => {
      expect(await page.evaluate(t => normaliseRef(t), typed)).toBe(ref);
    });
  }
});

test("a known reference shows its progress, starting with 'received'", async ({ page }) => {
  await track(page, "R-0412");
  await expect(page.locator("#result")).toBeVisible();
  await expect(page.locator("#result-title")).toContainText("R-0412");
  await expect(page.locator("#steps li").first()).toHaveClass(/done/);
});

test("an empty reference shows an error", async ({ page }) => {
  await track(page, "");
  await expect(page.locator("#ref-error")).toBeVisible();
  await expect(page.locator("#result")).toBeHidden();
});

test("a reference that doesn't exist says so", async ({ page }) => {
  await track(page, "R-9999");
  await expect(page.locator("#ref-error")).toContainText("R-9999");
});

test("when staff mark the work as fixed, every step is done", async ({ page }) => {
  await page.evaluate(() => {
    const st = loadState();
    const report = window.DATA.reports.find(r => r.ref === "R-0412");
    st.status[report.homeId] = "Fixed";
    saveState(st);
  });
  await track(page, "R-0412");
  await expect(page.locator("#steps li:not(.done)")).toHaveCount(0);
});

test("a visit booked on the case shows as 'visit booked' to the tenant", async ({ page }) => {
  // Book an assessment the way staff do, on the case page
  await page.goto("/#cases/H-1004"); // the home behind report R-0412
  await page.locator("#book-type").selectOption("assess");
  await page.locator("#book-reason").selectOption("other");
  await page.locator("#book-other").fill("Test booking");
  await page.locator("#find-slot").click();
  await expect(page.locator("#book-date")).not.toHaveValue("");
  await page.locator("#book-form button[type=submit]").click();

  await page.goto("/track.html");
  await track(page, "R-0412");
  await expect(page.locator("#steps li").nth(2), "the 'visit' step should be done").toHaveClass(/done/);
});
