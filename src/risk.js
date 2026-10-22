// The risk rating model. Each rule adds points and gives a reason staff can see.
// Change the points or add rules here. Bands are at the bottom.
window.RISK = {
  rules: [
    { reason: "Poor energy rating (EPC E)", points: 1, test: h => h.epc === "E" },
    { reason: "Very poor energy rating (EPC F or G)", points: 2, test: h => h.epc === "F" || h.epc === "G" },
    { reason: "Damp or mould repairs in the last year", points: 2, test: h => h.dampRepairs12m >= 1 },
    { reason: "Repeat damp or mould repairs", points: 1, test: h => h.dampRepairs12m >= 2 },
    { reason: "Sensor shows high humidity (over 70%)", points: 2, test: h => h.sensor && h.sensor.humidity > 70 },
    { reason: "Sensor shows a cold home (under 16°C)", points: 2, test: h => h.sensor && h.sensor.temperature < 16 },
    { reason: "Older person in the household", points: 1, test: h => h.household.olderPerson },
    { reason: "Young child in the household", points: 1, test: h => h.household.youngChild },
    { reason: "Tenant told us about a health condition", points: 2, test: h => h.household.healthConditionShared },
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
    const reasons = this.rules.filter(r => r.test(home, ctx));
    const points = reasons.reduce((sum, r) => sum + r.points, 0);
    const band = this.bands.find(b => points >= b.min).name;
    return { points, band, reasons };
  }
};
