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

/* ─── Progressive reveal helper ─────────────────────────────────────────── */
/* Items appear at evenly spaced rect.top thresholds, mapped from startAt → endAt.
   - startAt: rect.top at which item 1 just appears
   - endAt:   rect.top at which item N (last) just appears
   Both relative to image's rect.top (positive = image still partially below viewport top). */
function setupProgressiveReveal(items, anchor, startAt = 200, endAt = -300) {
  if (!items.length || !anchor) return;
  const update = () => {
    const rect = anchor.getBoundingClientRect();
    const n = items.length;
    /* Map rect.top in [startAt, endAt] to t in [0, 1] */
    const t = Math.max(0, Math.min(1, (startAt - rect.top) / (startAt - endAt)));
    /* Item k (0-indexed) appears at t = k/(n-1); show floor(t*(n-1))+1 items when t>0, else 0 */
    let itemsToShow;
    if (rect.top <= startAt) {
      itemsToShow = Math.min(n, Math.floor(t * (n - 1)) + 1);
    } else {
      itemsToShow = 0;
    }
    items.forEach((item, i) => {
      if (i < itemsToShow) {
        item.classList.add('is-revealed');
      } else {
        item.classList.remove('is-revealed');
      }
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ─── feature-list sticky top sync ──────────────────────────────────────────
   목표: .feature-list의 sticky top을 .editorial-shot의 그리드 내 오프셋과
   동기화해서, 스크롤 시 feature-list 상단이 이미지 상단과 정확히 맞닿도록 함.

   계산식:
     imageOffsetInRow = shot.getBoundingClientRect().top - row.getBoundingClientRect().top
     → 이 값이 그리드 행 내에서 이미지가 얼마나 아래에 있는지 (복사 블록 높이 + row-gap)
     sticky top = imageOffsetInRow (px)
     → 뷰포트 기준 top이 imageOffsetInRow에 도달해야 feature-list가 멈추므로
       이미지가 뷰포트에 걸리는 위치와 일치하게 됨.
*/
function syncFeatureListTop() {
  /* 첫 항목이 이미지 상단 옆에 시작하도록 padding-top만 설정.
     gap은 CSS의 고정 값(130px) 사용 — space-between 분산 제거. */
  const featureList = document.querySelector('.feature-list');
  const shot = document.querySelector('.editorial-shot');
  const row = document.querySelector('.editorial-row');
  if (!featureList || !shot || !row) return;

  const rowRect = row.getBoundingClientRect();
  const shotRect = shot.getBoundingClientRect();
  const imageOffsetInRow = shotRect.top - rowRect.top;

  featureList.style.paddingTop = imageOffsetInRow + 'px';
  featureList.style.minHeight = '';
  featureList.style.top = '';
  featureList.style.marginTop = '';
  featureList.style.paddingBottom = '';
}

/* 초기 실행 + 리사이즈 대응 */
syncFeatureListTop();
window.addEventListener('resize', syncFeatureListTop);
/* 폰트·이미지 로드 후 레이아웃이 확정되면 재계산 */
window.addEventListener('load', syncFeatureListTop);

/* ─── Artist Feature Page — feature list reveal ──────────────────────────────
   이미지(800×2254px) 기준:
   - 01: 이미지가 뷰포트에 진입하자마자 (rect.top ≈ 뷰포트 높이에서 내려오기 시작)
         → startAt: 뷰포트 높이의 70% 지점 (이미지 상단이 뷰포트 하단 30% 위치)
   - 05: 이미지 하단 15%(푸터 영역) 진입 전에 완료
         → 이미지 높이가 동적이므로 JS 런타임에 계산

   아래 setupProgressiveReveal 호출은 런타임에 정확한 값을 계산한 뒤 실행 */
(function initFeatureReveal() {
  const items = Array.from(document.querySelectorAll('.feature-list li'));
  const anchor = document.querySelector('.editorial-shot');
  if (!items.length || !anchor) return;

  function computeAndSetup() {
    const imgH = anchor.getBoundingClientRect().height || anchor.offsetHeight;
    const vh = window.innerHeight;

    /* 등장 속도: 원래보다 살짝 늦게 (1배 정도). */
    const startAt = 800;
    const endAt = -1300;    /* 범위 2100px ÷ 5 항목 = 항목당 ~420px 스크롤 */

    setupProgressiveReveal(items, anchor, startAt, endAt);
  }

  /* 이미지가 아직 로드 중이면 load 이벤트 후 단 한 번 실행.
     이미 로드됐으면 즉시 실행. 두 번 호출되어 리스너가 중복 등록되는 것을 방지. */
  const img = anchor.querySelector('img');
  if (img && !img.complete) {
    img.addEventListener('load', computeAndSetup, { once: true });
  } else {
    computeAndSetup();
  }
})();

/* Best Sellers Page — detail notes reveal */
setupProgressiveReveal(
  document.querySelectorAll('.ui-detail-row .detail-note'),
  document.querySelector('.ui-detail-row .detail-display'),
  300,
  -400
);
