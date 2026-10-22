// The visit app (visit.html): for the person visiting the home, on a phone or tablet.
const { test, expect } = require("@playwright/test");

const PHONE = { width: 375, height: 812 };
const TABLET = { width: 768, height: 1024 };

// Open the app, start from the made-up data, and choose the first assessor
async function openAs(page, size = PHONE, staffIndex = 1) {
  await page.setViewportSize(size);
  await page.goto("/visit.html");
  await page.evaluate(() => ["healthier-homes", "healthier-homes-planner", "healthier-homes-visit-app"].forEach(k => localStorage.removeItem(k)));
  await page.reload();
  await expect(page.locator("#who option")).not.toHaveCount(1); // the plan has loaded
  const value = await page.locator("#who option").nth(staffIndex).getAttribute("value");
  await page.locator("#who").selectOption(value);
  await expect(page.locator(".visit-card").first()).toBeVisible();
}
// Run some code against the staff view's plan, inside the app
const inPlan = (page, fn, arg) => page.locator("#engine").evaluate((el, [src, arg]) => {
  const W = el.contentWindow;
  return new Function("W", "arg", `return (${src})(W, arg)`)(W, arg);
}, [fn.toString(), arg]);

test("shows the person's visits for the day, in time order", async ({ page }) => {
  await openAs(page);
  const times = await page.locator(".vc-time").allTextContents();
  expect(times.length).toBeGreaterThan(0);
  expect([...times].sort()).toEqual(times);
  await expect(page.locator(".visit-card").first().locator(".badge")).toHaveText(/High|Medium|Low/);
});

test("only shows visits for the chosen person", async ({ page }) => {
  await openAs(page);
  const who = await page.locator("#who").inputValue();
  const day = await page.locator("#day").inputValue();
  const expected = await inPlan(page, (W, [who, day]) => W.PLANNER.events().filter(e => e.staff.id === who && e.iso === day).length, [who, day]);
  await expect(page.locator(".visit-card")).toHaveCount(expected);
});

test("remembers who you are next time", async ({ page }) => {
  await openAs(page);
  const who = await page.locator("#who").inputValue();
  await page.reload();
  await expect(page.locator("#who")).toHaveValue(who);
});

test.describe("A visit", () => {
  test("shows the tenant, a call button and why we're visiting", async ({ page }) => {
    await openAs(page);
    await page.locator(".visit-card").first().click();
    await expect(page.locator("#visit-title")).toBeVisible();
    await expect(page.locator("a.call")).toHaveAttribute("href", /^tel:\d+$/);
    await expect(page.locator("#detail-pane")).toContainText("Why we're visiting");
  });

  test("marks private reasons as Private, with a reminder", async ({ page }) => {
    await openAs(page);
    // Find a visit to a home with a private reason (health, age or children)
    const key = await inPlan(page, (W, who) => {
      const e = W.PLANNER.events().find(x => x.staff.id === who && x.home.risk.reasons.some(r => r.sensitive));
      return e && { key: e.key, iso: e.iso };
    }, await page.locator("#who").inputValue());
    test.skip(!key, "no visit with a private reason for this person");
    await page.locator("#day").selectOption(key.iso);
    await page.locator(`[data-key="${key.key}"]`).click();
    await expect(page.locator(".private").first()).toBeVisible();
    await expect(page.locator("#detail-pane")).toContainText("Don't read it out");
  });

  test("every question has a label", async ({ page }) => {
    await openAs(page);
    await page.locator(".visit-card").first().click();
    const unlabelled = await page.evaluate(() => [...document.querySelectorAll("#visit-form input, #visit-form textarea, #visit-form select")]
      .filter(el => !el.labels || !el.labels.length).map(el => el.id || el.name));
    expect(unlabelled).toEqual([]);
  });

  test("can be opened with a keyboard", async ({ page }) => {
    await openAs(page);
    await page.locator(".visit-card").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#visit-title")).toBeVisible();
  });
});

test.describe("Saving a visit", () => {
  test("won't save without choosing what happens next", async ({ page }) => {
    await openAs(page);
    await page.locator(".visit-card").first().click();
    await page.getByRole("button", { name: "Save visit" }).click();
    await expect(page.locator("#outcome-error")).toBeVisible();
    await expect(page.locator(".notice.saved")).toHaveCount(0);
  });

  test("won't save a referral unless the tenant agreed", async ({ page }) => {
    await openAs(page);
    await page.locator(".visit-card").first().click();
    await page.getByLabel("Referral to energy advice").check();
    await page.getByLabel("No work needed").check();
    await page.getByRole("button", { name: "Save visit" }).click();
    await expect(page.locator("#consent-error")).toBeVisible();
    await page.locator("#consent").check();
    await page.getByRole("button", { name: "Save visit" }).click();
    await expect(page.locator(".notice.saved")).toBeVisible();
  });

  test("'work needed' updates the case for staff and plans a repair with the repairs team", async ({ page }) => {
    await openAs(page);
    const card = page.locator(".visit-card").first();
    const key = await card.getAttribute("data-key");
    await card.click();
    const address = (await page.locator("#visit-title").textContent()).trim();
    await page.getByLabel(/A lot/).check();
    await page.getByLabel("Bedroom").check();
    await page.locator("#humidity").fill("78");
    await page.locator("#temperature").fill("15.5");
    await page.getByLabel("Work needed: plan a repair").check();
    await page.getByRole("button", { name: "Save visit" }).click();

    await expect(page.locator(".notice.saved")).toContainText("Humidity 78%");
    await expect(page.locator(`[data-key="${key}"]`)).toContainText("Done");

    const staffSee = await inPlan(page, (W, address) => {
      const h = W.DATA.homes.find(x => x.address === address);
      const st = JSON.parse(localStorage.getItem("healthier-homes"));
      const repair = W.PLANNER.events().find(e => e.home.id === h.id && e.type === "fix");
      return { log: W.PLANNER.peekCase(h.id).log.map(l => l.text).join(" | "), status: st.status[h.id], repairBy: repair && repair.staff.does };
    }, address);
    expect(staffSee.log).toContain("Humidity 78%");
    expect(staffSee.status).toBe("Work ordered");
    expect(staffSee.repairBy).toContain("fix");
  });

  test("'couldn't get in' is noted, and the home still needs a visit", async ({ page }) => {
    await openAs(page);
    await page.locator(".visit-card").first().click();
    const address = (await page.locator("#visit-title").textContent()).trim();
    await page.getByLabel("Couldn't get in").check();
    await page.getByRole("button", { name: "Save visit" }).click();
    await expect(page.locator(".notice.saved")).toBeVisible();

    const after = await inPlan(page, (W, address) => {
      const h = W.DATA.homes.find(x => x.address === address);
      return { log: W.PLANNER.peekCase(h.id).log.map(l => l.text).join(" | "), stillPlanned: W.PLANNER.events().some(e => e.home.id === h.id && e.type === "assess") };
    }, address);
    expect(after.log).toContain("couldn't get in");
    expect(after.stillPlanned).toBe(true);
  });
});

test.describe("Phone and tablet", () => {
  test("on a phone: the list, then one visit, then back to the list", async ({ page }) => {
    await openAs(page, PHONE);
    await page.locator(".visit-card").first().click();
    await expect(page.locator("#list-pane")).toBeHidden();
    await expect(page.locator("#visit-title")).toBeVisible();
    await page.locator("#back").click();
    await expect(page.locator("#list-pane")).toBeVisible();
  });

  test("on a tablet: the list and the visit side by side", async ({ page }) => {
    await openAs(page, TABLET);
    await page.locator(".visit-card").first().click();
    await expect(page.locator("#list-pane")).toBeVisible();
    await expect(page.locator("#visit-title")).toBeVisible();
    const list = await page.locator("#list-pane").boundingBox();
    const detail = await page.locator("#detail-pane").boundingBox();
    expect(detail.x).toBeGreaterThan(list.x + list.width - 1);
  });

  for (const [name, size] of [["phone", PHONE], ["tablet", TABLET]]) {
    test(`no sideways scrolling on a ${name}`, async ({ page }) => {
      await openAs(page, size);
      await page.locator(".visit-card").first().click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }

  test("buttons and tick boxes are big enough to tap (at least 44 pixels)", async ({ page }) => {
    await openAs(page, PHONE);
    const small = await page.evaluate(() => [...document.querySelectorAll(".visit-card")].filter(b => b.getBoundingClientRect().height < 44).length);
    expect(small).toBe(0);
    await page.locator(".visit-card").first().click();
    const smallLabels = await page.evaluate(() => [...document.querySelectorAll("#visit-form .checks label")].filter(l => l.getBoundingClientRect().height < 44).map(l => l.textContent.trim()));
    expect(smallLabels).toEqual([]);
  });
});

test.describe("The Home visit tab on the staff view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => ["healthier-homes", "healthier-homes-planner", "healthier-homes-visit-app"].forEach(k => localStorage.removeItem(k)));
  });

  test("shows the visit app in a tablet frame, and switches to a phone", async ({ page }) => {
    await page.getByRole("link", { name: "Home visit" }).click();
    await expect(page.locator("#tab-visit-app")).toBeVisible();
    await expect(page.locator("#tab-overview")).toBeHidden();
    const app = page.frameLocator("#visit-app-frame");
    await expect(app.locator("#who option")).not.toHaveCount(1);
    await expect(page.locator("#device-frame")).toHaveClass(/tablet/);
    await page.getByRole("button", { name: "Phone" }).click();
    await expect(page.locator("#device-frame")).toHaveClass(/phone/);
    await expect(page.getByRole("button", { name: "Phone" })).toHaveAttribute("aria-pressed", "true");
  });

  test("a visit recorded in the tab shows for staff after leaving it", async ({ page }) => {
    await page.goto("/#visit-app");
    const app = page.frameLocator("#visit-app-frame");
    await expect(app.locator("#who option")).not.toHaveCount(1);
    await app.locator("#who").selectOption({ index: 1 });
    await app.locator(".visit-card").first().click();
    const address = (await app.locator("#visit-title").textContent()).trim();
    await app.getByLabel("Work needed: plan a repair").check();
    await app.getByRole("button", { name: "Save visit" }).click();
    await expect(app.locator(".notice.saved")).toBeVisible();

    await page.getByRole("link", { name: "Risk overview" }).click();
    await expect(page.locator("#tab-overview")).toBeVisible();
    const status = await page.evaluate(a => scored().find(h => h.address === a).status, address);
    expect(status).toBe("Work ordered");
  });
});
