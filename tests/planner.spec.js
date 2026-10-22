// The visit planner's logic: who visits which home, and when.
// These check the planner's promises from the outside, so they keep working if the planning code changes.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear()); // start from the made-up rota and homes
  await page.reload();
});

// Every planned visit, in a form the test can read
const visits = page => page.evaluate(() => window.PLANNER.events().map(e => ({
  key: e.key, type: e.type, home: e.home.id, band: e.home.risk.band, staff: e.staff.id, name: e.staff.name,
  does: e.staff.does, days: e.staff.days, from: e.staff.start, to: e.staff.end,
  iso: e.iso, weekday: e.date.getDay(), start: e.start, end: e.end, travel: e.travel, late: e.late, fixed: !!e.fixed
})));
const mins = hhmm => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

test("the planner plans some visits", async ({ page }) => {
  expect((await visits(page)).length).toBeGreaterThan(0);
});

test("nobody is booked in two places at once (travel included)", async ({ page }) => {
  const byPerson = {};
  for (const v of await visits(page)) (byPerson[`${v.name} ${v.iso}`] ||= []).push(v);
  const clashes = [];
  for (const [who, list] of Object.entries(byPerson)) {
    list.sort((a, b) => a.start - b.start);
    for (let i = 1; i < list.length; i++) {
      if (list[i].start - list[i].travel < list[i - 1].end) clashes.push(`${who}: ${list[i - 1].home} and ${list[i].home}`);
    }
  }
  expect(clashes).toEqual([]);
});

test("planned visits are within each person's working hours", async ({ page }) => {
  const outside = (await visits(page)).filter(v => !v.fixed && (v.start - v.travel < mins(v.from) || v.end > mins(v.to)));
  expect(outside.map(v => `${v.name} ${v.iso} ${v.home}`)).toEqual([]);
});

test("planned visits are only on the days each person works", async ({ page }) => {
  const wrongDay = (await visits(page)).filter(v => !v.fixed && !v.days.includes(v.weekday));
  expect(wrongDay.map(v => `${v.name} ${v.iso}`)).toEqual([]);
});

test("nobody is sent on a type of visit they don't do (only the repairs team does repairs)", async ({ page }) => {
  const wrongJob = (await visits(page)).filter(v => !v.fixed && !v.does.includes(v.type));
  expect(wrongJob.map(v => `${v.name}: ${v.type} at ${v.home}`)).toEqual([]);
});

test("no home gets two assessment visits", async ({ page }) => {
  const homes = (await visits(page)).filter(v => v.type === "assess").map(v => v.home);
  expect(homes.filter((h, i) => homes.indexOf(h) !== i)).toEqual([]);
});

test("every high risk home is seen within its target (5 working days)", async ({ page }) => {
  const late = (await visits(page)).filter(v => v.type === "assess" && v.band === "High" && v.late > 0);
  expect(late.map(v => `${v.home} is ${v.late} working days late`)).toEqual([]);
});

test("high risk homes are seen before low risk homes", async ({ page }) => {
  const assess = (await visits(page)).filter(v => v.type === "assess");
  const lastHigh = assess.filter(v => v.band === "High").map(v => v.iso).sort().pop();
  const firstLow = assess.filter(v => v.band === "Low").map(v => v.iso).sort()[0];
  test.skip(!lastHigh || !firstLow, "needs both high and low risk visits in the plan");
  expect(lastHigh <= firstLow).toBe(true);
});

test("every home that needs a visit is either planned or listed as not fitted in", async ({ page }) => {
  const missing = await page.evaluate(() => {
    const planned = new Set(window.PLANNER.events().map(e => e.home.id));
    const unplanned = document.getElementById("plan-unplanned").textContent;
    return scored()
      .filter(h => ["Not started", "Contacted", "Visit booked"].includes(h.status) && window.LOCATIONS.homes[h.id])
      .filter(h => !planned.has(h.id) && !unplanned.includes(h.address))
      .map(h => h.id);
  });
  expect(missing).toEqual([]);
});

test.describe("Recording what happened at a visit", () => {
  test("'work needed' plans a repair with the repairs team, after the visit", async ({ page }) => {
    const result = await page.evaluate(() => {
      const first = window.PLANNER.events().find(e => e.type === "assess");
      window.PLANNER.record(first.home.id, "work", first.iso, "Test");
      window.PLANNER.save();
      const fix = window.PLANNER.events().find(e => e.type === "fix" && e.home.id === first.home.id);
      return { visited: first.iso, fix: fix && { iso: fix.iso, does: fix.staff.does } };
    });
    expect(result.fix, "a repair should be planned").toBeTruthy();
    expect(result.fix.does).toContain("fix");
    expect(result.fix.iso > result.visited).toBe(true);
  });

  test("'no work needed' means no more visits to that home", async ({ page }) => {
    const left = await page.evaluate(() => {
      const first = window.PLANNER.events().find(e => e.type === "assess");
      window.PLANNER.record(first.home.id, "none", first.iso, "Test");
      window.PLANNER.save();
      return window.PLANNER.events().filter(e => e.home.id === first.home.id && !e.fixed).length;
    });
    expect(left).toBe(0);
  });
});

test.describe("Booking a follow-up on a case", () => {
  // Fill in the booking form on a home's case page
  async function book(page, home, { staff, iso, time }) {
    await page.goto(`/#cases/${home}`);
    await page.locator("#book-type").selectOption("check");
    await page.locator("#book-reason").selectOption("other");
    await page.locator("#book-other").fill("Test booking");
    await page.locator("#book-who").selectOption(staff);
    await page.locator("#book-date").fill(iso);
    await page.locator("#book-time").fill(time);
    await page.locator("#book-form button[type=submit]").click();
  }
  const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const firstVisit = page => page.evaluate(() => {
    const e = window.PLANNER.events().find(x => x.type === "assess" && !x.fixed);
    return { staff: e.staff.id, iso: e.iso, start: e.start, home: e.home.id };
  });

  test("booking someone at exactly the same time as another visit is refused", async ({ page }) => {
    const v = await firstVisit(page);
    await book(page, "H-1002", { staff: v.staff, iso: v.iso, time: hhmm(v.start) });
    await expect(page.locator("#book-time-error")).toBeVisible();
  });

  test("booking over a planned visit moves the planned visit out of the way", async ({ page }) => {
    const v = await firstVisit(page);
    await book(page, "H-1002", { staff: v.staff, iso: v.iso, time: hhmm(v.start + 30) });
    await expect(page.locator("#book-time-error")).toBeHidden();
    const moved = await page.evaluate(id => window.PLANNER.events().find(e => e.home.id === id && e.type === "assess"), v.home);
    expect(moved.start !== v.start || moved.iso !== v.iso).toBe(true);
  });

  test("booking someone in the middle of another booked visit is refused", async ({ page }) => {
    const v = await firstVisit(page);
    const first = { staff: v.staff, iso: v.iso, time: "10:00" };
    await book(page, "H-1002", first);
    await expect(page.locator("#book-time-error")).toBeHidden();
    await book(page, "H-1003", { ...first, time: "10:15" }); // the first check-in runs 10:00 to 10:30
    await expect(page.locator("#book-time-error"), "the form should warn that this person is already booked").toBeVisible();
  });
});
