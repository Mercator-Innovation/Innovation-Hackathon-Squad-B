// The risk rating model. Each rule adds points and gives a reason staff can see.
// Tiers don't overlap (one damp repair OR repeat repairs; older person OR aged 75 or over), so each sign is listed once.
// sensitive: about the household's health or circumstances. Staff see it, but it stays out of texts to tenants and downloads.
// Change the points or add rules here. Bands are at the bottom.
window.RISK = {
  rules: [
    { reason: "Poor energy rating (EPC E)", points: 1, test: h => h.epc === "E" },
    { reason: "Very poor energy rating (EPC F or G)", points: 2, test: h => h.epc === "F" || h.epc === "G" },
    { reason: "Damp or mould repairs in the last year", points: 2, test: h => h.dampRepairs12m === 1 },
    { reason: "Repeat damp or mould repairs", points: 3, test: h => h.dampRepairs12m >= 2 },
    { reason: "Sensor shows high humidity (over 70%)", points: 2, test: h => h.sensor && h.sensor.humidity > 70 },
    { reason: "Sensor shows a cold home (under 16°C)", points: 2, test: h => h.sensor && h.sensor.temperature < 16 },
    { reason: "Older person in the household", points: 1, sensitive: true, test: h => h.household.olderPerson && h.household.tenantAgeBand !== "75 or over" },
    { reason: "Tenant aged 75 or over", points: 2, sensitive: true, test: h => h.household.tenantAgeBand === "75 or over" },
    { reason: "Young child in the household", points: 1, sensitive: true, test: h => h.household.youngChild },
    // From our records, or from a tenant who answered Yes to the health question on the report form
    { reason: "Tenant told us about a health condition", points: 2, sensitive: true,
      test: (h, ctx) => h.household.healthConditionShared || (ctx.healthShared || []).includes(h.id) },
    { reason: "Asked for energy advice", points: 1, test: h => h.askedForEnergyAdvice },
    { reason: "No contact for over a year", points: 1, test: h => h.monthsSinceLastContact > 12 },
    { reason: "Open report from the tenant", points: 2, test: (h, ctx) => ctx.openReports.includes(h.id) }
  ],

  bands: [
    { name: "High", min: 7 },
    { name: "Medium", min: 4 },
    { name: "Low", min: 0 }
  ],

  score(home, ctx) {
    // Strongest warning sign first, so every list leads with what matters most
    const reasons = this.rules.filter(r => r.test(home, ctx)).sort((a, b) => b.points - a.points);
    const points = reasons.reduce((sum, r) => sum + r.points, 0);
    const band = this.bands.find(b => points >= b.min).name;
    return { points, band, reasons };
  },

  // A suggested next step, picked from the warning signs. The first rule that matches wins.
  // The words are in content.js (keys starting "action").
  suggest(home, risk) {
    const has = text => risk.reasons.some(r => r.reason.startsWith(text));
    const sensor = has("Sensor shows");
    if (has("Open report")) return "actionReport";
    if (risk.band === "High" && (sensor || has("Repeat damp"))) return "actionVisitUrgent";
    if (sensor) return "actionVisitSoon";
    if (has("Damp or mould repairs") || has("Repeat damp")) return "actionCheckRepair";
    // A tenant who asked us for help always gets it
    if (has("Asked for energy advice") || has("Very poor energy") || (has("Poor energy") && risk.band !== "Low")) return "actionEnergy";
    if (has("No contact") || has("Tenant aged 75") || has("Tenant told us")) return "actionCheckIn";
    return "actionMonitor";
  }
};
