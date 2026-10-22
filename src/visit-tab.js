// The "Visit app" tab on the staff view: the visit app (visit.html) shown in a tablet or phone frame.
// The app only loads when the tab is opened. (The visit app loads this page out of sight for its plan,
// so loading it straight away would load pages inside pages.)
(function () {
  const tab = document.getElementById("tab-visit-app");
  const frame = document.getElementById("visit-app-frame");
  const box = document.getElementById("device-frame");
  const link = document.querySelector('[data-tab="visit-app"]');

  // The visit app saves to this browser's storage from its own page, so this page's copy goes stale.
  // If it saved anything, reload when staff leave the tab, so nothing gets overwritten.
  let changed = false;
  window.addEventListener("storage", e => { if (e.key && e.key.startsWith("healthier-homes")) changed = true; });

  function route() {
    const on = location.hash === "#visit-app";
    if (!on && changed) { changed = false; location.reload(); return; }
    tab.hidden = !on;
    if (on) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    if (on && !frame.getAttribute("src")) frame.src = "visit.html";
  }

  document.querySelectorAll("[data-device]").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("[data-device]").forEach(x => x.setAttribute("aria-pressed", x === b));
    box.className = `device-frame ${b.dataset.device}`;
  }));

  window.addEventListener("hashchange", route);
  route();
})();
