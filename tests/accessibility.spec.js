// Accessibility checks with axe (the standard automated checker), against WCAG 2.2 AA.
// Every page and tab, at desktop and phone width, plus the main things people open.
// Automated checks find about a third of problems: still try it with a keyboard and a screen reader.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const SIZES = { desktop: { width: 1280, height: 900 }, phone: { width: 375, height: 812 } };

// Run axe and turn problems into short readable lines
async function problems(page, exclude = []) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  for (const sel of exclude) builder = builder.exclude(sel);
  const { violations } = await builder.analyze();
  return violations.map(v => `${v.impact}: ${v.help} (${v.id}), ${v.nodes.length}× e.g. ${v.nodes[0].target.join(" ")}`);
}

async function fresh(page, url, size) {
  await page.setViewportSize(size);
  await page.goto(url);
  await page.evaluate(() => ["healthier-homes", "healthier-homes-planner", "healthier-homes-visit-app"].forEach(k => localStorage.removeItem(k)));
  await page.goto(url);
  await page.reload();
}

for (const [sizeName, size] of Object.entries(SIZES)) {
  test.describe(`At ${sizeName} width`, () => {
    for (const [name, url, ready, exclude] of [
      ["Risk overview", "/#overview", "#glance-cards .glance-card", []],
      ["Reports from tenants", "/#reports", "#reports-list", []],
      ["Visits booked", "/#visits", "#calendar", []],
      ["Cases", "/#cases", "#tab-cases", []],
      ["Home visit tab", "/#visit-app", "#visit-app-frame", ["#visit-app-frame"]],
      ["Tenant report form", "/report.html", "#report-form", []],
      ["Track your report", "/track.html", "#track-form", []],
      ["Home visit app", "/visit.html", "#who", ["#engine"]]
    ]) {
      test(`${name} has no accessibility problems`, async ({ page }) => {
        await fresh(page, url, size);
        await expect(page.locator(ready).first()).toBeVisible();
        expect(await problems(page, exclude)).toEqual([]);
      });
    }

    test("a home's details (the pop-up) have no accessibility problems", async ({ page }) => {
      await fresh(page, "/", size);
      await page.locator("#homes [data-home]").first().click();
      await expect(page.locator("#detail")).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });

    test("an open case has no accessibility problems", async ({ page }) => {
      await fresh(page, "/#cases/H-1004", size);
      await expect(page.locator("#book-form")).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });

    test("a visit open in the Home visit app has no accessibility problems", async ({ page }) => {
      await fresh(page, "/visit.html", size);
      await expect(page.locator("#who option")).not.toHaveCount(1);
      await page.locator("#who").selectOption({ index: 1 });
      await page.locator(".visit-card").first().click();
      await expect(page.locator("#visit-form")).toBeVisible();
      expect(await problems(page, ["#engine"])).toEqual([]);
    });

    test("the form errors in the Home visit app have no accessibility problems", async ({ page }) => {
      await fresh(page, "/visit.html", size);
      await expect(page.locator("#who option")).not.toHaveCount(1);
      await page.locator("#who").selectOption({ index: 1 });
      await page.locator(".visit-card").first().click();
      await page.getByRole("button", { name: "Save visit" }).click();
      await expect(page.locator("#outcome-error")).toBeVisible();
      expect(await problems(page, ["#engine"])).toEqual([]);
    });

    test("a tracked report's progress has no accessibility problems", async ({ page }) => {
      await fresh(page, "/track.html", size);
      await page.locator("#ref").fill("R-0412");
      await page.locator("#track-form button[type=submit]").click();
      await expect(page.locator("#result")).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });
  });
}

test.describe("Keyboard", () => {
  test("every tab in the staff view can be reached and opened with a keyboard", async ({ page }) => {
    await fresh(page, "/", SIZES.desktop);
    const tabs = await page.locator("nav.tabs a[data-tab]").count();
    for (let i = 0; i < tabs; i++) {
      const link = page.locator("nav.tabs a[data-tab]").nth(i);
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  test("focus is always visible on the staff view", async ({ page }) => {
    await fresh(page, "/", SIZES.desktop);
    const invisible = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const seen = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return true;
        const s = getComputedStyle(el);
        return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
      });
      if (!seen) invisible.push(await page.evaluate(() => document.activeElement.outerHTML.slice(0, 80)));
    }
    expect(invisible).toEqual([]);
  });

  test("the home details pop-up closes with Escape and focus goes back", async ({ page }) => {
    await fresh(page, "/", SIZES.desktop);
    const opener = page.locator("#homes [data-home]").first();
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#detail")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#detail")).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
