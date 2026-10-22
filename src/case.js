// Cases: one case for each home. What's happened, what's coming up, notes on progress,
// and follow-ups booked straight onto the calendar.
// Uses scored(), allReports(), state and the planner (window.PLANNER), so it loads after them.
(function () {
  const T = window.CONTENT;
  const PL = window.PLANNER;
  const WRITER_KEY = "healthier-homes-writer";
  const NOTE_TYPES = ["Repair progress", "Contact with tenant", "Assessment finding", "Something else"];
  const BOOK_TYPES = [["assess", "Assessment follow-up"], ["fix", "Repair"], ["check", "Check-in"]];
  const KIND = { note: "Note", booking: "Booking", outcome: "Visit", report: "Tenant report" };
  const tab = document.getElementById("tab-cases");
  let message = "";
  let justBooked = null;   // the booking to confirm, straight after it's made

  const homeById = id => scored().find(h => h.id === id);
  const when = isoTime => new Date(isoTime).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const day = isoDate => PL.nice(new Date(`${isoDate}T12:00`));
  const writer = () => { try { return localStorage.getItem(WRITER_KEY) || ""; } catch { return ""; } };

  function upcoming(id) {
    return PL.events().filter(e => e.home.id === id && !e.done).sort((a, b) => a.iso.localeCompare(b.iso) || a.start - b.start);
  }

  // Where the case has got to, in a few words.
  function stage(h) {
    const o = PL.outcome(h.id);
    const next = upcoming(h.id)[0];
    if (o && o.fixed) return "Repair done";
    if (o && o.result === "work") return next && next.type === "fix" ? `Repair ${next.fixed ? "booked" : "planned"}` : "Repair needed";
    if (o && o.result === "none") return "No work needed";
    if (next) return `${PL.TYPE[next.type]} ${next.fixed ? "booked" : "planned"}`;
    return "Not planned";
  }

  function history(h) {
    const c = PL.peekCase(h.id);
    const items = c.log.map(l => ({ at: l.at, kind: l.kind, text: l.text, by: l.by }));
    allReports().filter(r => r.homeId === h.id).forEach(r =>
      items.push({ at: new Date(`${r.received}T09:00`).toISOString(), kind: "report", text: `${r.ref}: ${r.problems.join(", ")}. ${r.description}`, by: "" }));
    if (state.notes[h.id]) items.push({ at: "", kind: "note", text: state.notes[h.id], by: "Note on the home's details" });
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }

  // ---- Reasons for a visit, and the confirmation once it's booked ----
  const reasonText = b => b.reason === "other" ? `${T.bookReasonOther}: ${b.reasonNote}` : b.reason;

  function confirmation(h, b, st, statusChanged) {
    const reports = allReports().filter(r => r.homeId === h.id);
    const prefers = reports.length && reports[reports.length - 1].contactBy;
    const tenant = escapeHtml(h.tenant);
    return `<div class="confirm" id="visit-confirm" tabindex="-1" role="region" aria-labelledby="confirm-title">
      <h3 id="confirm-title">${T.confirmTitle}</h3>
      <p><strong>${PL.TYPE[b.type]}, ${day(b.date)} at ${b.time}</strong> ${T.confirmWith} ${escapeHtml(st.name)} (${escapeHtml(st.role)})<br>
        ${T.visitReason}: ${escapeHtml(reasonText(b))}${b.note ? `<br>${T.caseBookNoteShort}: ${escapeHtml(b.note)}` : ""}</p>
      <p><strong>${T.confirmNext}</strong></p>
      <ul>
        <li>${fillIn(T.confirmTexted, { tenant })} <em>${T.confirmPrototype}</em>
          <blockquote class="sms">${fillIn(T.confirmSms, { when: `${day(b.date)} at ${b.time}` })}</blockquote></li>
        <li>${fillIn(T.confirmStaff, { who: escapeHtml(st.name) })}</li>
        ${statusChanged ? `<li>${T.confirmStatus}</li>` : ""}
        <li>${fillIn(T.confirmChange, { tenant })}</li>
      </ul>
      <dl class="facts">
        <dt>${T.factTenant}</dt><dd>${tenant}</dd>
        <dt>${T.factPhone}</dt><dd>${phoneHtml(h)}</dd>
        ${prefers ? `<dt>${T.contactPrefers}</dt><dd>${escapeHtml(prefers)}</dd>` : ""}
      </dl>
      <div class="actions">
        <button type="button" class="button" data-show-visit="b-${b.id}">${T.caseOnCalendar}</button>
        <button type="button" class="small" data-book-another>${T.bookAnother}</button>
      </div>
    </div>`;
  }

  // Error messages sit above the field they're about, and the field says it's invalid
  function showFieldError(fieldId, text) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    error.textContent = text;
    error.hidden = false;
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", [field.dataset.hint, error.id].filter(Boolean).join(" "));
  }

  function clearFieldErrors() {
    document.querySelectorAll("#book-form .error").forEach(e => { e.hidden = true; e.textContent = ""; });
    document.querySelectorAll("#book-form [aria-invalid]").forEach(f => {
      f.removeAttribute("aria-invalid");
      if (f.dataset.hint) f.setAttribute("aria-describedby", f.dataset.hint); else f.removeAttribute("aria-describedby");
    });
  }

  // ---- The list of cases: chips, filters, cards ----
  const FILTER_KEY = "healthier-homes-case-filters";
  const PAGE = 20;
  const DEFAULTS = { q: "", risk: ["High", "Medium", "Low"], updated: "", stage: "", area: "", show: "open", sort: "updated" };
  const STAGES = ["Assessment planned", "Assessment booked", "Check-in booked", "Repair needed", "Repair planned", "Repair booked", "Repair done", "No work needed", "Not planned"];
  const CLOSED = ["Repair done", "No work needed"];
  let F = (() => { try { return { ...DEFAULTS, ...JSON.parse(sessionStorage.getItem(FILTER_KEY)) }; } catch { return { ...DEFAULTS }; } })();
  let limit = PAGE;

  const postcode = id => (window.LOCATIONS.homes[id] || {}).postcode || "";
  const daysSince = isoTime => {
    const then = new Date(isoTime), today = new Date();
    then.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((today - then) / 864e5);
  };
  function ago(isoTime) {
    const n = daysSince(isoTime);
    const time = new Date(isoTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (n <= 0) return `Today, ${time}`;
    if (n === 1) return `Yesterday, ${time}`;
    if (n < 7) return `${n} days ago`;
    return new Date(isoTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  const street = address => address.replace(/^\d+\s*/, "");
  const number = address => parseInt(address, 10) || 0;

  // Everything the list needs about one home, worked out once per redraw.
  function summarise(h) {
    const hist = history(h);
    const st = stage(h);
    return { h, pc: postcode(h.id), st, next: upcoming(h.id)[0], last: hist.find(i => i.at), open: !CLOSED.includes(st) && (hist.length > 0 || st !== "Not planned") };
  }

  function matches(x, f) {
    if (f.show === "open" && !x.open && !CLOSED.includes(f.stage)) return false;
    if (!f.risk.includes(x.h.risk.band)) return false;
    if (f.stage === "repair" ? !x.st.startsWith("Repair") || x.st === "Repair done" : f.stage && x.st !== f.stage) return false;
    if (f.area && x.h.area !== f.area) return false;
    if (f.updated) {
      const age = x.last ? daysSince(x.last.at) : Infinity;
      if (f.updated === "stale" ? age <= 30 : f.updated === "1" ? age > 0 : age > +f.updated) return false;
    }
    const q = f.q.trim().toLowerCase();
    if (q) {
      const hay = `${x.h.address} ${x.pc} ${x.pc.replace(/\s/g, "")} ${x.h.tenant} ${x.h.id} ${x.h.area}`.toLowerCase();
      if (!hay.includes(q) && !hay.includes(q.replace(/\s/g, ""))) return false;
    }
    return true;
  }

  const SORTS = {
    updated: (a, b) => ((b.last || {}).at || "").localeCompare((a.last || {}).at || "") || b.h.risk.points - a.h.risk.points,
    risk: (a, b) => b.h.risk.points - a.h.risk.points || ((b.last || {}).at || "").localeCompare((a.last || {}).at || ""),
    next: (a, b) => (!a.next || !b.next) ? (!a.next) - (!b.next) : a.next.iso.localeCompare(b.next.iso) || a.next.start - b.next.start,
    address: (a, b) => street(a.h.address).localeCompare(street(b.h.address)) || number(a.h.address) - number(b.h.address)
  };

  // Quick filters across the top. Each one sets the filters to a preset.
  const CHIPS = [
    { label: T.chipOpen, preset: {} },
    { label: T.chipHigh, preset: { risk: ["High"] } },
    { label: T.chipToday, preset: { updated: "1", show: "all" } },
    { label: T.chipRepair, preset: { stage: "repair" } },
    { label: T.chipStale, preset: { updated: "stale" } }
  ];
  // Chips keep whatever is in Search, so the search isn't counted when matching a chip.
  const sameFilters = (a, b) => ["updated", "stage", "area", "show"].every(k => a[k] === b[k]) && a.risk.join() === b.risk.join();

  // Highlight what was searched for, without breaking the escaping.
  function hl(text) {
    const s = String(text), q = F.q.trim();
    if (!q) return escapeHtml(s);
    const chars = [...q.replace(/\s+/g, "")].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!chars.length) return escapeHtml(s);
    const re = new RegExp(`(${chars.join("\\s?")})`, "ig");
    return s.split(re).map((part, i) => (i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part))).join("");
  }

  function cardHtml(x) {
    const { h, pc, st, next, last } = x;
    return `<li class="case-item risk-${h.risk.band}">
      <div class="ci-top">
        <h3 class="ci-addr"><a href="#cases/${h.id}">${hl(h.address)}</a></h3>
        <span class="badge ${h.risk.band}">${h.risk.band} · ${h.risk.points}</span>
      </div>
      <p class="ci-sub"><span class="nowrap">${hl(pc)}</span> · ${hl(h.area)} · ${hl(h.tenant)} · <span class="nowrap">${hl(h.id)}</span></p>
      <div class="ci-meta">
        <span class="stage-pill">${st}</span>
        <span><span class="ci-label">${T.labelNext}</span> ${next ? `${PL.TYPE[next.type]}, ${PL.nice(next.date)} ${PL.hhmm(next.start)}
          <button type="button" class="link ci-cal" data-show-visit="${next.key}">${T.caseOnCalendar}<span class="visually-hidden">: visit to ${escapeHtml(h.address)}</span></button>` : T.noneLabel}</span>
        <span><span class="ci-label">${T.labelLast}</span> ${last ? ago(last.at) : T.neverLabel}</span>
      </div>
      ${last ? `<p class="ci-last tl-${last.kind}"><span class="tl-kind">${KIND[last.kind] || ""}</span> ${escapeHtml(last.text.length > 140 ? `${last.text.slice(0, 137)}...` : last.text)}</p>` : ""}
    </li>`;
  }

  function renderList() {
    const all = scored().map(summarise);
    const found = all.filter(x => matches(x, F)).sort(SORTS[F.sort] || SORTS.updated);
    const shown = found.slice(0, limit);

    document.getElementById("case-chips").innerHTML = CHIPS.map((c, i) => {
      const preset = { ...DEFAULTS, ...c.preset };
      const n = all.filter(x => matches(x, { ...preset, q: F.q })).length;
      return `<button type="button" class="chip" data-chip="${i}" aria-pressed="${sameFilters(F, preset)}"><strong>${n}</strong> ${c.label}</button>`;
    }).join("");

    document.getElementById("case-count").textContent =
      T.casesCount.replace("{shown}", shown.length).replace("{total}", found.length)
        .replace("{what}", CLOSED.includes(F.stage) ? (found.length === 1 ? "case" : "cases")
          : F.show === "open" ? (found.length === 1 ? "open case" : "open cases") : (found.length === 1 ? "home" : "homes"));
    document.getElementById("case-clear").hidden = sameFilters(F, DEFAULTS) && !F.q.trim() && F.sort === DEFAULTS.sort;
    document.getElementById("cases-rows").innerHTML = shown.map(cardHtml).join("") || `<li class="case-none">${F.show === "open" ? T.casesEmpty : T.casesEmptyAll}</li>`;
    const more = document.getElementById("case-more");
    more.hidden = found.length <= shown.length;
    more.textContent = T.casesMore.replace("{n}", Math.min(PAGE, found.length - shown.length));
  }

  // Put the saved filters into the form, and read the form back.
  function fillForm() {
    document.getElementById("case-stage").innerHTML = `<option value="">${T.anyLabel}</option><option value="repair">${T.chipRepair}</option>` +
      STAGES.map(s => `<option>${s}</option>`).join("");
    document.getElementById("case-area").innerHTML = `<option value="">${T.anyLabel}</option>` +
      [...new Set(scored().map(h => h.area))].sort().map(a => `<option>${escapeHtml(a)}</option>`).join("");
    document.getElementById("case-search").value = F.q;
    document.querySelectorAll('#case-filters [name="risk"]').forEach(c => (c.checked = F.risk.includes(c.value)));
    ["updated", "stage", "area", "show", "sort"].forEach(k => (document.getElementById(`case-${k}`).value = F[k]));
  }
  function readForm() {
    F = {
      q: document.getElementById("case-search").value,
      risk: [...document.querySelectorAll('#case-filters [name="risk"]:checked')].map(c => c.value),
      updated: document.getElementById("case-updated").value,
      stage: document.getElementById("case-stage").value,
      area: document.getElementById("case-area").value,
      show: document.getElementById("case-show").value,
      sort: document.getElementById("case-sort").value
    };
  }
  function applyFilters() {
    try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(F)); } catch {}
    limit = PAGE;
    renderList();
  }

  // ---- One case ----
  function renderCase(id, focusId) {
    const h = homeById(id);
    const view = document.getElementById("case-view");
    if (!h) { view.innerHTML = `<section class="panel"><p>No home with reference ${escapeHtml(id)}. <a href="#cases">${T.caseBack}</a></p></section>`; return; }
    const c = PL.peekCase(id);
    const staff = PL.staff();
    const coming = upcoming(id);
    const items = history(h);
    const staffOptions = staff.map(st => `<option value="${st.id}">${escapeHtml(st.name)} (${escapeHtml(st.role)})</option>`).join("");
    const tomorrow = PL.iso(new Date(Date.now() + 864e5));

    const last = items.find(i => i.at);
    const next = coming[0];
    view.innerHTML = `
      <p class="back-link"><a href="#cases">← ${T.caseBack}</a></p>
      <section class="panel case-head risk-${h.risk.band}" aria-labelledby="case-title">
        <div class="ch-top">
          <div>
            <h2 id="case-title">${escapeHtml(h.address)}</h2>
            <p class="ci-sub">${escapeHtml(postcode(h.id))} · ${escapeHtml(h.area)} · ${h.id}</p>
          </div>
          <div class="ch-badges"><span class="badge ${h.risk.band}">${h.risk.band} risk · ${h.risk.points} points</span> <span class="stage-pill">${stage(h)}</span></div>
        </div>
        <dl class="ch-facts">
          <div><dt>Tenant</dt><dd>${escapeHtml(h.tenant)}</dd></div>
          <div><dt>Household</dt><dd>${h.household.people} ${h.household.people === 1 ? "person" : "people"}</dd></div>
          <div><dt>Home</dt><dd>${escapeHtml(h.propertyType)}, built ${h.built}, EPC ${h.epc}</dd></div>
          <div><dt>${T.labelNext}</dt><dd>${next ? `${PL.TYPE[next.type]}, ${PL.nice(next.date)} ${PL.hhmm(next.start)}` : T.noneLabel}</dd></div>
          <div><dt>${T.labelLast}</dt><dd>${last ? ago(last.at) : T.neverLabel}</dd></div>
        </dl>
        <p><button type="button" class="link" data-home="${h.id}">${T.openHome}</button></p>
        ${message ? `<p class="notice" role="status">${message}</p>` : ""}
        ${justBooked ? confirmation(h, justBooked.booking, justBooked.staff, justBooked.statusChanged) : ""}
      </section>

      <div class="case-grid">
          <section class="panel cg-coming" aria-labelledby="coming-title">
            <h2 id="coming-title">${T.caseComingUp}</h2>
            ${coming.length ? `<ul class="timeline">${coming.map(e => `<li>
              <span class="tl-when">${PL.nice(e.date)}, ${PL.hhmm(e.start)}</span>
              <span><strong>${PL.TYPE[e.type]}</strong>${e.fixed ? " (booked)" : " (planned)"} with ${escapeHtml(e.staff.name)}
                ${(c.bookings.find(b => b.id === e.booking) || {}).reason ? `<br>${T.visitReason}: ${escapeHtml(reasonText(c.bookings.find(b => b.id === e.booking)))}` : ""}
                <br><button type="button" class="link" data-visit="${e.key}">Details and outcome</button>
                · <button type="button" class="link" data-show-visit="${e.key}">${T.caseOnCalendar}</button>
                ${e.fixed ? ` · <button type="button" class="link" data-cancel="${e.booking}">Cancel booking</button>` : ""}</span>
            </li>`).join("")}</ul>` : `<p>${T.caseNothingComingUp}</p>`}
          </section>

          <section class="panel cg-history" aria-labelledby="history-title">
            <h2 id="history-title">${T.caseHistory}</h2>
            ${items.length ? `<ul class="timeline">${items.map(i => `<li class="tl-${i.kind}">
              <span class="tl-when">${i.at ? when(i.at) : "Earlier"}</span>
              <span><span class="tl-kind">${KIND[i.kind] || ""}</span> ${escapeHtml(i.text)}${i.by ? `<br><small>${escapeHtml(i.by)}</small>` : ""}</span>
            </li>`).join("")}</ul>` : `<p>${T.caseHistoryEmpty}</p>`}
          </section>

        <div class="cg-actions">
          <section class="panel" aria-labelledby="note-title">
            <h2 id="note-title">${T.caseNoteTitle}</h2>
            <form id="note-form" novalidate>
              <div class="form-row"><label for="note-type">${T.caseNoteType}</label>
                <select id="note-type">${NOTE_TYPES.map(t => `<option>${t}</option>`).join("")}</select></div>
              <div class="form-row"><label for="note-who">${T.caseNoteWho}</label>
                <select id="note-who">${staff.map(st => `<option ${st.name === writer() ? "selected" : ""}>${escapeHtml(st.name)}</option>`).join("")}</select></div>
              <div class="form-row"><label for="note-text">${T.caseNoteText}</label>
                <span class="hint" id="note-hint">${T.caseNoteHint}</span>
                <span class="error" id="note-text-error" hidden></span>
                <textarea id="note-text" rows="3" aria-describedby="note-hint" data-hint="note-hint"></textarea></div>
              <button type="submit" class="primary">${T.caseNoteButton}</button>
            </form>
          </section>

          <section class="panel" aria-labelledby="book-title">
            <h2 id="book-title">${T.caseBookTitle}</h2>
            <form id="book-form" novalidate>
              <div class="form-row"><label for="book-type">${T.caseBookType}</label>
                <select id="book-type">${BOOK_TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
              <div class="form-row">
                <label for="book-reason">${T.bookReason}</label>
                <span class="hint" id="book-reason-hint">${T.bookReasonHint}</span>
                <span class="error" id="book-reason-error" hidden></span>
                <select id="book-reason" aria-describedby="book-reason-hint" data-hint="book-reason-hint">
                  <option value="">${T.bookReasonChoose}</option>
                  ${h.risk.reasons.map(r => `<option>${escapeHtml(r.reason)}</option>`).join("")}
                  <option value="other">${T.bookReasonOther}</option>
                </select>
              </div>
              <div class="form-row" id="book-other-row" hidden>
                <label for="book-other">${T.bookOtherLabel}</label>
                <span class="error" id="book-other-error" hidden></span>
                <textarea id="book-other" rows="2"></textarea>
              </div>
              <div class="form-row"><label for="book-who">${T.caseBookWho}</label>
                <select id="book-who">${staffOptions}</select></div>
              <div class="times">
                <label for="book-date">${T.caseBookDate} <span class="error" id="book-date-error" hidden></span><input type="date" id="book-date" min="${tomorrow}" required></label>
                <label for="book-time">${T.caseBookTime} <span class="error" id="book-time-error" hidden></span><input type="time" id="book-time" step="900" required></label>
              </div>
              <p><button type="button" class="small" id="find-slot">${T.caseFindSlot}</button> <span id="slot-out" role="status"></span></p>
              <div class="form-row"><label for="book-note">${T.caseBookNote}</label>
                <input id="book-note" autocomplete="off"></div>
              <button type="submit" class="primary">${T.caseBookButton}</button>
            </form>
          </section>
        </div>
      </div>`;
    if (message) announce(message.replace(/<[^>]+>/g, ""));
    message = "";
    if (focusId) {
      const target = document.getElementById(focusId);
      if (target) { target.tabIndex = -1; target.focus(); }
    }
    if (justBooked) {
      const confirm = document.getElementById("visit-confirm");
      confirm.scrollIntoView({ block: "start" });
      confirm.focus({ preventScroll: true });
      justBooked = null;
    }

    document.getElementById("book-reason").addEventListener("change", e => {
      document.getElementById("book-other-row").hidden = e.target.value !== "other";
    });

    // Suggest the right person for the type of visit.
    const pickWho = () => {
      const type = document.getElementById("book-type").value;
      const does = type === "check" ? "assess" : type;
      const st = staff.find(s => s.does.includes(does));
      if (st) document.getElementById("book-who").value = st.id;
    };
    document.getElementById("book-type").addEventListener("change", pickWho);
    pickWho();

    document.getElementById("note-form").addEventListener("submit", e => {
      e.preventDefault();
      const text = document.getElementById("note-text").value.trim();
      const box = document.getElementById("note-text"), error = document.getElementById("note-text-error");
      if (!text) {
        error.textContent = T.caseNoteEmpty;
        error.hidden = false;
        box.setAttribute("aria-invalid", "true");
        box.setAttribute("aria-describedby", "note-hint note-text-error");
        box.focus();
        return;
      }
      const by = document.getElementById("note-who").value;
      try { localStorage.setItem(WRITER_KEY, by); } catch {}
      PL.log(id, "note", `${document.getElementById("note-type").value}: ${text}`, by);
      message = T.caseNoteAdded;
      PL.save();
      renderCase(id, "history-title");
    });

    document.getElementById("find-slot").addEventListener("click", () => {
      const slot = PL.firstFree(document.getElementById("book-who").value, document.getElementById("book-type").value);
      if (!slot) { document.getElementById("slot-out").textContent = T.caseNoSlot; return; }
      document.getElementById("book-date").value = slot.date;
      document.getElementById("book-time").value = slot.time;
      document.getElementById("slot-out").textContent = `${day(slot.date)} at ${slot.time}.`;
    });

    document.getElementById("book-form").addEventListener("submit", e => {
      e.preventDefault();
      const type = document.getElementById("book-type").value;
      const staffId = document.getElementById("book-who").value;
      const date = document.getElementById("book-date").value;
      const time = document.getElementById("book-time").value;
      const note = document.getElementById("book-note").value.trim();
      const reason = document.getElementById("book-reason").value;
      const reasonNote = document.getElementById("book-other").value.trim();
      const st = staff.find(s => s.id === staffId);

      clearFieldErrors();
      if (!reason) showFieldError("book-reason", T.errorReason);
      if (reason === "other" && !reasonNote) showFieldError("book-other", T.errorOther);
      if (!date) showFieldError("book-date", T.errorDate);
      if (!time) showFieldError("book-time", T.errorTime);
      // A clash: the same start time as any visit, or overlapping another booked visit.
      // (Planned visits that overlap are fine: the planner moves them out of the way.)
      if (date && time) {
        const [hh, mm] = time.split(":").map(Number);
        const from = hh * 60 + mm, to = from + PL.minutesFor(type);
        const clash = PL.events().some(ev => ev.staff.id === staffId && ev.iso === date &&
          (PL.hhmm(ev.start) === time || (ev.fixed && from < ev.end && ev.start < to)));
        if (clash) showFieldError("book-time", fillIn(T.errorClash, { who: st.name }));
      }
      const firstError = document.querySelector("#book-form [aria-invalid]");
      if (firstError) { firstError.focus(); return; }

      const booking = { type, staffId, date, time, note, reason, reasonNote: reason === "other" ? reasonNote : "" };
      booking.id = PL.book(id, booking);
      PL.log(id, "booking", `${PL.TYPE[type]} booked with ${st.name}, ${day(date)} at ${time}. ${T.visitReason}: ${reasonText(booking)}${note ? `. ${note}` : ""}.`, writer());
      const statusChanged = type === "assess" && ["Not started", "Contacted"].includes(h.status);
      if (statusChanged) state.status[id] = "Visit booked";
      PL.showWeekOf(date);
      justBooked = { booking, staff: st, statusChanged };
      PL.save();
      renderCase(id);
    });
  }

  // ---- Which view: #cases for the list, #cases/H-1001 for one case ----
  const PAGE_TITLE = document.title;
  let lastCase = null;
  function route() {
    const hash = location.hash.slice(1);
    const on = hash === "cases" || hash.startsWith("cases/");
    tab.hidden = !on;
    const link = document.querySelector('[data-tab="cases"]');
    if (on) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    if (!on) { document.title = PAGE_TITLE; return; }
    const id = hash.split("/")[1];
    const h = id && homeById(id);
    document.title = h ? `${h.address}: case - ${PAGE_TITLE}` : `${T.casesPageTitle} - ${PAGE_TITLE}`;
    document.getElementById("cases-list").hidden = !!id;
    if (id) { lastCase = id; renderCase(id); }
    else { document.getElementById("case-view").innerHTML = ""; renderList(); }
  }
  // Arriving at a case: start at the top, with focus on its name.
  // Back at the list: focus the case you were on, showing more of the list if needed.
  function arrive() {
    route();
    if (location.hash.startsWith("#cases/")) {
      window.scrollTo(0, 0);
      const title = document.getElementById("case-title");
      if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    } else if (location.hash === "#cases" && lastCase) {
      const find = () => document.querySelector(`#cases-rows a[href="#cases/${lastCase}"]`);
      while (!find() && !document.getElementById("case-more").hidden) { limit += PAGE; renderList(); }
      const card = find();
      if (card) card.focus();
      lastCase = null;
    }
  }
  // Redraw after a pop-up closes, keeping focus on the same control if it's still there.
  function redraw() {
    const a = document.activeElement;
    const view = document.getElementById("case-view");
    const sel = a && view.contains(a)
      ? (a.dataset.visit ? `[data-visit="${a.dataset.visit}"]` : a.dataset.home ? `[data-home="${a.dataset.home}"]` : a.id ? `#${a.id}` : null)
      : null;
    route();
    if (!sel) return;
    const again = view.querySelector(sel) || document.getElementById("coming-title");
    if (again) { if (!again.matches("a, button, input, select, textarea")) again.tabIndex = -1; again.focus(); }
  }
  // Say what just happened to screen reader users. The region stays on the page, so it is read out.
  function announce(text) {
    const live = document.getElementById("case-live");
    live.textContent = "";
    setTimeout(() => (live.textContent = text), 50);
  }

  window.addEventListener("hashchange", arrive);
  const form = document.getElementById("case-filters");
  form.addEventListener("input", () => { readForm(); applyFilters(); });
  form.addEventListener("submit", e => e.preventDefault());
  document.getElementById("case-clear").addEventListener("click", () => {
    F = { ...DEFAULTS };
    fillForm();
    applyFilters();
    document.getElementById("case-search").focus();
  });
  document.getElementById("case-more").addEventListener("click", () => {
    const first = limit;
    limit += PAGE;
    renderList();
    const next = document.querySelectorAll("#cases-rows .ci-addr a")[first];
    if (next) next.focus();
  });
  document.getElementById("case-chips").addEventListener("click", e => {
    const chip = e.target.closest("[data-chip]");
    if (!chip) return;
    F = { ...DEFAULTS, ...CHIPS[+chip.dataset.chip].preset, q: F.q, sort: F.sort };
    fillForm();
    applyFilters();
    document.querySelector(`[data-chip="${chip.dataset.chip}"]`).focus();
  });
  fillForm();
  tab.addEventListener("click", e => {
    if (e.target.closest("[data-book-another]")) {
      const reason = document.getElementById("book-reason");
      reason.scrollIntoView({ block: "center" });
      reason.focus({ preventScroll: true });
      return;
    }
    const show = e.target.closest("[data-show-visit]");
    if (show) return PL.showVisit(show.dataset.showVisit);
    const cancel = e.target.closest("[data-cancel]");
    if (!cancel) return;
    const id = location.hash.split("/")[1];
    const b = PL.peekCase(id).bookings.find(x => x.id === cancel.dataset.cancel);
    if (!b) return;
    if (!confirm(T.caseCancelAsk.replace("{what}", PL.TYPE[b.type].toLowerCase()).replace("{when}", `${day(b.date)} at ${b.time}`))) return;
    PL.cancel(id, b.id);
    PL.log(id, "booking", `${PL.TYPE[b.type]} on ${day(b.date)} at ${b.time} cancelled.`, writer());
    message = T.caseCancelled;
    PL.save();
    renderCase(id, "coming-title");
  });
  // A recorded outcome or a status change elsewhere can change the case on screen.
  document.getElementById("visit-dialog").addEventListener("close", () => setTimeout(redraw));
  document.getElementById("detail").addEventListener("close", () => setTimeout(redraw));

  route();
})();
