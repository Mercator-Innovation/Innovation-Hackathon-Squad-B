// Tenant form: a report goes into "Reports from tenants" on the staff view (in this browser).
fillText();

const form = document.getElementById("report-form");
const thanks = document.getElementById("thanks");
const T = window.CONTENT;

// Forgiving address match: "29 Firth View", "29 firth view, Greenock" and "Flat 1, 29 Firth View." all find the home.
// The spaces either side stop "9 Firth View" matching "29 Firth View".
const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function findHome(address) {
  const typed = ` ${norm(address)} `;
  return typed.trim() ? window.DATA.homes.find(h => typed.includes(` ${norm(h.address)} `)) : null;
}

// An error summary at the top, and the message above the field, so the form can't be sent with no way to reach the tenant
function showError(text) {
  let summary = document.getElementById("error-summary");
  if (!summary) {
    summary = document.createElement("div");
    summary.id = "error-summary";
    summary.className = "error-summary";
    summary.tabIndex = -1;
    form.prepend(summary);
  }
  summary.innerHTML = `<h2>${T.errorSummaryTitle}</h2><p><a href="#address">${text}</a></p>`;
  let inline = document.getElementById("address-error");
  if (!inline) {
    inline = document.createElement("span");
    inline.id = "address-error";
    inline.className = "error";
    document.getElementById("address").before(inline);
  }
  inline.textContent = text;
  const field = document.getElementById("address");
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", "address-error");
  summary.focus();
}

function clearError() {
  ["error-summary", "address-error"].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
  const field = document.getElementById("address");
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(form);
  const address = data.get("address").trim();
  const contact = data.get("contact").trim();
  clearError();
  if (!address && !contact) { showError(T.errorAddressOrContact); return; }
  const home = findHome(address);
  const state = loadState();
  const ref = "R-" + String(414 + state.reports.length).padStart(4, "0");

  state.reports.push({
    ref,
    homeId: home ? home.id : null,
    address,
    name: data.get("name").trim(),
    contact,
    received: new Date().toISOString().slice(0, 10),
    problems: data.getAll("problem").length ? data.getAll("problem") : ["Not sure"],
    description: data.get("description") || "No description given",
    rooms: data.getAll("room").join(", "),
    photos: [...form.photos.files].map(f => f.name),
    health: data.get("health"),
    contactBy: [...data.getAll("contactWay"), ...data.getAll("contactTime")].join(", "),
    status: "New"
  });
  saveState(state);

  form.hidden = true;
  thanks.hidden = false;
  document.getElementById("thanks-body").textContent = window.CONTENT.thanksBody.replace("{ref}", ref);
  document.getElementById("thanks-track").href = "track.html?ref=" + ref;
  thanks.focus();
});

document.getElementById("again").addEventListener("click", () => {
  form.reset();
  clearError();
  thanks.hidden = true;
  form.hidden = false;
  form.querySelector("input").focus();
});
