// Site-wide behavior: theme toggle, mobile nav, footer year.
// Page-specific code should go in its own file under assets/js/.

// localStorage can throw (private mode, blocked storage), so never touch it directly.
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
};

// ── Theme ─────────────────────────────────────────────────
// The inline script in <head> sets data-theme before first paint; this keeps it in sync.
const THEME_KEY = 'theme';
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

function currentTheme() {
  return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, persist) {
  root.dataset.theme = theme;
  if (persist) store.set(THEME_KEY, theme);
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

applyTheme(currentTheme(), false);

themeToggle?.addEventListener('click', () => {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
});

// Keep other open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === THEME_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
    applyTheme(event.newValue, false);
  }
});

// ── Mobile nav ────────────────────────────────────────────
const nav = document.getElementById('site-nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

function setNavOpen(open) {
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

if (nav && navToggle && navLinks) {
  navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setNavOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNavOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 680) setNavOpen(false); });
}

// ── Orbit ─────────────────────────────────────────────────
// The sparkle's SVG animation ignores CSS reduced-motion, so freeze it here.
// Both halves share one clock; park the star on the front arc where it's visible.
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const orbits = document.querySelectorAll('svg.orbit');

function syncOrbitMotion() {
  orbits.forEach((svg) => {
    if (motionQuery.matches) {
      svg.pauseAnimations();
      svg.setCurrentTime(48 * 0.62);
    } else {
      svg.unpauseAnimations();
    }
  });
}

syncOrbitMotion();
motionQuery.addEventListener('change', syncOrbitMotion);

// ── Local time ────────────────────────────────────────────
// Shows the current time in Denmark next to "Based in Denmark".
const localTimeEl = document.querySelector('[data-local-time]');
if (localTimeEl) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Copenhagen', hour: '2-digit', minute: '2-digit',
  });
  const tick = () => { localTimeEl.textContent = `. It's ${fmt.format(new Date())} here right now.`; };
  tick();
  setInterval(tick, 30000);
}

// ── Footer year ───────────────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
