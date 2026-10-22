// Tenant form: a report goes into "Reports from tenants" on the staff view (in this browser).
fillText();

const form = document.getElementById("report-form");
const thanks = document.getElementById("thanks");

form.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(form);
  const address = data.get("address").trim();
  const home = window.DATA.homes.find(h => address && h.address.toLowerCase() === address.toLowerCase());
  const state = loadState();
  const ref = "R-" + String(414 + state.reports.length).padStart(4, "0");

  state.reports.push({
    ref,
    homeId: home ? home.id : null,
    address,
    name: data.get("name").trim(),
    received: new Date().toISOString().slice(0, 10),
    problems: data.getAll("problem").length ? data.getAll("problem") : ["Not sure"],
    description: data.get("description") || "No description given",
    rooms: data.get("rooms"),
    photos: [...form.photos.files].map(f => f.name),
    health: data.get("health"),
    contactBy: data.get("contactWhen"),
    status: "New"
  });
  saveState(state);

  form.hidden = true;
  thanks.hidden = false;
  document.getElementById("thanks-body").textContent = window.CONTENT.thanksBody.replace("{ref}", ref);
  thanks.focus();
});

document.getElementById("again").addEventListener("click", () => {
  form.reset();
  thanks.hidden = true;
  form.hidden = false;
  form.querySelector("input").focus();
});
