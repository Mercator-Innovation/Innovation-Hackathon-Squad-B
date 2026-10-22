// Cases: one case for each home. What's happened, what's coming up, notes on progress,
// and follow-ups booked straight onto the calendar.
// Uses scored(), allReports(), state and the planner (window.PLANNER), so it loads after them.
(function () {
  const T = window.CONTENT;
  const PL = window.PLANNER;
  const WRITER_KEY = "healthier-homes-writer";
  const NOTE_TYPES = ["Repair progress", "Contact with tenant", "Assessment finding", "Something else"];
  const BOOK_TYPES = [["assess", "Assessment follow-up"], ["fix", "Repair"], ["check", "Check-in"]];
  const KIND = { note: "Note", booking: "Booking", outcome: "Visit", report: "Report" };
  const tab = document.getElementById("tab-cases");
  let message = "";

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
    const c = PL.caseOf(h.id);
    const items = c.log.map(l => ({ at: l.at, kind: l.kind, text: l.text, by: l.by }));
    allReports().filter(r => r.homeId === h.id).forEach(r =>
      items.push({ at: `${r.received}T09:00`, kind: "report", text: `Report from tenant (${r.ref}): ${r.problems.join(", ")}. ${r.description}`, by: "" }));
    if (state.notes[h.id]) items.push({ at: "", kind: "note", text: state.notes[h.id], by: "Note on the home's details" });
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }
  const lastUpdate = h => history(h).find(i => i.at);
  const isOpen = h => {
    const s = stage(h);
    return history(h).length > 0 && s !== "Repair done" && s !== "No work needed";
  };

  // ---- The list of cases ----
  function renderList() {
    const search = document.getElementById("case-search").value.trim().toLowerCase();
    const show = document.getElementById("case-show").value;
    const rows = scored()
      .filter(h => (show === "all" || isOpen(h)) && (!search || `${h.address} ${h.tenant} ${h.id}`.toLowerCase().includes(search)))
      .sort((a, b) => ((lastUpdate(b) || {}).at || "").localeCompare((lastUpdate(a) || {}).at || "") || b.risk.points - a.risk.points);
    document.getElementById("cases-rows").innerHTML = rows.map(h => {
      const next = upcoming(h.id)[0];
      const last = lastUpdate(h);
      return `<tr>
        <td><a href="#cases/${h.id}">${escapeHtml(h.address)}</a>, ${escapeHtml(h.area)}<br><small>${h.id} · ${escapeHtml(h.tenant)}</small></td>
        <td><span class="badge ${h.risk.band}">${h.risk.band} · ${h.risk.points}</span></td>
        <td>${stage(h)}</td>
        <td>${next ? `${PL.TYPE[next.type]}, ${PL.nice(next.date)} ${PL.hhmm(next.start)}` : "None"}</td>
        <td>${last ? when(last.at) : "None"}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="5">${T.casesEmpty}</td></tr>`;
  }

  // ---- One case ----
  function renderCase(id) {
    const h = homeById(id);
    const view = document.getElementById("case-view");
    if (!h) { view.innerHTML = `<section class="panel"><p>No home with reference ${escapeHtml(id)}. <a href="#cases">${T.caseBack}</a></p></section>`; return; }
    const c = PL.caseOf(id);
    const staff = PL.staff();
    const coming = upcoming(id);
    const items = history(h);
    const staffOptions = staff.map(st => `<option value="${st.id}">${escapeHtml(st.name)} (${escapeHtml(st.role)})</option>`).join("");
    const tomorrow = PL.iso(new Date(Date.now() + 864e5));

    view.innerHTML = `
      <p><a href="#cases">← ${T.caseBack}</a></p>
      <section class="panel" aria-labelledby="case-title">
        <h2 id="case-title">${escapeHtml(h.address)}, ${escapeHtml(h.area)}</h2>
        <p><span class="badge ${h.risk.band}">${h.risk.band} risk · ${h.risk.points} points</span> <strong>${stage(h)}</strong></p>
        <p>${escapeHtml(h.tenant)} · ${h.household.people} ${h.household.people === 1 ? "person" : "people"} · ${h.propertyType}, built ${h.built} · EPC ${h.epc}
          · <button type="button" class="link" data-home="${h.id}">${T.openHome}</button></p>
        ${message ? `<p class="notice" role="status">${message}</p>` : ""}
      </section>

      <div class="case-grid">
        <div>
          <section class="panel" aria-labelledby="coming-title">
            <h2 id="coming-title">${T.caseComingUp}</h2>
            ${coming.length ? `<ul class="timeline">${coming.map(e => `<li>
              <span class="tl-when">${PL.nice(e.date)}, ${PL.hhmm(e.start)}</span>
              <span><strong>${PL.TYPE[e.type]}</strong>${e.fixed ? " (booked)" : " (planned)"} with ${escapeHtml(e.staff.name)}
                <br><button type="button" class="link" data-visit="${e.key}">Details and outcome</button>
                ${e.fixed ? ` · <button type="button" class="link" data-cancel="${e.booking}">Cancel booking</button>` : ""}</span>
            </li>`).join("")}</ul>` : `<p>${T.caseNothingComingUp}</p>`}
          </section>

          <section class="panel" aria-labelledby="history-title">
            <h2 id="history-title">${T.caseHistory}</h2>
            ${items.length ? `<ul class="timeline">${items.map(i => `<li class="tl-${i.kind}">
              <span class="tl-when">${i.at ? when(i.at) : "Earlier"}</span>
              <span><span class="tl-kind">${KIND[i.kind] || ""}</span> ${escapeHtml(i.text)}${i.by ? `<br><small>${escapeHtml(i.by)}</small>` : ""}</span>
            </li>`).join("")}</ul>` : `<p>${T.caseHistoryEmpty}</p>`}
          </section>
        </div>

        <div>
          <section class="panel" aria-labelledby="note-title">
            <h2 id="note-title">${T.caseNoteTitle}</h2>
            <form id="note-form">
              <div class="form-row"><label for="note-type">${T.caseNoteType}</label>
                <select id="note-type">${NOTE_TYPES.map(t => `<option>${t}</option>`).join("")}</select></div>
              <div class="form-row"><label for="note-who">${T.caseNoteWho}</label>
                <select id="note-who">${staff.map(st => `<option ${st.name === writer() ? "selected" : ""}>${escapeHtml(st.name)}</option>`).join("")}</select></div>
              <div class="form-row"><label for="note-text">${T.caseNoteText}</label>
                <span class="hint" id="note-hint">${T.caseNoteHint}</span>
                <textarea id="note-text" rows="3" required aria-describedby="note-hint"></textarea></div>
              <button type="submit" class="primary">${T.caseNoteButton}</button>
            </form>
          </section>

          <section class="panel" aria-labelledby="book-title">
            <h2 id="book-title">${T.caseBookTitle}</h2>
            <form id="book-form">
              <div class="form-row"><label for="book-type">${T.caseBookType}</label>
                <select id="book-type">${BOOK_TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
              <div class="form-row"><label for="book-who">${T.caseBookWho}</label>
                <select id="book-who">${staffOptions}</select></div>
              <div class="times">
                <label for="book-date">${T.caseBookDate} <input type="date" id="book-date" min="${tomorrow}" required></label>
                <label for="book-time">${T.caseBookTime} <input type="time" id="book-time" step="900" required></label>
              </div>
              <p><button type="button" class="small" id="find-slot">${T.caseFindSlot}</button> <span id="slot-out" role="status"></span></p>
              <div class="form-row"><label for="book-note">${T.caseBookNote}</label>
                <input id="book-note" autocomplete="off"></div>
              <button type="submit" class="primary">${T.caseBookButton}</button>
            </form>
          </section>
        </div>
      </div>`;
    message = "";

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
      if (!text) return;
      const by = document.getElementById("note-who").value;
      try { localStorage.setItem(WRITER_KEY, by); } catch {}
      PL.log(id, "note", `${document.getElementById("note-type").value}: ${text}`, by);
      message = "Note added.";
      PL.save();
      renderCase(id);
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
      if (!staffId || !date || !time) return;
      const st = staff.find(s => s.id === staffId);
      PL.book(id, { type, staffId, date, time, note });
      PL.log(id, "booking", `${PL.TYPE[type]} booked with ${st.name}, ${day(date)} at ${time}${note ? `: ${note}` : ""}.`, writer());
      if (type === "assess" && ["Not started", "Contacted"].includes(h.status)) state.status[id] = "Visit booked";
      PL.showWeekOf(date);
      message = `${T.caseBooked} <a href="#visits">${T.caseSeeCalendar}</a>`;
      PL.save();
      renderCase(id);
    });
  }

  // ---- Which view: #cases for the list, #cases/H-1001 for one case ----
  function route() {
    const hash = location.hash.slice(1);
    const on = hash === "cases" || hash.startsWith("cases/");
    tab.hidden = !on;
    const link = document.querySelector('[data-tab="cases"]');
    if (on) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    if (!on) return;
    const id = hash.split("/")[1];
    document.getElementById("cases-list").hidden = !!id;
    if (id) renderCase(id);
    else { document.getElementById("case-view").innerHTML = ""; renderList(); }
  }

  window.addEventListener("hashchange", route);
  document.getElementById("case-search").addEventListener("input", renderList);
  document.getElementById("case-show").addEventListener("change", renderList);
  tab.addEventListener("click", e => {
    const cancel = e.target.closest("[data-cancel]");
    if (!cancel) return;
    const id = location.hash.split("/")[1];
    const b = PL.caseOf(id).bookings.find(x => x.id === cancel.dataset.cancel);
    if (!b) return;
    PL.cancel(id, b.id);
    PL.log(id, "booking", `${PL.TYPE[b.type]} on ${day(b.date)} at ${b.time} cancelled.`, writer());
    message = "Booking cancelled.";
    PL.save();
    renderCase(id);
  });
  // A recorded outcome or a status change elsewhere can change the case on screen.
  document.getElementById("visit-dialog").addEventListener("close", () => setTimeout(route));
  document.getElementById("detail").addEventListener("close", () => setTimeout(route));

  route();
})();
