// Track my report: a tenant enters their reference and sees how far things have got.
// Progress comes from what staff do on the staff view (in this browser).
fillText();

const C = window.CONTENT;
const form = document.getElementById("track-form");
const input = document.getElementById("ref");
const error = document.getElementById("ref-error");
const result = document.getElementById("result");

// The order things happen in, matching the statuses on the staff view.
const HOME_ORDER = ["Not started", "Contacted", "Visit booked", "Work ordered", "Fixed", "Checked: risk down"];

// Accept "R-0412", "r0412" or just "412".
function normaliseRef(text) {
  const digits = text.replace(/\D/g, "");
  return digits ? "R-" + digits.padStart(4, "0") : "";
}

function findReport(ref) {
  const state = loadState();
  return [...window.DATA.reports, ...state.reports].find(r => r.ref === ref);
}

function progress(report) {
  const state = loadState();
  const reportStatus = state.status[report.ref] || report.status;
  const home = report.homeId && window.DATA.homes.find(h => h.id === report.homeId);
  const homeStatus = home ? (state.status[home.id] || home.status) : "Not started";
  const reached = HOME_ORDER.indexOf(homeStatus);
  const visit = state.visits.filter(v => v.homeId === report.homeId).pop();

  return [
    { label: C.trackStepReceived, done: true, detail: new Date(report.received + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
    { label: C.trackStepLooking, done: reportStatus !== "New" || reached >= 1 },
    { label: C.trackStepVisit, done: !!visit || reached >= 2, detail: visit && visit.when },
    { label: C.trackStepWork, done: reached >= 3 },
    { label: C.trackStepFixed, done: reached >= 4 }
  ];
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
  result.hidden = true;
  input.focus();
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const ref = normaliseRef(input.value);
  if (!ref) return showError(C.trackErrorEmpty);
  const report = findReport(ref);
  if (!report) return showError(C.trackErrorNotFound.replace("{ref}", ref));

  error.hidden = true;
  const steps = progress(report);
  const next = steps.find(s => !s.done);

  document.getElementById("result-title").textContent = C.trackResultTitle.replace("{ref}", ref);
  document.getElementById("result-summary").textContent =
    C.trackResultSummary.replace("{problems}", report.problems.join(", ").toLowerCase());
  document.getElementById("steps").innerHTML = steps.map(s => `
    <li class="${s.done ? "done" : ""}">
      <strong>${escapeHtml(s.label)}</strong>
      <span class="state">${s.done ? C.trackDone : C.trackNotYet}${s.done && s.detail ? ": " + escapeHtml(s.detail) : ""}</span>
    </li>`).join("");
  document.getElementById("result-next").textContent = next ? C.trackNext : C.trackAllDone;

  result.hidden = false;
  result.focus();
});

// Coming from the "thanks" screen: fill in the reference and show progress straight away.
const fromLink = new URLSearchParams(location.search).get("ref");
if (fromLink) {
  input.value = fromLink;
  form.requestSubmit();
}
