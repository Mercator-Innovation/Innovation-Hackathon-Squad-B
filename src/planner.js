// Visit planner: who visits which home, when, and in what order.
// Risk comes first. Between homes of similar risk, the nearest one wins, to cut travel.
// Uses scored(), state, saveState() and render() from app.js, so it loads after it.
(function () {
  const T = window.CONTENT;
  const KEY = "healthier-homes-planner";
  const DAY_NAMES = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri" };
  const BAND_BONUS = { High: 6, Medium: 3, Low: 0 }; // keeps the bands in order before points
  const HORIZON = 90;      // working days to plan ahead
  const ROAD_FACTOR = 1.3; // roads are longer than a straight line
  const SPEED_KMH = 30;    // average speed around town
  const STOP_MINUTES = 5;  // parking and finding the door
  const TYPE = { assess: "Assessment", fix: "Repair", check: "Check-in" };

  // ---- Saved planner data (team, rules, visit outcomes, cases) ----
  // cases[homeId] = { log: [{ at, kind, text, by }], bookings: [{ id, type, staffId, date, time, note, done }] }
  function seed() {
    const copy = JSON.parse(JSON.stringify(window.ROTA));
    return { staff: copy.staff.map((s, i) => ({ id: `s${i}`, ...s })), settings: copy.settings, outcomes: {}, cases: {} };
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.staff) return { ...seed(), ...saved };
    } catch {}
    return seed();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {}
  }
  let P = load();
  let who = "";

  const caseOf = id => (P.cases[id] = P.cases[id] || { log: [], bookings: [] });
  function log(id, kind, text, by) {
    caseOf(id).log.push({ at: new Date().toISOString(), kind, text, by: by || "" });
  }
  const minutesFor = type => P.settings.minutes[type] || 30;
  // Follow-ups booked on a case: fixed appointments the planner works around.
  const bookings = () => Object.entries(P.cases).flatMap(([homeId, c]) => c.bookings.map(b => ({ ...b, homeId })));

  // ---- Time, dates and distance ----
  const toMin = hhmm => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + (m || 0); };
  const hhmm = min => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const nice = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const hoursMins = min => min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;

  function workingDays(n) {
    const days = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (days.length < n) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() >= 1 && d.getDay() <= 5) days.push(new Date(d));
    }
    return days;
  }
  // The working-day number of a date in the plan (-1 if it's before the plan starts).
  function dayIndex(days, date) {
    const i = days.findIndex(d => iso(d) === date);
    return i >= 0 ? i : days.filter(d => iso(d) < date).length - 1;
  }
  const dueDate = (days, i) => (i >= 0 ? nice(days[Math.min(i, days.length - 1)]) : "today");

  function km(a, b) {
    const rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  function travelMinutes(a, b) {
    if (a === b) return 0;
    return Math.round(km(a, b) * ROAD_FACTOR / SPEED_KMH * 60) + STOP_MINUTES;
  }

  // ---- What needs a visit ----
  function jobs(days) {
    const s = P.settings;
    const out = [];
    const first = iso(days[0]);
    const booked = (id, type) => bookings().some(b => b.homeId === id && b.type === type && !b.done && b.date >= first);
    scored().forEach(home => {
      const loc = window.LOCATIONS.homes[home.id];
      if (!loc) return;
      const band = home.risk.band;
      const done = P.outcomes[home.id];
      if (done) {
        if (done.result === "work" && !done.fixed && !booked(home.id, "fix")) {
          const i = dayIndex(days, done.date);
          out.push({ type: "fix", home, loc, earliest: i + 1, due: i + s.fixTargets[band] });
        }
        return;
      }
      if (home.status === "Work ordered") { if (!booked(home.id, "fix")) out.push({ type: "fix", home, loc, earliest: 0, due: s.fixTargets[band] - 1 }); }
      else if (["Not started", "Contacted", "Visit booked"].includes(home.status) && !booked(home.id, "assess")) out.push({ type: "assess", home, loc, earliest: 0, due: s.targets[band] - 1 });
    });
    return out;
  }

  // Once a day's visits are chosen, their order doesn't change any deadline,
  // so visit them in the order with the least driving, then redo the times.
  function shortestOrder(r, base) {
    if (r.stops.length < 2 || r.stops.length > 7 || r.stops.some(s => s.fixed)) return;
    const drive = order => order.reduce((sum, s, i) => sum + travelMinutes(i ? order[i - 1].loc : base, s.loc), 0);
    let best = r.stops, bestDrive = drive(r.stops);
    const permute = (done, left) => {
      if (!left.length) { const d = drive(done); if (d < bestDrive) { best = done; bestDrive = d; } return; }
      left.forEach((s, i) => permute([...done, s], left.filter((_, j) => j !== i)));
    };
    permute([], r.stops);
    let time = toMin(r.staff.start), at = base;
    r.stops = best.map(s => {
      const travel = travelMinutes(at, s.loc);
      const start = time + travel, end = start + (s.end - s.start);
      time = end;
      at = s.loc;
      return { ...s, travel, start, end };
    });
    r.travel = bestDrive;
  }

  // ---- The plan ----
  // Day by day, keep giving the best next visit to whoever can fit it in.
  // Best = risk (scaled by riskWeight) minus minutes of travel from where that person is now.
  // A visit that would miss its target if it waited another day jumps the queue.
  // Booked follow-ups are fixed: other visits only go in the gaps around them.
  function plan() {
    const days = workingDays(HORIZON);
    const todo = jobs(days);
    const base = window.LOCATIONS.base;
    const homesById = Object.fromEntries(scored().map(h => [h.id, h]));
    const fixed = bookings().filter(b => homesById[b.homeId] && window.LOCATIONS.homes[b.homeId] && P.staff.some(st => st.id === b.staffId));
    const lastFixed = fixed.reduce((last, b) => (b.date > last ? b.date : last), "");
    const planned = [];
    for (let i = 0; i < days.length && (todo.length || iso(days[i]) <= lastFixed); i++) {
      const day = iso(days[i]);
      const routes = P.staff.map(st => {
        const mine = fixed.filter(b => b.staffId === st.id && b.date === day).map(b => {
          const start = toMin(b.time);
          return { type: b.type, home: homesById[b.homeId], loc: window.LOCATIONS.homes[b.homeId], start, end: start + minutesFor(b.type),
            fixed: true, done: b.done, booking: b.id, key: `b-${b.id}`, due: i, late: 0 };
        }).sort((a, b) => a.start - b.start);
        const works = st.days.includes(days[i].getDay()) && st.does.length && toMin(st.end) > toMin(st.start);
        if (!works && !mine.length) return null;
        return { staff: st, at: base, time: works ? toMin(st.start) : 0, end: works ? toMin(st.end) : 0, stops: [], travel: 0, fixed: mine };
      }).filter(Boolean);
      for (;;) {
        let best = null;
        for (const r of routes) {
          for (const j of todo) {
            if (!r.staff.does.includes(j.type) || i < j.earliest) continue;
            const travel = travelMinutes(r.at, j.loc);
            const length = P.settings.minutes[j.type];
            if (r.time + travel + length > r.end) continue;
            if (r.fixed.length && r.time + travel + length + travelMinutes(j.loc, r.fixed[0].loc) > r.fixed[0].start) continue;
            const risk = j.home.risk.points + BAND_BONUS[j.home.risk.band];
            const score = (i >= j.due ? 1000 : 0) + P.settings.riskWeight * 5 * risk - travel;
            if (!best || score > best.score || (score === best.score && r.time < best.r.time)) best = { r, j, travel, length, score };
          }
        }
        if (!best) {
          // Nothing fits before someone's next fixed appointment: move them past it.
          const r = routes.find(x => x.fixed.length);
          if (!r) break;
          const f = r.fixed.shift();
          const travel = travelMinutes(r.at, f.loc);
          r.travel += travel;
          r.stops.push({ ...f, travel });
          r.time = Math.max(r.time, f.end);
          r.at = f.loc;
          continue;
        }
        const { r, j, travel, length } = best;
        r.time += travel;
        r.travel += travel;
        r.stops.push({ ...j, start: r.time, end: r.time + length, travel, late: Math.max(0, i - j.due) });
        r.time += length;
        r.at = j.loc;
        todo.splice(todo.indexOf(j), 1);
      }
      routes.forEach(r => shortestOrder(r, base));
      const used = routes.filter(r => r.stops.length);
      if (used.length) planned.push({ date: days[i], routes: used });
    }
    return { days, planned, unplanned: todo };
  }

  // ---- Showing the plan: a week calendar ----
  const PX = 1.1;       // pixels per minute
  let weekStart = null; // Monday of the week on screen
  let events = [];      // every planned visit
  let lastDays = [];

  const monday = d => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const initials = name => name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colour = st => Math.max(0, P.staff.indexOf(st)) % 6;
  const lateText = n => `${n} working ${n === 1 ? "day" : "days"} late`;

  // Visits that overlap sit side by side, like a calendar app. Travel counts as part of the visit.
  function lanes(list) {
    list.sort((a, b) => (a.start - a.travel) - (b.start - b.travel));
    let cluster = [], clusterEnd = -1;
    const finish = () => { const n = Math.max(...cluster.map(e => e.lane)) + 1; cluster.forEach(e => (e.lanes = n)); };
    list.forEach(e => {
      const from = e.start - e.travel;
      if (cluster.length && from >= clusterEnd) { finish(); cluster = []; }
      const ends = [];
      cluster.forEach(c => (ends[c.lane] = Math.max(ends[c.lane] || 0, c.end)));
      let lane = 0;
      while (ends[lane] !== undefined && ends[lane] > from) lane++;
      e.lane = lane;
      cluster.push(e);
      clusterEnd = Math.max(clusterEnd, e.end);
    });
    if (cluster.length) finish();
  }

  function eventHtml(e, from) {
    const h = e.home, c = colour(e.staff);
    const place = `left:calc(${(e.lane / e.lanes) * 100}% + 2px);width:calc(${100 / e.lanes}% - 4px)`;
    const top = (e.start - from) * PX;
    const label = `${e.fixed ? "Booked " : ""}${TYPE[e.type]} at ${h.address}, ${nice(e.date)} ${hhmm(e.start)} to ${hhmm(e.end)}, ${e.staff.name}, ${h.risk.band} risk${e.done ? ", done" : ""}${e.late ? `, ${lateText(e.late)}` : ""}`;
    return `${e.travel ? `<div class="cal-travel c${c}" style="top:${top - e.travel * PX}px;height:${e.travel * PX}px;${place}" title="${e.travel} min travel" aria-hidden="true"></div>` : ""}
      <button type="button" class="cal-ev c${c} ${e.type}${e.late ? " is-late" : ""}${e.fixed ? " booked" : ""}${e.done ? " done" : ""}${e.end - e.start < 45 ? " short" : ""}" data-visit="${e.key}" aria-label="${escapeHtml(label)}"
        style="top:${top}px;height:${Math.max(e.end - e.start, 30) * PX}px;${place}">
        ${e.end - e.start < 45 ? `<span class="ev-where">${hhmm(e.start)} ${TYPE[e.type]} · ${escapeHtml(h.address)}</span>` : `
        <span class="ev-time">${hhmm(e.start)} ${TYPE[e.type]}${e.done ? " · done" : e.fixed ? " · booked" : ""}${e.late ? " · late" : ""}</span>
        <span class="ev-where">${escapeHtml(h.address)}</span>
        <span class="ev-meta"><span class="badge ${h.risk.band}">${h.risk.band} ${h.risk.points}</span>${who ? "" : ` <span class="ev-who">${initials(e.staff.name)}</span>`}</span>`}
      </button>`;
  }

  function renderCalendar() {
    const shown = events.filter(e => !who || e.staff.id === who);
    const people = who ? P.staff.filter(st => st.id === who) : P.staff;
    const from = Math.floor(Math.min(9 * 60, ...people.map(st => toMin(st.start))) / 60) * 60;
    const to = Math.ceil(Math.max(17 * 60, ...people.map(st => toMin(st.end))) / 60) * 60;
    const height = (to - from) * PX;
    const week = [0, 1, 2, 3, 4].map(n => addDays(weekStart, n));
    const today = iso(new Date());
    const hours = [];
    for (let m = from; m < to; m += 60) hours.push(m);
    const inWeek = shown.filter(e => week.some(d => iso(d) === e.iso));

    document.getElementById("week-label").textContent =
      `${nice(week[0])} to ${nice(week[4])} · ${inWeek.length} ${inWeek.length === 1 ? "visit" : "visits"}`;
    document.getElementById("calendar").innerHTML = `
      <div class="cal-corner"></div>
      ${week.map(d => `<div class="cal-day-head">${nice(d)}${iso(d) === today ? " <small>(today)</small>" : ""}</div>`).join("")}
      <div class="cal-times" style="height:${height}px">${hours.map(m => `<span style="top:${(m - from) * PX}px">${hhmm(m)}</span>`).join("")}</div>
      ${week.map(d => {
        const mine = shown.filter(e => e.iso === iso(d));
        lanes(mine);
        return `<div class="cal-day${iso(d) <= today ? " past" : ""}" style="height:${height}px;--hour:${60 * PX}px">${mine.map(e => eventHtml(e, from)).join("")}</div>`;
      }).join("")}`;
    document.getElementById("cal-empty").textContent = inWeek.length ? "" : (events.length ? T.noVisitsWeek : T.planEmpty);

    document.getElementById("cal-legend").innerHTML = who ? "" : P.staff.map(st =>
      `<span><span class="swatch c${colour(st)}" aria-hidden="true"></span><strong>${initials(st.name)}</strong> ${escapeHtml(st.name)}</span>`).join("");
    renderWhere(week);
  }

  function renderSchedule() {
    const { days, planned, unplanned } = plan();
    lastDays = days;
    events = planned.flatMap(d => d.routes.flatMap(r => r.stops.map(s =>
      ({ ...s, staff: r.staff, date: d.date, iso: iso(d.date), key: s.key || `${s.type}-${s.home.id}` }))));
    const high = events.filter(s => s.type === "assess" && s.home.risk.band === "High");
    const travel = events.reduce((sum, s) => sum + s.travel, 0);

    document.getElementById("plan-summary").innerHTML = `
      <div><strong>${events.filter(s => s.type === "assess").length}</strong> assessments planned</div>
      <div><strong>${events.filter(s => s.type === "fix").length}</strong> repairs planned</div>
      <div><strong>${high.filter(s => !s.late).length} of ${high.length}</strong> high risk homes seen on time</div>
      <div><strong>${events.filter(s => s.late).length + unplanned.length}</strong> visits late or not fitted in</div>
      <div><strong>${hoursMins(travel)}</strong> travel in total</div>`;

    document.getElementById("plan-who").innerHTML = `<option value="">Everyone</option>` +
      P.staff.map(st => `<option value="${st.id}" ${st.id === who ? "selected" : ""}>${escapeHtml(st.name)}</option>`).join("");

    const first = monday(days[0]);
    const last = monday(planned.length ? planned[planned.length - 1].date : days[0]);
    if (!weekStart || weekStart < first) weekStart = first;
    if (weekStart > last) weekStart = last;
    document.getElementById("week-prev").disabled = weekStart <= first;
    document.getElementById("week-next").disabled = weekStart >= last;
    renderCalendar();
    fillVisitsCount();

    document.getElementById("plan-unplanned").innerHTML = unplanned.length
      ? `<h3>${T.unplannedTitle}</h3><p class="hint">${T.unplannedHelp}</p><ul>${unplanned.map(j =>
          `<li>${TYPE[j.type]}: <button type="button" class="link" data-home="${j.home.id}">${escapeHtml(j.home.address)}, ${escapeHtml(j.home.area)}</button> <span class="badge ${j.home.risk.band}">${j.home.risk.band} · ${j.home.risk.points}</span></li>`).join("")}</ul>`
      : "";

    const recorded = Object.entries(P.outcomes);
    document.getElementById("plan-recorded").innerHTML = recorded.length
      ? `<h3>${T.recordedTitle}</h3><ul>${recorded.map(([id, o]) => {
          const h = scored().find(x => x.id === id);
          const what = o.fixed ? "repair done" : o.result === "work" ? "work needed, repair planned" : "no work needed";
          return `<li>${escapeHtml(h ? h.address : id)}: ${what} <button type="button" class="link" data-undo="${id}">Undo</button></li>`;
        }).join("")}</ul>`
      : "";
  }

  // ---- Who's where: people by days, and a map of one day's route ----
  let picked = null; // { staff: id, iso: "2026-10-27" }
  const dayRoute = (stId, day) => events.filter(e => e.staff.id === stId && e.iso === day).sort((a, b) => a.start - b.start);
  function areasOf(route) {
    const n = {};
    route.forEach(e => (n[e.home.area] = (n[e.home.area] || 0) + 1));
    return Object.keys(n).sort((a, b) => n[b] - n[a]);
  }

  function renderWhere(week) {
    const people = who ? P.staff.filter(st => st.id === who) : P.staff;
    const max = Math.max(1, ...week.flatMap(d => people.map(st => dayRoute(st.id, iso(d)).length)));
    const days = week.map(iso);
    if (!picked || !days.includes(picked.iso) || !people.some(st => st.id === picked.staff) || !dayRoute(picked.staff, picked.iso).length) {
      picked = null;
      for (const d of days) {
        const st = people.find(p => dayRoute(p.id, d).length);
        if (st) { picked = { staff: st.id, iso: d }; break; }
      }
    }
    document.getElementById("where-grid").innerHTML = `
      <thead><tr><td></td>${week.map(d => `<th scope="col">${nice(d)}</th>`).join("")}</tr></thead>
      <tbody>${people.map(st => `<tr>
        <th scope="row"><span class="swatch c${colour(st)}" aria-hidden="true"></span>${escapeHtml(st.name)}</th>
        ${week.map(d => {
          const route = dayRoute(st.id, iso(d));
          if (!st.days.includes(d.getDay())) return `<td><span class="cell off">Not on visits</span></td>`;
          if (!route.length) return `<td><span class="cell free">Free</span></td>`;
          const areas = areasOf(route);
          const on = picked && picked.staff === st.id && picked.iso === iso(d);
          return `<td><button type="button" class="cell busy-${Math.ceil(route.length / max * 3)}" data-pick="${st.id}|${iso(d)}" aria-pressed="${on}">
            <strong>${escapeHtml(areas[0])}</strong>${areas.length > 1 ? ` +${areas.length - 1} more` : ""}<br>${route.length} ${route.length === 1 ? "visit" : "visits"}</button></td>`;
        }).join("")}
      </tr>`).join("")}</tbody>`;
    renderMap();
  }

  function renderMap() {
    const box = document.getElementById("where-map");
    if (!picked) { box.innerHTML = `<p class="hint">${T.whereEmpty}</p>`; return; }
    const st = P.staff.find(s => s.id === picked.staff);
    const route = dayRoute(picked.staff, picked.iso);
    const L = window.LOCATIONS;
    const all = [L.base, ...Object.values(L.homes)];
    // Zoom to the day's route (and the base), at least a couple of km across, in a 5:3 frame.
    const k = Math.cos(all.reduce((s, p) => s + p.lat, 0) / all.length * Math.PI / 180);
    const shown = [L.base, ...route.map(e => e.loc)];
    const xs = shown.map(p => p.lng * k), ys = shown.map(p => -p.lat);
    const W = 600, H = 360, pad = 44;
    let spanX = Math.max(Math.max(...xs) - Math.min(...xs), 0.03), spanY = Math.max(Math.max(...ys) - Math.min(...ys), 0.018);
    if (spanX / spanY < W / H) spanX = spanY * W / H; else spanY = spanX * H / W;
    const midX = (Math.max(...xs) + Math.min(...xs)) / 2, midY = (Math.max(...ys) + Math.min(...ys)) / 2;
    const scale = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);
    const xy = p => [W / 2 + (p.lng * k - midX) * scale, H / 2 + (-p.lat - midY) * scale].map(n => Math.round(n));

    // Town names sit above the middle of their homes.
    const towns = {};
    window.DATA.homes.forEach(h => { const p = L.homes[h.id]; if (p) (towns[h.area] = towns[h.area] || []).push(xy(p)); });
    const townLabels = Object.entries(towns).map(([name, pts]) => {
      const x = pts.reduce((s, p) => s + p[0], 0) / pts.length, y = Math.min(...pts.map(p => p[1])) - 10;
      return `<text class="town" x="${Math.round(x)}" y="${Math.round(y)}">${escapeHtml(name)}</text>`;
    }).join("");

    const [bx, by] = xy(L.base);
    const points = [[bx, by], ...route.map(e => xy(e.loc))];
    const date = new Date(`${picked.iso}T12:00`);
    const travel = route.reduce((s, e) => s + e.travel, 0);
    const drawn = [];
    box.innerHTML = `
      <svg class="map c${colour(st)}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="map-title">
        <title id="map-title">Map of ${escapeHtml(st.name)}'s visits on ${nice(date)}</title>
        ${Object.values(L.homes).map(p => { const [x, y] = xy(p); return `<circle class="home-dot" cx="${x}" cy="${y}" r="3"/>`; }).join("")}
        ${townLabels}
        <polyline class="route" points="${points.map(p => p.join(",")).join(" ")}"/>
        <rect class="base" x="${bx - 7}" y="${by - 7}" width="14" height="14"/><text class="base-label" x="${bx - 11}" y="${by + 5}">Base</text>
        ${route.map((e, i) => {
          // Nudge a marker that would sit on top of an earlier one.
          let [x, y] = xy(e.loc);
          while (drawn.some(([a, b]) => Math.hypot(a - x, b - y) < 20)) x += 20;
          drawn.push([x, y]);
          return `<circle class="stop-dot" cx="${x}" cy="${y}" r="11"/><text class="stop-n" x="${x}" y="${y}">${i + 1}</text>`;
        }).join("")}
      </svg>
      <div>
        <h3>${escapeHtml(st.name)}, ${nice(date)}</h3>
        <p class="hint">${route.length} ${route.length === 1 ? "visit" : "visits"} in ${escapeHtml(areasOf(route).join(", "))}. ${travel} min travel.</p>
        <ol class="where-list">${route.map(e => `<li>${hhmm(e.start)} ${TYPE[e.type]}:
          <button type="button" class="link" data-visit="${e.key}">${escapeHtml(e.home.address)}</button>, ${escapeHtml(e.home.area)}
          <span class="badge ${e.home.risk.band}">${e.home.risk.band} ${e.home.risk.points}</span></li>`).join("")}</ol>
        <p class="hint">${T.mapNote}</p>
      </div>`;
  }

  // ---- One visit's details ----
  const visitDialog = document.getElementById("visit-dialog");
  function openVisit(key) {
    const e = events.find(x => x.key === key);
    if (!e) return;
    const h = e.home;
    const button = (outcome, label) =>
      `<button type="button" class="primary" data-outcome="${outcome}" data-id="${h.id}" data-date="${e.iso}" data-by="${escapeHtml(e.staff.name)}" data-booking="${e.booking || ""}">${label}</button>`;
    const actions = e.done ? `<p>${T.visitDone}</p>`
      : e.type === "assess" ? button("work", T.workNeeded) + button("none", T.noWork)
      : e.type === "fix" ? button("fixed", T.repairDone) : button("checked", T.checkDone);
    document.getElementById("visit-body").innerHTML = `
      <button type="button" class="link dialog-close" data-close-visit>Close</button>
      <h2 id="visit-title">${TYPE[e.type]}: ${escapeHtml(h.address)}, ${escapeHtml(h.area)}</h2>
      <p><span class="badge ${h.risk.band}">${h.risk.band} risk · ${h.risk.points} points</span></p>
      <dl class="facts">
        <dt>When</dt><dd>${nice(e.date)}, ${hhmm(e.start)} to ${hhmm(e.end)}</dd>
        <dt>Who</dt><dd>${escapeHtml(e.staff.name)}, ${escapeHtml(e.staff.role)}</dd>
        <dt>Travel</dt><dd>${e.travel} minutes from the last stop</dd>
        ${e.fixed ? `<dt>Booked</dt><dd>${T.visitBooked}</dd>` : `<dt>Target</dt><dd>By ${dueDate(lastDays, e.due)}${e.late ? `: <strong class="late">${lateText(e.late)}</strong>` : ", on time"}</dd>`}
      </dl>
      <h3>${T.whyFlagged}</h3>
      <ul class="reasons">${h.risk.reasons.map(r => `<li>${escapeHtml(r.reason)}</li>`).join("") || "<li>Nothing flagged</li>"}</ul>
      <h3>${T.visitOutcome}</h3>
      <div class="actions">${actions}</div>
      <p><a class="button" href="#cases/${h.id}" data-close-visit>${T.openCase}</a>
        <button type="button" class="link" data-home="${h.id}">${T.openHome}</button></p>`;
    visitDialog.showModal();
  }

  // ---- Team and rules forms ----
  function renderTeam() {
    document.getElementById("plan-team").innerHTML = P.staff.map(st => `
      <fieldset class="card person">
        <legend>${escapeHtml(st.name)} <small>${escapeHtml(st.role)}</small></legend>
        <div class="checks inline">
          <label><input type="checkbox" data-staff="${st.id}" data-does="assess" ${st.does.includes("assess") ? "checked" : ""}> Assessments</label>
          <label><input type="checkbox" data-staff="${st.id}" data-does="fix" ${st.does.includes("fix") ? "checked" : ""}> Repairs</label>
        </div>
        <fieldset>
          <legend class="small-legend">Days for visits</legend>
          <div class="checks inline">${Object.entries(DAY_NAMES).map(([n, name]) => `
            <label><input type="checkbox" data-staff="${st.id}" data-day="${n}" ${st.days.includes(+n) ? "checked" : ""}> ${name}</label>`).join("")}
          </div>
        </fieldset>
        <div class="times">
          <label for="${st.id}-start">From <input type="time" id="${st.id}-start" data-staff="${st.id}" data-field="start" value="${st.start}"></label>
          <label for="${st.id}-end">To <input type="time" id="${st.id}-end" data-staff="${st.id}" data-field="end" value="${st.end}"></label>
        </div>
        <button type="button" class="link" data-remove="${st.id}">Remove ${escapeHtml(st.name)}</button>
      </fieldset>`).join("");
  }

  function renderRules() {
    const s = P.settings;
    const num = (group, key, label) =>
      `<label>${label} <input type="number" min="1" max="200" data-rule="${group}" data-key="${key}" value="${s[group][key]}"></label>`;
    document.getElementById("plan-rules").innerHTML = `
      <fieldset><legend>${T.rulesAssess}</legend>
        <div class="times">${num("targets", "High", "High")}${num("targets", "Medium", "Medium")}${num("targets", "Low", "Low")}</div></fieldset>
      <fieldset><legend>${T.rulesFix}</legend>
        <div class="times">${num("fixTargets", "High", "High")}${num("fixTargets", "Medium", "Medium")}${num("fixTargets", "Low", "Low")}</div></fieldset>
      <fieldset><legend>${T.rulesMinutes}</legend>
        <div class="times">${num("minutes", "assess", "Assessment")}${num("minutes", "fix", "Repair")}</div></fieldset>
      <div class="form-row"><label for="risk-weight">${T.rulesWeight}</label>
        <select id="risk-weight">${[[1, "The same as travel"], [2, "Twice as much as travel"], [4, "Four times as much as travel"]].map(([v, l]) =>
          `<option value="${v}" ${s.riskWeight === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <p class="hint">${T.distanceNote}</p>`;
  }

  function renderAll() { renderTeam(); renderRules(); renderSchedule(); }

  // ---- Changes ----
  const root = document.getElementById("tab-visits");
  root.addEventListener("change", e => {
    const el = e.target;
    const st = P.staff.find(x => x.id === el.dataset.staff);
    if (st && el.dataset.does) st.does = el.checked ? [...new Set([...st.does, el.dataset.does])] : st.does.filter(d => d !== el.dataset.does);
    else if (st && el.dataset.day) st.days = el.checked ? [...st.days, +el.dataset.day].sort() : st.days.filter(d => d !== +el.dataset.day);
    else if (st && el.dataset.field && el.value) st[el.dataset.field] = el.value;
    else if (el.dataset.rule && +el.value > 0) P.settings[el.dataset.rule][el.dataset.key] = +el.value;
    else if (el.id === "risk-weight") P.settings.riskWeight = +el.value;
    else if (el.id === "plan-who") who = el.value;
    else return;
    save();
    renderSchedule();
  });

  document.addEventListener("click", e => {
    const visit = e.target.closest("[data-visit]");
    const out = e.target.closest("[data-outcome]");
    const undo = e.target.closest("[data-undo]");
    const remove = e.target.closest("[data-remove]");
    const week = e.target.closest("#week-prev, #week-next");
    const pick = e.target.closest("[data-pick]");
    if (visit) return openVisit(visit.dataset.visit);
    if (pick) {
      const [staff, day] = pick.dataset.pick.split("|");
      picked = { staff, iso: day };
      renderCalendar();
      return document.querySelector(`[data-pick="${pick.dataset.pick}"]`).focus();
    }
    if (e.target.closest("[data-close-visit]") || (e.target.closest("[data-home]") && visitDialog.contains(e.target))) return visitDialog.close();
    if (week) {
      weekStart = addDays(weekStart, week.id === "week-next" ? 7 : -7);
      return renderSchedule();
    }
    if (out) {
      visitDialog.close();
      record(out.dataset.id, out.dataset.outcome, out.dataset.date, out.dataset.by, out.dataset.booking);
    } else if (undo) {
      const id = undo.dataset.undo;
      delete P.outcomes[id];
      if (state.status[id] === "Work ordered" || state.status[id] === "Fixed") delete state.status[id];
      log(id, "outcome", "Recorded outcome undone.");
    } else if (remove) {
      P.staff = P.staff.filter(st => st.id !== remove.dataset.remove);
      if (who === remove.dataset.remove) who = "";
      renderTeam();
    } else if (e.target.id === "plan-reset") {
      [...Object.keys(P.outcomes), ...Object.keys(P.cases)].forEach(id => {
        if (["Work ordered", "Fixed", "Visit booked"].includes(state.status[id])) delete state.status[id];
      });
      P = seed();
      who = "";
      renderAll();
    } else return;
    save();
    saveState(state);
    render();
  });

  document.getElementById("plan-add").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("add-name").value.trim();
    if (!name) return;
    P.staff.push({ id: `s${Date.now()}`, name, role: document.getElementById("add-role").value.trim() || "Visiting officer",
      does: ["assess"], days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" });
    e.target.reset();
    save();
    renderTeam();
    renderSchedule();
  });

  // ---- Recording what happened at a visit ----
  const OUTCOME_TEXT = {
    work: "Assessment: work needed. A repair will be planned.",
    none: "Assessment: no work needed.",
    fixed: "Repair done.",
    checked: "Check-in done."
  };
  function record(id, outcome, date, by, bookingId) {
    if (outcome === "fixed") {
      P.outcomes[id] = { ...(P.outcomes[id] || { result: "work" }), fixed: date };
      state.status[id] = "Fixed";
    } else if (outcome === "work" || outcome === "none") {
      P.outcomes[id] = { result: outcome, date };
      if (outcome === "work") state.status[id] = "Work ordered";
    }
    const booking = bookingId && caseOf(id).bookings.find(b => b.id === bookingId);
    if (booking) booking.done = date;
    log(id, "outcome", OUTCOME_TEXT[outcome], by);
  }

  // Statuses changed in a home's details can change the plan.
  document.getElementById("detail").addEventListener("close", renderSchedule);

  // Whenever the dashboard redraws, redraw the plan too, and fill the dashboard's visits count.
  const appRender = render;
  render = function () {
    appRender();
    renderSchedule();
  };
  // The "Visits" card on the Risk overview (glance.js) counts the next 5 working days of the plan.
  function fillVisitsCount() {
    const el = document.querySelector('[data-glance="visits"] .g-count');
    if (el) el.textContent = events.filter(e => !e.done && lastDays.slice(0, 5).some(d => iso(d) === e.iso)).length;
  }

  // The first gap in someone's plan that a visit of this type fits into, with time to travel.
  function firstFree(staffId, type) {
    const st = P.staff.find(x => x.id === staffId);
    if (!st) return null;
    const need = minutesFor(type) + 30;
    for (const d of lastDays.slice(0, 40)) {
      if (!st.days.includes(d.getDay())) continue;
      const busy = events.filter(e => e.staff.id === st.id && e.iso === iso(d)).sort((a, b) => a.start - b.start);
      let cursor = toMin(st.start);
      for (const e of [...busy, { start: toMin(st.end), travel: 0, end: toMin(st.end) }]) {
        if (e.start - e.travel - cursor >= need) {
          const at = Math.ceil((cursor + 15) / 15) * 15;
          return { date: iso(d), time: hhmm(at) };
        }
        cursor = Math.max(cursor, e.end);
      }
    }
    return null;
  }

  // For the case page (case.js).
  window.PLANNER = {
    TYPE, nice, hhmm, iso,
    staff: () => P.staff,
    events: () => events,
    outcome: id => P.outcomes[id],
    caseOf, log, record, firstFree,
    book(id, booking) { caseOf(id).bookings.push({ id: Date.now().toString(36), ...booking }); },
    cancel(id, bookingId) { const c = caseOf(id); c.bookings = c.bookings.filter(b => b.id !== bookingId); },
    showWeekOf(date) { weekStart = monday(new Date(`${date}T12:00`)); },
    save() { save(); saveState(state); render(); }
  };

  renderAll();
})();
