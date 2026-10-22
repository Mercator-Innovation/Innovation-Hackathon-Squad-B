// Checks on the made-up data, so the dashboard isn't fed impossible homes.
const { test, expect } = require("@playwright/test");

let data;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/");
  data = await page.evaluate(() => ({ homes: window.DATA.homes, reports: window.DATA.reports }));
  await page.close();
});

const AGE_BANDS = ["18 to 24", "25 to 44", "45 to 64", "65 to 74", "75 or over"];

test("every home has a unique reference", () => {
  const ids = data.homes.map(h => h.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every EPC rating is A to G", () => {
  expect(data.homes.filter(h => !/^[A-G]$/.test(h.epc)).map(h => h.id)).toEqual([]);
});

test("every tenant has a valid age band", () => {
  expect(data.homes.filter(h => !AGE_BANDS.includes(h.household.tenantAgeBand)).map(h => h.id)).toEqual([]);
});

test("there is one repair note for each damp repair", () => {
  expect(data.homes.filter(h => h.repairNotes.length !== h.dampRepairs12m).map(h => h.id)).toEqual([]);
});

test("a tenant aged 65 or over is counted as an older person", () => {
  const wrong = data.homes.filter(h => ["65 to 74", "75 or over"].includes(h.household.tenantAgeBand) && !h.household.olderPerson);
  expect(wrong.map(h => h.id)).toEqual([]);
});

test("a one-person household can't have both an older person and a young child", () => {
  const impossible = data.homes.filter(h => h.household.people === 1 && h.household.olderPerson && h.household.youngChild);
  expect(impossible.map(h => h.id), "these homes have impossible households").toEqual([]);
});

test("sensor readings are believable (humidity 0 to 100%, temperature 0 to 35°C)", () => {
  const odd = data.homes.filter(h => h.sensor && (h.sensor.humidity < 0 || h.sensor.humidity > 100 || h.sensor.temperature < 0 || h.sensor.temperature > 35));
  expect(odd.map(h => h.id)).toEqual([]);
});

test("every report from a tenant points to a home that exists", () => {
  const ids = new Set(data.homes.map(h => h.id));
  expect(data.reports.filter(r => r.homeId && !ids.has(r.homeId)).map(r => r.ref)).toEqual([]);
});
