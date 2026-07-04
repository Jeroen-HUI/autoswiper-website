// ===== Footer year =====
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Store badges (from config.js) =====
const siteCfg = window.AUTOSWIPER_CONFIG || {};
document.querySelectorAll('[data-play-store-link]').forEach((link) => {
  if (siteCfg.playStoreUrl) {
    link.href = siteCfg.playStoreUrl;
  } else {
    link.hidden = true;
  }
});

// ===== Theme toggle (persisted) =====
const THEME_KEY = 'autoswiper-theme';
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');

function setThemeColorMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const isLight = root.getAttribute('data-theme') === 'light';
    meta.setAttribute('content', isLight ? '#f2f2f7' : '#0a0a0a');
  }
}
setThemeColorMeta();

if (toggle) {
  toggle.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) {
      root.removeAttribute('data-theme');
      try { localStorage.setItem(THEME_KEY, 'dark'); } catch (e) {}
    } else {
      root.setAttribute('data-theme', 'light');
      try { localStorage.setItem(THEME_KEY, 'light'); } catch (e) {}
    }
    setThemeColorMeta();
  });
}

// ===== Sticky-nav border on scroll =====
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
