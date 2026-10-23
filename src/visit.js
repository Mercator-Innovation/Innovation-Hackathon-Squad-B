// The visit app: what someone visiting a home needs on a phone or tablet.
// It reads the plan from the staff view (loaded out of sight in an iframe), and writes
// what happened back to the same case, so staff see it straight away.
(function () {
  const V = window.VISIT_TEXT;
  const KEY = "healthier-homes-visit-app";
  const $ = id => document.getElementById(id);
  const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const niceDay = iso => new Date(iso + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  // What this person has done in the app (kept in this browser)
  function loadMine() { try { return { who: "", done: {}, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { who: "", done: {} }; } }
  function saveMine() { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch {} }
  let mine = loadMine();
  let W = null;       // the staff view's window, where the plan lives
  let openKey = null;

  // ---- Fill in the fixed words ----
  document.title = `${V.title}: Healthier homes`;
  $("app-title").textContent = V.title;
  $("app-intro").textContent = V.intro;
  $("who-label").textContent = V.whoLabel;
  $("day-label").textContent = V.dayLabel;
  $("list-status").textContent = V.loading;

  // ---- The visits ----
  // A visit as the app needs it. Done visits drop out of the plan, so we keep a copy.
  function snapshot(e) {
    return {
      key: e.key, type: e.type, iso: e.iso, start: e.start, end: e.end, travel: e.travel, booking: e.booking || null,
      staff: e.staff.id, home: {
        id: e.home.id, tenant: e.home.tenant, phone: e.home.phone, address: e.home.address, area: e.home.area,
        propertyType: e.home.propertyType, built: e.home.built, epc: e.home.epc, people: e.home.household.people,
        band: e.home.risk.band, points: e.home.risk.points,
        reasons: e.home.risk.reasons.map(r => ({ reason: r.reason, points: r.points, sensitive: !!r.sensitive })),
        repairs: e.home.repairNotes || []
      }
    };
  }
  function visitsFor(who) {
    const planned = W.PLANNER.events().filter(e => e.staff.id === who).map(snapshot);
    const done = Object.values(mine.done).filter(d => d.visit.staff === who).map(d => d.visit);
    const keys = new Set(done.map(d => d.key));
    return [...done, ...planned.filter(p => !keys.has(p.key))].sort((a, b) => a.iso.localeCompare(b.iso) || a.start - b.start);
  }

  function fillPickers() {
    const staff = W.PLANNER.staff();
    if (!staff.some(s => s.id === mine.who)) mine.who = "";
    $("who").innerHTML = `<option value="">${V.whoChoose}</option>` +
      staff.map(s => `<option value="${s.id}" ${s.id === mine.who ? "selected" : ""}>${esc(s.name)} (${esc(s.role)})</option>`).join("");
    const days = [...new Set(visitsFor(mine.who).map(v => v.iso))].slice(0, 10);
    const keep = $("day").value;
    $("day").innerHTML = days.map(d => `<option value="${d}">${niceDay(d)}</option>`).join("");
    if (days.includes(keep)) $("day").value = keep;
    $("day").disabled = !days.length;
  }

  function renderList() {
    const list = mine.who ? visitsFor(mine.who).filter(v => v.iso === $("day").value) : [];
    $("list-status").textContent = !mine.who ? V.whoChoose + "." : list.length ? `${list.length} ${list.length === 1 ? "visit" : "visits"}` : V.noVisits;
    $("visit-list").innerHTML = list.map(v => {
      const done = mine.done[v.key];
      return `<li><button type="button" class="visit-card ${done ? "is-done" : ""}" data-key="${esc(v.key)}" aria-current="${v.key === openKey}">
        <span class="vc-time">${hhmm(v.start)}</span>
        <span class="vc-main">
          <strong>${esc(v.home.address)}</strong>
          <span>${esc(v.home.area)} · ${V.types[v.type]}${v.travel ? ` · ${v.travel} ${V.travel}` : ""}</span>
        </span>
        <span class="vc-side">${done ? `<span class="vc-done">✓ ${V.done}</span>` : `<span class="badge ${v.home.band}">${v.home.band}</span>`}</span>
      </button></li>`;
    }).join("");
  }

  // ---- One visit ----
  function findVisit(key) {
    return (mine.done[key] && mine.done[key].visit) || visitsFor(mine.who).find(v => v.key === key);
  }

  function choices(name, options, type = "radio") {
    return options.map((o, i) => `<label><input type="${type}" name="${name}" value="${esc(o)}" ${type === "radio" && i === 0 && name !== "outcome" ? "" : ""}> ${esc(o)}</label>`).join("");
  }

  function renderDetail() {
    const pane = $("detail-pane");
    const v = openKey && findVisit(openKey);
    document.body.classList.toggle("detail-open", !!v);
    if (!v) { pane.innerHTML = `<p class="hint">${V.pickVisit}</p>`; return; }
    const h = v.home;
    const done = mine.done[v.key];
    const caseLog = W.PLANNER.peekCase(h.id).log.slice(-3).reverse();
    const outcomes = v.type === "assess" ? ["work", "none", "noaccess"] : v.type === "fix" ? ["fixed", "noaccess"] : ["checked", "work", "noaccess"];

    pane.innerHTML = `
      <button type="button" class="link back" id="back">${V.backToList}</button>
      <h2 id="visit-title">${esc(h.address)}</h2>
      <p class="visit-sub">${hhmm(v.start)} to ${hhmm(v.end)} · ${niceDay(v.iso)} · ${V.types[v.type]}</p>
      <p><span class="badge ${h.band}">${h.band} risk · ${h.points}</span></p>
      <div class="visit-tenant">
        <div><strong>${esc(h.tenant)}</strong><br>${esc(h.area)} · ${esc(h.propertyType)}, built ${h.built} · EPC ${esc(h.epc)} · ${h.people} ${h.people === 1 ? "person" : "people"}</div>
        ${h.phone ? `<a class="button call" href="tel:${esc(h.phone.replace(/\s/g, ""))}">${V.call} ${esc(h.phone)}</a>` : ""}
      </div>

      <h3>${V.whyTitle}</h3>
      <ul class="reasons">${h.reasons.map(r => `<li>${esc(r.reason)}${r.sensitive ? ' <span class="private">Private</span>' : ""}</li>`).join("")}</ul>
      ${h.reasons.some(r => r.sensitive) ? `<p class="notice">${V.sensitiveNote}</p>` : ""}

      <details><summary>${V.repairsTitle} (${h.repairs.length})</summary>
        ${h.repairs.length ? `<ul>${h.repairs.map(r => `<li>${esc(r.date)}: ${esc(r.note)}</li>`).join("")}</ul>` : `<p>${V.repairsNone}</p>`}
      </details>
      <details><summary>${V.historyTitle}</summary>
        ${caseLog.length ? `<ul>${caseLog.map(l => `<li>${esc(new Date(l.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}: ${esc(l.text)}</li>`).join("")}</ul>` : `<p>${V.historyNone}</p>`}
      </details>

      ${done ? `<div class="notice saved"><strong>✓ ${V.outcomes[done.outcome]}</strong><br>${esc(done.summary)}</div>` : `
      <form id="visit-form" novalidate>
        <h3>${V.checksTitle}</h3>
        <fieldset class="checks"><legend>${V.qDamp}</legend>${choices("damp", V.qDampOptions)}</fieldset>
        <fieldset class="checks rooms"><legend>${V.qRooms}</legend>${choices("room", V.roomOptions, "checkbox")}</fieldset>
        <p class="hint" id="readings-hint">${V.qReadingsHint}</p>
        <div class="readings">
          <label>${V.qHumidity}<input type="number" id="humidity" inputmode="decimal" min="0" max="100" aria-describedby="readings-hint"></label>
          <label>${V.qTemperature}<input type="number" id="temperature" inputmode="decimal" step="0.1" min="-10" max="40" aria-describedby="readings-hint"></label>
        </div>
        <fieldset class="checks"><legend>${V.qHeating}</legend>${choices("heating", V.qHeatingOptions)}</fieldset>
        <div class="form-row"><label for="photos">${V.qPhotos}</label>
          <span class="hint" id="photos-hint">${V.qPhotosHint}</span>
          <input type="file" id="photos" accept="image/*" capture="environment" multiple aria-describedby="photos-hint"></div>

        <h3>${V.adviceTitle}</h3>
        <fieldset class="checks"><legend class="visually-hidden">${V.adviceTitle}</legend>${choices("advice", V.adviceOptions, "checkbox")}</fieldset>
        <span class="error" id="consent-error" hidden></span>
        <label class="consent"><input type="checkbox" id="consent"> ${V.adviceConsent}</label>

        <div class="form-row"><label for="notes">${V.notesLabel}</label>
          <span class="hint" id="notes-hint">${V.notesHint}</span>
          <textarea id="notes" rows="3" aria-describedby="notes-hint"></textarea></div>

        <fieldset class="checks outcome"><legend>${V.outcomeTitle}</legend>
          <span class="error" id="outcome-error" hidden></span>
          ${outcomes.map(o => `<label><input type="radio" name="outcome" value="${o}"> ${V.outcomes[o]}</label>`).join("")}
        </fieldset>
        <button type="submit" class="primary big">${V.save}</button>
      </form>`}`;

    $("back").onclick = () => { openKey = null; renderDetail(); renderList(); const b = document.querySelector(`[data-key="${CSS.escape(v.key)}"]`); if (b) b.focus(); };
    const form = $("visit-form");
    if (form) form.addEventListener("submit", e => { e.preventDefault(); saveVisit(v, form); });
  }

  // ---- Saving what happened ----
  function showError(id, text) { const el = $(id); el.textContent = text; el.hidden = !text; }

  function saveVisit(v, form) {
    const data = new FormData(form);
    const outcome = data.get("outcome");
    const advice = data.getAll("advice");
    const consent = $("consent").checked;
    showError("outcome-error", outcome ? "" : V.errorOutcome);
    showError("consent-error", advice.length && !consent ? V.errorConsent : "");
    if (!outcome) { form.querySelector('[name="outcome"]').focus(); return; }
    if (advice.length && !consent) { $("consent").focus(); return; }

    const staff = W.PLANNER.staff().find(s => s.id === v.staff);
    const by = staff ? staff.name : "";
    const parts = [
      data.get("damp") && `Damp or mould: ${data.get("damp")}`,
      data.getAll("room").length && `Rooms: ${data.getAll("room").join(", ")}`,
      $("humidity").value && `Humidity ${$("humidity").value}%`,
      $("temperature").value && `${$("temperature").value}°C`,
      data.get("heating") && `Can afford heating: ${data.get("heating")}`,
      advice.length && `Help offered (tenant agreed): ${advice.join(", ")}`,
      $("photos").files.length && `${$("photos").files.length} photo(s)`,
      $("notes").value.trim() && `Notes: ${$("notes").value.trim()}`
    ].filter(Boolean);
    const summary = parts.join(". ") || "No details recorded.";

    W.PLANNER.log(v.home.id, "note", `Assessment finding: ${V.types[v.type]} visit. ${summary}`, by);
    if (outcome === "noaccess") W.PLANNER.log(v.home.id, "note", "Contact with tenant: couldn't get in. Visit needs rearranging.", by);
    else W.PLANNER.record(v.home.id, outcome, v.iso, by, v.booking);
    W.PLANNER.save();

    mine.done[v.key] = { visit: v, outcome, summary, at: new Date().toISOString() };
    saveMine();
    renderList();
    renderDetail();
    $("detail-pane").focus();
  }

  // ---- Events ----
  $("who").addEventListener("change", e => { mine.who = e.target.value; saveMine(); openKey = null; fillPickers(); renderList(); renderDetail(); });
  $("day").addEventListener("change", () => { openKey = null; renderList(); renderDetail(); });
  $("visit-list").addEventListener("click", e => {
    const card = e.target.closest("[data-key]");
    if (!card) return;
    openKey = card.dataset.key;
    renderList();
    renderDetail();
    $("detail-pane").focus();
    if (window.innerWidth < 768) window.scrollTo(0, 0);
  });

  // ---- Start when the plan is ready ----
  const engine = $("engine");
  // Opened straight from the file (file://), the browser won't let this page read the plan,
  // so say how to open it properly instead of showing empty dropdowns.
  function cantLoad() {
    $("list-status").innerHTML = V.needsServer;
    $("who").innerHTML = `<option>${V.cantLoad}</option>`;
    $("who").disabled = $("day").disabled = true;
  }
  let tries = 0;
  function start() {
    try {
      W = engine.contentWindow;
      if (!W || !W.PLANNER) { if (++tries > 100) return cantLoad(); return setTimeout(start, 100); }
    } catch { return cantLoad(); }
    fillPickers();
    renderList();
    renderDetail();
  }
  engine.addEventListener("load", start);
})();
