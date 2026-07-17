/**
 * vaelora dashboard client
 * Call initDashboard() on page load.
 * Polls /api/dashboard every POLL_MS and updates the two panels.
 */

const DASHBOARD_API = "/api/dashboard";
const POLL_MS = 10000;

function renderTools(tools) {
  const el = document.getElementById("dash-tools");
  if (!el) return;
  if (!tools?.length) {
    el.innerHTML = '<div class="dash-row"><span class="dash-tool" style="color:var(--text-faint)">no tools found in TOOLS.md</span></div>';
    return;
  }
  el.innerHTML = tools
    .map(t => `
      <div class="dash-row">
        <span class="dash-tool">${esc(t.name)}</span>
        <span class="dash-desc" style="color:var(--text-faint);font-size:.8rem">${esc(t.desc)}</span>
      </div>`)
    .join("");
}

function renderGit(commits) {
  const el = document.getElementById("dash-git");
  if (!el) return;
  if (!commits?.length) {
    el.innerHTML = '<div class="dash-row"><span style="color:var(--text-faint)">no commits found</span></div>';
    return;
  }
  el.innerHTML = commits
    .map(c => `
      <div class="dash-row git-row">
        <span class="git-hash" style="color:var(--text-faint)">${esc(c.hash)}</span>
        <span class="git-msg">${esc(c.msg)}</span>
        <span class="git-time" style="color:var(--text-faint);font-size:.75rem">${esc(c.time)}</span>
      </div>`)
    .join("");
}

async function fetchDashboard() {
  try {
    const res = await fetch(DASHBOARD_API, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderTools(data.tools);
    renderGit(data.git);
  } catch (err) {
    console.warn("[dashboard] fetch failed:", err);
  }
}

export function initDashboard() {
  fetchDashboard();
  setInterval(fetchDashboard, POLL_MS);
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
