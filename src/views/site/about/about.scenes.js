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

export default async function initAbout(PXR, L) {
  const { setTimeout, requestAnimationFrame, IntersectionObserver, matchMedia } = L.scope;
  const $ = (s, r = PXR) => r.querySelector(s);
  const $$ = (s, r = PXR) => Array.from(r.querySelectorAll(s));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MOB = () => window.innerWidth <= 860;
  const hi = (name, size = 18) => `<svg class="hg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none">${(window.HUGE || {})[name] || ''}</svg>`;
  $$('svg.huge[data-icon]').forEach((s) => { s.setAttribute('fill', 'none'); s.innerHTML = (window.HUGE || {})[s.dataset.icon] || ''; });
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
    let W = 0, H = 0, pts = [], t0 = performance.now(), running = true, disperse = 0, mx = -9999, my = -9999, laidOut = false;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function layout() {
      // The gather plays once. A later layout (rotation, a real resize) re-targets the points
      // in place instead of scattering them and gathering again.
      const again = laidOut;
      laidOut = true;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const m = MOB();
      const size = Math.round(m ? Math.min(W * 0.7, 300) : Math.min(H * 0.64, W * 0.38, 560));
      const cx = m ? W / 2 : W * 0.73, cy = m ? H * 0.3 : H * 0.52;
      const oc = document.createElement('canvas'); oc.width = size; oc.height = size;
      const o = oc.getContext('2d'); o.drawImage(img, 0, 0, size, size);
      const data = o.getImageData(0, 0, size, size).data;
      const step = m ? 4 : 5, target = [];
      for (let y = 0; y < size; y += step) for (let x = 0; x < size; x += step) if (data[(y * size + x) * 4 + 3] > 120) target.push([cx - size / 2 + x + rnd(-1, 1), cy - size / 2 + y + rnd(-1, 1)]);
      const N = target.length, AMB = m ? 120 : 280;
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
      if (!again) t0 = performance.now();
      if (REDUCED) draw(99);
    }
    const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    function draw(tt) {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        const f = p.amb ? 1 : ease((tt - 0.25 - p.d * 0.9) / 1.6);
        let x = p.sx + (p.tx - p.sx) * f, y = p.sy + (p.ty - p.sy) * f;
        if (!REDUCED) { x += Math.sin(tt * p.sp + p.ph) * (p.amb ? 6 : 0.9); y += Math.cos(tt * p.sp * 0.8 + p.ph) * (p.amb ? 5 : 0.9); }
        if (FINE && !p.amb) { const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy), reach = 280; if (d < reach) { const k = (1 - d / reach) * 96; x += (dx / (d || 1)) * k; y += (dy / (d || 1)) * k; } }
        if (disperse > 0) { const k = disperse * disperse * 420 * p.depth; x += p.ux * k + (p.amb ? 0 : p.ux * 20 * disperse); y += p.uy * k - disperse * 60 * p.depth; }
        const a = (p.amb ? 0.24 : 1) * (1 - disperse * 0.85);
        if (a <= 0.01) continue;
        ctx.globalAlpha = a; ctx.fillStyle = p.c;
        ctx.fillRect(x, y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!running) return;
      draw((now - t0) / 1000);
      requestAnimationFrame(frame);
    }
    layout();
    if (!REDUCED) {
      requestAnimationFrame(frame);
      new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) requestAnimationFrame(frame); }).observe(hero);
      if (gsap) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4, onUpdate: (s) => { disperse = s.progress; } });
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
    gsap.from(['#build .build-in > *'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#build', start: 'top 75%' } });
  }

  initHeroCopy();
  initMission();
  initWhy();
  initVision();
  initRest();
  await initField();
  if (!L.alive) return;
  if (gsap) {
    let rz; L.on(window, 'resize', () => { clearTimeout(rz); rz = setTimeout(() => ScrollTrigger.refresh(), 150); });
    await document.fonts.ready; if (L.alive) ScrollTrigger.refresh();
  }
}
