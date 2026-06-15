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
  /* brand concept */
  '.essay-block',
  '.pillars-block',
  '.pillars-list li',
  /* research */
  '.research-copy',
  '.audit-table',
  '.key-insight-block',
  /* visual */
  '.system-block',
  '.swatch',
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
  /* footer — .closing-footer h2는 GSAP Effect4가 opacity를 직접 제어하므로
     IntersectionObserver FADE 대상에서 제외. .closing-copy만 fade 처리 */
  '.closing-copy',
];

/* Elements that should fade only (no translate — overflow: clip) */
const FADE_ONLY = new Set(['.record-visual', '.ui-image--main', '.ui-image--poster', '.ui-image--detail', '.ui-image--about']);

/* prefers-reduced-motion: 모든 JS 애니메이션을 건너뜀 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Mark every matching element as hidden initially */
const allEls = [];
FADE_SELECTORS.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    if (prefersReducedMotion) {
      /* 모션 감소 환경: 클래스 없이 즉시 표시 */
      return;
    }
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
  if (prefersReducedMotion) {
    heroEls.forEach(el => el.classList.add('is-visible'));
    return;
  }
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
  { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
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

  /* prefers-reduced-motion: 전체 항목을 즉시 표시하고 리스너 등록 생략 */
  if (prefersReducedMotion) {
    items.forEach(item => item.classList.add('is-revealed'));
    return;
  }

  let rafId = null;

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
    rafId = null;
  };

  const onScroll = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ─── feature-list top sync ──────────────────────────────────────────────────
   목표: .feature-list의 padding-top을 .editorial-shot의 그리드 내 오프셋과
   동기화해서 feature-list 첫 항목이 이미지 상단과 정확히 맞닿도록 함.

   계산식:
     imageOffsetInRow = shot.getBoundingClientRect().top - row.getBoundingClientRect().top
     → 그리드 행 내에서 이미지가 얼마나 아래에 있는지 (copy 블록 높이 + row-gap)
*/
function syncFeatureListTop() {
  /* 첫 항목이 이미지 상단 옆에 시작하도록 padding-top만 설정.
     gap은 CSS의 고정 값(350px) 사용. */
  const featureList = document.querySelector('.feature-list');
  const shot = document.querySelector('.editorial-shot');
  const row = document.querySelector('.editorial-row');
  if (!featureList || !shot || !row) return;

  /* sticky 목록은 CSS의 top 값으로 위치를 잡으므로, 예전처럼 이미지 상단에 맞추는
     큰 paddingTop을 넣지 않는다. 목록 전체 높이를 뷰포트 안에 유지해야 sticky가
     '따라오는' 효과를 내기 때문에 paddingTop은 0으로 통제한다. */
  featureList.style.paddingTop = '0px';
  featureList.style.minHeight = '';
  featureList.style.top = '';
  featureList.style.marginTop = '';
  featureList.style.paddingBottom = '';

  /* 이 함수가 문서 높이를 바꾸므로, ScrollTrigger가 잡고 있는 trigger 위치를
     반드시 다시 계산해야 한다. 그렇지 않으면 GSAP의 load/resize 자동 refresh가
     이 padding 변경 '이전'에 실행돼, 아래쪽 클로징 ONVINYL pin이 어긋난
     위치(메인 카탈로그 구간)에서 조기 발동한다. */
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

/* 디바운스 유틸 — resize 이벤트 과다 호출 방지 */
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

const syncFeatureListTopDebounced = debounce(syncFeatureListTop, 80);

/* 초기 실행 + 리사이즈 대응 */
syncFeatureListTop();
window.addEventListener('resize', syncFeatureListTopDebounced);
/* 폰트·이미지 로드 후 레이아웃이 확정되면 재계산 */
window.addEventListener('load', syncFeatureListTop);

/* ─── Artist Feature Page — feature list reveal ──────────────────────────────
   실측 기준 (뷰포트 900px, 이미지 1920px):
   - 01: rectTop ≈ 300 → 이미지 상단이 뷰포트에 진입, CORTIS 타이틀이 막 보이기 시작
   - 05: rectTop ≈ -900 → 이미지 47% 스크롤, FIVE VOICES 섹션 상단 도달 직전
   - 항목 간격: (300-(-900)) / 4 = 300px 스크롤마다 1개씩 누적 등장

   아래 setupProgressiveReveal 호출은 런타임에 정확한 값을 계산한 뒤 실행 */
(function initFeatureReveal() {
  const items = Array.from(document.querySelectorAll('.feature-list li'));
  const anchor = document.querySelector('.editorial-shot');
  if (!items.length || !anchor) return;

  function computeAndSetup() {
    /* 등장 속도는 수정 전과 동일하게 유지(항목당 ~300px 스크롤 간격).
       이미지가 충분히 높아 이 범위 내내 목록이 sticky로 고정되어 따라온다.
       - 01: 이미지 상단이 뷰포트에 진입하는 순간
       - 05: 이미지 47% 스크롤 지점 */
    const startAt = 300;
    const endAt = -1300;

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

/* ═══════════════════════════════════════════════════════════════════════════
   GSAP EFFECTS — 5개 순위별 구현
   모두 prefersReducedMotion 가드 적용
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Effect 1: 히어로 LP 3D 마우스 틸트 ──────────────────────────────────
   2D 패럴랙스(x/y 이동) 대신 3D 틸트(rotateX/rotateY).
   마우스 위치에 따라 LP가 X/Y 축으로 기울어짐 — 실물 LP를 손에 든 느낌.
   조건: hover 가능 환경 + prefers-reduced-motion 미설정
   ─────────────────────────────────────────────────────────────────────── */
(function initRecordTilt() {
  if (prefersReducedMotion) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  const heroVisual = document.querySelector('.hero-visual');
  if (!heroVisual) return;

  const TILT_RANGE = 12; /* ±12도 */

  const rotX = gsap.quickTo(heroVisual, 'rotateX', { duration: 0.7, ease: 'power2.out' });
  const rotY = gsap.quickTo(heroVisual, 'rotateY', { duration: 0.7, ease: 'power2.out' });

  function onMouseMove(e) {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    rotY(nx * TILT_RANGE);
    rotX(-ny * TILT_RANGE);
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }, 600);
  });
})();

/* ─── Effect 2: 무드보드 그리드 Stagger Reveal ────────────────────────────
   충돌 방지: .moodboard-shot은 FADE_SELECTORS에 없으므로 충돌 없음
              GSAP ScrollTrigger + stagger로 독립 처리
   ─────────────────────────────────────────────────────────────────────── */
(function initMoodboardReveal() {
  if (prefersReducedMotion) return;

  const shots = document.querySelectorAll('.moodboard-shot');
  if (!shots.length) return;

  /* 초기 상태 설정 */
  gsap.set(shots, { opacity: 0, scale: 0.96 });

  gsap.to(shots, {
    opacity: 1,
    scale: 1,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.12,
    scrollTrigger: {
      trigger: '.moodboard-grid',
      start: 'top 82%',
      once: true,         /* 한 번만 재생 */
    },
  });
})();

/* ─── Effect 3: 섹션 타이틀 SplitText 글자별 등장 ────────────────────────
   구현: 순수 JS로 h2 텍스트를 <span class="char">로 분해
   충돌 방지: FADE_SELECTORS에서 '.section-title-line' 처리 중이지만
              h2 자체가 아닌 .section-title-line 컨테이너에만 fade가 적용됨
              → h2는 is-visible 클래스 대상 아님 → 충돌 없음
              단, BRAND CONCEPT h2가 hero load 타이밍 근처에 있으므로
              ScrollTrigger start 조정으로 첫 진입 커버
   CSS: .section-title-line h2 { overflow: hidden } — styles.css에 추가됨
   ─────────────────────────────────────────────────────────────────────── */
(function initTitleSplit() {
  if (prefersReducedMotion) return;

  const titleLines = document.querySelectorAll('.section-title-line h2');
  if (!titleLines.length) return;

  titleLines.forEach(h2 => {
    const text = h2.textContent;
    /* 텍스트를 char 단위 span으로 분해 (공백 포함) */
    h2.innerHTML = Array.from(text).map(ch => {
      if (ch === ' ') return '<span class="char char--space" aria-hidden="true"> </span>';
      return `<span class="char" aria-hidden="true">${ch}</span>`;
    }).join('');
    /* 접근성: aria-label로 원본 텍스트 보존 */
    h2.setAttribute('aria-label', text);

    const chars = h2.querySelectorAll('.char');

    /* 초기 상태 */
    gsap.set(chars, { y: '110%', opacity: 0 });

    /* ScrollTrigger 진입 시 stagger 슬라이드업 */
    gsap.to(chars, {
      y: '0%',
      opacity: 1,
      duration: 0.55,
      ease: 'power3.out',
      stagger: 0.025,
      scrollTrigger: {
        trigger: h2,
        start: 'top 90%', /* BRAND CONCEPT도 페이지 진입 시 바로 보이도록 */
        once: true,
      },
    });
  });
})();

/* ─── Effect 4: Closing "ONVINYL" 워드마크 pin + scale ──────────────────
   구현: ScrollTrigger pin:true + scale 1→1.08 + fadeOut
   충돌 방지: .closing-footer h2는 FADE_SELECTORS에 있어 will-animate 클래스
              부여됨 → GSAP 실행 전 is-visible이 붙어 opacity:1, translateY:0
              상태이므로 GSAP이 이 위에 덮어쓰는 방식으로 충돌 없음
              단, is-visible transition과 겹치지 않도록 ScrollTrigger를
              IntersectionObserver보다 늦게 실행되는 '최하단' 위치로 설정
   ─────────────────────────────────────────────────────────────────────── */
(function initClosingWordmarkPin() {
  if (prefersReducedMotion) return;

  const wordmark = document.querySelector('.closing-footer h2');
  const footer   = document.querySelector('.closing-footer');
  if (!wordmark || !footer) return;

  /* closing-footer h2는 FADE_SELECTORS에서 제외됐으므로 will-animate 클래스 없음.
     GSAP이 opacity를 단독 제어. 초기 상태(opacity:1)에서 시작해 scrub.
     pin은 .closing-footer를 trigger로, 워드마크 엘리먼트를 pin 대상으로 함.
     end '+=300' — 짧은 스크럽 범위로 과도한 fade-out 속도 방지. */

  /* 초기 상태 */
  gsap.set(wordmark, { opacity: 1, scale: 1, y: 0, color: '#f4f1ea' });

  /* ★ 핵심 버그 수정 ★
     pin은 position:fixed를 사용한다. 대용량 이미지가 로드되기 전(문서 높이가
     짧을 때) ScrollTrigger를 만들면 trigger(footer)의 start 위치가 페이지
     상단 쪽으로 잘못(stale) 계산된다. 그 상태에서 스크롤하면 메인 페이지
     구간에서 pin이 발동해 워드마크가 화면 왼쪽에 고정되어 '새어나온다'.
     → 레이아웃(이미지·폰트 포함)이 확정되는 load 이후에만 생성해
        stale-active 구간 자체를 원천 차단한다. */
  function buildClosingTriggers() {
    /* Pin + scale: 확장(슬라이드) 구간을 넓혀 더 천천히 1 → 1.55 */
    const scaleTl = gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: 'top 55%',
        end: '+=280',
        pin: wordmark,
        pinSpacing: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    scaleTl.to(wordmark, {
      scale: 1.55,
      duration: 1,
      ease: 'power1.inOut',
    });

    /* 색상 전환: cream → red 를 더 넓은 스크롤 구간에 걸쳐 천천히.
       - start 'top 78%' — 더 일찍부터 서서히 시작
       - end 'top 32%' — 페이지 최대 스크롤 안에서 풀 레드 도달(완료 보장) */
    gsap.to(wordmark, {
      color: '#d11f26',
      ease: 'none',
      scrollTrigger: {
        trigger: footer,
        start: 'top 78%',
        end: 'top 32%',
        scrub: 1,
        invalidateOnRefresh: true,
      },
      immediateRender: false,
    });
  }

  if (document.readyState === 'complete') {
    buildClosingTriggers();
  } else {
    window.addEventListener('load', buildClosingTriggers, { once: true });
  }
})();

/* ─── Effect 7: Closing copy-sub typewriter ───────────────────────────────
   .closing-copy-sub 텍스트를 한 글자씩 타이핑 효과
   ScrollTrigger onEnter에서 1회 발동, 마무리 무게감 강화 */
(function initClosingCopyTypewriter() {
  if (prefersReducedMotion) return;

  const sub = document.querySelector('.closing-copy-sub');
  if (!sub) return;

  const originalText = sub.textContent.trim();
  let isPlayed = false;
  let isTyping = false;

  function startTyping() {
    if (isTyping || isPlayed) return;
    isTyping = true;
    isPlayed = true;

    sub.textContent = '';
    sub.style.minHeight = sub.getBoundingClientRect().height + 'px';

    const CHAR_DELAY = 35; /* ms/char — 한국어라 약간 천천히 */
    Array.from(originalText).forEach((ch, i) => {
      setTimeout(() => {
        sub.textContent += ch;
      }, i * CHAR_DELAY);
    });

    setTimeout(() => {
      isTyping = false;
    }, originalText.length * CHAR_DELAY + 100);
  }

  ScrollTrigger.create({
    trigger: sub,
    start: 'top 85%',
    onEnter: startTyping,
  });
})();

/* ─── Effect 5: Publishing 코드 블록 타이핑 효과 ─────────────────────────
   구현: 순수 JS 타이머 기반 타이핑
         ScrollTrigger onEnter에서 1회 발동
         한 번 시작되면 끝까지 진행 (isTyping 플래그로 보호)
   대상: .code-window-body 전체의 텍스트 노드를 순서대로 타이핑
         <span> 같은 컬러링 태그는 구조 유지하며 텍스트만 타이핑
   ─────────────────────────────────────────────────────────────────────── */
(function initCodeTypewriter() {
  if (prefersReducedMotion) return;

  const codeBody = document.querySelector('.code-window-body');
  if (!codeBody) return;

  /* ── 1. 코드 블록 원본 HTML 저장 & 초기화 ── */
  const originalHTML = codeBody.innerHTML;

  /* 타이핑 대상 구성: {node, text} 플랫 리스트
     DOM 트리 순회 — 텍스트 노드 추출 */
  function collectTextNodes(root) {
    const result = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.length > 0) {
        result.push(node);
      }
    }
    return result;
  }

  /* 초기 상태: 모든 텍스트 숨김 */
  function hideAll() {
    codeBody.innerHTML = originalHTML;
    const nodes = collectTextNodes(codeBody);
    nodes.forEach(n => { n._original = n.textContent; n.textContent = ''; });
    return nodes;
  }

  let isTyping = false;
  let isPlayed = false; /* 한 번만 재생 */

  /* 커서 엘리먼트 */
  const cursor = document.createElement('span');
  cursor.className = 'code-cursor';

  function startTyping() {
    if (isTyping || isPlayed) return;
    isTyping = true;
    isPlayed = true;

    const nodes = hideAll();
    /* 마지막 텍스트 노드 뒤에 커서 추가 */
    const lastNode = nodes[nodes.length - 1];
    if (lastNode && lastNode.parentNode) {
      lastNode.parentNode.insertBefore(cursor, lastNode.nextSibling);
    }

    /* 전체 문자를 플랫하게 이어 붙인 스케줄 생성 */
    const CHAR_DELAY = 12; /* ms/char */
    let totalDelay = 0;

    nodes.forEach(node => {
      const chars = Array.from(node._original);
      chars.forEach(ch => {
        const delay = totalDelay;
        setTimeout(() => {
          node.textContent += ch;
        }, delay);
        totalDelay += CHAR_DELAY;
      });
      /* 텍스트 노드 사이 약간의 딜레이 (줄 바꿈 느낌) */
      totalDelay += 40;
    });

    /* 타이핑 완료 후 커서 숨김 */
    setTimeout(() => {
      cursor.classList.add('is-done');
      isTyping = false;
    }, totalDelay + 100);
  }

  /* ScrollTrigger: 코드 블록 진입 시 1회 발동 */
  ScrollTrigger.create({
    trigger: '.publishing-code',
    start: 'top 75%',
    onEnter: startTyping,
  });
})();

/* ─── Effect 8: 모바일 목업 '흐르듯 펼쳐져 떨어지기' ───────────────────────
   스크롤에 묶지 않고(=scrub X), 뷰포트에 들어오면 1회 자동 재생.
   clip-path inset(bottom) 100%→0% 를 시간 기반(ease)으로 풀어, 위 → 아래로
   흐르듯 펼쳐져 떨어지는 느낌. */
(function initMobileUnfold() {
  if (prefersReducedMotion) return;

  const img = document.querySelector('.ui-image--mobile');
  if (!img) return;

  function build() {
    gsap.fromTo(img,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: img,
          start: 'top 80%',
          once: true,
        },
      }
    );
  }

  if (document.readyState === 'complete') build();
  else window.addEventListener('load', build, { once: true });
})();

/* ─── ScrollTrigger 위치 재보정 (asset/font 지연 로드 대응) ────────────────
   대용량 이미지·웹폰트가 load 이후까지 레이아웃을 바꾸면 GSAP의 자동 refresh
   타이밍과 어긋나 trigger 위치가 stale 해진다(클로징 ONVINYL pin 조기 발동 등).
   레이아웃이 실제로 확정되는 시점마다 명시적으로 refresh 해 위치를 재계산한다.
   ─────────────────────────────────────────────────────────────────────── */
(function refreshScrollTriggerWhenSettled() {
  if (prefersReducedMotion) return;
  if (typeof ScrollTrigger === 'undefined') return;

  const refresh = () => ScrollTrigger.refresh();

  /* load 시점: 동기 load 핸들러(syncFeatureListTop 등)가 모두 끝난 뒤
     한 프레임 늦춰 최종 레이아웃 기준으로 재계산 */
  window.addEventListener('load', () => requestAnimationFrame(refresh));

  /* 캐시 미스로 늦게 도착하는 이미지가 남아 있으면 마지막 1장까지 반영 */
  const pendingImgs = Array.from(document.images).filter(img => !img.complete);
  let remaining = pendingImgs.length;
  pendingImgs.forEach(img => {
    const done = () => { if (--remaining === 0) refresh(); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* 웹폰트 스왑으로 텍스트 높이가 바뀌는 경우까지 반영 */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh);
  }
})();
