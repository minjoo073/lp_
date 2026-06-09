/* ─── Lenis smooth scroll ─────────────────────────────────────────────── */
const lenis = new Lenis({
  duration: 1.15,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Lenis + ScrollTrigger sync
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ─── Hero entrance (on load) ──────────────────────────────────────────── */
gsap.set('.hero-copy h1, .hero-copy h2, .hero-copy p, .record-visual, .meta-grid--top .meta-item, .archive-strip', {
  opacity: 0,
});

gsap.timeline({ delay: 0.1 })
  .from('.hero-copy h1', {
    y: 60, opacity: 0, duration: 1.1, ease: 'power3.out',
  })
  .from('.hero-copy h2', { y: 36, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.75')
  .from('.hero-copy p',  { y: 24, opacity: 0, duration: 0.85, ease: 'power2.out' }, '-=0.7')
  .from('.record-visual', { scale: 0.94, opacity: 0, duration: 1.6, ease: 'power2.out' }, '<-0.9')
  .from('.meta-grid--top .meta-item', {
    y: 16, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
  }, '-=0.5')
  .from('.archive-strip', { opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4')
  .from('.meta-grid--bottom .meta-item', {
    y: 16, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
  }, '-=0.3');

/* ─── Helper: fade-up on scroll ─────────────────────────────────────────── */
function fadeUp(targets, options = {}) {
  const els = gsap.utils.toArray(targets);
  els.forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
        ...options.trigger,
      },
      y: options.y ?? 44,
      opacity: 0,
      duration: options.duration ?? 0.85,
      delay: options.stagger ? i * options.stagger : (options.delay ?? 0),
      ease: options.ease ?? 'power3.out',
    });
  });
}

/* ─── Section headers ───────────────────────────────────────────────────── */
gsap.utils.toArray('.section-head').forEach(head => {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: head, start: 'top 85%', once: true },
  });
  tl.from(head.querySelector('.section-title-line'), {
    y: 60, opacity: 0, duration: 1, ease: 'power3.out',
  });
  const sub = head.querySelector('.section-subtitle');
  const side = head.querySelector('.section-side');
  if (sub) tl.from(sub, { y: 20, opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5');
  if (side) tl.from(side, { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5');
  const rule = head.querySelector('.section-rule, hr');
  if (rule) tl.from(rule, { scaleX: 0, transformOrigin: 'left', duration: 0.9, ease: 'power2.inOut' }, '-=0.4');
});

/* ─── Brand Concept ─────────────────────────────────────────────────────── */
fadeUp('.concept-grid .essay-block');
fadeUp('.concept-grid .pillars-block');
fadeUp('.pillars-list li', { stagger: 0.06, y: 24 });

/* ─── Research ──────────────────────────────────────────────────────────── */
fadeUp('.research-copy');
gsap.utils.toArray('.audit-table tr').forEach((row, i) => {
  gsap.from(row, {
    scrollTrigger: { trigger: row, start: 'top 92%', once: true },
    x: -20, opacity: 0, duration: 0.5, delay: i * 0.04, ease: 'power2.out',
  });
});
fadeUp('.insight-grid .insight-card', { stagger: 0.1, y: 30 });

/* ─── Visual / Brand Design ─────────────────────────────────────────────── */
fadeUp('.system-block');
fadeUp('.color-grid .swatch', { stagger: 0.07, y: 20 });
fadeUp('.type-row', { stagger: 0.1 });
fadeUp('.motif-grid .motif-item', { stagger: 0.08, y: 24 });

/* ─── Wireframe ─────────────────────────────────────────────────────────── */
gsap.utils.toArray('.wire-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: 'top 88%', once: true },
    y: 50, opacity: 0, scale: 0.97,
    duration: 0.9, delay: i * 0.12, ease: 'power3.out',
  });
});

/* ─── UI Section — catalog row (main page annotations) ─────────────────── */
gsap.from('.ui-intro-copy', {
  scrollTrigger: { trigger: '.ui-intro-copy', start: 'top 85%', once: true },
  y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
});

gsap.from('.ui-image--main', {
  scrollTrigger: { trigger: '.ui-catalog-row', start: 'top 80%', once: true },
  scale: 0.96, opacity: 0, duration: 1.2, ease: 'power2.out',
});

gsap.utils.toArray('.ui-note-column--left .ui-note').forEach((note, i) => {
  gsap.from(note, {
    scrollTrigger: { trigger: note, start: 'top 90%', once: true },
    x: -30, opacity: 0, duration: 0.7, delay: i * 0.1, ease: 'power2.out',
  });
});

gsap.utils.toArray('.ui-note-column--right .ui-note').forEach((note, i) => {
  gsap.from(note, {
    scrollTrigger: { trigger: note, start: 'top 90%', once: true },
    x: 30, opacity: 0, duration: 0.7, delay: i * 0.1, ease: 'power2.out',
  });
});

/* ─── UI Section — editorial row (artist feature page) ─────────────────── */
gsap.from('.ui-image--poster', {
  scrollTrigger: { trigger: '.editorial-row', start: 'top 80%', once: true },
  scale: 0.96, opacity: 0, duration: 1.2, ease: 'power2.out',
});

gsap.utils.toArray('.feature-list li').forEach((item, i) => {
  gsap.from(item, {
    scrollTrigger: { trigger: item, start: 'top 90%', once: true },
    x: 30, opacity: 0, duration: 0.65, delay: i * 0.08, ease: 'power2.out',
  });
});

/* ─── UI Section — best sellers & about ────────────────────────────────── */
gsap.utils.toArray('.detail-note, .about-note, .about-side-copy').forEach((note, i) => {
  gsap.from(note, {
    scrollTrigger: { trigger: note, start: 'top 90%', once: true },
    x: -24, opacity: 0, duration: 0.65, delay: i * 0.08, ease: 'power2.out',
  });
});

gsap.from('.ui-image--detail', {
  scrollTrigger: { trigger: '.ui-detail-row', start: 'top 80%', once: true },
  scale: 0.96, opacity: 0, duration: 1.2, ease: 'power2.out',
});

gsap.from('.ui-image--about', {
  scrollTrigger: { trigger: '.ui-about-row', start: 'top 80%', once: true },
  scale: 0.96, opacity: 0, duration: 1.2, ease: 'power2.out',
});

/* ─── Publishing ────────────────────────────────────────────────────────── */
fadeUp('.publishing-intro');
fadeUp('.publishing-copy h3');
fadeUp('.publishing-list span', { stagger: 0.08, y: 20 });
fadeUp('.device-card-wrap', { stagger: 0.1, y: 30 });

gsap.from('.publishing-code', {
  scrollTrigger: { trigger: '.publishing-code', start: 'top 85%', once: true },
  x: 40, opacity: 0, duration: 1, ease: 'power2.out',
});

/* ─── Closing footer ────────────────────────────────────────────────────── */
fadeUp('.closing-footer h2', { y: 60, duration: 1.1 });
fadeUp('.closing-copy', { delay: 0.2 });
