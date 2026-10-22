// Staff dashboard: risk overview, heat map, reports from tenants, visits.
const C = window.CONTENT;
const { homes, team } = window.DATA;
const STATUSES = ["Not started", "Contacted", "Visit booked", "Work ordered", "Fixed", "Checked: risk down"];
let state = loadState();
let selectedArea = "";

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
function renderSummary(list) {
  const count = band => list.filter(h => h.risk.band === band).length;
  const newReports = allReports().filter(r => (state.status[r.ref] || r.status) === "New").length;
  document.getElementById("summary").innerHTML = `
    <div><strong>${count("High")}</strong> high risk homes</div>
    <div><strong>${count("Medium")}</strong> medium risk homes</div>
    <div><strong>${newReports}</strong> new reports from tenants</div>
    <div><strong>${state.visits.length}</strong> visits booked</div>`;
}

function renderHeatmap(list) {
  const areas = [...new Set(homes.map(h => h.area))].sort();
  document.getElementById("heatmap").innerHTML = areas.map(area => {
    const inArea = list.filter(h => h.area === area);
    const high = inArea.filter(h => h.risk.band === "High").length;
    const avg = inArea.reduce((s, h) => s + h.risk.points, 0) / inArea.length;
    const level = avg >= 6 ? 3 : avg >= 4.5 ? 2 : avg >= 3 ? 1 : 0;
    return `<button type="button" class="heat-${level}" data-area="${escapeHtml(area)}" aria-pressed="${selectedArea === area}">
      <span class="area-name">${escapeHtml(area)}</span>
      ${high} high risk of ${inArea.length} homes<br>Average score ${avg.toFixed(1)}
    </button>`;
  }).join("");
}

function renderFilters() {
  const areas = [...new Set(homes.map(h => h.area))].sort();
  document.getElementById("filter-area").innerHTML =
    `<option value="">${C.filterAll}</option>` + areas.map(a => `<option>${escapeHtml(a)}</option>`).join("");
  document.getElementById("filter-band").innerHTML =
    `<option value="">${C.filterAll}</option><option>High</option><option>Medium</option><option>Low</option>`;
}

function renderList(list) {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const band = document.getElementById("filter-band").value;
  const shown = list.filter(h =>
    (!selectedArea || h.area === selectedArea) &&
    (!band || h.risk.band === band) &&
    (!search || `${h.address} ${h.tenant} ${h.id}`.toLowerCase().includes(search)));
  document.getElementById("homes").innerHTML = shown.map(h => `
    <tr>
      <td><span class="badge ${h.risk.band}">${h.risk.band} · ${h.risk.points}</span></td>
      <td><button type="button" class="link" data-home="${h.id}">${escapeHtml(h.address)}</button><br><small>${h.id}</small></td>
      <td>${escapeHtml(h.area)}</td>
      <td>${h.risk.reasons.slice(0, 2).map(r => escapeHtml(r.reason)).join("<br>") || "None"}</td>
      <td>${escapeHtml(h.status)}</td>
    </tr>`).join("") || `<tr><td colspan="5">No homes match.</td></tr>`;
}

// ---- Home detail ----
function weekdaySlots() {
  const slots = [];
  const d = new Date();
  while (slots.length < 10) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    slots.push(`${day}, morning`, `${day}, afternoon`);
  }
  return slots.slice(0, 10);
}

function openHome(id) {
  const h = scored().find(x => x.id === id);
  const reports = allReports().filter(r => r.homeId === id);
  const visits = state.visits.filter(v => v.homeId === id);
  const body = document.getElementById("detail-body");
  body.innerHTML = `
    <button type="button" class="link dialog-close" id="close-detail">Close</button>
    <h2 id="detail-title">${escapeHtml(h.address)}, ${escapeHtml(h.area)}</h2>
    <p><span class="badge ${h.risk.band}">${h.risk.band} risk · ${h.risk.points} points</span></p>
    <p>${escapeHtml(h.tenant)} · ${h.household.people} ${h.household.people === 1 ? "person" : "people"} · ${h.propertyType}, built ${h.built} · EPC ${h.epc}
      ${h.sensor ? `<br>Sensor: ${h.sensor.humidity}% humidity, ${h.sensor.temperature}°C` : ""}</p>

    <h3>${C.whyFlagged}</h3>
    <ul class="reasons">${h.risk.reasons.map(r => `<li>${escapeHtml(r.reason)} (+${r.points})</li>`).join("") || "<li>Nothing flagged</li>"}</ul>
    <h3>${C.suggestedTitle}</h3>
    <p class="card suggested">${escapeHtml(C[window.RISK.suggest(h, h.risk)])}</p>
    <p class="notice">${C.humanCheck}</p>

    <h3>${C.householdTitle}</h3>
    <p>${C.ageBandLabel}: ${escapeHtml(h.household.tenantAgeBand)}</p>

    <h3>${C.repairsTitle}</h3>
    ${h.repairNotes.length
      ? `<ul class="repairs">${h.repairNotes.map(r => `<li><strong>${new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>: ${escapeHtml(r.note)}</li>`).join("")}</ul>`
      : `<p>${C.repairsNone}</p>`}

    ${reports.length ? `<h3>Reports from this tenant</h3>${reports.map(r => `<div class="card"><strong>${r.ref}</strong>, ${r.received}: ${escapeHtml(r.problems.join(", "))}<br>${escapeHtml(r.description)}</div>`).join("")}` : ""}

    <h3>${C.caseTitle}</h3>
    <div class="form-row"><label for="status">${C.statusLabel}</label>
      <select id="status">${STATUSES.map(s => `<option ${s === h.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
    <div class="form-row"><label for="note">${C.noteLabel}</label>
      <textarea id="note" rows="3">${escapeHtml(state.notes[id] || "")}</textarea></div>
    <button type="button" class="primary" id="save-case">${C.saveButton}</button>

    <h3>${C.bookTitle}</h3>
    ${visits.map(v => `<p>Booked: ${escapeHtml(v.who)}, ${escapeHtml(v.when)}</p>`).join("")}
    <div class="form-row"><label for="visit-who">${C.bookWho}</label>
      <select id="visit-who">${team.map(t => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)} (${escapeHtml(t.role)})</option>`).join("")}</select></div>
    <div class="form-row"><label for="visit-when">${C.bookWhen}</label>
      <select id="visit-when">${weekdaySlots().map(s => `<option>${s}</option>`).join("")}</select></div>
    <button type="button" class="primary" id="book-visit">${C.bookButton}</button>`;

  document.getElementById("close-detail").onclick = () => dialog.close();
  document.getElementById("save-case").onclick = () => {
    state.status[id] = document.getElementById("status").value;
    state.notes[id] = document.getElementById("note").value;
    saveState(state); render(); dialog.close();
  };
  document.getElementById("book-visit").onclick = () => {
    state.visits.push({ homeId: id, address: h.address, who: document.getElementById("visit-who").value, when: document.getElementById("visit-when").value });
    state.status[id] = "Visit booked";
    saveState(state); render(); openHome(id);
  };
  if (!dialog.open) dialog.showModal();
}

// ---- Reports and visits ----
function renderReports() {
  const list = allReports().slice().reverse();
  document.getElementById("reports-list").innerHTML = list.map(r => {
    const home = homes.find(h => h.id === r.homeId);
    const status = state.status[r.ref] || r.status;
    return `<div class="card">
      <h3>${r.ref}: ${escapeHtml(r.problems.join(", "))}</h3>
      <p>${home ? `<button type="button" class="link" data-home="${home.id}">${escapeHtml(home.address)}, ${escapeHtml(home.area)}</button>` : escapeHtml(r.address || "Address not matched")}
        · received ${r.received} · ${escapeHtml(status)}</p>
      <p>${escapeHtml(r.description)}</p>
      <p><small>Rooms: ${escapeHtml(r.rooms || "not given")} · Contact: ${escapeHtml(r.contactBy || "not given")}</small></p>
      ${status === "New" ? `<button type="button" class="primary" data-close-report="${r.ref}">Mark as picked up</button>` : ""}
    </div>`;
  }).join("") || `<p>${C.reportsEmpty}</p>`;
}

function renderVisits() {
  document.getElementById("visits-list").innerHTML = team.map(t => {
    const mine = state.visits.filter(v => v.who === t.name);
    return `<div class="card"><h3>${escapeHtml(t.name)}, ${escapeHtml(t.role)}</h3>
      ${mine.length ? `<ul>${mine.map(v => `<li>${escapeHtml(v.when)}: <button type="button" class="link" data-home="${v.homeId}">${escapeHtml(v.address)}</button></li>`).join("")}</ul>` : "<p>No visits yet.</p>"}</div>`;
  }).join("") + (state.visits.length ? "" : `<p>${C.visitsEmpty}</p>`);
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
  renderSummary(list);
  renderHeatmap(list);
  renderList(list);
  renderReports();
  renderVisits();
}

const dialog = document.getElementById("detail");
fillText();
renderFilters();
render();
showTab();

window.addEventListener("hashchange", showTab);
document.getElementById("search").addEventListener("input", render);
document.getElementById("filter-band").addEventListener("change", render);
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
  if (report) { state.status[report.dataset.closeReport] = "Picked up"; saveState(state); render(); }
});
