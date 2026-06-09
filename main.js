/* ─── Intersection Observer fade-in ────────────────────────────────────── */

const FADE_SELECTORS = [
  /* hero */
  '.hero-copy h1',
  '.hero-copy h2',
  '.hero-copy p',
  '.record-visual',
  '.meta-grid .meta-item',
  '.archive-strip',
  /* section headers */
  '.section-title-line',
  '.section-subtitle',
  '.section-rule',
  /* brand concept */
  '.essay-block',
  '.pillars-block',
  '.pillars-list li',
  /* research */
  '.research-copy',
  '.audit-table',
  '.insight-card',
  /* visual */
  '.system-block',
  '.swatch',
  '.type-row',
  '.motif-item',
  /* wireframe */
  '.wire-card',
  /* ui */
  '.ui-intro-copy',
  '.ui-note',
  '.feature-list li',
  '.detail-note',
  '.about-note',
  '.about-side-copy',
  '.ui-image--main',
  '.ui-image--poster',
  '.ui-image--detail',
  '.ui-image--about',
  /* publishing */
  '.publishing-intro',
  '.publishing-copy h3',
  '.publishing-list span',
  '.device-card-wrap',
  '.publishing-code',
  /* footer */
  '.closing-footer h2',
  '.closing-copy',
];

/* Elements that should fade only (no translate — overflow: clip) */
const FADE_ONLY = new Set(['.record-visual', '.ui-image--main', '.ui-image--poster', '.ui-image--detail', '.ui-image--about']);

/* Mark every matching element as hidden initially */
const allEls = [];
FADE_SELECTORS.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    const cls = FADE_ONLY.has(sel) ? 'will-animate-fade' : 'will-animate';
    el.classList.add(cls);
    el.style.transitionDelay = `${i * 0.04}s`;
    allEls.push(el);
  });
});

/* Hero elements animate immediately on load */
const heroEls = document.querySelectorAll(
  '.hero-copy h1, .hero-copy h2, .hero-copy p, .record-visual, .meta-grid .meta-item, .archive-strip'
);
window.addEventListener('load', () => {
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('is-visible'), 120 + i * 80);
  });
});

/* All other elements animate on scroll */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
);

allEls.forEach(el => {
  if (!el.closest('.hero')) observer.observe(el);
});
