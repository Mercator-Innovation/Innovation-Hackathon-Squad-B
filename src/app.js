// Staff dashboard: risk overview, heat map, reports from tenants, visits.
const C = window.CONTENT;
const { homes, team } = window.DATA;
const STATUSES = ["Not started", "Contacted", "Visit booked", "Work ordered", "Fixed", "Checked: risk down"];
let state = loadState();
let selectedArea = "";
let sort = { key: "risk", dir: "desc" };
let reportHomeFilter = null;   // set when you follow "See their reports" from a home

// "Showing {shown} of {total}" + { shown: 3, total: 30 } → "Showing 3 of 30"
function fillIn(text, values) {
  return text.replace(/\{(\w+)\}/g, (m, key) => values[key] ?? m);
}

// Seeded reports plus any sent from the tenant form in this browser.
function allReports() {
  return [...window.DATA.reports, ...state.reports];
}
function openReportHomeIds() {
  return allReports().filter(r => (state.status[r.ref] || r.status) !== "Closed").map(r => r.homeId);
}

function scored() {
  const ctx = { openReports: openReportHomeIds() };
  return homes
    .map(h => ({ ...h, risk: window.RISK.score(h, ctx), status: state.status[h.id] || h.status }))
    .sort((a, b) => b.risk.points - a.risk.points);
}

// ---- Overview ----
// The cards, trend chart and risk by area are drawn by glance.js.

function renderFilters() {
  const areas = [...new Set(homes.map(h => h.area))].sort();
  document.getElementById("filter-area").innerHTML =
    `<option value="">${C.filterAll}</option>` + areas.map(a => `<option>${escapeHtml(a)}</option>`).join("");
  document.getElementById("filter-band").innerHTML =
    `<option value="">${C.filterAll}</option><option>High</option><option>Medium</option><option>Low</option>`;
  const options = values => `<option value="">${C.filterAll}</option>` + values.map(v => `<option>${escapeHtml(v)}</option>`).join("");
  // The reasons come straight from the risk model, so a new rule shows up here too
  document.getElementById("filter-reason").innerHTML = options(window.RISK.rules.map(r => r.reason));
  document.getElementById("filter-status").innerHTML = options(STATUSES);
  document.getElementById("search").placeholder = C.searchPlaceholder;
  // Reports from tenants
  document.getElementById("report-filter-band").innerHTML = options(["High", "Medium", "Low"]) + `<option value="none">${C.filterNotRated}</option>`;
  document.getElementById("report-filter-status").innerHTML = options(["New", "Picked up", "Closed"]);
  document.getElementById("report-filter-type").innerHTML = options(["Damp", "Mould", "Condensation", "Cold", "Something else", "Not sure"]);
}

// ---- Homes to look at first: filters and sorting ----
// "29 Firth View" → "Firth View 29", so homes sort by street, then house number
const streetFirst = address => address.replace(/^(\S+)\s+(.*)$/, "$2 $1");
const SORTS = {
  risk: { value: h => h.risk.points, label: "colRisk", asc: "sortLowFirst", desc: "sortHighFirst", first: "desc" },
  home: { value: h => streetFirst(h.address), label: "colHome", asc: "sortAtoZ", desc: "sortZtoA", first: "asc" },
  area: { value: h => h.area, label: "colArea", asc: "sortAtoZ", desc: "sortZtoA", first: "asc" },
  reasons: { value: h => h.risk.reasons.length ? h.risk.reasons[0].reason : "~", label: "colReasons", asc: "sortAtoZ", desc: "sortZtoA", first: "asc" },
  status: { value: h => STATUSES.indexOf(h.status), label: "colStatus", asc: "sortStatusFirst", desc: "sortStatusLast", first: "asc" }
};

function compareHomes(a, b) {
  const va = SORTS[sort.key].value(a), vb = SORTS[sort.key].value(b);
  const c = typeof va === "number" ? va - vb : va.localeCompare(vb, "en-GB", { numeric: true });
  // Ties: highest risk first
  return (sort.dir === "asc" ? c : -c) || b.risk.points - a.risk.points;
}

function filterValues() {
  const v = id => document.getElementById(id).value;
  return { search: v("search").trim(), area: selectedArea, band: v("filter-band"), reason: v("filter-reason"), status: v("filter-status") };
}

// The homes the list shows right now, filtered and sorted. export.js uses this too.
function shownHomes(list = scored()) {
  const f = filterValues();
  const search = f.search.toLowerCase();
  return list.filter(h =>
    (!f.area || h.area === f.area) &&
    (!f.band || h.risk.band === f.band) &&
    (!f.reason || h.risk.reasons.some(r => r.reason === f.reason)) &&
    (!f.status || h.status === f.status) &&
    (!window.listFilter || window.listFilter(h)) &&
    (!search || `${h.address} ${h.tenant} ${h.id}`.toLowerCase().includes(search))
  ).sort(compareHomes);
}

function sortDescription() {
  const s = SORTS[sort.key];
  return `${C.sortedBy} ${C[s.label].toLowerCase()}, ${C[s[sort.dir]]}`;
}

// "Area: Gourock · Risk: High", for the PDF and Excel downloads
function filterDescription() {
  const f = filterValues();
  const parts = [
    f.search && `${C.filterSearch}: "${f.search}"`,
    f.area && `${C.filterArea}: ${f.area}`,
    f.band && `${C.filterBand}: ${f.band}`,
    f.reason && `${C.filterReason}: ${f.reason}`,
    f.status && `${C.filterStatus}: ${f.status}`,
    window.listFilter && !document.getElementById("active-filter").hidden && document.getElementById("active-filter").querySelector("span").textContent
  ].filter(Boolean);
  return parts.join(" · ") || C.downloadNoFilters;
}

function renderSortHeaders() {
  document.querySelectorAll("th[data-col]").forEach(th => {
    const on = th.dataset.col === sort.key;
    if (on) th.setAttribute("aria-sort", sort.dir === "asc" ? "ascending" : "descending");
    else th.removeAttribute("aria-sort");
    th.querySelector(".sort-icon").textContent = on ? (sort.dir === "asc" ? "▲" : "▼") : "↕";
  });
  document.getElementById("homes-caption").textContent = `${C.listTitle}. ${sortDescription()}. ${C.sortHint}`;
}

function clearAllFilters() {
  ["search", "filter-band", "filter-reason", "filter-status", "filter-area"].forEach(id => { document.getElementById(id).value = ""; });
  selectedArea = "";
  window.listFilter = null;
  document.getElementById("active-filter").hidden = true;
  render();
  document.getElementById("search").focus();
}

// The top two reasons. When you filter by a reason, it comes first, so you can see why the home is listed.
function mainReasons(h, filterReason) {
  const picked = h.risk.reasons.filter(r => r.reason === filterReason);
  return [...picked, ...h.risk.reasons.filter(r => r.reason !== filterReason)].slice(0, 2);
}

function renderList(list) {
  const shown = shownHomes(list);
  const f = filterValues();
  const anyFilter = f.search || f.area || f.band || f.reason || f.status || window.listFilter;
  document.getElementById("homes-count").textContent = fillIn(C.homesCount, { shown: shown.length, total: list.length });
  document.getElementById("clear-all").hidden = !anyFilter;
  renderSortHeaders();
  document.getElementById("homes").innerHTML = shown.map(h => `
    <tr>
      <td><span class="badge ${h.risk.band}">${h.risk.band} · ${h.risk.points}</span></td>
      <td><button type="button" class="link" data-home="${h.id}">${escapeHtml(h.address)}</button><br><small>${h.id}</small></td>
      <td>${escapeHtml(h.area)}</td>
      <td>${mainReasons(h, f.reason).map(r => escapeHtml(r.reason)).join("<br>") || "None"}</td>
      <td>${escapeHtml(h.status)}</td>
    </tr>`).join("") || `<tr><td colspan="5">No homes match.</td></tr>`;
}

// ---- Home detail ----
// "07700 900148" → "***** **0148": enough to check you've got the right person
function maskPhone(phone) {
  const last4 = phone.replace(/\D/g, "").slice(-4);
  return { masked: phone.slice(0, -4).replace(/\d/g, "*") + last4, last4 };
}

// The number stays hidden until someone chooses "Show number"
function phoneHtml(h) {
  const { masked, last4 } = maskPhone(h.phone);
  return `<span class="phone" data-full="${escapeHtml(h.phone)}" data-masked="${escapeHtml(masked)}" data-last4="${last4}"><span class="phone-number" aria-hidden="true">${escapeHtml(masked)}</span><span class="visually-hidden phone-sr">${C.phoneEnding} ${last4}</span></span>
    <button type="button" class="small" data-toggle-phone aria-pressed="false">${C.showNumber}</button>`;
}

function togglePhone(button) {
  const phone = button.previousElementSibling;
  const show = button.getAttribute("aria-pressed") !== "true";
  phone.querySelector(".phone-number").textContent = show ? phone.dataset.full : phone.dataset.masked;
  phone.querySelector(".phone-sr").textContent = show ? phone.dataset.full : `${C.phoneEnding} ${phone.dataset.last4}`;
  button.setAttribute("aria-pressed", show);
  button.textContent = show ? C.hideNumber : C.showNumber;
}

const monthsText = m => `${m} ${m === 1 ? "month" : "months"}`;

function contactHtml(h, reports) {
  if (!reports.length) return `${C.contactNotReported}. ${fillIn(C.contactLast, { months: monthsText(h.monthsSinceLastContact) })}`;
  const count = reports.length === 1 ? C.contactOneReport : fillIn(C.contactReportCount, { count: reports.length });
  return `<strong>${C.contactReported}</strong> (${count}). <button type="button" class="link" data-show-reports="${h.id}">${C.contactSeeReports}</button>`;
}

function openHome(id) {
  const h = scored().find(x => x.id === id);
  const reports = allReports().filter(r => r.homeId === id);
  const latest = reports[reports.length - 1];
  const prefers = latest && latest.contactBy;
  const body = document.getElementById("detail-body");
  body.innerHTML = `
    <button type="button" class="link dialog-close" id="close-detail">${C.closeButton}</button>
    <h2 id="detail-title">${escapeHtml(h.address)}, ${escapeHtml(h.area)}</h2>
    <p class="badges">
      <span class="badge ${h.risk.band}">${h.risk.band} risk · ${h.risk.points} points</span>
      ${reports.length
        ? `<button type="button" class="badge contact yes" data-show-reports="${h.id}">${C.contactReported} →</button>`
        : `<span class="badge contact">${C.contactNotReported}</span>`}
    </p>

    <h3>${C.aboutHomeTitle}</h3>
    <dl class="facts">
      <dt>${C.factTenant}</dt>
      <dd>${escapeHtml(h.tenant)}<br><span class="hint">${C.factTenantHint}</span></dd>
      <dt>${C.factContact}</dt>
      <dd>${contactHtml(h, reports)}</dd>
      <dt>${C.factPhone}</dt>
      <dd>${phoneHtml(h)}${prefers ? `<br><span class="hint">${C.contactPrefers}: ${escapeHtml(prefers)}</span>` : ""}</dd>
      <dt>${C.factHousehold}</dt>
      <dd>${h.household.people} ${h.household.people === 1 ? C.factPerson : C.factPeople}<br>${C.ageBandLabel}: ${escapeHtml(h.household.tenantAgeBand)}</dd>
      <dt>${C.factHome}</dt>
      <dd>${h.propertyType}, ${C.factBuilt} ${h.built}</dd>
      <dt>${C.factEpc}</dt>
      <dd>${h.epc}<br><span class="hint">${C.factEpcHint}</span></dd>
      <dt>${C.factSensor}</dt>
      <dd>${h.sensor ? fillIn(C.factSensorReading, h.sensor) : C.factNoSensor}</dd>
    </dl>
    <p class="hint">${C.factsSource}</p>

    <h3>${C.whyFlagged}</h3>
    <ul class="reasons">${h.risk.reasons.map(r => `<li>${escapeHtml(r.reason)} (+${r.points})</li>`).join("") || "<li>Nothing flagged</li>"}</ul>
    <h3>${C.suggestedTitle}</h3>
    <p class="card suggested">${escapeHtml(C[window.RISK.suggest(h, h.risk)])}</p>
    <p class="notice">${C.humanCheck}</p>

    <h3>${C.repairsTitle}</h3>
    ${h.repairNotes.length
      ? `<ul class="repairs">${h.repairNotes.map(r => `<li><strong>${new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>: ${escapeHtml(r.note)}</li>`).join("")}</ul>`
      : `<p>${C.repairsNone}</p>`}

    ${reports.length ? `<h3>Reports from this tenant</h3>${reports.map(r => `<div class="card"><strong>${r.ref}</strong>, ${r.received}: ${escapeHtml(r.problems.join(", "))}<br>${escapeHtml(r.description)}</div>`).join("")}
      <p><button type="button" class="link" data-show-reports="${h.id}">${C.contactSeeReports}</button></p>` : ""}

    <h3>${C.caseTitle}</h3>
    <div class="form-row"><label for="status">${C.statusLabel}</label>
      <select id="status">${STATUSES.map(s => `<option ${s === h.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
    <div class="form-row"><label for="note">${C.noteLabel}</label>
      <textarea id="note" rows="3">${escapeHtml(state.notes[id] || "")}</textarea></div>
    <button type="button" class="primary" id="save-case">${C.saveButton}</button>

    <h3>${C.bookTitle}</h3>
    <p>${C.bookHelp}</p>
    <a class="button" href="#cases/${id}" id="open-case">${C.openCase}</a>`;

  document.getElementById("close-detail").onclick = () => dialog.close();
  document.getElementById("save-case").onclick = () => {
    state.status[id] = document.getElementById("status").value;
    state.notes[id] = document.getElementById("note").value;
    saveState(state); render(); dialog.close();
  };
  document.getElementById("open-case").onclick = () => dialog.close();
  if (!dialog.open) dialog.showModal();
}

// From a home's card to its reports, on the Reports from tenants tab
function showReportsFor(id) {
  reportHomeFilter = id;
  ["report-filter-band", "report-filter-status", "report-filter-type"].forEach(f => { document.getElementById(f).value = ""; });
  if (dialog.open) dialog.close();
  location.hash = "#reports";
  showTab();
  renderReports();
  document.getElementById("reports-title").focus();
}

// ---- Reports and visits ----
// "2026-10-21" → "21 Oct 2026"
function formatDate(iso) {
  return new Date(iso + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function renderReports() {
  const rated = scored();
  const band = document.getElementById("report-filter-band").value;
  const statusFilter = document.getElementById("report-filter-status").value;
  const type = document.getElementById("report-filter-type").value;
  const search = document.getElementById("report-search").value.trim().toLowerCase();
  const list = allReports().slice().reverse().map(r => {
    const home = homes.find(h => h.id === r.homeId);
    const risk = home && rated.find(h => h.id === home.id).risk;
    return { r, home, risk, status: state.status[r.ref] || r.status };
  }).filter(({ r, home, risk, status }) =>
    (!reportHomeFilter || r.homeId === reportHomeFilter) &&
    (!band || (risk ? risk.band === band : band === "none")) &&
    (!statusFilter || status === statusFilter) &&
    (!type || r.problems.includes(type)) &&
    (!search || `${r.ref} ${r.name || ""} ${r.address || ""} ${home ? `${home.address} ${home.area} ${home.tenant}` : ""}`.toLowerCase().includes(search))
  );
  const anyFilter = band || statusFilter || type || reportHomeFilter || search;
  const filteredHome = reportHomeFilter && homes.find(h => h.id === reportHomeFilter);
  const chip = document.getElementById("report-home-filter");
  chip.hidden = !filteredHome;
  if (filteredHome) chip.querySelector("span").textContent = fillIn(C.reportsShowingHome, { address: filteredHome.address });
  // Laid out like the Cases table: column labels show on wide screens, and above each value on phones.
  const cell = (label, html, cls) => `<div class="rr-cell ${cls}"><span class="rr-label">${label}</span>${html}</div>`;
  const rows = list.map(({ r, home, risk, status }) => `
    <article class="report-row" aria-label="${escapeHtml(`${C.reportRef} ${r.ref}`)}">
      ${cell(C.rrHome, `${home ? `<button type="button" class="link" data-home="${home.id}">${escapeHtml(home.address)}</button>, ${escapeHtml(home.area)}` : escapeHtml(r.address || "Address not matched")}
        <br><small>${r.ref} · ${escapeHtml(r.name || (home && home.tenant) || C.reportNotGiven)}</small>`, "rr-home")}
      ${cell(C.rrRisk, risk ? `<span class="badge ${risk.band}">${risk.band} · ${risk.points}</span>` : `<span class="badge">${C.filterNotRated}</span>`, "rr-risk")}
      ${cell(C.rrType, `${escapeHtml(r.problems.join(", "))}<br><small>${escapeHtml(r.rooms || C.reportNotGiven)}</small>`, "rr-type")}
      ${cell(C.rrStatus, `${escapeHtml(status)}<br><small>${formatDate(r.received)}</small>`, "rr-status")}
      <div class="rr-actions">
        ${status === "New" ? `<button type="button" class="primary" data-close-report="${r.ref}">Mark as picked up</button>`
          : home ? `<a class="button case-button" href="#cases/${home.id}" data-case-for="${r.ref}">${C.openCase}</a>` : ""}
      </div>
      <p class="rr-comment"><span class="label">${C.reportComments}</span> ${escapeHtml(r.description)}
        <small class="rr-contact">${C.reportContact} ${escapeHtml(r.contactBy || C.reportNotGiven)}</small></p>
    </article>`).join("");
  document.getElementById("reports-list").innerHTML = rows
    ? `<div class="report-cols" aria-hidden="true"><span>${C.rrHome}</span><span>${C.rrRisk}</span><span>${C.rrType}</span><span>${C.rrStatus}</span><span></span></div>${rows}`
    : `<p>${anyFilter ? C.reportsNoMatch : C.reportsEmpty}</p>`;
}

function renderVisits() {
  document.getElementById("visits-list").innerHTML = team.map(t => {
    const mine = state.visits.filter(v => v.who === t.name);
    if (!mine.length) return "";
    return `<div class="card"><h3>${escapeHtml(t.name)}, ${escapeHtml(t.role)}</h3>
      <ul>${mine.map(v => `<li>${escapeHtml(v.when)}: <button type="button" class="link" data-home="${v.homeId}">${escapeHtml(v.address)}</button></li>`).join("")}</ul></div>`;
  }).join("") || `<p>${C.visitsEmpty}</p>`;
}

// ---- Tabs ----
function showTab() {
  const tab = (location.hash || "#overview").slice(1);
  ["overview", "reports", "visits"].forEach(t => {
    document.getElementById(`tab-${t}`).hidden = t !== tab;
    const link = document.querySelector(`[data-tab="${t}"]`);
    if (t === tab) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
}

function render() {
  const list = scored();
  window.GLANCE.render(list);
  renderList(list);
  renderReports();
}

const dialog = document.getElementById("detail");
fillText();
renderFilters();
render();
showTab();

window.addEventListener("hashchange", showTab);
document.getElementById("search").addEventListener("input", render);
["filter-band", "filter-reason", "filter-status"].forEach(id =>
  document.getElementById(id).addEventListener("change", render));
["report-filter-band", "report-filter-status", "report-filter-type"].forEach(id =>
  document.getElementById(id).addEventListener("change", renderReports));
document.getElementById("report-search").addEventListener("input", renderReports);
document.getElementById("filter-area").addEventListener("change", e => { selectedArea = e.target.value; render(); });
document.addEventListener("click", e => {
  const area = e.target.closest("[data-area]");
  if (area) {
    selectedArea = selectedArea === area.dataset.area ? "" : area.dataset.area;
    document.getElementById("filter-area").value = selectedArea;
    render();
  }
  const home = e.target.closest("[data-home]");
  if (home) openHome(home.dataset.home);
  const report = e.target.closest("[data-close-report]");
  if (report) {
    const ref = report.dataset.closeReport;
    state.status[ref] = "Picked up"; saveState(state); render();
    // Keep keyboard users in place: move focus to the button that replaced the one they clicked.
    const next = document.querySelector(`[data-case-for="${ref}"]`);
    if (next) next.focus();
  }

  // Sorting: choose a column once to sort by it, again to reverse
  const sortButton = e.target.closest("[data-sort]");
  if (sortButton) {
    const key = sortButton.dataset.sort;
    sort = sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: SORTS[key].first };
    render();
  }
  if (e.target.closest("#clear-all")) clearAllFilters();

  // Home details card
  const showReports = e.target.closest("[data-show-reports]");
  if (showReports) showReportsFor(showReports.dataset.showReports);
  const phone = e.target.closest("[data-toggle-phone]");
  if (phone) togglePhone(phone);

  // Reports from tenants: back to all reports
  if (e.target.closest("#clear-report-home") || e.target.closest('[data-tab="reports"]')) {
    reportHomeFilter = null;
    renderReports();
  }
});
