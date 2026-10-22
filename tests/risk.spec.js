// The core logic: risk scores, bands, suggested actions, Awaab's Law dates and traffic lights.
// These run inside the real page, so they test the same code staff see.
const { test, expect } = require("@playwright/test");

// A home with no warning signs. Each test adds the one thing it's checking.
const BLANK = {
  id: "T-1", epc: "C", dampRepairs12m: 0, sensor: null,
  household: { people: 2, olderPerson: false, youngChild: false, healthConditionShared: false, tenantAgeBand: "25 to 44" },
  askedForEnergyAdvice: false, monthsSinceLastContact: 2
};

test.beforeEach(async ({ page }) => { await page.goto("/"); });

// Score a home in the page: changes are merged into BLANK
async function score(page, changes = {}, openReports = []) {
  return page.evaluate(({ blank, changes, openReports }) => {
    const home = { ...blank, ...changes, household: { ...blank.household, ...(changes.household || {}) } };
    const r = window.RISK.score(home, { openReports });
    return { points: r.points, band: r.band, reasons: r.reasons.map(x => x.reason), action: window.RISK.suggest(home, r) };
  }, { blank: BLANK, changes, openReports });
}

test.describe("Risk score", () => {
  test("a home with no warning signs scores 0 and is Low", async ({ page }) => {
    const r = await score(page);
    expect(r).toMatchObject({ points: 0, band: "Low", reasons: [] });
  });

  for (const [what, changes, points] of [
    ["EPC E adds 1", { epc: "E" }, 1],
    ["EPC F adds 2", { epc: "F" }, 2],
    ["EPC G adds 2", { epc: "G" }, 2],
    ["one damp repair adds 2", { dampRepairs12m: 1 }, 2],
    ["repeat damp repairs add 3", { dampRepairs12m: 2 }, 3],
    ["humidity over 70% adds 2", { sensor: { humidity: 71, temperature: 19 } }, 2],
    ["humidity of exactly 70% adds nothing", { sensor: { humidity: 70, temperature: 19 } }, 0],
    ["a home under 16°C adds 2", { sensor: { humidity: 50, temperature: 15.9 } }, 2],
    ["a home at exactly 16°C adds nothing", { sensor: { humidity: 50, temperature: 16 } }, 0],
    ["an older person adds 1", { household: { olderPerson: true, tenantAgeBand: "65 to 74" } }, 1],
    ["a tenant aged 75 or over adds 2 (older person + 75 or over)", { household: { olderPerson: true, tenantAgeBand: "75 or over" } }, 2],
    ["a young child adds 1", { household: { youngChild: true } }, 1],
    ["a health condition the tenant told us about adds 2", { household: { healthConditionShared: true } }, 2],
    ["asking for energy advice adds 1", { askedForEnergyAdvice: true }, 1],
    ["no contact for 13 months adds 1", { monthsSinceLastContact: 13 }, 1],
    ["no contact for exactly 12 months adds nothing", { monthsSinceLastContact: 12 }, 0]
  ]) {
    test(what, async ({ page }) => {
      expect((await score(page, changes)).points).toBe(points);
    });
  }

  test("an open report from the tenant adds 2", async ({ page }) => {
    expect((await score(page, {}, ["T-1"])).points).toBe(2);
  });

  test("every point is explained by a reason staff can see", async ({ page }) => {
    const total = await page.evaluate(() => {
      const ctx = { openReports: [] };
      return window.DATA.homes.every(h => {
        const r = window.RISK.score(h, ctx);
        return r.points === r.reasons.reduce((s, x) => s + x.points, 0) && r.reasons.every(x => x.reason);
      });
    });
    expect(total).toBe(true);
  });
});

test.describe("Risk bands", () => {
  for (const [points, band] of [[3, "Low"], [4, "Medium"], [6, "Medium"], [7, "High"], [15, "High"]]) {
    test(`${points} points is ${band}`, async ({ page }) => {
      const got = await page.evaluate(p => window.RISK.bands.find(b => p >= b.min).name, points);
      expect(got).toBe(band);
    });
  }
});

test.describe("Suggested action", () => {
  test("an open report comes first: call today and book a check (Awaab's Law)", async ({ page }) => {
    expect((await score(page, { epc: "G", dampRepairs12m: 3 }, ["T-1"])).action).toBe("actionReport");
  });
  test("high risk with a sensor warning means an urgent visit", async ({ page }) => {
    const r = await score(page, { epc: "G", sensor: { humidity: 80, temperature: 14 }, household: { youngChild: true } });
    expect(r.band).toBe("High");
    expect(r.action).toBe("actionVisitUrgent");
  });
  test("a recent damp repair means checking the repair worked", async ({ page }) => {
    expect((await score(page, { dampRepairs12m: 1 })).action).toBe("actionCheckRepair");
  });
  test("a poor energy rating at medium risk means an energy advice referral", async ({ page }) => {
    expect((await score(page, { epc: "F", askedForEnergyAdvice: true, household: { youngChild: true } })).action).toBe("actionEnergy");
  });
  test("a poor energy rating alone at low risk means keep an eye on it", async ({ page }) => {
    expect((await score(page, { epc: "E" })).action).toBe("actionMonitor");
  });
  test("no contact for over a year means a friendly check-in", async ({ page }) => {
    expect((await score(page, { monthsSinceLastContact: 20 })).action).toBe("actionCheckIn");
  });
  test("every suggested action has words in content.js", async ({ page }) => {
    const missing = await page.evaluate(() => {
      const keys = ["actionReport", "actionVisitUrgent", "actionCheckRepair", "actionEnergy", "actionCheckIn", "actionMonitor"];
      return keys.filter(k => !window.CONTENT[k]);
    });
    expect(missing).toEqual([]);
  });
});

test.describe("Awaab's Law dates (working days)", () => {
  async function addDays(page, iso, n) {
    return page.evaluate(([iso, n]) => {
      const d = window.GLANCE.addWorkingDays(new Date(iso + "T00:00"), n);
      return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    }, [iso, n]);
  }
  test("10 working days from Tuesday 20 Oct is Tuesday 3 Nov", async ({ page }) => {
    expect(await addDays(page, "2026-10-20", 10)).toBe("2026-11-03");
  });
  test("1 working day from a Friday is the Monday", async ({ page }) => {
    expect(await addDays(page, "2026-10-23", 1)).toBe("2026-10-26");
  });
  test("a report on a Saturday is due 10 working days later, on a Friday", async ({ page }) => {
    expect(await addDays(page, "2026-10-24", 10)).toBe("2026-11-06");
  });
  test("counting working days backwards gives a negative number (overdue)", async ({ page }) => {
    const n = await page.evaluate(() => window.GLANCE.workingDaysBetween(new Date("2026-11-03T00:00"), new Date("2026-10-27T00:00")));
    expect(n).toBe(-5);
  });
});

test.describe("Traffic lights for areas", () => {
  for (const [avg, light] of [[6.5, "red"], [5.5, "red"], [5.49, "amber"], [4, "amber"], [3.99, "green"], [0, "green"]]) {
    test(`an average score of ${avg} is ${light}`, async ({ page }) => {
      expect(await page.evaluate(a => window.GLANCE.light(a).key, avg)).toBe(light);
    });
  }
  test("every light has words, not just a colour", async ({ page }) => {
    const labels = await page.evaluate(() => [6, 4.5, 1].map(a => window.GLANCE.light(a).label));
    labels.forEach(l => expect(l).toBeTruthy());
  });
});
