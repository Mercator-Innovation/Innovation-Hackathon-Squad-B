// "Where to act first": clickable summary cards, the trend chart, and risk by area.
// app.js calls GLANCE.render(list) every time the dashboard redraws.
window.GLANCE = (() => {
  const C = window.CONTENT;

  // ---- Helpers ----
  // Working days from a to b (positive if b is later). Weekends don't count.
  function workingDaysBetween(a, b) {
    const step = a <= b ? 1 : -1;
    let days = 0;
    const d = new Date(a);
    while (d.toDateString() !== b.toDateString()) {
      d.setDate(d.getDate() + step);
      if (d.getDay() !== 0 && d.getDay() !== 6) days += step;
    }
    return days;
  }
  function addWorkingDays(date, n) {
    const d = new Date(date);
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) n--;
    }
    return d;
  }
  const shortDate = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  // Traffic light for an area, from its average score.
  function light(avg) {
    if (avg >= 5.5) return { key: "red", label: C.lightRed };
    if (avg >= 4) return { key: "amber", label: C.lightAmber };
    return { key: "green", label: C.lightGreen };
  }

  // Trend: the history from data/trend.js, plus this week's live count.
  function series(name, now) {
    return [...window.TREND[name], now];
  }
  function trendText(values) {
    const before = values[values.length - 5]; // 4 weeks ago
    const now = values[values.length - 1];
    const diff = now - before;
    if (diff === 0) return { cls: "flat", text: `${C.trendFlat}` };
    return { cls: diff > 0 ? "up" : "down", text: `${diff > 0 ? "▲ up" : "▼ down"} ${Math.abs(diff)} ${C.trendSince}` };
  }
  function sparkline(values) {
    const max = Math.max(...values, 1);
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 26}`).join(" ");
    return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" /></svg>`;
  }

  // ---- Awaab's Law: a damp and mould check is due within 10 working days of a report ----
  function checksDue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allReports()
      .filter(r => !["Closed"].includes(state.status[r.ref] || r.status))
      .map(r => {
        const due = addWorkingDays(new Date(r.received + "T00:00"), 10);
        return { ref: r.ref, due, left: workingDaysBetween(today, due) };
      })
      .sort((a, b) => a.due - b.due);
  }

  // ---- Cards ----
  function renderCards(list) {
    const count = band => list.filter(h => h.risk.band === band).length;
    const high = count("High");
    const medium = count("Medium");
    const noContact = list.filter(h => h.monthsSinceLastContact > 12).length;
    const due = checksDue();
    const next = due[0];
    const urgent = due.filter(d => d.left <= 3).length;
    const newReports = allReports().filter(r => (state.status[r.ref] || r.status) === "New").length;

    const highSeries = series("High", high);
    const medSeries = series("Medium", medium);
    const ncSeries = series("NoContact", noContact);

    const cards = [
      { id: "high", label: C.cardHigh, count: high, alert: high > 0 && "red", flag: C.flagActNow, trend: trendText(highSeries), spark: highSeries, action: C.cardSeeHomes },
      { id: "medium", label: C.cardMedium, count: medium, alert: medium > 0 && "amber", trend: trendText(medSeries), spark: medSeries, action: C.cardSeeHomes },
      { id: "checks", label: C.cardChecks, count: due.length, alert: urgent ? "red" : due.length && "amber", flag: urgent ? C.flagOverdue : "",
        note: next ? (next.left < 0 ? C.checkOverdue : `${C.checkNext} ${shortDate(next.due)} (${next.left} ${C.workingDays})`) : C.checkNone, action: C.cardSeeReports },
      { id: "nocontact", label: C.cardNoContact, count: noContact, alert: noContact > 0 && "amber", trend: trendText(ncSeries), spark: ncSeries, action: C.cardSeeHomes },
      { id: "reports", label: C.cardReports, count: newReports, alert: newReports > 0 && "amber", action: C.cardSeeReports },
      { id: "visits", label: C.cardVisits, count: state.visits.length, action: C.cardSeeVisits }
    ];

    document.getElementById("glance-cards").innerHTML = cards.map(c => `
      <button type="button" class="glance-card ${c.alert ? "alert-" + c.alert : ""}" data-glance="${c.id}">
        ${c.flag && c.count ? `<span class="g-flag">${c.flag}</span>` : ""}
        <span class="g-count">${c.count}</span>
        <span class="g-label">${c.label}</span>
        ${c.trend ? `<span class="g-trend ${c.trend.cls}">${c.trend.text}</span>` : ""}
        ${c.note ? `<span class="g-note">${c.note}</span>` : ""}
        ${c.spark ? sparkline(c.spark) : ""}
        <span class="g-action">${c.action} →</span>
      </button>`).join("");
  }

  // ---- Trend chart ----
  function renderTrend(list) {
    const high = series("High", list.filter(h => h.risk.band === "High").length);
    const med = series("Medium", list.filter(h => h.risk.band === "Medium").length);
    const weeks = [...window.TREND.weeks, C.thisWeek];
    const W = 600, H = 220, L = 36, R = 90, T = 12, B = 30;
    const max = Math.ceil(Math.max(...med, ...high, 5) / 5) * 5;
    const x = i => L + (i / (weeks.length - 1)) * (W - L - R);
    const y = v => T + (1 - v / max) * (H - T - B);
    const line = vals => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
    const ticks = [0, max / 2, max];
    document.getElementById("trend-chart").innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="trend-title trend-summary">
        ${ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" /><text class="axis" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join("")}
        ${weeks.map((w, i) => i % 2 === 1 || i === weeks.length - 1 ? `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${w}</text>` : "").join("")}
        <polyline class="line-medium" points="${line(med)}" />
        <polyline class="line-high" points="${line(high)}" />
        ${med.map((v, i) => `<circle class="dot-medium" cx="${x(i)}" cy="${y(v)}" r="3.5" />`).join("")}
        ${high.map((v, i) => `<rect class="dot-high" x="${x(i) - 4}" y="${y(v) - 4}" width="8" height="8" />`).join("")}
        <text class="end-label medium" x="${W - R + 8}" y="${y(med[med.length - 1]) + 4}">${med[med.length - 1]} ${C.seriesMedium}</text>
        <text class="end-label high" x="${W - R + 8}" y="${y(high[high.length - 1]) + 4}">${high[high.length - 1]} ${C.seriesHigh}</text>
      </svg>`;
    const sentence = (label, vals) => {
      const before = vals[vals.length - 5], now = vals[vals.length - 1];
      if (before === now) return `${label} ${C.stayedAt} ${now} ${C.overWeeks}`;
      return `${label} ${now > before ? C.wentUp : C.wentDown} ${before} ${C.to} ${now} ${C.overWeeks}`;
    };
    document.getElementById("trend-summary").textContent =
      `${sentence(C.trendSummaryHigh, high)} ${sentence(C.trendSummaryMedium, med)}`;
  }

  // ---- Risk by area ----
  function areaStats(list) {
    const areas = [...new Set(list.map(h => h.area))].sort();
    return areas.map(area => {
      const inArea = list.filter(h => h.area === area);
      const avg = inArea.reduce((s, h) => s + h.risk.points, 0) / inArea.length;
      return { area, homes: inArea.length, high: inArea.filter(h => h.risk.band === "High").length, avg, light: light(avg) };
    });
  }

  function renderAreas(list) {
    document.getElementById("heatmap").innerHTML = areaStats(list).map(s => `
      <button type="button" class="light-${s.light.key}" data-area="${escapeHtml(s.area)}" aria-pressed="${selectedArea === s.area}">
        <span class="light-tag"><span class="dot" aria-hidden="true"></span>${s.light.label}</span>
        <span class="area-name">${escapeHtml(s.area)}</span>
        ${s.high} ${C.areaHighOf} ${s.homes} ${C.areaHomes}<br>${C.areaAverage} ${s.avg.toFixed(1)}
      </button>`).join("");
  }

  // ---- Clicking a card ----
  const FILTERS = {
    high: { band: "High", label: C.cardHigh },
    medium: { band: "Medium", label: C.cardMedium },
    nocontact: { test: h => h.monthsSinceLastContact > 12, label: C.cardNoContact }
  };
  const TABS = { checks: "#reports", reports: "#reports", visits: "#visits" };

  function applyFilter(id) {
    const f = FILTERS[id];
    document.getElementById("filter-band").value = f && f.band ? f.band : "";
    window.listFilter = f && f.test ? f.test : null;
    const chip = document.getElementById("active-filter");
    chip.hidden = !f;
    if (f) chip.querySelector("span").textContent = `${C.showing} ${f.label.toLowerCase()}`;
    render();
    if (f) {
      const heading = document.getElementById("list-title");
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      heading.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", e => {
    const card = e.target.closest("[data-glance]");
    if (card) {
      if (TABS[card.dataset.glance]) location.hash = TABS[card.dataset.glance];
      else applyFilter(card.dataset.glance);
    }
    if (e.target.closest("#clear-filter")) applyFilter(null);
  });
  // Changing the Risk filter by hand replaces a card's filter.
  document.addEventListener("change", e => {
    if (e.target.id === "filter-band") { window.listFilter = null; document.getElementById("active-filter").hidden = true; }
  });

  return {
    render(list) {
      renderCards(list);
      renderTrend(list);
      renderAreas(list);
    }
  };
})();
