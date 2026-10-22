// Small helpers used by every page.

// Put the words from content.js into every element with data-text="key".
function fillText(root = document) {
  root.querySelectorAll("[data-text]").forEach(el => {
    el.textContent = window.CONTENT[el.dataset.text] ?? el.dataset.text;
  });
}

// Saved changes (statuses, visits, tenant reports) live in this browser only.
const STORE_KEY = "healthier-homes";
function loadState() {
  try {
    return { status: {}, notes: {}, visits: [], reports: [], ...JSON.parse(localStorage.getItem(STORE_KEY)) };
  } catch {
    return { status: {}, notes: {}, visits: [], reports: [] };
  }
}
function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
