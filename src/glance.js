// "Where to act first": clickable summary cards, the trend chart, and risk by area (a map and an area matrix side by side).
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
      .filter(r => reportStatus(r) !== "Closed")
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
    const newReports = allReports().filter(r => reportStatus(r) === "New").length;

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

  // ---- Risk by area: a map and an area matrix, side by side ----
  // Rough positions on a simplified map of Inverclyde (percent across, percent down). Not to scale.
  // The Firth of Clyde is along the top and down the left; every town sits on land.
  const MAP_POS = {
    "Gourock": [28, 29], "Greenock West": [40, 37], "Greenock Central": [54, 49], "Greenock East": [68, 38],
    "Port Glasgow": [87, 36], "Kilmacolm": [80, 66], "Inverkip": [28, 58], "Wemyss Bay": [24, 75]
  };
  // The coast, from the east end of the Firth round Gourock and down to Wemyss Bay
  const LAND = "M100,27 L86,29 L74,31 L62,29 L50,30 L41,28 L34,23 L27,21 L24,29 L22,41 L21,52 L19,64 L17,76 L15,100 L100,100 Z";
  const BANDS = ["High", "Medium", "Low"];

  function areaStats(list) {
    const areas = [...new Set(list.map(h => h.area))];
    return areas.map(area => {
      const inArea = list.filter(h => h.area === area);
      const avg = inArea.reduce((s, h) => s + h.risk.points, 0) / inArea.length;
      const count = band => inArea.filter(h => h.risk.band === band).length;
      return { area, homes: inArea.length, high: count("High"), medium: count("Medium"), low: count("Low"), avg, light: light(avg) };
    // Highest risk first: most high risk homes, then the highest average
    }).sort((a, b) => b.high - a.high || b.avg - a.avg);
  }

  const areaLabel = s => `${s.area}: ${s.light.label}. ${s.high} ${C.areaHighOf} ${s.homes} ${C.areaHomes}. ${C.areaAverage} ${s.avg.toFixed(1)}.`;

  function pinHtml(s, left, top) {
    return `<button type="button" class="map-pin light-${s.light.key}" style="left:${left}%;top:${top}%" data-area="${escapeHtml(s.area)}"
      aria-pressed="${selectedArea === s.area}" aria-label="${escapeHtml(areaLabel(s))}">
      <span class="pin-dot" aria-hidden="true">${s.high}</span>
      <span class="pin-name" aria-hidden="true">${escapeHtml(s.area)}</span>
    </button>`;
  }

  // Simon's map (map.js): coast, far shore, main roads and glowing risk hotspots, the same as on Who's where.
  // A pin for each area sits at the middle of its homes. Choose an area and the map zooms in to it,
  // with a dot for each home (choose a dot to open the home).
  function heatMapHtml(stats) {
    const L = window.LOCATIONS.homes;
    const k = Math.cos(55.93 * Math.PI / 180);
    const zoomed = selectedArea && window.DATA.homes.some(h => h.area === selectedArea && L[h.id]);
    const pts = window.DATA.homes.filter(h => !zoomed || h.area === selectedArea).map(h => L[h.id]).filter(Boolean);
    const xs = pts.map(p => p.lng * k), ys = pts.map(p => -p.lat);
    const W = 600, H = 480, pad = 56;
    let spanX = Math.max(Math.max(...xs) - Math.min(...xs), 0.03), spanY = Math.max(Math.max(...ys) - Math.min(...ys), 0.018);
    if (spanX / spanY < W / H) spanX = spanY * W / H; else spanY = spanX * H / W;
    const midX = (Math.max(...xs) + Math.min(...xs)) / 2, midY = (Math.max(...ys) + Math.min(...ys)) / 2;
    const scale = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
    const xy = p => [W / 2 + (p.lng * k - midX) * scale, H / 2 + (-p.lat - midY) * scale].map(n => Math.round(n));
    const centre = area => {
      const ps = window.DATA.homes.filter(h => h.area === area && L[h.id]).map(h => xy(L[h.id]));
      return ps.length ? [ps.reduce((t, q) => t + q[0], 0) / ps.length, ps.reduce((t, q) => t + q[1], 0) / ps.length] : [W / 2, H / 2];
    };
    return `<figure class="area-map-wrap">
      <div class="area-map heat" style="aspect-ratio: ${W} / ${H}">
        <svg class="map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${window.MAP.layers(xy, scale / 111.32, { hot: true, towns: false })}</svg>
        <span class="map-north" aria-hidden="true">N ↑</span>
        ${stats.map(s => {
          const [x, y] = centre(s.area);
          if (x < 0 || x > W || y < 0 || y > H) return "";   // off the edge when zoomed in
          return pinHtml(s, (x / W * 100).toFixed(1), (y / H * 100).toFixed(1));
        }).join("")}
        ${zoomed ? scored().filter(h => h.area === selectedArea && L[h.id]).map(h => {
          const [x, y] = xy(L[h.id]);
          return `<button type="button" class="map-home ${h.risk.band}" style="left:${(x / W * 100).toFixed(1)}%;top:${(y / H * 100).toFixed(1)}%"
            data-home="${h.id}" aria-label="${escapeHtml(`${h.address}: ${h.risk.band} risk, ${h.risk.points} points`)}" title="${escapeHtml(h.address)}"></button>`;
        }).join("") : ""}
        ${zoomed ? `<button type="button" class="map-zoom-out" data-area="${escapeHtml(selectedArea)}">← ${C.mapZoomOut}</button>` : ""}
      </div>
      <figcaption>
        <span class="map-key">${["red", "amber", "green"].map(k2 => `<span class="light-${k2}"><span class="dot" aria-hidden="true"></span>${C["light" + k2[0].toUpperCase() + k2.slice(1)]}</span>`).join("")}</span>
        <span class="hint">${C.areaHeatNote}</span>
      </figcaption>
    </figure>`;
  }

  function mapHtml(stats) {
    if (window.MAP && window.LOCATIONS) return heatMapHtml(stats);
    return `<figure class="area-map-wrap">
      <div class="area-map">
        <svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="land" d="${LAND}" />
          <text class="water-label" x="56" y="13">${C.mapWater}</text>
        </svg>
        <span class="map-north" aria-hidden="true">N ↑</span>
        ${stats.map(s => pinHtml(s, ...(MAP_POS[s.area] || [60, 85]))).join("")}
      </div>
      <figcaption>
        <span class="map-key">${["red", "amber", "green"].map(k => `<span class="light-${k}"><span class="dot" aria-hidden="true"></span>${C["light" + k[0].toUpperCase() + k.slice(1)]}</span>`).join("")}</span>
        <span class="hint">${C.areaMapNote}</span>
      </figcaption>
    </figure>`;
  }

  // Each area as a row with one stacked bar: high, medium and low risk homes, sized by how many.
  // Every part of the bar opens exactly those homes in the list.
  function matrixHtml(stats) {
    const most = Math.max(1, ...stats.map(s => s.homes));
    const seg = (s, band) => {
      const n = s[band.toLowerCase()];
      return n ? `<button type="button" class="seg seg-${band.toLowerCase()}" style="flex: ${n}" data-area-band="${escapeHtml(s.area)}|${band}">${n}<span class="visually-hidden"> ${band.toLowerCase()} risk ${n === 1 ? "home" : "homes"} in ${escapeHtml(s.area)}</span></button>` : "";
    };
    const total = band => stats.reduce((sum, s) => sum + s[band.toLowerCase()], 0);
    return `<div class="area-matrix">
      <h3 id="matrix-title">${C.matrixTitle}</h3>
      <p class="hint">${C.matrixHelp}</p>
      <p class="seg-key" aria-hidden="true">${BANDS.map(b => `<span class="key-${b.toLowerCase()}">${b}</span>`).join("")}</p>
      <ol class="area-list" aria-labelledby="matrix-title">${stats.map(s => `
        <li class="area-row ${selectedArea === s.area ? "is-selected" : ""}" data-row-area="${escapeHtml(s.area)}">
          <div class="ar-head">
            <button type="button" class="ar-name" data-area="${escapeHtml(s.area)}" aria-pressed="${selectedArea === s.area}">${escapeHtml(s.area)}</button>
            <span class="light-tag light-${s.light.key}"><span class="dot" aria-hidden="true"></span>${s.light.label}</span>
            <span class="ar-score" title="${C.matrixAverage}">${s.avg.toFixed(1)}<span class="visually-hidden"> ${C.matrixAverage.toLowerCase()}</span></span>
          </div>
          <div class="ar-bar" style="width: ${Math.max(28, (s.homes / most) * 100)}%">${BANDS.map(b => seg(s, b)).join("")}</div>
        </li>`).join("")}
      </ol>
      <p class="ar-total">${C.matrixTotal}: <strong>${total("High")}</strong> high · <strong>${total("Medium")}</strong> medium · <strong>${total("Low")}</strong> low</p>
      <details class="rating-how">
        <summary>${C.ratingHowTitle}</summary>
        <p>${C.ratingHowIntro}</p>
        <ul>${window.RISK.rules.map(r => `<li>${escapeHtml(r.reason)}: <strong>+${r.points}</strong></li>`).join("")}</ul>
        <p>${window.RISK.bands.map((b, i) => i === window.RISK.bands.length - 1
          ? `<strong>${b.name}</strong>: ${C.ratingUnder} ${window.RISK.bands[i - 1].min} ${C.ratingPoints}`
          : `<strong>${b.name}</strong>: ${b.min} ${C.ratingPoints} ${C.ratingOrMore}`).join(" · ")}</p>
        <p class="hint">${C.humanCheck}</p>
      </details>
    </div>`;
  }

  function renderAreas(list) {
    const stats = areaStats(list);
    const box = document.getElementById("heatmap");
    const open = box.querySelector(".rating-how[open]");
    box.innerHTML = mapHtml(stats) + matrixHtml(stats);
    if (open) box.querySelector(".rating-how").open = true;
  }

  // Pointing at an area in one column lights it up in the other
  function hotArea(area) {
    document.querySelectorAll("#heatmap .is-hot").forEach(el => el.classList.remove("is-hot"));
    if (!area) return;
    document.querySelectorAll(`#heatmap [data-area="${CSS.escape(area)}"].map-pin, #heatmap [data-row-area="${CSS.escape(area)}"]`)
      .forEach(el => el.classList.add("is-hot"));
  }
  ["mouseover", "focusin"].forEach(type => document.addEventListener(type, e => {
    const box = document.getElementById("heatmap");
    if (!box || !box.contains(e.target)) return;
    const el = e.target.closest("[data-area], [data-row-area], [data-area-band]");
    hotArea(el && (el.dataset.area || el.dataset.rowArea || el.dataset.areaBand.split("|")[0]));
  }));
  ["mouseleave", "focusout"].forEach(type => document.getElementById("heatmap").addEventListener(type, e => {
    if (type === "focusout" && document.getElementById("heatmap").contains(e.relatedTarget)) return;
    hotArea(null);
  }));

  // map.js loads after this file, so draw the areas again once everything has loaded
  window.addEventListener("load", () => { if (window.MAP) render(); });

  // A number in the matrix: show exactly those homes, then take you to the list
  function showAreaBand(area, band) {
    selectedArea = area;
    document.getElementById("filter-area").value = area;
    document.getElementById("filter-band").value = band;
    window.listFilter = null;
    document.getElementById("active-filter").hidden = true;
    render();
    const heading = document.getElementById("list-title");
    heading.scrollIntoView({ behavior: "smooth", block: "start" });
    heading.focus({ preventScroll: true });
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
    const cell = e.target.closest("[data-area-band]");
    if (cell) { const [area, band] = cell.dataset.areaBand.split("|"); showAreaBand(area, band); }
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
    },
    // Shared so the tests in tests/ can check them
    workingDaysBetween, addWorkingDays, light
  };
})();
