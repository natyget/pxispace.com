/* PXI — About. Mission, vision and what we believe.
 * Hero: a field of scattered moments gathers into the PXI mark, then drifts
 * apart as you scroll. Everything else is calm, one gesture per section.
 * All copy is real HTML; motion only decorates it. Reduced motion shows end states.
 *
 * Ported from pxispace-redesign/site/about.js. Runs once per mount (see SiteShell):
 * PXR is the page's .pxr wrapper, L the lifecycle that undoes every global side effect.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Hugeicons (4.2, stroke-rounded) the shared vendor sets don't carry; same markup format as
// public/site/vendor/hugeicons*.js, looked up only on this page (window.HUGE stays untouched).
const EXTRA_ICONS = {
  StarIcon: '<path d="M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  BubbleChatIcon: '<path d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C10.3719 21.5 8.8394 21.0904 7.5 20.3687C5.63177 19.362 4.37462 20.2979 3.26592 20.4658C3.09774 20.4913 2.93024 20.4302 2.80997 20.31C2.62741 20.1274 2.59266 19.8451 2.6935 19.6074C3.12865 18.5818 3.5282 16.6382 2.98341 15C2.6698 14.057 2.5 13.0483 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.1257 12H12.0007M8.125 12H8M16.125 12H16M12.2507 12C12.2507 12.1381 12.1388 12.25 12.0007 12.25C11.8627 12.25 11.7507 12.1381 11.7507 12C11.7507 11.8619 11.8627 11.75 12.0007 11.75C12.1388 11.75 12.2507 11.8619 12.2507 12ZM8.25 12C8.25 12.1381 8.13807 12.25 8 12.25C7.86193 12.25 7.75 12.1381 7.75 12C7.75 11.8619 7.86193 11.75 8 11.75C8.13807 11.75 8.25 11.8619 8.25 12ZM16.25 12C16.25 12.1381 16.1381 12.25 16 12.25C15.8619 12.25 15.75 12.1381 15.75 12C15.75 11.8619 15.8619 11.75 16 11.75C16.1381 11.75 16.25 11.8619 16.25 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  Camera01Icon: '<path d="M12.6974 3.5H11.303C10.5884 3.5 10.2311 3.5 9.91067 3.612C9.71499 3.68039 9.53113 3.77879 9.36568 3.90367C9.09474 4.10816 8.89655 4.40544 8.50018 5L8.50017 5.00001C8.29717 5.30453 7.99794 5.75337 7.87867 5.87871C7.58314 6.18927 7.19563 6.39666 6.77329 6.47029C6.60284 6.5 6.41985 6.5 6.05387 6.5C5.07379 6.5 4.58376 6.5 4.18307 6.61342C3.18074 6.89716 2.39734 7.68055 2.1136 8.68289C2.00018 9.08357 2.00018 9.57361 2.00018 10.5537V14.5C2.00018 17.3284 2.00018 18.7426 2.87886 19.6213C3.75754 20.5 5.17176 20.5 8.00018 20.5H16.0002C18.8286 20.5 20.2428 20.5 21.1215 19.6213C22.0002 18.7426 22.0002 17.3284 22.0002 14.5V10.5537C22.0002 9.57361 22.0002 9.08357 21.8868 8.68289C21.603 7.68055 20.8196 6.89716 19.8173 6.61342C19.4166 6.5 18.9266 6.5 17.9465 6.5C17.5805 6.5 17.3975 6.5 17.2271 6.47029C16.8047 6.39666 16.4172 6.18927 16.1217 5.87871C16.0024 5.75336 15.7032 5.30451 15.5002 5C15.1038 4.40544 14.9056 4.10816 14.6347 3.90367C14.4692 3.77879 14.2854 3.68039 14.0897 3.612C13.7693 3.5 13.412 3.5 12.6974 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.0002 13C16.0002 15.2091 14.2093 17 12.0002 17C9.79104 17 8.00018 15.2091 8.00018 13C8.00018 10.7909 9.79104 9 12.0002 9C14.2093 9 16.0002 10.7909 16.0002 13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.1252 9.5H19.0002M19.2502 9.5C19.2502 9.63807 19.1383 9.75 19.0002 9.75C18.8621 9.75 18.7502 9.63807 18.7502 9.5C18.7502 9.36193 18.8621 9.25 19.0002 9.25C19.1383 9.25 19.2502 9.36193 19.2502 9.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};

export default async function initAbout(PXR, L) {
  const { setTimeout, requestAnimationFrame, IntersectionObserver, matchMedia } = L.scope;
  const $ = (s, r = PXR) => r.querySelector(s);
  const $$ = (s, r = PXR) => Array.from(r.querySelectorAll(s));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MOB = () => window.innerWidth <= 860;
  const glyph = (name) => EXTRA_ICONS[name] || (window.HUGE || {})[name] || '';
  const hi = (name, size = 18) => `<svg class="hg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none">${glyph(name)}</svg>`;
  $$('svg.huge[data-icon]').forEach((s) => { s.setAttribute('fill', 'none'); s.innerHTML = glyph(s.dataset.icon); });
  $$('[data-i]').forEach((el) => { el.innerHTML = hi(el.dataset.i, el.classList.contains('ci') ? 20 : el.classList.contains('fi') ? 22 : 16); });
  if (gsap) gsap.registerPlugin(ScrollTrigger);

  /* ═════════════ HERO — moments gather into the mark ═════════════ */
  async function initField() {
    const cv = $('.field'), hero = $('#hero');
    const ctx = cv.getContext('2d');
    const img = new Image(); img.src = '/site/img/pxi-mark-clean.svg?v=grit5';
    try { await img.decode(); } catch { return; }
    if (!L.alive) return;
    const COLORS = ['#f5f5f5', '#f5f5f5', '#f5f5f5', '#e9e9ee', '#D84AFF', '#e98bff', '#FF5A1F'];
    let W = 0, H = 0, pts = [], groups = [], t0 = performance.now(), running = true, disperse = 0, mx = -9999, my = -9999, laidOut = false;
    // Touch screens get a field that holds still once gathered: no idle drift, so nothing is drawn
    // unless the gather is playing or the scroll moves the scatter. That was every frame, forever.
    const STILL = !FINE;
    const GATHERED = 0.25 + 0.9 * 0.9 + 1.6 + 0.05;   // the last particle lands at this many seconds
    let settled = false, queued = false;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function layout() {
      // The gather plays once. A later layout (rotation, a real resize) re-targets the points
      // in place instead of scattering them and gathering again.
      const again = laidOut;
      laidOut = true;
      // phones: a lighter canvas (1.5x) and a coarser sample — the mark reads the same, the frames stay cheap
      const dpr = Math.min(STILL ? 1.5 : 2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const m = MOB();
      const size = Math.round(m ? Math.min(W * 0.7, 300) : Math.min(H * 0.64, W * 0.38, 560));
      const cx = m ? W / 2 : W * 0.73, cy = m ? H * 0.3 : H * 0.52;
      const oc = document.createElement('canvas'); oc.width = size; oc.height = size;
      const o = oc.getContext('2d'); o.drawImage(img, 0, 0, size, size);
      const data = o.getImageData(0, 0, size, size).data;
      const step = m ? 5 : 5, target = [];
      for (let y = 0; y < size; y += step) for (let x = 0; x < size; x += step) if (data[(y * size + x) * 4 + 3] > 120) target.push([cx - size / 2 + x + rnd(-1, 1), cy - size / 2 + y + rnd(-1, 1)]);
      const N = target.length, AMB = m ? 90 : 280;
      const keep = pts;
      pts = [];
      for (let i = 0; i < N + AMB; i++) {
        const p = keep[i] || { x: rnd(0, W), y: rnd(0, H), s: rnd(1.3, 2.6), c: COLORS[(Math.random() * COLORS.length) | 0], ph: rnd(0, 6.28), sp: rnd(0.4, 1.2), d: rnd(0, 0.9) };
        if (i < N) { p.tx = target[i][0]; p.ty = target[i][1]; p.amb = false; } else { p.tx = rnd(0, W); p.ty = rnd(0, H); p.amb = true; }
        if (again) { p.sx = p.tx; p.sy = p.ty; } else { p.sx = p.x; p.sy = p.y; }
        const dx = p.tx - cx, dy = p.ty - cy, L = Math.hypot(dx, dy) || 1;
        p.ux = dx / L; p.uy = dy / L; p.depth = p.depth || rnd(0.4, 1.4);
        pts.push(p);
      }
      // draw in batches: one fillStyle/globalAlpha per colour and layer instead of per particle
      const g = new Map();
      for (const p of pts) { const k = p.c + (p.amb ? 'a' : 'm'); if (!g.has(k)) g.set(k, { c: p.c, amb: p.amb, list: [] }); g.get(k).list.push(p); }
      groups = [...g.values()];
      if (!again) t0 = performance.now();
      if (REDUCED || (again && settled)) draw(99);
    }
    const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    function draw(tt) {
      ctx.clearRect(0, 0, W, H);
      const drift = !REDUCED && !(STILL && settled);
      const fade = 1 - disperse * 0.85;
      for (const grp of groups) {
        const a = (grp.amb ? 0.24 : 1) * fade;
        if (a <= 0.01) continue;
        ctx.globalAlpha = a; ctx.fillStyle = grp.c;
        for (const p of grp.list) {
          const f = p.amb ? 1 : ease((tt - 0.25 - p.d * 0.9) / 1.6);
          let x = p.sx + (p.tx - p.sx) * f, y = p.sy + (p.ty - p.sy) * f;
          if (drift) { x += Math.sin(tt * p.sp + p.ph) * (p.amb ? 6 : 0.9); y += Math.cos(tt * p.sp * 0.8 + p.ph) * (p.amb ? 5 : 0.9); }
          if (FINE && !p.amb) { const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy), reach = 280; if (d < reach) { const k = (1 - d / reach) * 96; x += (dx / (d || 1)) * k; y += (dy / (d || 1)) * k; } }
          if (disperse > 0) { const k = disperse * disperse * 420 * p.depth; x += p.ux * k + (p.amb ? 0 : p.ux * 20 * disperse); y += p.uy * k - disperse * 60 * p.depth; }
          ctx.fillRect(x, y, p.s, p.s);
        }
      }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      queued = false;
      if (!running) return;
      const tt = (now - t0) / 1000;
      if (STILL && tt > GATHERED) settled = true;
      draw(tt);
      if (!(STILL && settled)) { queued = true; requestAnimationFrame(frame); }
    }
    // one frame on demand (touch screens, once settled): only when the scroll moves the scatter
    const kick = () => { if (!queued && running) { queued = true; requestAnimationFrame(frame); } };
    layout();
    if (!REDUCED) {
      kick();
      new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) kick(); }).observe(hero);
      if (gsap) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4, onUpdate: (s) => { if (s.progress === disperse) return; disperse = s.progress; kick(); } });
      if (FINE) { hero.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }); hero.addEventListener('pointerleave', () => { mx = my = -9999; }); }
    }
    // Phones fire resize whenever the address bar slides in or out while scrolling; only a real
    // change of width (rotation, window resize) or a big height change re-lays the field out.
    let rz; L.on(window, 'resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (cv.clientWidth !== W || Math.abs(cv.clientHeight - H) > 160) layout(); }, 150);
    });
  }

  function initHeroCopy() {
    if (!gsap || REDUCED) return;
    gsap.from('.ab-hero .ln > span', { yPercent: 112, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.15 });
    gsap.from('.ab-hero .hero-lead', { y: 24, opacity: 0, duration: 1.1, ease: 'expo.out', delay: 0.35 });
    gsap.to('.ab-hero-copy', { y: -80, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.4 } });
  }

  /* ═════════════ MISSION — the sentence lights up ═════════════ */
  function initMission() {
    const st = $('.statement');
    const text = st.textContent.trim();
    const KEY1 = 'keep the revenue', KEY2 = 'keep the memory', LEAD = 'Our mission is to';
    const endColor = (w) => w.classList.contains('k0') ? '#8b8b93' : w.classList.contains('k1') || w.classList.contains('k2') ? '#FF5A1F' : '#F5F5F5';
    // wrap words; tag the two promises so they end in brand color
    let html = '';
    const words = text.split(/\s+/);
    const joined = text;
    const k1 = joined.indexOf(KEY1), k2 = joined.indexOf(KEY2);
    let pos = 0;
    for (const w of words) {
      const at = joined.indexOf(w, pos); pos = at + w.length;
      const cls = at < LEAD.length ? ' k0' : at >= k1 && at < k1 + KEY1.length ? ' k1' : at >= k2 && at < k2 + KEY2.length ? ' k2' : '';
      html += `<span class="w${cls}">${w}</span> `;
    }
    st.innerHTML = html.trim();
    const ws = $$('.w', st), head = $('.mission-h');
    if (!gsap || REDUCED) { ws.forEach((w) => { w.style.color = endColor(w); }); return; }
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#mission', start: MOB() ? 'top 20%' : 'top top', end: () => '+=' + window.innerHeight * (MOB() ? 0.9 : 1.1), pin: !MOB(), scrub: 0.5, invalidateOnRefresh: true } });
    // the heading lights up first, then the sentence word by word
    tl.fromTo(head, { opacity: 0.16, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
    ws.forEach((w, k) => tl.to(w, { color: endColor(w), duration: 0.4, ease: 'none' }, 0.35 + k * 0.12));
  }

  /* ═════════════ WHY — five apps collapse into one place ═════════════ */
  function initWhy() {
    const stage = $('.why-stage'), frags = $$('.frag', stage), one = $('.one', stage);
    if (!gsap || REDUCED) { frags.forEach((f) => { f.style.opacity = 0.18; }); one.style.opacity = 1; return; }
    const toCenter = (f) => { const s = stage.getBoundingClientRect(), r = f.getBoundingClientRect(); return { x: s.left + s.width / 2 - (r.left + r.width / 2), y: s.top + s.height / 2 - (r.top + r.height / 2) }; };
    gsap.from(['#why .why-copy > *'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#why', start: 'top 70%' } });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#why', start: MOB() ? 'top top' : 'top top', end: () => '+=' + window.innerHeight * (MOB() ? 1 : 1.2), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    tl.fromTo(frags, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }, 0)
      .to({}, { duration: 0.25 })
      .addLabel('merge');
    frags.forEach((f, i) => tl.to(f, { x: () => toCenter(f).x * 0.92, y: () => toCenter(f).y * 0.92, rotation: 0, scale: 0.55, opacity: 0, duration: 0.5, ease: 'power3.in' }, `merge+=${i * 0.04}`));
    tl.fromTo(one, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, 'merge+=0.45')
      .to({}, { duration: 0.35 });
  }

  /* ═════════════ VISION — the archive rings ═════════════ */
  function initVision() {
    const svg = $('.rings');
    const R = [60, 110, 160, 210, 262, 314, 366];
    svg.innerHTML = R.map((r, i) => {
      const dash = i % 3 === 0 ? '2 10' : i % 3 === 1 ? '40 18 4 18' : '120 30';
      const col = i === 3 ? 'rgba(216,74,255,.55)' : i === 5 ? 'rgba(255,90,31,.35)' : 'rgba(255,255,255,.08)';
      return `<circle cx="400" cy="400" r="${r}" stroke="${col}" stroke-width="${i === 3 ? 1.6 : 1.1}" stroke-dasharray="${dash}"/>`;
    }).join('');
    const cs = $$('circle', svg);
    if (!gsap || REDUCED) return;
    cs.forEach((c, i) => gsap.to(c, { rotation: (i % 2 ? -1 : 1) * 360, duration: 60 + i * 18, repeat: -1, ease: 'none' }));
    gsap.fromTo(cs, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.06, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#vision', start: 'top 70%' } });
    gsap.from(['#vision .display-xl', '#vision .lead'], { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '#vision', start: 'top 65%' } });
    gsap.to(svg, { scale: 1.15, ease: 'none', scrollTrigger: { trigger: '#vision', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  }

  /* ═════════════ BELIEFS, BUILD, PEOPLE, CONTACT ═════════════ */
  function initRest() {
    if (!gsap || REDUCED) return;
    gsap.from(['#note .note-in > *'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#note', start: 'top 75%' } });
    gsap.from(['#build .build-in > *'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#build', start: 'top 75%' } });
    gsap.from(['#help .help-in > *'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#help', start: 'top 75%' } });
    gsap.from(['#help .ccard'], { y: 36, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#help .cards', start: 'top 88%' } });
    gsap.from(['#help .signoff'], { y: 24, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#help .signoff', start: 'top 95%' } });
  }

  /* ═════════════ THE ASK: "Share PXI" ═════════════ */
  function initShare() {
    const btn = $('[data-share]');
    if (!btn) return;
    const label = $('.ccta-label', btn), status = $('[data-share-status]');
    const DATA = { title: 'PXI', text: 'The app I use for nights out: tickets, one shared camera roll, a scrapbook the next morning.', url: 'https://pxispace.com' };
    const IDLE = label.textContent;
    let timer;
    const copy = async () => {
      try { await navigator.clipboard.writeText(DATA.url); return true; } catch { /* no clipboard permission or insecure context: try the old way */ }
      const ta = document.createElement('textarea');
      ta.value = DATA.url; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* nothing else to try */ }
      ta.remove();
      return ok;
    };
    L.on(btn, 'click', async () => {
      if (navigator.share) {
        try { await navigator.share(DATA); return; } catch (err) { if (err && err.name === 'AbortError') return; /* share sheet failed: fall back to copying the link */ }
      }
      const ok = await copy();
      if (!ok || !L.alive) return;
      label.textContent = 'Link copied';
      if (status) status.textContent = 'Link copied';
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = IDLE; if (status) status.textContent = ''; }, 2000);
    });
  }

  initHeroCopy();
  initMission();
  initWhy();
  initVision();
  initRest();
  initShare();
  await initField();
  if (!L.alive) return;
  if (gsap) {
    let rz; L.on(window, 'resize', () => { clearTimeout(rz); rz = setTimeout(() => ScrollTrigger.refresh(), 150); });
    await document.fonts.ready; if (L.alive) ScrollTrigger.refresh();
  }
}
