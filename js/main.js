// path: js/main.js

/* =========================
   PXI — site JS (neon/black)
   ========================= */

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* ---- Header: mobile menu ---- */
(() => {
  const toggle = $('.nav-toggle');
  const panel  = $('#site-nav');
  if (!toggle || !panel) return;

  const close = () => {
    panel.classList.remove('on');
    document.body.classList.remove('no-scroll');
    toggle.setAttribute('aria-expanded','false');
  };
  const open = () => {
    panel.classList.add('on');
    document.body.classList.add('no-scroll');
    toggle.setAttribute('aria-expanded','true');
  };

  toggle.addEventListener('click', () => {
    panel.classList.contains('on') ? close() : open();
  });

  panel.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });

  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('on')) return;
    const within = e.target.closest('#site-nav') || e.target.closest('.nav-toggle');
    if (!within) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('on')) close();
  });
})();

/* ---- Cookie banner ---- */
(() => {
  const bar = $('#cookie');
  const btn = $('#cookieBtn');
  if (!bar || !btn) return;
  if (!localStorage.getItem('pxi_cookie_ok')) bar.classList.add('show');
  btn.addEventListener('click', () => {
    localStorage.setItem('pxi_cookie_ok', '1');
    bar.classList.remove('show');
  });
})();

/* ---- Footer year ---- */
(() => { $$('#year, #year2').forEach(el => el.textContent = new Date().getFullYear()); })();

/* ---- Intro overlay timing (logo.mp4) ---- */
(() => {
  const intro  = $('#intro');
  const video  = $('#introVideo');
  const poster = $('#introPoster');
  if (!intro || !video) return;

  let done = false;
  const hide = () => {
    if (done) return; done = true;
    intro.classList.add('hide');
    setTimeout(() => intro.remove(), 600);
  };

  video.muted = true;
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');

  video.addEventListener('loadeddata', () => {
    if (poster) poster.classList.add('hide');
    setTimeout(hide, 1600);
  });
  video.addEventListener('error', () => setTimeout(hide, 1000));
  setTimeout(hide, 2600);
})();

/* ---- Feature / hero videos visibility ---- */
(() => {
  const vids = $$('video[autoplay], .video-card .video, #introVideo');
  vids.forEach(v => {
    v.muted = true;
    v.setAttribute('playsinline','');
    v.setAttribute('webkit-playsinline','');
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({isIntersecting, target}) => {
        const v = target;
        if (isIntersecting) v.play().catch(()=>{});
        else if (v.id !== 'introVideo') v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(v => io.observe(v));
  } else {
    vids.forEach(v => v.play?.().catch(()=>{}));
  }
})();

/* ---- Analytics click helper (GA4) ---- */
(() => {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-evt]');
    if (!el || typeof window.gtag !== 'function') return;
    window.gtag('event', 'select_content', {
      content_type: 'click',
      item_id: el.getAttribute('data-evt')
    });
  });
})();

/* ---- Signup UTM/ref capture ---- */
(() => {
  const qs = new URLSearchParams(location.search);
  ['utm_source','utm_medium','utm_campaign','ref'].forEach((k) => {
    const v = qs.get(k);
    if (v) localStorage.setItem('pxi_'+k, v);
    const el = $('#'+k);
    if (el && !el.value) el.value = v || localStorage.getItem('pxi_'+k) || '';
  });
})();

/* ---- Album join deep-link (graceful fallback) ---- */
(() => {
  const m = location.pathname.match(/\/album\/([^/]+)\/join\/?$/);
  if (!m) return;

  const albumId = decodeURIComponent(m[1]);
  const scheme  = `pxi://album/${albumId}/join`;

  const idChip = $('#album-id'); if (idChip) idChip.textContent = albumId;

  const openBtn = $('#open-app');
  if (openBtn) {
    openBtn.href = scheme;
    openBtn.addEventListener('click', (e) => { e.preventDefault(); tryOpen(); });
  }

  let opened = false;
  let timer  = null;

  function markOpened() {
    if (opened) return; opened = true;
    if (timer) { clearTimeout(timer); timer = null; }
    const sub = $('#join-sub');
    if (sub) sub.textContent = 'Switching to PXI Studio…';
  }
  function showFallback() {
    if (opened) return;
    const sub = $('#join-sub');
    if (sub) sub.textContent = 'Couldn’t open automatically. Tap “Open app”, or install via TestFlight below.';
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') markOpened();
  }, { passive: true });
  window.addEventListener('pagehide', markOpened, { passive: true });
  window.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.visibilityState === 'hidden') markOpened();
    }, 300);
  }, { passive: true });

  function tryOpen() { timer = setTimeout(showFallback, 1400); window.location.href = scheme; }
  setTimeout(tryOpen, 220);
})();

/* ---- Legacy carousel (#appCarousel) ---- */
(() => {
  const viewport = document.querySelector('#appCarousel .embla__viewport');
  if (!viewport || typeof window.EmblaCarousel === 'undefined') return;

  const autoplay = EmblaCarouselAutoplay({ delay: 2400, stopOnInteraction: false, stopOnMouseEnter: true });
  const embla = EmblaCarousel(viewport, { loop: true, align: 'center', dragFree: false, duration: 18 }, [autoplay]);

  const dots = Array.from(document.querySelectorAll('#appCarousel .embla__dot'));
  const setActive = () => {
    const i = embla.selectedScrollSnap();
    dots.forEach((d, idx) => d.classList.toggle('is-selected', idx === i));
  };
  dots.forEach((d, idx) => d.addEventListener('click', () => embla.scrollTo(idx)));
  embla.on('select', setActive);
  embla.on('reInit', setActive);
  setActive();
})();

/* =========================================================================
   Features carousel (#appShowcase): cross-fade copy; NO device width lock +
   Mobile DOM re-order so header comes before phone
   ========================================================================= */
(() => {
  const root = document.getElementById('appShowcase');
  const viewport = root?.querySelector('.embla__viewport');
  if (!viewport || typeof window.EmblaCarousel === 'undefined') return;

  /* --- 0) Mobile header ordering (header → device → copy) --- */
  const wrap        = root.querySelector('.feature-wrap');
  const deviceCol   = root.querySelector('.device-col');
  const featureCopy = root.querySelector('.feature-copy');
  const featureHead = root.querySelector('.feature-head');

  // Remember original location so we can restore on desktop
  const originalParent = featureHead?.parentElement || null;
  const originalNext   = featureHead?.nextSibling || null;

  const MOBILE_BP = 960; // must match CSS breakpoint

  function placeMobile() {
    if (!wrap || !featureHead || !deviceCol) return;
    // If header is still inside .feature-copy, move it out to the grid, before the device
    if (featureHead.parentElement !== wrap) {
      wrap.insertBefore(featureHead, deviceCol);
    } else {
      // Ensure order is: [featureHead, deviceCol, featureCopy]
      if (wrap.children[0] !== featureHead) wrap.insertBefore(featureHead, wrap.firstChild);
      if (wrap.children[1] !== deviceCol)   wrap.insertBefore(deviceCol, wrap.children[1] || null);
      if (wrap.children[2] !== featureCopy) wrap.insertBefore(featureCopy, wrap.children[2] || null);
    }
  }

  function placeDesktop() {
    if (!featureHead || !originalParent) return;
    if (featureHead.parentElement !== originalParent) {
      originalParent.insertBefore(featureHead, originalNext);
    } else if (originalNext && featureHead.nextSibling !== originalNext) {
      originalParent.insertBefore(featureHead, originalNext);
    }
  }

  const onResizeReorder = () => {
    if (window.innerWidth <= MOBILE_BP) placeMobile();
    else placeDesktop();
  };

  // Initial call + resize (debounced)
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t); t = setTimeout(onResizeReorder, 120);
  });
  onResizeReorder();

  /* --- 1) Carousel with fixed copy derived from product narrative --- */
  const SLIDES = [
    {
      title: 'Feed',
      desc:  'Share the moment as it happens. Your event’s live feed pulls in everyone’s angles—no chasing photos later.'
    },
    {
      title: 'Camera',
      desc:  'Shoot with film-inspired looks tuned for print. Great filters, live to the shared album while you capture.'
    },
    {
      title: 'Library',
      desc:  'Organize events and keep the dear moments in your archives—easy browsing, everything where it belongs.'
    },
    {
      title: 'Passport',
      desc:  'Your event passport—see where you’ve been, earn stamps, and level up a gamified event experience.'
    }
  ];

  const autoplay = EmblaCarouselAutoplay({ delay: 2400, stopOnInteraction: false, stopOnMouseEnter: true });
  const embla = EmblaCarousel(viewport, { loop: true, align: 'center', dragFree: false, duration: 18 }, [autoplay]);

  const dots = Array.from(root.querySelectorAll('.embla__dot'));
  dots.forEach((d, i) => d.addEventListener('click', () => embla.scrollTo(i)));

  // Cross-fade layers
  const tA = root.querySelector('#appTitleA');
  const tB = root.querySelector('#appTitleB');
  const dA = root.querySelector('#appDescA');
  const dB = root.querySelector('#appDescB');
  const idx = root.querySelector('#appIndex');

  let toggle = false;
  const write = (el, text) => { if (el) el.textContent = text || ''; };
  const showPair = (showA) => {
    (showA ? tA : tB)?.classList.add('layer--show');
    (showA ? tB : tA)?.classList.remove('layer--show');
    (showA ? dA : dB)?.classList.add('layer--show');
    (showA ? dB : dA)?.classList.remove('layer--show');
  };

  function setActive() {
    const i = embla.selectedScrollSnap();
    dots.forEach((d, k) => d.classList.toggle('is-selected', k === i));

    // Prefer fixed SLIDES text; fall back to image data if array missing
    const slideText = SLIDES[i] || {};
    let title = slideText.title;
    let desc  = slideText.desc;

    if (!title || !desc) {
      const slide = embla.slideNodes()[i]?.querySelector('img');
      title = title || slide?.dataset.title || slide?.alt || 'PXIStudio';
      desc  = desc  || slide?.dataset.desc  || '';
    }

    if (toggle){ write(tB, title); write(dB, desc); }
    else        { write(tA, title); write(dA, desc); }

    showPair(!toggle);
    toggle = !toggle;

    if (idx) idx.textContent = `${i+1} / ${embla.slideNodes().length}`;
  }

  // Stable caption height based on our fixed copy (no layout shift)
  (function setStableHeights(){
    const titles = SLIDES.map(s => s.title || '');
    const descs  = SLIDES.map(s => s.desc  || '');
    const longestTitle = titles.reduce((a,b)=> a.length>b.length?a:b, '');
    const longestDesc  = descs.reduce((a,b)=> a.length>b.length?a:b, '');

    const meas = document.createElement('div');
    meas.style.position='absolute';
    meas.style.visibility='hidden';
    meas.style.pointerEvents='none';
    meas.style.width = getComputedStyle(dA || dB || root).width;
    meas.className = 'copy';
    document.body.appendChild(meas);

    meas.textContent = longestTitle; const titleH = meas.getBoundingClientRect().height;
    meas.textContent = longestDesc;  const descH  = meas.getBoundingClientRect().height;
    document.body.removeChild(meas);

    const cap = root.querySelector('.app-caption');
    if (cap){ cap.style.minHeight = `${titleH + descH + 20}px`; }
  })();

  embla.on('select', setActive);
  embla.on('reInit', setActive);
  setActive();
})();
