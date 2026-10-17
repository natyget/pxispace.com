// PXI site v9: object behaviour. Every interaction answers a tap; nothing depends on hover. Each block runs only if its
// object is on the page. Motion pauses off screen, stays inside its own object, and holds still under reduced motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.3) => new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { threshold }).observe(el);
  const once = (el, cb, threshold = 0.35) => new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { cb(); io.disconnect(); } }), { threshold }).observe(el);
  const settled = new Promise((ok) => (document.readyState === 'complete' ? setTimeout(ok, 900) : addEventListener('load', () => setTimeout(ok, 900), { once: true })));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const ticker = (el, fn, ms, threshold = 0.3) => {
    let t = 0, on = false;
    const run = () => { clearInterval(t); if (on && !document.hidden && !reduce) t = setInterval(fn, ms); };
    settled.then(() => seen(el, (v) => { on = v; run(); }, threshold));
    document.addEventListener('visibilitychange', run);
  };
  const tap = (el, fn) => {
    el.addEventListener('click', fn);
    if (!/^(BUTTON|A)$/.test(el.tagName)) el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  window.PXI = { $, $$, seen, once, settled, wait, ticker, tap, pick, restart, reduce };

  // ---------------------------------------------------- discover: the records, and the details beside them
  $$('[data-disc]').forEach((d) => {
    const car = $('[data-car]', d), slides = $$('.dsc-slide', car), ev = JSON.parse(d.dataset.events);
    const info = $('.disc-info', d), stamps = $$('[data-st]', d), save = $('[data-save]', d);
    const set = (k, v) => $$(`[data-k="${k}"]`, d).forEach((e) => { e.textContent = v; });
    const saved = new Set();
    let cur = 0, auto = true;
    const show = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, j) => {
        let o = j - cur;
        if (o > slides.length / 2) o -= slides.length;
        if (o < -slides.length / 2) o += slides.length;
        s.dataset.o = Math.abs(o) > 2 ? 'far' : String(o);
        s.style.setProperty('--o', Math.max(-3, Math.min(3, o > 0 ? o + 0.3 : o))); // the record pops right, so the right side sits further out
      });
      const e = ev[cur];
      set('when', e.when); set('title', e.title); set('by', 'by ' + e.by); set('venue', e.venue); set('dist', e.dist + ' away'); set('price', e.price); set('match', e.match);
      stamps.forEach((s) => { s.hidden = +s.dataset.st !== cur; });
      if (save) save.setAttribute('aria-pressed', String(saved.has(cur)));
      restart(info, 'swap');
    };
    show(0);
    const go = (i) => { auto = false; show(i); };
    $('[data-prev]', d).addEventListener('click', () => go(cur - 1));
    $('[data-next]', d).addEventListener('click', () => go(cur + 1));
    slides.forEach((s, j) => s.addEventListener('click', () => { if (!car.dataset.swiped && s.dataset.o !== '0') go(j); }));
    car.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); });
    save?.addEventListener('click', () => { saved.has(cur) ? saved.delete(cur) : saved.add(cur); save.setAttribute('aria-pressed', String(saved.has(cur))); restart(save, 'pop'); });
    let x0 = null, dx = 0;
    car.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; car.setPointerCapture(e.pointerId); });
    car.addEventListener('pointermove', (e) => { if (x0 === null) return; dx = e.clientX - x0; if (Math.abs(dx) > 6) car.classList.add('dragging'); slides.forEach((s) => s.style.setProperty('--dx', dx + 'px')); });
    const end = () => {
      if (x0 === null) return;
      car.classList.remove('dragging'); slides.forEach((s) => s.style.setProperty('--dx', '0px'));
      if (Math.abs(dx) > 50) { car.dataset.swiped = '1'; go(cur + (dx < 0 ? 1 : -1)); setTimeout(() => delete car.dataset.swiped, 60); }
      x0 = null;
    };
    car.addEventListener('pointerup', end); car.addEventListener('pointercancel', end);
    ticker(d, () => { if (auto) show(cur + 1); }, 5200, 0.45);
  });

  // ---------------------------------------------------- the roll: new shots land, reactions pile up on the edges, comments slide into the tray
  // the friend's text slides down from the top edge like a real notification, each time the section comes back on screen
  $$('[data-ask]').forEach((a) => {
    if (reduce) return;
    a.classList.add('wait');
    let t = 0;
    seen(a.closest('section') || a, (v) => {
      clearTimeout(t);
      if (v) { a.classList.remove('wait', 'done'); restart(a, 'in'); t = setTimeout(() => a.classList.add('done'), 1700); }   // then a soft line through it
      else { a.classList.remove('in', 'done'); a.classList.add('wait'); }
    }, 0.9);
  });
  $$('[data-roll]').forEach((rl) => {
    const grid = $('[data-grid]', rl), data = JSON.parse(rl.dataset.rollData);
    const SPOTS = ['tr', 'tl', 'br', 'bl', 'lm', 'rm'];
    let k = 0, step = 0, minute = 43;
    const visible = () => $$('.rl-card', grid).filter((c) => c.offsetParent !== null).slice(0, 10);
    const react = (card, emo = pick(data.emoji)) => {
      const has = $$('.rl-st', card).find((s) => s.firstChild.textContent === emo);
      if (has) { const b = $('b', has); b.textContent = +b.textContent + 1; restart(has, 'bump'); return; }
      const used = $$('.rl-st', card).map((s) => [...s.classList].find((c) => c.startsWith('at-')));
      const free = SPOTS.filter((p) => !used.includes('at-' + p));
      if (!free.length) { const s = pick($$('.rl-st', card)); const b = $('b', s); b.textContent = +b.textContent + 1; restart(s, 'bump'); return; }
      const s = document.createElement('span');
      s.className = `rl-st at-${pick(free)}`; s.innerHTML = `${emo}<b>1</b>`;
      card.append(s); restart(s, 'pop');
    };
    const tray = (card, who, text) => {
      const t = $('.rl-tray', card); if (!t || t.dataset.busy) return;
      t.dataset.busy = '1';
      t.classList.add('out');
      setTimeout(() => { t.innerHTML = `<b>@${who}</b> <span>${text}</span>`; t.classList.remove('out'); restart(t, 'cm'); delete t.dataset.busy; }, reduce ? 0 : 260);
    };
    const arrive = () => {
      const [img, who, pos] = data.more[k++ % data.more.length];
      const card = document.createElement('figure');
      card.className = 'rl-card new';
      const [cw, ct] = pick(data.comments);
      card.innerHTML = `<div class="rl-ph"><img class="ph" src="/img/night/${img}.webp" alt="" width="480" height="600" style="object-position:${pos}"></div><figcaption class="rl-tray"><b>@${cw}</b> <span>${ct}</span></figcaption>`;
      bind(card); grid.prepend(card);
      while (grid.children.length > 10) grid.lastElementChild.remove();
    };
    function bind(card) {
      card.addEventListener('click', () => {
        const h = document.createElement('span'); h.className = 'rl-heart'; h.textContent = pick(['😭', '🔥', '🫶', '😍']);
        card.append(h); setTimeout(() => h.remove(), 850); react(card, h.textContent);
      });
    }
    $$('.rl-card', grid).forEach(bind);
    ticker(rl, () => {
      step++;
      const cards = visible();
      if (cards.length) react(pick(cards));
      if (step % 4 === 0) arrive();
      if (step % 3 === 1 && cards.length) { const [who, text] = pick(data.comments); tray(pick(cards.slice(0, 10)), who, text); }
    }, 700, 0.25);
  });

  // ---------------------------------------------------- the morning: notifications drop in from the top, one after another, forever
  $$('[data-morning]').forEach((mo) => {
    const pool = JSON.parse(mo.dataset.notes), stack = $('[data-stack]', mo), MAX = +getComputedStyle(mo).getPropertyValue('--max') || 4;
    let k = 0;
    const drop = () => {
      const w = document.createElement('div'); w.innerHTML = pool[k++ % pool.length];
      const nt = w.firstElementChild; stack.prepend(nt);
      requestAnimationFrame(() => nt.classList.add('on'));
      const all = $$('.nt', stack);
      all.forEach((el, i) => { el.style.setProperty('--i', i); el.classList.toggle('old', i >= MAX - 1); });
      all.slice(MAX).forEach((el) => { el.classList.add('gone'); setTimeout(() => el.remove(), 500); });
      $$('time', stack).forEach((t, i) => { t.textContent = i === 0 ? 'now' : `${i * 3}m ago`; });
    };
    for (let i = 0; i < MAX - 1; i++) drop();
    $$('.nt', stack).forEach((el) => el.classList.add('on'));
    ticker(mo, drop, 2600, 0.4);
    tap(stack, drop);
  });

  // ---------------------------------------------------- the wall: the app's endless scrapbook wall (wallLayout.ts), drag it with momentum
  const COL_FACTORS = [0.94, 1.06, 0.86, 1.0, 0.98, 1.08, 0.9, 1.02], ASPECTS = [1.25];
  const ROTATIONS = [-2.4, 1.6, 2.7, -1.1, 0.7, -2.9, 2.1, -0.5, 1.2, -1.8], SPOTS = ['low', 'center', 'bottom', 'low', 'bottom', 'center', 'top'];
  const PHASES = [0, 0.37, 0.14, 0.62, 0.81, 0.29, 0.53, 0.06], EDGE = 18 + 52, COL_GAP = 16, ROW_GAP = 18;
  const posMod = (a, n) => ((a % n) + n) % n;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const geometry = (W, H) => {
    const base = clamp(Math.round(W * 0.37), 118, 200);
    let cols = 4, colW = [], periodX = 0, maxW = 0;
    for (;;) { colW = Array.from({ length: cols }, (_, c) => Math.round(base * COL_FACTORS[c % COL_FACTORS.length])); periodX = colW.reduce((s, w) => s + w + COL_GAP, 0); maxW = Math.max(...colW); if (periodX >= W + maxW + EDGE * 2 || cols >= 12) break; cols++; }
    let rows = 3, heights = [], periodY = 0, maxH = 0;
    for (;;) {
      const raw = colW.map((cw, c) => Array.from({ length: rows }, (_, r) => Math.round(cw * ASPECTS[(r * 3 + c * 2) % ASPECTS.length])));
      periodY = Math.max(...raw.map((col) => col.reduce((a, b) => a + b, 0) + rows * ROW_GAP));
      heights = raw.map((col) => { const sum = col.reduce((a, b) => a + b, 0), sc = (periodY - rows * ROW_GAP) / sum, out = col.map((h) => Math.round(h * sc)); out[out.length - 1] += periodY - rows * ROW_GAP - out.reduce((a, b) => a + b, 0); return out; });
      maxH = Math.max(...heights.flat());
      if (periodY >= H + maxH + EDGE * 2 || rows >= 14) break; rows++;
    }
    const slots = []; let x = 0;
    for (let c = 0; c < cols; c++) {
      let y = PHASES[c % PHASES.length] * periodY;
      for (let r = 0; r < rows; r++) { slots.push({ col: c, row: r, x, y: posMod(y, periodY), w: colW[c], h: heights[c][r], rot: ROTATIONS[(c * 3 + r * 5) % ROTATIONS.length], spot: SPOTS[(c * 2 + r * 3) % SPOTS.length] }); y += heights[c][r] + ROW_GAP; }
      x += colW[c] + COL_GAP;
    }
    return { cols, rows, periodX, periodY, marginX: maxW + EDGE, marginY: maxH + EDGE, slots, home: { x: -Math.round(colW[0] * 0.5), y: -Math.round(periodY * 0.08) } };
  };
  $$('[data-wall]').forEach((wall) => {
    const tiles = JSON.parse(wall.dataset.tiles), inner = $('[data-in]', wall);
    let g, els = [], ox = 0, oy = 0, vx = 0, vy = 0, drag = null, last = 0, on = false, touched = false;
    const lap = (h, o, p, m) => Math.floor((h + o + m) / p);
    const build = () => {
      g = geometry(wall.clientWidth, wall.clientHeight); ox = g.home.x; oy = g.home.y; inner.innerHTML = '';
      els = g.slots.map((s) => { const el = document.createElement('div'); el.className = 'wt'; el.style.width = s.w + 'px'; el.style.height = s.h + 'px'; inner.append(el); return { s, el, idx: -1 }; });
      place();
    };
    const fill = (t, idx) => {
      const [img, name, kind] = tiles[idx];
      t.el.className = 'wt' + (kind === 'private' ? ' wt-private' : '');
      t.el.innerHTML = `<img src="${img}" alt="" width="360" height="450" loading="lazy" draggable="false">`;
      t.el.title = name;
    };
    const place = () => {
      for (const t of els) {
        const { s } = t;
        const px = posMod(s.x + ox + g.marginX, g.periodX) - g.marginX, py = posMod(s.y + oy + g.marginY, g.periodY) - g.marginY;
        const lx = lap(s.x, ox, g.periodX, g.marginX), ly = lap(s.y, oy, g.periodY, g.marginY);
        const idx = posMod((s.col + lx * g.cols) * 7 + (s.row + ly * g.rows) * 3 + s.col * 5, tiles.length);
        if (idx !== t.idx) { t.idx = idx; fill(t, idx); }
        t.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) rotate(${s.rot}deg)`;
      }
    };
    const loop = (now) => {
      const dt = Math.min(48, now - (last || now)); last = now;
      if (on && !drag) {
        if (Math.hypot(vx, vy) > 12) { const f = Math.pow(0.998, dt); vx *= f; vy *= f; ox += vx * dt / 1000; oy += vy * dt / 1000; place(); }
        else if (!touched && !reduce) { ox -= 9 * dt / 1000; oy -= 6 * dt / 1000; place(); }
      }
      requestAnimationFrame(loop);
    };
    wall.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; vx = vy = 0; wall.setPointerCapture(e.pointerId); wall.classList.add('drag', 'touched'); touched = true; });
    wall.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const now = performance.now(), dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(1, now - drag.t);
      ox += dx; oy += dy; vx = clamp(dx / dt * 1000, -4200, 4200); vy = clamp(dy / dt * 1000, -4200, 4200);
      drag = { x: e.clientX, y: e.clientY, t: now }; place();
    });
    const up = () => { drag = null; wall.classList.remove('drag'); };
    wall.addEventListener('pointerup', up); wall.addEventListener('pointercancel', up);
    build();
    new ResizeObserver(() => { const w = wall.clientWidth; if (g && Math.abs(w - wall._w) < 2) return; wall._w = w; build(); }).observe(wall);
    seen(wall, (v) => { on = v; }, 0.15);
    requestAnimationFrame(loop);
  });

  // ---------------------------------------------------- the ticket: tap to scan; the stub flies to the passport and slams in as the stamp
  // the level badge: the ring is the progress through the level; at the top it turns into the next level
  // A damped spring (stiffness, damping, mass, as Framer Motion takes them at the port), stepped in small slices.
  const springTo = ({ from = 0, to = 1, stiffness = 170, damping = 26, mass = 1, velocity = 0, onUpdate, onDone }) => new Promise((ok) => {
    if (reduce) { onUpdate(to); if (onDone) onDone(); ok(); return; }
    let x = from, v = velocity, last = performance.now();
    const span = Math.abs(to - from) || 1;   // done when it is within a hair of the target, relative to the move
    const step = (now) => {
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      for (let i = 0; i < 4; i++) { const acc = (-stiffness * (x - to) - damping * v) / mass; v += acc * dt / 4; x += v * dt / 4; }
      if (Math.abs(x - to) < span * 0.004 && Math.abs(v) < span * 0.06) { onUpdate(to); if (onDone) onDone(); ok(); return; }
      onUpdate(x); requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  window.PXI.springTo = springTo;

  // The level badge levels up: the ring fills, the badge pops, and the letter turns over into the next level's letter and
  // colours, then the new ring starts its first sliver.
  const levelUp = async (bd, to) => {
    const tiers = JSON.parse(bd.dataset.tiers), [letter, name, style] = tiers[to];
    const svg = $('svg', bd), l = $('[data-lv-l]', bd), n = $('[data-lv-n]', bd);
    const p0 = parseFloat(getComputedStyle(bd).getPropertyValue('--p')) || 0.86;
    bd.classList.add('live');   // the ring follows the spring, not a CSS transition
    await springTo({ from: p0, to: 1, stiffness: 120, damping: 20, onUpdate: (p) => bd.style.setProperty('--p', p) });
    let swapped = false;
    await springTo({ from: 0, to: 1, stiffness: 260, damping: 15, onUpdate: (k) => {
      // pop: up to 1.18 and back; the letter turns edge-on halfway, changes, and comes back round
      const pop = 1 + 0.18 * Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
      svg.style.transform = `scale(${pop.toFixed(3)})`;
      const turn = Math.abs(Math.cos(Math.PI * Math.min(1, Math.max(0, k))));
      l.style.transform = `scaleX(${turn.toFixed(3)})`;
      if (!swapped && k >= 0.5) {
        swapped = true;
        style.split(';').forEach((kv) => { const [kk, vv] = kv.split(':'); bd.style.setProperty(kk, vv); });
        l.textContent = letter; n.textContent = name; bd.style.setProperty('--p', 0); restart(bd, 'up');
      }
    } });
    svg.style.transform = ''; l.style.transform = '';
    await springTo({ from: 0, to: 0.08, stiffness: 140, damping: 18, onUpdate: (p) => bd.style.setProperty('--p', p) });
    bd.classList.remove('live');
  };
  window.PXI.levelUp = levelUp;

  $$('[data-door]').forEach((door) => {
    const t = $('[data-ticket]', door), stub = $('[data-stub]', t), pp = $('[data-pp]', door), hint = $('[data-scan]', door);
    const slot = pp && $('[data-slot]', pp), bd = pp && $('[data-badge]', pp);
    const START = bd ? JSON.parse(bd.dataset.tiers).VOYAGER : null;
    let state = 'idle', touched = false;
    const reset = () => {
      t.classList.remove('scanning', 'ok', 'torn'); stub.classList.remove('away');
      if (pp) { const n = $('[data-pp-n]', pp); if (n) { n.dataset.was = n.dataset.was || n.textContent; n.textContent = n.dataset.was; } pp.classList.remove('stamped', 'shake'); pp.style.transform = ''; const nw = $('.pp-new', pp); if (nw) { nw.style.transform = ''; nw.style.opacity = ''; } }
      if (bd) { START[2].split(';').forEach((kv) => { const [k, v] = kv.split(':'); bd.style.setProperty(k, v); }); bd.style.setProperty('--p', 0.86); $('[data-lv-l]', bd).textContent = START[0]; $('[data-lv-n]', bd).textContent = START[1]; bd.classList.remove('up'); }
      if (hint) hint.textContent = 'Tap the ticket to scan it'; state = 'idle';
    };
    const run = async () => {
      if (state === 'busy') return;
      if (state === 'done') { reset(); return; }
      state = 'busy';
      t.classList.add('scanning'); await wait(reduce ? 0 : 520);
      t.classList.remove('scanning'); t.classList.add('ok'); await wait(reduce ? 0 : 320);
      t.classList.add('torn'); await wait(reduce ? 0 : 260);
      if (pp) {
        if (!reduce) {
          // the stub itself goes: up off the ticket, over in an arc, turning to the slot's angle and shrinking to the stamp's size
          const a = stub.getBoundingClientRect(), b = slot.getBoundingClientRect();
          const fly = document.createElement('div');
          fly.className = 'stub-fly'; fly.innerHTML = stub.innerHTML.replace(/<span class="admit">[^<]*<\/span>/, '');
          Object.assign(fly.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
          (document.querySelector('.v12') || document.body).append(fly); stub.classList.add('away');
          const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
          const s = Math.max(0.3, Math.min(1, (b.height * 0.92) / a.height)), lift = Math.min(140, Math.hypot(dx, dy) * 0.28);
          await springTo({ from: 0, to: 1, stiffness: 95, damping: 15, onUpdate: (p) => {
            const q = Math.min(1, Math.max(0, p)), arc = Math.sin(Math.PI * q);
            fly.style.transform = `translate(${(dx * p).toFixed(1)}px, ${(dy * p - lift * arc).toFixed(1)}px) rotate(${(10 - 18 * p).toFixed(2)}deg) scale(${((1 + (s - 1) * p) * (1 + 0.1 * arc)).toFixed(3)})`;
            fly.style.setProperty('--lift', arc.toFixed(3));
          } });
          // it presses into the page and becomes the stamp
          pp.classList.add('stamped');
          const n = $('[data-pp-n]', pp); if (n) { n.dataset.was = n.dataset.was || n.textContent; n.textContent = +n.dataset.was + 1; }   // one more on her card
          fly.classList.add('press');
          setTimeout(() => fly.remove(), 260);
        } else { pp.classList.add('stamped'); const n = $('[data-pp-n]', pp); if (n) { n.dataset.was = n.dataset.was || n.textContent; n.textContent = +n.dataset.was + 1; } }
        const nw = $('.pp-new', slot);
        springTo({ from: 1.32, to: 1, stiffness: 520, damping: 22, onUpdate: (k) => { nw.style.transform = `scale(${k.toFixed(3)})`; nw.style.opacity = Math.min(1, (1.32 - k) / 0.2 + 0.2); } });
        springTo({ from: 3, to: 0, stiffness: 600, damping: 28, onUpdate: (y) => { pp.style.transform = `translateY(${y.toFixed(2)}px)`; } });   // a small thud
        if (bd) setTimeout(() => levelUp(bd, 'PATHFINDER'), reduce ? 0 : 260);
      }
      if (hint) hint.textContent = 'Tap the ticket to scan it again'; state = 'done';
    };
    tap(t, () => { touched = true; run(); });
    hint?.addEventListener('click', () => { touched = true; run(); });
    reset();
    once(door, () => settled.then(() => setTimeout(() => { if (!touched && state === 'idle' && !reduce) run(); }, 1200)), 0.6);
  });
})();

// ---------------------------------------------------- organizers
(() => {
  const { $, $$, seen, once, settled, wait, ticker, tap, pick, restart, reduce } = window.PXI;

  $$('[data-fan]').forEach((f) => { if (!reduce) f.classList.add('dealt'); f.addEventListener('click', () => f.classList.toggle('spread')); });
  $$('[data-receipt]').forEach((r) => once(r, () => r.classList.add('in-view'), 0.35));

  // the scene: "Sew it on" sews the patch on; tapping again unpicks it
  $$('[data-scene]').forEach((sc) => {
    const b = $('[data-sew]', sc);
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Wearing' : 'Sew it on';
      if (on) restart(sc, 'sewn'); else sc.classList.remove('sewn');
    });
  });

  // the ticket wall: squares fill in sale order; a tapped color lights up its tickets and says what it cost
  $$('[data-sales]').forEach((sl) => {
    const cells = $$('.sl-wall i', sl), keys = $$('[data-ch]', sl), info = JSON.parse(sl.dataset.chInfo), detail = $('[data-detail]', sl), sold = $('[data-sold]', sl);
    let auto = true, k = 0;
    const show = (c) => {
      keys.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ch === c)));
      if (!c) { delete sl.dataset.pick; return; }
      sl.dataset.pick = c; const i = info[c];
      detail.innerHTML = c === 'direct' ? `<b>${i.n} tickets</b> came from your link being shared around. <span class="dim">No send behind them, so they cost you nothing.</span>`
        : `<b>${i.n} tickets</b> from ${i.what.toLowerCase()}. <span class="dim">${i.who}.</span> Spent <b>${i.spent}</b>, brought in <b>${i.back}</b>.`;
    };
    keys.forEach((b) => b.addEventListener('click', () => { auto = false; show(sl.dataset.pick === b.dataset.ch ? null : b.dataset.ch); }));
    once(sl, () => {
      if (reduce) { cells.forEach((c) => c.classList.add('on')); return; }
      let n = 0; sold.textContent = '0';
      const fill = () => { const to = Math.min(cells.length, n + 10); for (; n < to; n++) cells[n].classList.add('on'); sold.textContent = n; if (n < cells.length) setTimeout(fill, 40); };
      fill();
    }, 0.4);
    const order = ['email', 'text', 'ads', 'direct'];
    ticker(sl, () => { if (auto) show(order[k++ % order.length]); }, 3200, 0.5);
  });

  // the door and the room: one clock; arrivals tick the list (a page turns every few names), the floor plan fills
  $$('[data-ops]').forEach((op) => {
    const arrivals = JSON.parse(op.dataset.arrivals), list = $('[data-list]', op), listBox = $('.op-list', op), page = $('[data-page]', op);
    const inEl = $('[data-in]', op), outEl = $('[data-out]', op), gates = { Front: $('[data-g="Front"]', op), Side: $('[data-g="Side"]', op) };
    const clock = $('[data-clock]', op), fill = $('[data-fill]', op), track = $('[data-track]', op), moment = $('[data-moment]', op), play = $('[data-play]', op), g = $('[data-cells]', op);
    const T = 180; // minutes from 9:30 PM
    const MOMENTS = [[0, 'Doors open'], [30, 'A line at the front door'], [80, 'The floor fills up'], [120, 'The busiest it gets: 131 inside'], [165, 'Last call at the bar']];
    const crowd = (t) => Math.round(131 / (1 + Math.exp(-(t - 70) / 18)));
    const KEYS = [[0, [[580, 330, 40, .5]]], [30, [[590, 330, 60, 1.1], [75, 360, 40, .5], [540, 70, 40, .3]]], [80, [[230, 160, 95, .9], [540, 70, 60, .6], [85, 210, 50, .6]]],
      [120, [[220, 190, 115, 1.1], [490, 290, 60, .6], [620, 240, 50, .7], [85, 210, 56, .8]]], [165, [[230, 200, 90, .7], [775, 200, 70, .9], [540, 70, 50, .8]]], [180, [[775, 200, 70, .8], [540, 70, 60, .7]]]];
    const inside = (x, y) => (x > 34 && x < 686 && y > 24 && y < 376) || (x > 694 && x < 856 && y > 64 && y < 346);
    const S = 26, cells = [];
    for (let y = 24; y < 376; y += S) for (let x = 34; x < 856; x += S) {
      if (!inside(x + S / 2, y + S / 2)) continue;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', x + 2); r.setAttribute('y', y + 2); r.setAttribute('width', S - 4); r.setAttribute('height', S - 4); r.setAttribute('rx', 3); r.setAttribute('class', 'cell'); r.style.opacity = 0;
      g.append(r); cells.push([r, x + S / 2, y + S / 2]);
    }
    const heat = (spots) => cells.map(([, x, y]) => spots.reduce((v, [sx, sy, sr, st]) => v + st * Math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / (2 * sr * sr)), 0));
    const KH = KEYS.map(([t, s]) => [t, heat(s)]);
    const fmt = (t) => { const m = Math.round(t) + 21 * 60 + 30, h = Math.floor(m / 60) % 24, mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`; };
    let t = 0, shown = 0, playing = true, last = 0, on = false, hold = 0, pageNo = 0;
    const per = () => (matchMedia('(max-width: 979px)').matches ? 4 : 6);
    const tickSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    // a page of the guest list: the names are written in, unticked; each one ticks (or gets crossed out) as they reach the door
    const turn = (p, flip = true) => {
      pageNo = p; const n = per(), rows = arrivals.slice(p * n, p * n + n);
      list.innerHTML = rows.map(([name, type, door]) => `<li class="todo"><span class="box"></span><b>${name}</b><span class="t">${type}</span><span class="d">${door}</span></li>`).join('');
      page.textContent = `Page ${p + 1} of 34`;
      if (flip) restart(listBox, 'flip');
    };
    const reset = () => { shown = 0; turn(0, false); };
    const row = (i) => {
      const n = per(), p = Math.floor(i / n);
      if (p !== pageNo) turn(p);
      const li = list.children[i % n], why = arrivals[i][4];
      if (!li) return;
      li.className = why ? 'no' : '';
      li.querySelector('.box').innerHTML = why ? '' : tickSvg;
      if (why) li.insertAdjacentHTML('beforeend', `<span class="why">${why}</span>`);
    };
    reset();
    const draw = () => {
      let i = 1; while (i < KH.length - 1 && t > KH[i][0]) i++;
      const [a, ha] = KH[i - 1], [b, hb] = KH[i], f = Math.min(1, Math.max(0, (t - a) / (b - a)));
      cells.forEach(([r], k) => { const v = ha[k] + (hb[k] - ha[k]) * f; r.style.opacity = Math.min(.95, Math.max(.03, v * .95 - .03)).toFixed(2); });
      const n = crowd(t), denied = arrivals.filter((x) => x[4] && x[3] * 4 <= t).length;
      inEl.textContent = n; gates.Front.textContent = Math.round(n * .73); gates.Side.textContent = n - Math.round(n * .73); outEl.textContent = denied;
      clock.textContent = fmt(t); fill.style.setProperty('--p', (t / T * 100).toFixed(1) + '%');
      let m = MOMENTS[0][1]; MOMENTS.forEach(([mt, l]) => { if (t >= mt) m = l; }); moment.textContent = m;
      while (shown < arrivals.length && arrivals[shown][3] * 4 <= t) row(shown++);
    };
    const loop = (now) => {
      const dt = Math.min(64, now - (last || now)); last = now;
      if (playing && on) {
        if (hold > 0) hold -= dt; else { t += dt / 1000 * 10; if (t >= T) { t = T; hold = 2200; } }
        if (t >= T && hold <= 0) { t = 0; reset(); }
        draw();
      }
      requestAnimationFrame(loop);
    };
    const setPlaying = (p) => { playing = p; op.classList.toggle('paused', !p); play.setAttribute('aria-label', p ? 'Pause' : 'Play'); };
    play.addEventListener('click', () => setPlaying(!playing));
    const seek = (e) => { const r = track.getBoundingClientRect(), nt = Math.min(T, Math.max(0, (e.clientX - r.left) / r.width * T)); if (nt < t) reset(); t = nt; draw(); };
    let dragging = false;
    track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); setPlaying(false); seek(e); });
    track.addEventListener('pointermove', (e) => { if (dragging) seek(e); });
    track.addEventListener('pointerup', () => { dragging = false; });
    if (reduce) { t = 120; setPlaying(false); draw(); return; }
    draw();
    settled.then(() => seen(op, (v) => { on = v; last = 0; }, 0.25));
    requestAnimationFrame(loop);
  });

  // the loop: the package morphs from a story to a post to a carousel; the carousel turns its pages
  $$('[data-loop]').forEach((lp) => {
    const frame = $('[data-lp-frame]', lp), tabs = $$('[data-lp-f]', lp), strip = $('[data-lp-strip]', lp);
    let cur = 0, auto = true, pg = 0, n = 0;
    const show = (i) => { cur = i; frame.dataset.f = tabs[i].dataset.lpF; tabs.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); pg = 0; strip.style.setProperty('--pg', 0); frame.dataset.pg = 0; };
    tabs.forEach((b, i) => b.addEventListener('click', () => { auto = false; show(i); }));
    frame.addEventListener('click', () => { if (frame.dataset.f === 'carousel') { pg = (pg + 1) % 3; strip.style.setProperty('--pg', pg); frame.dataset.pg = pg; } });
    show(0);
    ticker(lp, () => {
      n++;
      if (frame.dataset.f === 'carousel' && n % 2 === 0) { pg = (pg + 1) % 3; strip.style.setProperty('--pg', pg); frame.dataset.pg = pg; }
      if (auto && n % 4 === 0) show((cur + 1) % tabs.length);
    }, 1200, 0.4);
  });

  // the recap: tap a format; the TikTok plays through the shots
  $$('[data-recap]').forEach((rx) => {
    const frame = $('[data-frame]', rx), tabs = $$('[data-fmt]', rx), tk = $$('.rx-tiktok img', rx), bars = $$('.rx-prog i', rx);
    if (!frame || !tabs.length) return;
    let cur = 0, auto = true, slide = 0, n = 0;
    const show = (i) => { cur = i; frame.dataset.f = tabs[i].dataset.fmt; tabs.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); };
    tabs.forEach((b, i) => b.addEventListener('click', () => { auto = false; show(i); }));
    const tiktok = () => { tk.forEach((im, k) => im.classList.toggle('on', k === slide)); bars.forEach((b, k) => b.classList.toggle('on', k <= slide)); slide = (slide + 1) % tk.length; };
    tiktok();
    ticker(rx, () => { if (frame.dataset.f === 'tiktok') tiktok(); if (auto && ++n % 3 === 0) show((cur + 1) % tabs.length); }, 1100, 0.4);
  });
})();
