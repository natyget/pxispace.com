// path: js/main.js

/* =========================
   PXI — site JS (neon/black)
   ========================= */

// helper: safe query
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* ---- Header: mobile menu (dropdown) ---- */
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
    document.body.classList.add('no-scroll'); // harmless for dropdown; prevents body scroll behind
    toggle.setAttribute('aria-expanded','true');
  };

  toggle.addEventListener('click', () => {
    panel.classList.contains('on') ? close() : open();
  });

  // Close when clicking any link in the panel
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('on')) return;
    const within = e.target.closest('#site-nav') || e.target.closest('.nav-toggle');
    if (!within) close();
  });

  // ESC to close
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
(() => {
  $$('#year, #year2').forEach(el => el.textContent = new Date().getFullYear());
})();

/* ---- Intro overlay timing (logo.mp4) ---- */
(() => {
  const intro  = $('#intro');
  const video  = $('#introVideo');
  const poster = $('#introPoster');
  if (!intro || !video) return;

  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    intro.classList.add('hide');
    setTimeout(() => intro.remove(), 600);
  };

  // Ensure autoplay attributes
  video.muted = true;
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');

  // When video data is ready
  video.addEventListener('loadeddata', () => {
    if (poster) poster.classList.add('hide');
    setTimeout(hide, 1600);
  });

  video.addEventListener('error', () => setTimeout(hide, 1000));

  // absolute cap so it never blocks visual content
  setTimeout(hide, 2600);
})();

/* ---- Feature / hero videos: play when visible, pause when hidden ---- */
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
        if (isIntersecting) {
          v.play().catch(() => {});
        } else {
          if (v.id !== 'introVideo') v.pause();
        }
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

/* ---- Album join deep-link (with graceful fallback) ---- */
(() => {
  const m = location.pathname.match(/\/album\/([^/]+)\/join\/?$/);
  if (!m) return;

  const albumId = decodeURIComponent(m[1]);
  const scheme  = `pxi://album/${albumId}/join`;

  // Update UI bits on join page if present
  const idChip = $('#album-id');
  if (idChip) idChip.textContent = albumId;

  const openBtn = $('#open-app');
  if (openBtn) {
    openBtn.href = scheme;
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      tryOpen();
    });
  }

  // Fallback logic:
  // If the page doesn't get hidden shortly after attempting deep-link,
  // show a friendly message (buttons already visible in join.html)
  let opened = false;
  let timer  = null;

  function markOpened() {
    if (opened) return;
    opened = true;
    if (timer) { clearTimeout(timer); timer = null; }
    // Optional: update subcopy when we think we switched to the app
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

  function tryOpen() {
    timer = setTimeout(showFallback, 1400);
    window.location.href = scheme;
  }

  // Auto attempt after a short delay
  setTimeout(tryOpen, 220);
})();

/* ---- PXI App Screens Carousel (Embla) ---- */
(() => {
  const viewport = document.querySelector('#appCarousel .embla__viewport');
  if (!viewport || typeof window.EmblaCarousel === 'undefined') return;

  // Autoplay plugin (pause on hover desktop, continue after swipe)
  const autoplay = EmblaCarouselAutoplay({
    delay: 2400,
    stopOnInteraction: false,
    stopOnMouseEnter: true
  });

  const embla = EmblaCarousel(viewport, {
    loop: true,
    align: 'center',
    dragFree: false,
    duration: 18
  }, [autoplay]);

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