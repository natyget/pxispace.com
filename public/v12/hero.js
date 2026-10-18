// The landing hero: the headline on top, and one event as a short film under it, from finding it to the next one, in
// about seven and a half seconds. Each scene is a value of the hero's data-s; home.css places every object on the stage
// for each scene and springs it there. The half of the headline the film is about stays lit. The film starts after the
// splash glitch, stops off screen and in a hidden tab, and starts over when you come back to it. It is silent. Under
// reduced motion there is no intro, and the film holds still on its first scene.
(() => {
  const hx = document.querySelector('[data-hx]');
  if (!hx) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pp = hx.querySelector('.hf-pp .pp');

  // ---------------------------------------------------------------- the film
  // [scene, ms, the half of the headline it is about]. The taps land at the end of their scene (home.css times them).
  const SCENES = [
    ['1', 850, 'a'],    // Discover: the record, Join (tap)
    ['2', 600, 'a'],    // Joined; the photos on the record (tap)
    ['3', 950, 'b'],    // the organizer's wall
    ['4', 700, 'b'],    // one notification (tap)
    ['5', 800, 'b'],    // the gallery (tap My shots)
    ['6', 800, 'b'],    // My shots
    ['7', 1000, 'b'],   // the passport and its stamp
    ['8', 2100, 'a'],   // the Scene's chat
  ];
  let n = 0, timer = 0, stamp = 0, playing = false, live = false, inView = true;
  const show = (i) => {
    const [id, , half] = SCENES[i];
    hx.dataset.s = id; hx.dataset.half = half;
    clearTimeout(stamp);
    if (pp) { pp.classList.remove('stamped'); if (id === '7') stamp = setTimeout(() => pp.classList.add('stamped'), 320); }
  };
  const step = () => { show(n); timer = setTimeout(() => { n = (n + 1) % SCENES.length; step(); }, SCENES[n][1]); };
  const play = () => { if (playing || reduce) return; playing = true; n = 0; step(); };
  const stop = () => { playing = false; clearTimeout(timer); clearTimeout(stamp); hx.dataset.s = '1'; hx.dataset.half = 'a'; if (pp) pp.classList.remove('stamped'); };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (!live) return; if (inView && !document.hidden) play(); else stop(); }, { threshold: 0.35 }).observe(hx);
  document.addEventListener('visibilitychange', () => { if (!live) return; if (document.hidden) stop(); else if (inView) play(); });
  // the wall's posters and the gallery's photos load once the splash is done, so they never hold up the page
  const load = () => hx.querySelectorAll('img[data-src]').forEach((i) => { i.src = i.dataset.src; i.removeAttribute('data-src'); });
  const settle = () => { live = true; root.classList.add('hx-in'); load(); if (inView && !document.hidden) play(); };

  // ---------------------------------------------------------------- the intro
  const intro = document.querySelector('[data-intro]');
  if (!intro || !root.classList.contains('hx-intro')) { settle(); return; }
  const $i = (s) => intro.querySelector(s), $$i = (s) => [...intro.querySelectorAll(s)];
  const cv = $i('[data-cv]'), cx = cv.getContext('2d');
  const core = $i('[data-core]'), mk = $i('[data-mk]'), gp = $i('[data-gp]'), go = $i('[data-go]'), prime = $i('[data-prime]'), scan = $i('[data-scan]');
  const strips = $$i('.hi-st'), blocks = $$i('.hi-bk');
  const k = mk.offsetWidth / 176;                       // the app's numbers are for a 176pt mark
  blocks.forEach((b) => b.style.setProperty('--k', k));

  // the static runs at half resolution with hard pixels: chunky like a bad signal, and every patch keeps a crisp edge
  const S = 0.5, W = innerWidth, H = innerHeight;
  cv.width = Math.ceil(W * S); cv.height = Math.ceil(H * S);
  const CW = cv.width, CH = cv.height, PAD = 96;
  const NOISE = [0, 1].map(() => {                      // two frames of static, bigger than the screen, drawn at random offsets
    const c = document.createElement('canvas'); c.width = CW + PAD; c.height = CH + PAD;
    const g = c.getContext('2d'), im = g.createImageData(c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const r = Math.random(); const v = r < 0.012 ? 140 + Math.random() * 100 : Math.random() ** 2.2 * 66; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    return c;
  });

  // the patches: the space around the mark, cut into pieces of different sizes; the mark's own patch comes off last
  const split = (r, n, out) => {
    if (n <= 1 || r[2] < 90 || r[3] < 60) { out.push(r); return; }
    const across = r[2] / r[3] > 1.25 ? true : r[3] / r[2] > 1.25 ? false : Math.random() < 0.5;
    const t = rnd(0.34, 0.66), n1 = Math.max(1, Math.round(n * t)), n2 = Math.max(1, n - n1);
    if (across) { const w1 = Math.round(r[2] * t); split([r[0], r[1], w1, r[3]], n1, out); split([r[0] + w1, r[1], r[2] - w1, r[3]], n2, out); }
    else { const h1 = Math.round(r[3] * t); split([r[0], r[1], r[2], h1], n1, out); split([r[0], r[1] + h1, r[2], r[3] - h1], n2, out); }
  };
  const cb = core.getBoundingClientRect(), wide = W > 700;
  const C = [Math.max(0, cb.left - 26), Math.max(0, cb.top - 26), 0, 0];
  C[2] = Math.min(W, cb.right + 26) - C[0]; C[3] = Math.min(H, cb.bottom + 26) - C[1];
  if (C[0] < 60 || W - C[0] - C[2] < 60) { C[0] = 0; C[2] = W; }   // on a phone the mark's patch is a band across
  const outer = [];
  split([0, 0, W, C[1]], wide ? 5 : 3, outer);
  split([0, C[1] + C[3], W, H - C[1] - C[3]], wide ? 5 : 3, outer);
  if (C[0] > 0) { split([0, C[1], C[0], C[3]], 1, outer); split([C[0] + C[2], C[1], W - C[0] - C[2], C[3]], 1, outer); }
  for (let i = outer.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [outer[i], outer[j]] = [outer[j], outer[i]]; }
  const queue = [...outer.filter((r) => r[2] > 0 && r[3] > 0), C];

  const ARRIVE = 80, LOCK = 600, PRIME = 340, PEEL = 1450, F = 42;   // ms; F is one frame of the bad signal
  const noise = (i, f) => { const n = Math.sin(i * 12.9898 + f * 78.233) * 43758.5453; return (n - Math.floor(n)) * 2 - 1; };
  const breakup = (ms) => (ms < ARRIVE ? 0 : ms < LOCK ? 1 - ((ms - ARRIVE) / (LOCK - ARRIVE)) ** 2 * 0.8 : 0);
  const glitchMark = (a, fr) => {
    mk.style.opacity = a > 0.3 && noise(5, fr) > 0.62 ? 0.15 : 1;
    strips.forEach((s, n) => { s.style.transform = `translateX(${noise(n + 31, fr) > -0.1 ? (a * 46 * noise(n, fr) * k).toFixed(1) : 0}px)`; });
    gp.style.opacity = go.style.opacity = a > 0 ? 0.75 : 0;
    gp.style.transform = `translate(${(-(5 + 16 * a) + 6 * noise(11, fr)) * k}px, ${3 * noise(12, fr) * k}px)`;
    go.style.transform = `translate(${(5 + 16 * a + 6 * noise(13, fr)) * k}px, ${-3 * noise(14, fr) * k}px)`;
    blocks.forEach((b, n) => { b.style.opacity = a > 0 && noise(n + 77, fr) > 0.55 ? 0.9 : 0; });
  };

  const holes = [];
  const px = (r) => [Math.floor(r[0] * S), Math.floor(r[1] * S), Math.ceil(r[2] * S) + 1, Math.ceil(r[3] * S) + 1];
  const staticFrame = (ms, fr) => {
    cx.globalCompositeOperation = 'source-over';
    cx.drawImage(NOISE[fr % 2], -Math.floor(Math.random() * PAD), -Math.floor(Math.random() * PAD));
    cx.fillStyle = 'rgba(0, 0, 0, .42)';
    for (let y = 0; y < CH; y += 2) cx.fillRect(0, y, CW, 1);      // scan lines, one every 4px on screen
    const storm = ms < 900 ? 1 : 0.4;                                  // bands slip sideways, hardest while the signal comes in
    const nb = Math.random() < 0.35 + 0.6 * storm ? 1 + Math.floor(Math.random() * 3 * storm) : 0;
    for (let i = 0; i < nb; i++) {
      const y = Math.floor(Math.random() * CH), h = 2 + Math.floor(Math.random() * (4 + 22 * storm)), dx = Math.round((Math.random() - 0.5) * (14 + 70 * storm));
      cx.drawImage(cv, 0, y, CW, h, dx, y, CW, h);
      if (Math.random() < 0.45) { cx.fillStyle = Math.random() < 0.5 ? 'rgba(165, 35, 239, .34)' : 'rgba(255, 90, 31, .3)'; cx.fillRect(0, y, CW, h); }
    }
    if (Math.random() < 0.1) { cx.fillStyle = 'rgba(255, 255, 255, .3)'; cx.fillRect(0, Math.floor(Math.random() * CH), CW, 1); }
    holes.forEach((r) => { const [x, y, w, h] = px(r); cx.clearRect(x, y, w, h); });
  };
  const peelFrame = (r, f, quick) => {                     // one patch coming off: it tears, comes away in strips, and is gone
    const [x, y, w, h] = px(r);
    if (f === 0 && !quick) {
      for (let yy = y; yy < y + h; yy += 3 + Math.floor(Math.random() * 5)) {
        const sh = 2 + Math.floor(Math.random() * 4), dx = Math.round((Math.random() - 0.5) * 28);
        cx.drawImage(cv, x, yy, w, sh, x + dx, yy, w, sh);
      }
      cx.fillStyle = Math.random() < 0.5 ? 'rgba(165, 35, 239, .5)' : 'rgba(255, 90, 31, .46)';
      cx.fillRect(x, y, w, h);
      cx.fillStyle = 'rgba(255, 255, 255, .5)'; cx.fillRect(x, y + Math.floor(Math.random() * h), w, 1);
    } else if (f === 1 && !quick) {
      for (let yy = y; yy < y + h; yy += 6) cx.clearRect(x, yy, w, 3 + Math.floor(Math.random() * 2));
      cx.fillStyle = Math.random() < 0.5 ? 'rgba(165, 35, 239, .3)' : 'rgba(255, 90, 31, .28)';
      for (let yy = y + 3; yy < y + h; yy += 6) cx.fillRect(x + Math.round((Math.random() - 0.5) * 12), yy, w, 3);
    } else {
      cx.clearRect(x, y, w, h);
      for (let i = 0; i < 2; i++) {
        cx.fillStyle = i ? 'rgba(165, 35, 239, .55)' : 'rgba(255, 90, 31, .5)';
        cx.fillRect(x + Math.round((Math.random() - 0.5) * 16), y + Math.floor(Math.random() * h), w, 1 + Math.floor(Math.random() * 2));
      }
    }
  };

  let t0 = 0, last = -1, cur = null, fast = false, ended = false, burst = 0;
  const finish = () => {
    if (ended) return; ended = true;
    cx.clearRect(0, 0, CW, CH);
    intro.remove(); root.classList.remove('hx-intro'); settle();
  };
  const tick = (now) => {
    if (ended) return;
    if (!t0) t0 = now;
    const ms = now - t0;
    const p = Math.min(1, ms / (ARRIVE + 140));
    scan.style.opacity = p < 1 ? 0.85 : 0; scan.style.transform = `translateY(${(p * H) / 2}px)`;
    const fr = Math.floor(ms / F);
    if (fr !== last) {                                    // hard steps, like a bad signal, not smooth motion
      last = fr;
      if (fr === 0) intro.classList.add('live');
      if (!burst) glitchMark(breakup(ms), fr);
      if (ms >= PRIME) prime.classList.add('on');
      staticFrame(ms, fr);
      if (ms >= PEEL || fast) {
        if (!cur && queue.length) {
          const r = queue.shift();
          cur = { r, f: 0, last: r === C };
          if (cur.last) burst = 1;                        // the mark lets go before its patch comes off
        }
        if (cur) {
          if (cur.last && burst && burst < (fast ? 2 : 5)) {        // the last burst: the mark breaks up, the line goes with it
            glitchMark(0.75, fr); prime.style.opacity = burst % 2 ? 0.3 : 0.9; burst++;
          } else {
            if (cur.last && burst) { core.style.visibility = 'hidden'; burst = 0; }
            peelFrame(cur.r, cur.f, fast);
            cur.f += fast ? 3 : 1;
            if (cur.f >= 3) { holes.push(cur.r); if (cur.last) { requestAnimationFrame(finish); return; } cur = null; }
          }
        }
      }
    }
    const since = ms - LOCK;
    mk.style.scale = since >= 0 && since < 160 ? 1 + 0.06 * (1 - since / 160) : 1;   // the kick at the lock
    requestAnimationFrame(tick);
  };
  // moving over the static picks the patch that comes off next, like scratching; a tap or a key clears it fast
  intro.addEventListener('pointermove', (e) => {
    const i = queue.findIndex((r) => r !== C && e.clientX >= r[0] && e.clientX < r[0] + r[2] && e.clientY >= r[1] && e.clientY < r[1] + r[3]);
    if (i > 0) queue.unshift(...queue.splice(i, 1));
  });
  const hurry = () => { fast = true; };
  intro.addEventListener('pointerdown', hurry);
  addEventListener('keydown', hurry, { once: true });
  addEventListener('wheel', hurry, { once: true, passive: true });
  addEventListener('resize', finish, { once: true });
  const mark = new Image();
  mark.src = '/img/brand/pxi-mark.svg';
  (mark.decode ? mark.decode() : Promise.resolve()).then(() => requestAnimationFrame(tick), finish);
})();
