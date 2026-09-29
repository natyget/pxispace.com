/* PXI — "One Night" landing concept (v2).
 * Scroll is time: every pinned scene is a scrubbed GSAP timeline, and the
 * split-flap night clock reads the active scene's progress.
 * App surfaces (ticket, camera, thread, share) are rebuilt from the RN source;
 * the passport and its stamps are the website's real React components.
 *
 * Ported from pxispace-redesign/site/app.js. Runs once per mount (see SiteShell):
 * PXR is the page's .pxr wrapper, L the lifecycle that undoes every global side effect.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default async function initHome(PXR, L) {
  const { setTimeout, requestAnimationFrame, matchMedia } = L.scope;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $ = (s, r = PXR) => r.querySelector(s);
  const $$ = (s, r = PXR) => Array.from(r.querySelectorAll(s));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Phones (<=600px portrait, or a landscape phone) get phone-first stage geometry
  // (data-mw/data-mh) and their own burst/scrapbook layouts. Rotating a phone stays inside
  // this query, so it never reloads; resizing a desktop window across it does, and the
  // reload lands back at the same point of the night (scroll ratio, not raw pixels).
  const LAND_Q = '(max-width: 950px) and (max-height: 500px) and (orientation: landscape)';
  const MQ_MOB = matchMedia(`(max-width: 600px), ${LAND_Q}`);
  const MOB = MQ_MOB.matches;
  const SCROLL_KEY = 'pxi-home-scroll';
  MQ_MOB.addEventListener('change', () => {
    try { sessionStorage.setItem(SCROLL_KEY, String(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))); } catch { /* storage blocked */ }
    location.reload();
  });
  // Pinned + scrubbed scenes; with reduced motion the scene is a normal block that shows a still.
  const pinST = (sec, mult, scrub = 0.6, extra = {}) => (REDUCED ? undefined : { trigger: sec, start: 'top top', end: () => '+=' + vh() * mult, pin: true, scrub, anticipatePin: 1, ...extra });
  const still = (tl, sec, t) => { tl.pause(); tl.time(t == null ? tl.duration() : t); return ScrollTrigger.create({ trigger: sec, start: 'top center', end: 'bottom center' }); };
  const vh = () => window.innerHeight;
  const rand = (a, b) => a + Math.random() * (b - a);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const hi = (name, size = 24, style = '') => `<svg class="hg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" style="${style}">${(window.HUGE || {})[name] || ''}</svg>`;
  $$('svg.huge[data-icon]').forEach((s) => { s.setAttribute('fill', 'none'); s.innerHTML = (window.HUGE || {})[s.dataset.icon] || ''; });

  /* ───────────────────────── event (one realistic night) ───────────────────────── */
  const EV = { name: 'Late Checkout', date: 'OCT 2', time: '10:00 PM', where: 'SEAPORT, BOSTON', tier: 'EARLY BIRD' };

  /* ───────────────────────── time ───────────────────────── */
  const T = (h, m, day = 0) => day * 1440 + h * 60 + m;
  const DAYS = ['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
  function fmt(total) {
    const m = Math.round(total);
    const d = Math.max(0, Math.min(7, Math.floor(m / 1440)));
    const mm = ((m % 1440) + 1440) % 1440;
    const h24 = Math.floor(mm / 60);
    return { h: h24 % 12 || 12, mi: mm % 60, time: `${h24 % 12 || 12}:${String(mm % 60).padStart(2, '0')}`, ap: h24 >= 12 ? 'PM' : 'AM', day: DAYS[d] };
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const clockScenes = [];
  const SCENES = {};
  function register(id, tl, keys, st = tl.scrollTrigger) {
    const dur = tl ? tl.duration() : 1;
    const entry = { id, tl, st, keys: keys.map(([t, m]) => [t / dur, m]) };
    clockScenes.push(entry);
    SCENES[id] = entry;
  }
  function interp(keys, p) {
    if (p <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (p <= keys[i][0]) { const [p0, m0] = keys[i - 1], [p1, m1] = keys[i]; return m0 + (m1 - m0) * ((p - p0) / (p1 - p0 || 1)); }
    }
    return keys[keys.length - 1][1];
  }
  function computeClock() {
    const y = window.scrollY;
    let m = T(21, 47);
    for (const s of clockScenes) if (y + 1 >= s.st.start) m = interp(s.keys, s.tl ? s.tl.progress() : s.st.progress);
    return m;
  }

  /* ───────────────────────── stage fitting ───────────────────────── */
  function fitStages() {
    $$('.stage').forEach((st) => {
      const box = st.parentElement, mob = MOB && st.dataset.mw;
      const w = +(mob ? st.dataset.mw : st.dataset.w), h = +(mob ? st.dataset.mh : st.dataset.h);
      const s = Math.min(box.clientWidth / w, box.clientHeight / h, +(st.dataset.max || 1.18));
      st.style.width = w + 'px'; st.style.height = h + 'px';
      st.style.transform = `translate(-50%, -50%) scale(${s})`;
      // data-mtop (phones): pull a short stage up toward the copy instead of floating mid-box
      st.style.top = mob && st.dataset.mtop ? (h * s) / 2 + (box.clientHeight - h * s) * +st.dataset.mtop + 'px' : '';
      st._s = s; st._w = w; st._h = h;
    });
  }
  function stagePt(stage, scene, x, y) {
    const sr = stage.getBoundingClientRect(), cr = scene.getBoundingClientRect();
    const s = sr.width / (stage._w || +stage.dataset.w);
    return { x: sr.left - cr.left + x * s, y: sr.top - cr.top + y * s, s };
  }

  /* ───────────────────────── iPhone (modern frame) ───────────────────────── */
  const sbar = (t, dark) => `<div class="sbar${dark ? ' dark' : ''}"><span class="tm">${t}</span><span class="ic"><span class="bars"><i></i><i></i><i></i><i></i></span>${hi('Wifi01Icon', 18)}<span class="bat"></span></span></div>`;
  function buildPhone(el) {
    const pw = +el.dataset.pw;
    el.style.setProperty('--pw', pw + 'px');
    const k = (pw * 0.932) / 402;
    el.innerHTML = '<i class="ib l act"></i><i class="ib l vu"></i><i class="ib l vd"></i><i class="ib r pw"></i><i class="ib r cc"></i>' +
      `<div class="iphone-body"><div class="iphone-screen"><div class="scr" style="--k:${k}"><div class="island"></div></div></div></div>`;
    if (el.dataset.shell) el.classList.add('shell');
    el._k = k; el._inset = pw * 0.034;
    return $('.scr', el);
  }
  // phone screen design coords → stage coords
  const scrToStage = (phone, x, y) => ({ x: phone.offsetLeft + phone._inset + x * phone._k, y: phone.offsetTop + phone._inset + y * phone._k });

  /* ───────────────────────── the app ticket (TicketCard + ticketShape) ───────────────────────── */
  function sawSegs(yStart, yEnd, tipX, valleyX, pitch, downward, startAtTip) {
    let d = '', y = yStart, atTip = startAtTip;
    const cond = downward ? (v) => v < yEnd - 0.01 : (v) => v > yEnd + 0.01;
    while (cond(y)) { const ny = downward ? Math.min(y + pitch, yEnd) : Math.max(y - pitch, yEnd); atTip = !atTip; d += ` L ${atTip ? tipX : valleyX} ${ny}`; y = ny; }
    return d;
  }
  const TS = 248, TT = 10, TB = 178, TR = 10;
  const TICKET_PATH = `M 6 ${TT} H ${TS - TR} A ${TR} ${TR} 0 0 0 ${TS + TR} ${TT} H 344 L 349 ${TT}` + sawSegs(TT, TB, 349, 344, 6, true, true) +
    ` L 344 ${TB} H ${TS + TR} A ${TR} ${TR} 0 0 0 ${TS - TR} ${TB} H 6 L 1 ${TB}` + sawSegs(TB, TT, 1, 6, 6, false, true) + ` L 6 ${TT} Z`;
  const TOP_EDGE = `M 6 ${TT} H ${TS - TR} A ${TR} ${TR} 0 0 0 ${TS + TR} ${TT} H 344`;
  const BOT_EDGE = `M 344 ${TB} H ${TS + TR} A ${TR} ${TR} 0 0 0 ${TS - TR} ${TB} H 6`;
  const LEFT_EDGE = `M 6 ${TT} L 1 ${TT}` + sawSegs(TT, TB, 1, 6, 6, true, true) + ` L 6 ${TB}`;
  const RIGHT_EDGE = `M 344 ${TT} L 349 ${TT}` + sawSegs(TT, TB, 349, 344, 6, true, true) + ` L 344 ${TB}`;
  const dx = +Math.sqrt(18 * 18 - 8 * 8).toFixed(2);
  const INNER = `M 14 18 H ${TS - dx} A 18 18 0 0 0 ${TS + dx} 18 H 336 V 170 H ${TS + dx} A 18 18 0 0 0 ${TS - dx} 170 H 14 V 18`;
  const NP = '#f01fff';
  const edge = (d, w = 1.75, op = 1) => `<path d="${d}" stroke="${NP}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  const inner = (w = 1.25, op = 0.9) => `<path d="${INNER}" stroke="${NP}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op}" stroke-dasharray="5 5"/>`;
  const ticketHTML = (withExtras) => `<div class="aticket">
    <svg class="at-svg" viewBox="0 0 350 188" preserveAspectRatio="xMidYMid meet">
      <path d="${TICKET_PATH}" fill="#0e0e10"/>
      ${edge(TOP_EDGE)}${edge(BOT_EDGE)}${edge(LEFT_EDGE)}${edge(RIGHT_EDGE)}${inner()}
      ${edge(TOP_EDGE, 3, 0.35)}${edge(BOT_EDGE, 3, 0.35)}${edge(LEFT_EDGE, 3, 0.35)}${edge(RIGHT_EDGE, 3, 0.35)}${inner(2, 0.28)}
      <line x1="${TS}" y1="${TT + TR}" x2="${TS}" y2="${TB - TR}" stroke="rgba(216,74,255,0.35)" stroke-width="1" stroke-dasharray="5 5"/>
    </svg>
    <div class="at-badge"><i></i>UPCOMING</div>
    <div class="at-main">
      <div class="at-head"><span class="at-title">${EV.name}</span><span class="at-vis">Public</span></div>
      <div class="at-grid"><div class="at-field"><small>Date &amp; time</small><b>${EV.date} / ${EV.time}</b></div><div class="at-field"><small>Location</small><b>${EV.where}</b></div></div>
      <div class="at-action"><div class="at-field"><small>Tier</small><b>${EV.tier}</b></div><span class="at-thread">Open thread</span></div>
      <span class="at-refund">Ticket is non refundable</span>
    </div>
    <div class="at-stub"><div class="at-qr-anchor"><span class="at-tap">TAP</span><div class="at-qr">${hi('QrCodeIcon', 30)}${withExtras ? '<span class="scanline"></span>' : ''}</div></div></div>
    ${withExtras ? '<div class="admit-wrap"><div class="admit">Admitted</div></div>' : ''}
  </div>`;

  /* ───────────────────────── avatars ───────────────────────── */
  const AV = (n) => `/site/img/av/${n}.jpg`;
  const PEOPLE = { ama: 'A18', kofi: 'A10', nia: 'A14', dre: 'A27', zee: 'A20', lu: 'A11', kev: 'A9', tay: 'A2', jo: 'A7', sade: 'A13', mo: 'A5', rae: 'A16', ty: 'A12', ari: 'A24' };

  /* ───────────────────────── night clock (dial + time pill) ───────────────────────── */
  function initClock() {
    const clock = $('.clock'), pill = $('.clock-pill'), menu = $('.clock-menu');
    const hh = $('.dial .hh'), mh = $('.dial .mh'), prog = $('.dial .prog');
    const tEl = $('.clock-time b'), apEl = $('.clock-time i'), dayEl = $('.clock-day'), nt = $('.nt-time'), root = PXR; // the scoped vars live on .pxr, not :root
    const CIRC = 2 * Math.PI * 17;
    prog.style.strokeDasharray = CIRC; prog.style.strokeDashoffset = CIRC;
    let last = null;
    L.tick(() => {
      const m = Math.round(computeClock());
      if (m === last) return;
      last = m;
      const f = fmt(m), mm = ((m % 1440) + 1440) % 1440;
      hh.setAttribute('transform', `rotate(${((mm / 60) % 12) * 30} 20 20)`);
      mh.setAttribute('transform', `rotate(${(mm % 60) * 6} 20 20)`);
      tEl.textContent = f.time; apEl.textContent = f.ap; dayEl.textContent = f.day;
      nt.innerHTML = `${f.time}<small>${f.ap}</small>`;
      const dawn = m < T(16, 0, 1) ? smooth(T(5, 0, 1), T(9, 20, 1), m) * (1 - smooth(T(10, 6, 1), T(14, 0, 1), m)) : 0;
      root.style.setProperty('--dawn', dawn.toFixed(3));
      root.style.setProperty('--night', (1 - dawn * 0.8).toFixed(3));
    });
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: '35% top', onLeave: () => clock.classList.add('on'), onEnterBack: () => clock.classList.remove('on') });
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { prog.style.strokeDashoffset = CIRC * (1 - self.progress); } });

    // reduced motion: the roll is three still panels (#roll, #roll-d, #roll-e) and has no lights-out beat
    const JUMPS = [
      ['9:48 PM', 'Doors', 'doors', 0], ['10:31 PM', 'The camera', 'camera', 0], ['11:52 PM', 'The roll', 'roll', 0],
      ...(REDUCED ? [['9:40 AM', 'The morning after', 'roll-d', 0]] : [['4:12 AM', 'Lights out', 'roll', 'c'], ['9:40 AM', 'The morning after', 'roll', 'dd']]),
      ['9:41 AM', 'The stamp', 'stamp', 0], ['10:02 AM', 'Post it', 'post', 0], ['Fri 10 PM', 'The next one', 'finale', 1],
    ];
    function jumpY([, , id, t]) {
      const sc = SCENES[id]; if (!sc) return 0;
      if (REDUCED && sc.tl) return sc.st.trigger.getBoundingClientRect().top + window.scrollY; // stills: land on the panel's top
      const time = typeof t === 'string' ? sc.tl.labels[t] : t;
      return sc.st.start + (sc.st.end - sc.st.start) * (sc.tl ? time / sc.tl.duration() : time) + 2;
    }
    $('ul', menu).innerHTML = JUMPS.map(([t, n]) => `<li><button type="button"><b>${t}</b><span>${n}</span></button></li>`).join('');
    const close = () => { menu.hidden = true; pill.setAttribute('aria-expanded', 'false'); };
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open; pill.setAttribute('aria-expanded', String(open));
      if (open) { let ci = 0; JUMPS.forEach((j, k) => { if (window.scrollY + 3 >= jumpY(j)) ci = k; }); $$('li', menu).forEach((li, k) => li.classList.toggle('cur', k === ci)); }
    });
    L.on(document, 'click', (e) => { if (!menu.hidden && !e.target.closest('.clock')) close(); });
    $$('li button', menu).forEach((b, k) => b.addEventListener('click', () => { close(); window.scrollTo({ top: jumpY(JUMPS[k]), behavior: 'smooth' }); }));
  }

  /* ───────────────────────── stage prep (build app screens) ───────────────────────── */
  fitStages();

  /* ───────────────────────── HERO ───────────────────────── */
  function initHero() {
    const hero = $('#hero'), room = $('.room', hero), shots = $('.shots', hero), cursor = $('.vf-cursor');
    const POOL = Array.from({ length: 12 }, (_, i) => `/site/img/lib/h${String(i).padStart(2, '0')}.jpg`);
    let n = 0, exp = 27;
    const live = [];
    const slots = () => {
      const W = hero.clientWidth, H = hero.clientHeight;
      const pts = W < 700
        ? [[0.19, 0.15], [0.81, 0.165], [0.13, 0.79], [0.87, 0.77], [0.5, 0.115], [0.6, 0.9]]
        : [[0.13, 0.28], [0.87, 0.26], [0.1, 0.72], [0.9, 0.7], [0.27, 0.86], [0.73, 0.87], [0.31, 0.14], [0.69, 0.13]];
      return pts.map(([x, y], i) => ({ x: x * W, y: y * H, i }));
    };
    const pw = () => { const W = hero.clientWidth; return W < 700 ? 82 : W > 1300 ? 170 : 148; };
    const place = (e) => { const s = slots()[e.slot]; return { x: s.x - e.el.offsetWidth / 2, y: s.y - e.el.offsetHeight / 2 }; };
    const drop = (el) => gsap.to(el, { y: '+=180', rotation: '+=18', opacity: 0, duration: 0.7, ease: 'power2.in', onComplete: () => el.remove() });

    function shoot(x, y, strength = 0.82) {
      const all = slots(), used = new Set(live.map((l) => l.slot));
      let free = all.filter((s) => !used.has(s.i));
      if (!free.length) { const old = live.shift(); drop(old.el); free = all.filter((s) => s.i === old.slot); }
      const slot = free.reduce((a, b) => (Math.hypot(a.x - x, a.y - y) <= Math.hypot(b.x - x, b.y - y) ? a : b));
      const el = document.createElement('div');
      el.className = 'polaroid'; el.style.width = pw() + 'px';
      el.innerHTML = `<div class="ph"><img src="${POOL[n++ % POOL.length]}" alt=""></div><div class="cap"><b>#${String(28 - exp).padStart(2, '0')}</b></div>`;
      shots.appendChild(el);
      const entry = { el, slot: slot.i }; live.push(entry);
      const w = el.offsetWidth, h = el.offsetHeight, img = $('img', el);
      gsap.set(el, { x: x - w / 2, y: y - h / 2, rotation: rand(-4, 4), scale: 1.35, opacity: 0 });
      gsap.set(img, { filter: 'brightness(0.1) contrast(0.7) saturate(0) blur(3px)' });
      const tl = gsap.timeline();
      if (!REDUCED) {
        tl.to('.flash', { opacity: strength, duration: 0.05, ease: 'power1.out' }, 0).to('.flash', { opacity: 0, duration: 0.75, ease: 'power2.out' }, 0.08)
          .fromTo('.room-lit', { opacity: 0 }, { opacity: 0.9, duration: 0.04 }, 0).to('.room-lit', { opacity: 0, duration: 1.5, ease: 'power2.in' }, 0.15);
      }
      const to = place(entry);
      tl.to(el, { opacity: 1, duration: 0.01 }, 0.05)
        .to(el, { x: to.x, y: to.y, scale: 1, rotation: rand(-11, 11), duration: 1.2, ease: 'expo.out' }, 0.1)
        .to(img, { filter: 'brightness(1) contrast(1) saturate(1) blur(0px)', duration: 2.3, ease: 'power2.out' }, 0.55);
      exp = Math.max(0, exp - 1);
      if (FINE) gsap.fromTo(cursor, { scale: 0.75 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
    }
    hero.addEventListener('click', (e) => { if (e.target.closest('.ctas a')) return; const r = hero.getBoundingClientRect(); shoot(e.clientX - r.left, e.clientY - r.top); });

    const light = { x: innerWidth / 2, y: innerHeight * 0.42 };
    const setLight = () => { room.style.setProperty('--mx', light.x - room.offsetLeft + 'px'); room.style.setProperty('--my', light.y - room.offsetTop + 'px'); };
    setLight();
    if (FINE) {
      hero.classList.add('aim');
      const lx = gsap.quickTo(light, 'x', { duration: 0.6, ease: 'power3', onUpdate: setLight });
      const ly = gsap.quickTo(light, 'y', { duration: 0.6, ease: 'power3', onUpdate: setLight });
      const cx = gsap.quickTo(cursor, 'x', { duration: 0.16, ease: 'power3' }), cy = gsap.quickTo(cursor, 'y', { duration: 0.16, ease: 'power3' });
      L.on(window, 'pointermove', (e) => {
        cx(e.clientX); cy(e.clientY);
        const r = hero.getBoundingClientRect(), inside = e.clientY > r.top && e.clientY < r.bottom;
        cursor.classList.toggle('on', inside && !e.target.closest('a, .nav, .clock'));
        if (inside) { lx(e.clientX - r.left); ly(e.clientY - r.top); }
      }, { passive: true });
    } else if (!REDUCED) {
      light.x = hero.clientWidth * 0.22;
      gsap.to(light, { x: () => hero.clientWidth * 0.78, duration: 4.2, ease: 'sine.inOut', repeat: -1, yoyo: true, onUpdate: setLight });
      gsap.fromTo(light, { y: () => hero.clientHeight * 0.3 }, { y: () => hero.clientHeight * 0.66, duration: 2.9, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }

    const intro = gsap.timeline({ delay: 0.15 });
    intro.from('.tap-cue', { y: 14, opacity: 0, duration: 0.8, ease: 'expo.out' })
      .from('.hero .display-1 .ln > span', { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.09 }, 0.05)
      .from('.hero-lead', { y: 16, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.3)
      .from('.hero .ctas > *', { y: 16, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, 0.38)
      .add(() => { if (!REDUCED) gsap.to('.tap-cue', { opacity: 0.5, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true }); }, 1.2);
    if (!REDUCED) {
      const auto = (k, s) => { const p = slots()[k], W = hero.clientWidth, H = hero.clientHeight; shoot(p.x + (W / 2 - p.x) * 0.3, p.y + (H / 2 - p.y) * 0.3, s); };
      intro.add(() => auto(0, 0.7), 1.0).add(() => auto(3, 0.45), 1.8);
    }
    L.on(window, 'resize', () => live.forEach((l) => gsap.set(l.el, place(l))));

    if (REDUCED) intro.progress(1);
    const exit = gsap.timeline({ paused: REDUCED, scrollTrigger: REDUCED ? undefined : { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 } });
    exit.to('.hero-copy', { y: -140, opacity: 0, ease: 'none' }, 0).to(shots, { y: -300, ease: 'none' }, 0)
      .to(room, { opacity: 0.15, ease: 'none' }, 0);
    register('hero', exit, [[0, T(21, 47)], [exit.duration(), T(21, 48)]], REDUCED ? still(exit, hero, 0) : undefined);
  }

  /* ───────────────────────── 9:48 PM — DOORS ───────────────────────── */
  function initDoors() {
    const sec = $('#doors'), q = gsap.utils.selector(sec);
    $('.t-body', sec).innerHTML = ticketHTML(true);
    $('.t-stub', sec).innerHTML = ticketHTML(true);
    // clean, face-forward portraits only (Ama and Kofi lead, as the line below names them)
    const FACES = ['A18', 'A9', 'A2', 'A16', 'A11'];
    $('.facepile', sec).innerHTML = FACES.map((a, i) => `<img src="${AV(a)}" alt="" style="z-index:${10 - i}">`).join('') + '<span class="more">+151</span>';
    const members = { n: 156 };
    const writeM = () => { const n = Math.round(members.n); $('.going .more', sec).textContent = '+' + (n - FACES.length); $('.going-others', sec).textContent = n - 2; };
    const tl = gsap.timeline({ paused: REDUCED, defaults: { ease: 'power2.inOut' }, scrollTrigger: pinST(sec, 2.5) });
    gsap.set(q('.ticket-pair'), { y: -280 });
    tl.to(q('.ticket-pair'), { y: 0, duration: 2, ease: 'none' }, 0)
      .fromTo(q('.slot'), { opacity: 0.55 }, { opacity: 1, duration: 0.3, repeat: 5, yoyo: true, ease: 'none' }, 0)
      .to(q('.printer'), { y: -30, opacity: 0, duration: 0.8 }, 2.1)
      .to(q('.ticket-pair'), { y: 44, duration: 1.1 }, 2.1)
      .from(q('.going-txt'), { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out' }, 3.3)
      .from(q('.facepile > *'), { y: 18, scale: 0.6, opacity: 0, stagger: 0.09, duration: 0.45, ease: 'back.out(1.8)' }, 2.9)
      .to(members, { n: 164, duration: 1.1, ease: 'none', onUpdate: writeM }, 3.1)
      // scanned at the door (the stub copy carries the visible QR)
      .fromTo(q('.t-stub .scanline'), { top: '0%', opacity: 0 }, { top: '100%', opacity: 1, duration: 1.1, ease: 'none' }, 4.3)
      .to(q('.t-stub .scanline'), { opacity: 0, duration: 0.2 }, 5.4)
      .to(q('.t-stub .at-qr'), { boxShadow: '0 0 26px rgba(0,240,255,.95)', borderColor: '#00F0FF', duration: 0.4 }, 5.1)
      .fromTo(q('.t-body .admit'), { scale: 2.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power4.in' }, 5.6)
      .to(q('.ticket-pair'), { keyframes: { x: [0, -5, 4, -2, 0] }, duration: 0.3, ease: 'none' }, 5.9)
      // tear along the perforation
      .set(q('.feed'), { overflow: 'visible' }, 6.7)
      .to(q('.t-body'), { x: -18, rotation: -4, duration: 0.6 }, 6.7)
      .to(q('.t-stub'), { x: MOB ? 10 : 22, y: -8, rotation: MOB ? 5 : 7, duration: 0.6 }, 6.7)
      .to(q('.t-body'), { y: 140, rotation: -10, duration: 1.1, ease: 'power2.in' }, 7.4)
      .to(q('.t-body'), { opacity: 0, duration: 0.5, ease: 'power1.in' }, 7.4) // gone before it drops behind who's-going
      .fromTo(q('.stub-note'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 7.5)
      // the stub leaves upward and fades before it reaches the header; who's-going and the note
      // stay and scroll away with the scene, and the pin ends as the stub goes — no empty stage
      .to(q('.t-stub'), { x: MOB ? 40 : 300, y: MOB ? -760 : -620, rotation: MOB ? 14 : 28, scale: 0.8, duration: 1.3, ease: 'power2.in' }, 8.3)
      .to(q('.t-stub'), { opacity: 0, duration: 0.45, ease: 'power1.in' }, 8.95);
    register('doors', tl, [[0, T(21, 48)], [4.3, T(21, 51)], [5.6, T(21, 52)], [tl.duration(), T(21, 58)]], REDUCED ? still(tl, sec, 6.3) : undefined);
  }

  /* ───────────────────────── 10:31 PM — CAMERA (one camera, one film look) ───────────────────────── */
  const RC = { outer: 'rgba(255,107,26,0.3)', mid: 'rgba(255,107,26,0.65)', core: 'rgba(255,107,26,0.95)' };
  const rLayer = (stroke, op, a, b) => `<g stroke="${stroke}" fill="none" opacity="${op}" stroke-linecap="round" stroke-linejoin="round" transform="translate(666, 0) rotate(90)"><circle cx="500" cy="333" r="105" stroke-width="${a}"/><path d="M 390,546 L 333,546 A 213,213 0 0,1 333,120 L 390,120" stroke-width="${b}"/><path d="M 610,546 L 667,546 A 213,213 0 0,0 667,120 L 610,120" stroke-width="${b}"/></g>`;
  const RETICLE = `<svg class="rt" viewBox="0 0 666 1000">${rLayer(RC.outer, 0.4, 60, 56)}${rLayer(RC.mid, 0.7, 44, 42)}${rLayer(RC.core, 1, 32, 32)}</svg>`;
  const SUN = `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="${RC.core}" stroke="${RC.core}" stroke-width="2.5"/><path d="M 12,1.8 L 12,4.2 M 12,19.8 L 12,22.2 M 1.8,12 L 4.2,12 M 19.8,12 L 22.2,12 M 4.8,4.8 L 6.5,6.5 M 17.5,17.5 L 19.2,19.2 M 4.8,19.2 L 6.5,17.5 M 17.5,6.5 L 19.2,4.8" stroke="${RC.core}" stroke-width="2.8" stroke-linecap="round"/></svg>`;
  function initCamera() {
    const sec = $('#camera'), q = gsap.utils.selector(sec), phone = $('.cam-phone', sec);
    const scr = buildPhone(phone);
    const IM = ['midday', 'bluehour', 'beach', 'neon', 'shade'];
    const FOCUS = [[208, 380], [262, 214], [268, 292], [250, 330], [246, 560]];
    scr.insertAdjacentHTML('afterbegin', `<div class="cam-imgs">${IM.map((n) => `<img src="/site/img/cam/${n}.jpg" alt="">`).join('')}</div><div class="cam-fade"></div>`);
    scr.insertAdjacentHTML('beforeend', `${sbar('10:31')}<div class="live-pill"></div>
      <div class="reticle">${RETICLE}<span class="sun">${SUN}</span></div>
      <div class="zoom"><span>.5</span><span class="on">1</span><span>3</span></div>
      <div class="queue"><i class="qs"></i><span class="qc">3</span><i class="qg"></i></div>
      <div class="fpill"><i class="accent"></i><span class="flip">${hi('Refresh04Icon', 20)}</span><span class="shutter"><i class="ring"></i><i class="core"></i></span><span class="fls">${hi('FlashIcon', 18)}</span></div>
      <p class="fpill-label">Snap</p>
      <div class="tabbar"><span>${hi('Home05Icon')}</span><span class="on">${hi('Camera02Icon')}</span><span>${hi('DashboardSquare03Icon')}</span><span>${hi('Passport01Icon')}</span></div>
      <div class="cam-flash"></div><i class="home-ind"></i>`);
    const imgs = $$('.cam-imgs img', scr), ret = $('.reticle', scr), qc = $('.qc', scr), items = q('.light-list li');
    const LIGHT = items.map((li) => $('span', li).lastChild.textContent.trim());
    const chipN = $('.cc-lbl small', sec), chipT = $('.cc-lbl span', sec), dots = q('.cc-dots i');
    // phones: the on-screen pill names the light being shot (desktop has the list beside it)
    const lightPill = $('.live-pill', scr);
    lightPill.textContent = LIGHT[0];
    let chipK = 0;
    const tl = gsap.timeline({ paused: REDUCED, scrollTrigger: pinST(sec, 2.8, 0.5) });
    const T0 = (k) => 0.3 + k * 1.25;
    IM.forEach((name, k) => {
      const t = T0(k), [fx, fy] = FOCUS[k];
      if (k > 0) {
        tl.to(imgs[k], { opacity: 1, duration: 0.3, ease: 'none' }, t)
          .to(imgs[k - 1], { opacity: 0, duration: 0.01 }, t + 0.31)
          .to(items[k - 1], { opacity: 0.32, x: 0, duration: 0.3 }, t)
          .to(items[k], { opacity: 1, x: -10, duration: 0.3 }, t);
      }
      tl.set(ret, { x: fx - 36, y: fy - 62 }, t + 0.25)
        .fromTo(ret, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, immediateRender: false }, t + 0.26)
        .to(q('.shutter .core'), { scale: 0.86, duration: 0.08 }, t + 0.55).to(q('.shutter .core'), { scale: 1, duration: 0.12 }, t + 0.63)
        .fromTo(q('.cam-flash'), { opacity: 0 }, { opacity: 0.92, duration: 0.04, ease: 'none', immediateRender: false }, t + 0.62)
        .to(q('.cam-flash'), { opacity: 0, duration: 0.3, ease: 'power2.out' }, t + 0.66)
        .fromTo(q('.queue'), { scale: 1.16 }, { scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t + 0.72)
        .fromTo(q('.queue .qg'), { opacity: 0 }, { keyframes: { opacity: [0, 0.5, 0.12, 0.4, 0] }, duration: 0.7, ease: 'none', immediateRender: false }, t + 0.72)
        .to(ret, { opacity: 0, duration: 0.2 }, t + 0.95);
    });
    gsap.set(items[0], { x: -10 });
    tl.to({}, { duration: 0.6 }, T0(4) + 1.1);
    tl.eventCallback('onUpdate', () => {
      let n = 3; for (let k = 0; k < 5; k++) if (tl.time() >= T0(k) + 0.72) n++;
      qc.textContent = n;
      let a = 0; for (let k = 1; k < 5; k++) if (tl.time() >= T0(k) + 0.15) a = k;
      if (a !== chipK) { chipK = a; lightPill.textContent = LIGHT[a]; chipN.textContent = String(a + 1).padStart(2, '0'); chipT.textContent = LIGHT[a]; dots.forEach((d, k) => d.classList.toggle('on', k === a)); }
      gsap.set(q('.queue .qs'), { opacity: n > 1 ? 0.7 : 0 });
    });
    if (!REDUCED) items.forEach((li, k) => $('button', li).addEventListener('click', () => {
      const st = tl.scrollTrigger;
      window.scrollTo({ top: st.start + (st.end - st.start) * ((T0(k) + 0.9) / tl.duration()), behavior: 'smooth' });
    }));
    register('camera', tl, [[0, T(22, 31)], [tl.duration(), T(23, 18)]], REDUCED ? still(tl, sec) : undefined);
    if (REDUCED) items.forEach((li, k) => $('button', li).addEventListener('click', () => { tl.time(T0(k) + 0.9); }));
  }

  /* ───────────────── 11:52 PM → 9:40 AM — ROLL / LIGHTS OUT / MORNING ───────────────── */
  const MAN = await (await fetch('/site/img/lib/manifest.json')).json();
  if (!L.alive) return;
  const KEEP = [
    { i: 9, p: 'k00', x: 40, y: 109, w: 302, h: 250, r: -1, tape: 'left:-14px;top:-4px;rotate:-38deg', badge: '<i>♥</i> Most loved · 41' },
    { i: 13, p: 'k01', x: 358, y: 149, w: 202, h: 190, r: 2, tape: 'left:calc(50% - 28px);top:-9px;rotate:3deg' },
    { i: 18, p: 'k02', x: 40, y: 423, w: 227, h: 170, r: -2, tape: 'right:-12px;top:-2px;rotate:36deg' },
    { i: 22, p: 'k03', x: 283, y: 375, w: 277, h: 214, r: 1, tape: 'left:calc(50% - 28px);top:-9px;rotate:-4deg' },
  ];
  // Reduced motion: the roll can't scrub, so it becomes three still panels — the thread
  // (#roll itself, which keeps both chapter headings as the real text), then visual-only
  // copies for the morning scrapbook and the lock-screen pushes (headings demoted, aria-hidden).
  function rollCopy(id) {
    const c = $('#roll').cloneNode(true);
    c.id = id; c.setAttribute('aria-hidden', 'true'); c.classList.add('roll-copy');
    $$('h2', c).forEach((h2) => { const p = document.createElement('p'); p.className = h2.className; p.innerHTML = h2.innerHTML; h2.replaceWith(p); });
    return c;
  }
  function initRoll(sec = $('#roll'), id = 'roll', stillT = 18.5) {
    const q = gsap.utils.selector(sec);
    const wall = { pos: [], r: [], d: [], pc: { x: 0, y: 0 }, slots: [], pile: { x: 0, y: 0 } };
    const stage = $('.stage', sec), tilesEl = $('.tiles', sec), bursts = $('.bursts', sec), fly = $('.flythumbs', sec), frame = $('.sb-frame', sec);
    const phone = $('.thread-phone', sec), scr = buildPhone(phone);
    const dims = MAN.dims;
    const shapeOf = (img) => (dims[img + '.jpg'][0] > dims[img + '.jpg'][1] ? 'l' : 'p');
    const frameH = (img) => (shapeOf(img) === 'l' ? 246 : 437) + 14;

    // ---- thread (chat order: oldest at top, newest lands at the bottom) ----
    const OLD = [
      { type: 'msg', who: 'kofi', time: '11:31 PM', text: 'Bout to tear up the floor! 💃' },
      { type: 'card', img: 't00', poster: 'sade', side: 'r', rx: [['🔥', 12], ['❤️', 8, true]] },
      { type: 'msg', who: 'ama', time: '11:47 PM', text: 'where are yall standing 👀' },
    ];
    const ARR = [
      { img: 't01', poster: 'ama', side: 'l', last: ['nia', 'baddest duo fr 🔥'], rx: [['❤️', 15, true], ['🔥', 7]] },
      { img: 't02', poster: 'kofi', side: 'r', rx: [['😂', 9], ['🙌', 4]] },
      { img: 't03', poster: 'zee', side: 'l', last: ['dre', 'the dj said ONE more 😭'], rx: [['🔥', 22, true]] },
      { img: 't04', poster: 'nia', side: 'r', rx: [['🥹', 6], ['❤️', 11]] },
      { img: 't05', poster: 'dre', side: 'l', last: ['lu', 'jersey szn'], rx: [['🔥', 19]] },
      { img: 't06', poster: 'lu', side: 'r', rx: [['🙌', 8], ['❤️', 5]] },
      { img: 't07', poster: 'kev', side: 'l', last: ['ama', 'take me back 🥺'], rx: [['❤️', 31, true], ['🥹', 12]] },
    ];
    const card = (c) => `<div class="tcard"><div class="frame" style="height:${frameH(c.img)}px"><img src="/site/img/lib/${c.img}.jpg" alt=""><i class="gloss"></i><i class="topsh"></i>
      <span class="poster ${c.side}"><img src="${AV(PEOPLE[c.poster])}" alt="">${c.poster}</span>
      ${c.last ? `<div class="lastc"><img src="${AV(PEOPLE[c.last[0]])}" alt=""><div><small>${c.last[0]}</small><p>${c.last[1]}</p></div></div>` : ''}</div>
      <div class="rxbar"><div class="chips">${c.rx.map(([e, n, on]) => `<span class="chip${on ? ' on' : ''}"><em>${e}</em>${n}</span>`).join('')}</div><div class="dock"><span>${hi('AddCircleIcon', 26)}</span><span>${hi('LinkForwardIcon', 26)}</span></div></div></div>`;
    const msg = (m) => `<div class="tmsg"><img src="${AV(PEOPLE[m.who])}" alt=""><div class="bub"><div class="meta"><b>${m.who}</b><span>${m.time}</span></div><p>${m.text}</p></div></div>`;
    scr.insertAdjacentHTML('afterbegin', `<div class="th-feed"><div class="th-list">${OLD.map((it) => (it.type === 'msg' ? msg(it) : card(it))).join('')}${ARR.map(card).join('')}</div></div>
      <div class="th-top">${sbar('11:52')}<div class="th-head"><span class="back"><svg viewBox="0 0 24 24" width="28" height="28"><path d="m15 18-6-6 6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ttl">${EV.name}</span><span class="more">${hi('MoreHorizontalIcon', 26)}</span></div><div class="th-toggle"><span class="on">Thread</span><span>Gallery</span></div></div>
      <div class="chatbar"><span class="gif">GIF</span><span class="inp">Type a message...</span><span class="send">${hi('SentIcon', 20)}</span></div><i class="home-ind"></i>`);
    const list = $('.th-list', scr), rows = Array.from(list.children), FEED_H = 612, PAD = 14;
    const bottomOf = (el) => el.offsetTop + el.offsetHeight;
    const yFor = (lastIdx) => FEED_H - PAD - bottomOf(rows[lastIdx]);
    const arrRows = rows.slice(OLD.length);
    gsap.set(list, { y: yFor(OLD.length - 1) });

    // ---- bursts: phones going off around the room (borderless avatars) ----
    // desktop: scattered around the room; phones: hugging the phone's two edges
    const BP = MOB ? [[2, 132], [370, 206], [2, 300], [370, 374], [2, 462], [370, 536], [2, 612]]
      : [[70, 118], [530, 150], [94, 300], [508, 330], [62, 470], [538, 500], [100, 612]];
    bursts.innerHTML = BP.map(([x, y], i) => `<div class="burst" style="left:${x}px;top:${y}px"><span class="core"></span><span class="ring"></span><span class="av"><img src="${AV(PEOPLE[ARR[i].poster])}" alt=""></span><span class="who">@${ARR[i].poster}</span></div>`).join('');
    fly.innerHTML = ARR.map((a) => `<div class="fthumb"><img src="/site/img/lib/${a.img}.jpg" alt=""></div>`).join('');
    const B = $$('.burst', bursts), TH = $$('.fthumb', fly);
    // where each arrival's card frame ends up (stage coords)
    const target = (i) => {
      const row = arrRows[i], y = 172 + yFor(OLD.length + i) + row.offsetTop;
      const p = scrToStage(phone, 30, y), s = phone._k;
      return { x: p.x, y: p.y, w: 342 * s, h: frameH(ARR[i].img) * s, b: 7 * s };
    };
    TH.forEach((th, i) => { const t = target(i); Object.assign(th.style, { left: t.x + 'px', top: t.y + 'px', width: t.w + 'px', height: t.h + 'px', borderWidth: t.b + 'px', borderRadius: 16 * phone._k + 'px' }); });
    const FL = ['❤️', '🔥', '🥹', '😂'];
    const FX = MOB ? 292 : 420;
    stage.insertAdjacentHTML('beforeend', FL.map((e, i) => `<span class="floaty" style="left:${FX + (i % 2) * 18}px;top:${440 + (i % 2) * 26}px">${e}</span>`).join(''));
    const floaties = $$('.floaty', stage);

    // ---- tiles: the wall of the whole night (all unique) ----
    const WALL = MAN.sets.w, TILE_N = 40;
    let html = '';
    for (let i = 0; i < TILE_N; i++) {
      const k = KEEP.find((kk) => kk.i === i);
      const src = k ? `/site/img/lib/${k.p}.jpg` : `/site/img/lib/${WALL[i % WALL.length]}`;
      html += `<div class="tile${k ? ' keeper' : ''}"><div class="im"><img src="${src}" alt="" loading="lazy"></div><div class="shade"></div>${k ? `<i class="tape" style="${k.tape}"></i>${k.badge ? `<span class="badge">${k.badge}</span>` : ''}` : ''}</div>`;
      wall.r[i] = rand(-1.4, 1.4);
    }
    tilesEl.insertAdjacentHTML('beforeend', html);
    const tiles = $$('.tile', tilesEl), keepers = KEEP.map((k) => tiles[k.i]), others = tiles.filter((t) => !t.classList.contains('keeper'));
    function layout() {
      const W = sec.clientWidth, H = sec.clientHeight, mob = W <= 860, wide = W > H * 1.6;
      // portrait phones: a tall 4×7 wall; landscape phones and desktops: a wide 8-column wall
      const cols = mob && !wide ? 4 : 8, rowsN = mob && !wide ? 7 : wide && H < 520 ? 4 : 5, gap = mob ? 4 : 8, pad = mob ? 4 : 8;
      const cw = (W - pad * 2 - gap * (cols - 1)) / cols, ch = (H - pad * 2 - gap * (rowsN - 1)) / rowsN;
      const pc = stagePt(stage, sec, phone.offsetLeft + phone.offsetWidth / 2, phone.offsetTop + phone.offsetHeight / 2);
      wall.pc = pc;
      let maxD = 1;
      tiles.forEach((t, i) => {
        const c = i % cols, r = Math.floor(i / cols), x = pad + c * (cw + gap), y = pad + r * (ch + gap);
        t.classList.toggle('hide', i >= cols * rowsN);
        wall.pos[i] = { x, y, w: cw, h: ch, cx: x + cw / 2, cy: y + ch / 2 };
        Object.assign(t.style, { left: x + 'px', top: y + 'px', width: cw + 'px', height: ch + 'px' });
        maxD = Math.max(maxD, Math.hypot(x + cw / 2 - pc.x, y + ch / 2 - pc.y));
      });
      wall.pos.forEach((p, i) => (wall.d[i] = Math.hypot(p.cx - pc.x, p.cy - pc.y) / maxD));
      // the scrapbook frame (568×648 at stage 16,21). On phones the stage is only as wide as
      // the phone, so size the frame from the whole stage box instead and centre it there.
      let fp;
      if (MOB) {
        const bx = stage.parentElement.getBoundingClientRect(), cr = sec.getBoundingClientRect();
        const fs = Math.min(bx.width / 568, bx.height / 648);
        fp = { x: bx.left - cr.left + (bx.width - 568 * fs) / 2, y: bx.top - cr.top + (bx.height - 648 * fs) / 2, s: fs };
      } else fp = stagePt(stage, sec, 16, 21);
      const toScene = (x, y) => ({ x: fp.x + (x - 16) * fp.s, y: fp.y + (y - 21) * fp.s, s: fp.s });
      wall.slots = KEEP.map((k) => { const p = toScene(k.x, k.y); return { x: p.x, y: p.y, w: k.w * p.s, h: k.h * p.s, r: k.r }; });
      frame.style.transform = `translate(${fp.x}px, ${fp.y}px) scale(${fp.s})`;
      wall.pile = toScene(470, 633);
      tilesEl.style.setProperty('--k2', fp.s);
      // reduced motion shows the scrapbook still: keep the keepers in their slots after every relayout
      if (REDUCED) keepers.forEach((k, i) => { const sl = wall.slots[i]; Object.assign(k.style, { left: sl.x + 'px', top: sl.y + 'px', width: sl.w + 'px', height: sl.h + 'px' }); });
    }
    layout();
    L.on(ScrollTrigger, 'refreshInit', layout);

    // phones: the counters ride as one pill on the stage instead of a block under the lead
    const statsEl = q('.stats')[0];
    if (MOB) $('.stage-box', sec).appendChild(statsEl);
    const stats = { photos: 12, people: 3 };
    const statEls = { photos: q('[data-stat="photos"]')[0], people: q('[data-stat="people"]')[0] };
    const writeStats = () => { statEls.photos.textContent = Math.round(stats.photos); statEls.people.textContent = Math.round(stats.people); };

    const tl = gsap.timeline({ paused: REDUCED, scrollTrigger: pinST(sec, 6.8, 0.6, { invalidateOnRefresh: true }) });

    // A — every phone fires, every shot lands at the bottom of the thread
    tl.to(stats, { photos: 171, people: 31, duration: 7.3, ease: 'none', onUpdate: writeStats }, 0.2);
    ARR.forEach((a, i) => {
      const t = 0.3 + i * 1.0, b = B[i], [bx, by] = BP[i], tg = target(i);
      const cx = tg.x + tg.w / 2, cy = tg.y + tg.h / 2;
      tl.fromTo($('.av', b), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, t)
        .fromTo($('.who', b), { opacity: 0 }, { opacity: 1, duration: 0.2 }, t + 0.1)
        .fromTo($('.core', b), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.07, ease: 'none' }, t + 0.3)
        .to($('.core', b), { opacity: 0, scale: 1.5, duration: 0.35 }, t + 0.37)
        .fromTo($('.ring', b), { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 2.4, duration: 0.5, ease: 'power2.out', immediateRender: false }, t + 0.3)
        .fromTo(TH[i], { x: bx - cx, y: by - cy, scale: 0.14, opacity: 0, rotation: rand(-14, 14) }, { opacity: 1, scale: 0.26, duration: 0.1 }, t + 0.32)
        .to(TH[i], { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.5, ease: 'power2.inOut' }, t + 0.42)
        .fromTo(list, { y: () => yFor(OLD.length + i - 1) }, { y: () => yFor(OLD.length + i), duration: 0.34, ease: 'power2.out', immediateRender: false }, t + 0.72)
        .to(TH[i], { opacity: 0, duration: 0.1 }, t + 1.0)
        .from($$('.rxbar .chip', arrRows[i]), { scale: 0, opacity: 0, stagger: 0.08, duration: 0.2, ease: 'back.out(2)' }, t + 0.98)
        .to([$('.av', b), $('.who', b)], { opacity: 0.3, duration: 0.3 }, t + 0.95);
      if (i % 2 === 1) tl.fromTo(floaties[((i - 1) / 2) % floaties.length], { y: 0, opacity: 0, scale: 0.6 }, { keyframes: { y: [0, -60, -130], opacity: [0, 1, 0], scale: [0.6, 1.1, 1] }, duration: 1.1, ease: 'none', immediateRender: false }, t + 1.0);
    });

    // B — pull back: the thread explodes into the wall of the whole night
    tl.addLabel('b', 7.8)
      .to(stats, { photos: 214, people: 38, duration: 1.4, ease: 'power1.out', onUpdate: writeStats }, 'b')
      .to(q('.beat-a'), { opacity: 0, y: -24, duration: 0.6 }, 'b+=.5');
    // phones: the counter pill sits on the phone's composer, so it leaves before the phone shrinks
    if (MOB) tl.to(statsEl, { opacity: 0, y: 12, duration: 0.3 }, 'b');
    tl
      .to(phone, { scale: 0.5, opacity: 0, duration: 1.1, ease: 'power2.in' }, 'b+=.4')
      .to([bursts, fly, ...floaties], { opacity: 0, duration: 0.6 }, 'b+=.4')
      .fromTo(tiles, { x: (i) => wall.pc.x - wall.pos[i].cx, y: (i) => wall.pc.y - wall.pos[i].cy, scale: 0.1, opacity: 0, rotation: 0 },
        { x: 0, y: 0, scale: 1, opacity: 1, rotation: (i) => wall.r[i], duration: 1.4, ease: 'power3.out', stagger: (i) => wall.d[i] * 0.9 }, 'b+=.8')
      .fromTo(q('.wall-text'), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.8 }, 'b+=1.6')
      .to({}, { duration: 0.6 }, 'b+=2.4');

    // C — lights out
    tl.addLabel('c', 11)
      .to(q('.wall-text'), { opacity: 0, scale: 1.04, duration: 0.5 }, 'c')
      .to(q('.tile .shade'), { opacity: 0.86, duration: 1.2, ease: 'none', stagger: { amount: 0.5, from: 'random' } }, 'c')
      .fromTo(q('.night-text'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 'c+=.5');

    // D — morning: best shots rise into the scrapbook, the rest stay in the album
    tl.addLabel('d', 14.2)
      .to(q('.night-text'), { opacity: 0, y: -24, duration: 0.8 }, 'd+=.4')
      .to(others, { x: (i, t) => wall.pile.x - wall.pos[tiles.indexOf(t)].cx, y: (i, t) => wall.pile.y - wall.pos[tiles.indexOf(t)].cy, scale: 0.25, opacity: 0, rotation: () => rand(-20, 20), duration: 1.3, ease: 'power2.in', stagger: { amount: 1, from: 'random' } }, 'd')
      .to(keepers.map((k) => $('.shade', k)), { opacity: 0, duration: 0.8 }, 'd+=.4')
      .to(keepers, { left: (i) => wall.slots[i].x, top: (i) => wall.slots[i].y, width: (i) => wall.slots[i].w, height: (i) => wall.slots[i].h, rotation: (i) => wall.slots[i].r, duration: 2, ease: 'power3.inOut', stagger: 0.12 }, 'd+=.5')
      .fromTo(q('.sb-card'), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1.2 }, 'd+=1.2')
      .addLabel('dd', 'd+=1.8')
      .fromTo(q('.beat-d'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 'd+=1.8')
      .fromTo(q('.tile .tape'), { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12 }, 'd+=2.6')
      .fromTo(q('.tile .badge'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, 'd+=3.1');

    // E — the lock screen at 9:40: the scrapbook dims behind the glass and the face-match
    // pushes (the real copy the backend sends) drop in one by one, main first.
    // The headline leaves and the glass dims first, then the clock, then the pushes — never
    // three layers of type on top of each other.
    tl.addLabel('e', 18.6)
      .to(q('.beat-d'), { opacity: 0, y: -16, duration: 0.3 }, 'e')
      .fromTo(q('.ls-dim'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none' }, 'e')
      .fromTo(q('.notif-stack'), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 'e+=.34')
      .fromTo(q('.ls-clock'), { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 'e+=.36')
      .fromTo(q('.notif'), { y: -40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, stagger: 0.18, duration: 0.5, ease: 'back.out(1.4)' }, 'e+=.5')
      .to({}, { duration: 1.3 }, 'e+=1');

    register(id, tl, [[0, T(23, 52)], [7.8, T(1, 6, 1)], [11, T(1, 50, 1)], [12.8, T(4, 12, 1)], [14.2, T(4, 40, 1)], [18.1, T(9, 38, 1)], [tl.duration(), T(9, 40, 1)]], REDUCED ? still(tl, sec, stillT) : undefined);
  }

  /* ───────────────────────── 9:41 AM — STAMP (real passport) ───────────────────────── */
  const PCSS = await (await fetch('/site/vendor/pxi-passport.css')).text();
  if (!L.alive) return;
  const shadowMount = (host) => { const root = host.attachShadow({ mode: 'open' }); root.innerHTML = `<style>${PCSS}</style><div class="m"></div>`; return { root, mount: $('.m', root) }; };
  const MAYA = { id: 'MAYA426L', name: 'Maya Laurent', username: 'maya.lrnt', city: 'Brooklyn', bio: 'Rooftops, film cameras, front row.', instagramHandle: 'maya.lrnt', age: 21, isVendor: true, isPassportIssued: true, odysseyXp: 6800, avatarUrl: '/landing/assets/maya_profile_new.jpg', createdAt: '2024-09-14T00:00:00.000Z' };
  const STAMP_EVENTS = [
    { id: 'st-1', name: 'AFRODISIAC', location: 'Boston, MA', startDate: '2026-05-16', ticketPriceUsd: 30, albumRole: 'MEMBER' },
    { id: 'st-2', name: 'MAISON BLANCHE', location: 'Manhattan, NY', startDate: '2026-02-21', ticketPriceUsd: 140, albumRole: 'OWNER' },
    { id: 'st-4', name: 'ROOFTOP CINÉ', location: 'Brooklyn, NY', startDate: '2026-06-05', ticketPriceUsd: 65, albumRole: 'ADMIN' },
    { id: 'st-6', name: 'GALA NOIR', location: 'Manhattan, NY', startDate: '2026-03-14', ticketPriceUsd: 220, albumRole: 'OWNER' },
    { id: 'st-7', name: 'RUN CLUB 5AM', location: 'Somerville, MA', startDate: '2026-06-21', ticketPriceUsd: 0, albumRole: 'MEMBER' },
    { id: 'st-9', name: 'SUNSET TERRACE', location: 'Queens, NY', startDate: '2026-07-12', ticketPriceUsd: 0, albumRole: 'MEMBER' },
    { id: 'st-10', name: 'VELVET HOUR', location: 'Boston, MA', startDate: '2026-08-08', ticketPriceUsd: 95, albumRole: 'ADMIN' },
    { id: 'st-12', name: 'DIPLOMAT GALA', location: 'Back Bay, MA', startDate: '2026-09-19', ticketPriceUsd: 180, albumRole: 'OWNER' },
    { id: 'st-new', name: 'LATE CHECKOUT', location: 'Seaport, Boston', startDate: '2026-10-02', ticketPriceUsd: 120, albumRole: 'MEMBER', xp: 9000 },
  ];
  const SLAM_ORDER = ['st-7', 'st-9', 'st-10', 'st-12']; // the season's latest four land live, oldest first
  const NEW_IDX = STAMP_EVENTS.length - 1;
  const { h, PxiPassportCard, HeaderPolygonBadge } = window.PXI;

  const ppHost = $('.passport-host');
  const pp = shadowMount(ppHost);
  {
    // - no XP numbers (claim policy): the tier name + bar carry the level, the "xp/max" column goes
    // - the card is w-[min(95vw,361px)]; inside the scaled stage 95vw undersizes it on 360px phones,
    //   so pin it to the host's 361 design px and centre it
    const ov = document.createElement('style');
    ov.textContent = `.bottom-\\[70px\\]{bottom:14px!important}.pr-12{padding-right:14px!important}.min-h-0.flex-1.bg-\\[\\#0a0a0a\\]{flex:1.16 1 0%}.top-1\\/2.z-20.h-12{top:53.7%}` +
      '.ml-2.shrink-0.text-right{display:none!important}.m{display:flex;justify-content:center}.m>div:first-child{width:361px!important;max-width:none!important}';
    pp.root.appendChild(ov);
  }
  const ppRoot = L.root(pp.mount);
  const renderPassport = (xp) => ppRoot.render(h(PxiPassportCard, { user: { ...MAYA, odysseyXp: xp }, attendedEvents: STAMP_EVENTS, animateStamps: false }));
  // The stamp map lays its stamps out from getBoundingClientRect(), which includes the stage's
  // fit-to-screen scale — at 0.4 (landscape phone) every stamp bunched into the top-left corner.
  // Mount at scale 1 so the layout is in design px at every screen size, then restore the fit.
  const ppStage = ppHost.closest('.stage'), ppFit = ppStage.style.transform;
  ppStage.style.transform = 'translate(-50%, -50%)';
  renderPassport(MAYA.odysseyXp);
  let stampEls = [];
  for (let tries = 0; tries < 80; tries++) {
    await wait(50);
    if (!L.alive) return;
    stampEls = $$('div[style*="drop-shadow"]', pp.root).filter((d) => d.querySelector('svg'));
    if (stampEls.length >= STAMP_EVENTS.length) break;
  }
  await wait(60); // one more frame for the map's measure → layout pass
  if (!L.alive) return;
  ppStage.style.transform = ppFit;
  // the new stamp is the solid white wax seal: a brighter halo than the other stamps' 6px tint
  const STAMP_GLOW = 'drop-shadow(0 0 3px rgba(255,255,255,.9)) drop-shadow(0 0 14px rgba(255,255,255,.55)) drop-shadow(0 0 30px rgba(216,74,255,.55))';
  // (re-applied on refresh: the map's later fit passes can rewrite the stamp's SVG)
  const whiteSeal = () => {
    const el = stampEls[NEW_IDX]; if (!el) return '';
    el.style.filter = STAMP_GLOW;
    const seal = $$('circle', el);
    if (seal[0]) seal[0].setAttribute('fill', '#fff');
    $$('text', el).forEach((t) => t.setAttribute('fill', '#1d0c26'));
    const c = el.cloneNode(true), art = c.firstElementChild; // drop the slam tween's opacity/scale
    if (art) { art.style.opacity = ''; art.style.transform = ''; art.style.translate = ''; art.style.scale = ''; }
    return c.innerHTML;
  };
  whiteSeal();
  // the level badge (real HeaderPolygonBadge): ring = progress through the current tier
  const badge = shadowMount($('.badge-host'));
  const badgeRoot = L.root(badge.mount);
  const tierOf = (xp) => { const t = window.PXI.getOdysseyTierFromXp(xp); return { ...t, theme: window.PXI.getPassportLevelBadgeTheme(t.id) }; };
  const renderBadge = (xp) => { const t = tierOf(xp); badgeRoot.render(h(HeaderPolygonBadge, { letter: t.badgeLetter, progress: window.PXI.getLevelProgress(xp), hexFill: t.theme.fill, hexStroke: t.theme.stroke, ringMuted: t.theme.ringMuted, ringBright: t.theme.ringBright })); };

  function initStamp() {
    const sec = $('#stamp'), q = gsap.utils.selector(sec), stage = $('.stage', sec), stub = $('.stub-fly', sec);
    stub.innerHTML = `<div class="clipper">${ticketHTML(false)}</div>`;
    const inner = (el) => el.firstElementChild || el;
    const newEl = inner(stampEls[NEW_IDX]);
    const slamEls = SLAM_ORDER.map((id) => inner(stampEls[STAMP_EVENTS.findIndex((e) => e.id === id)]));
    gsap.set([...slamEls, newEl], { opacity: 0 });
    const specksHost = $('.specks', sec);
    specksHost.innerHTML = Array.from({ length: 12 }, () => '<i></i>').join('');
    const specks = $$('i', specksHost);
    const speckV = specks.map((_, i) => { const a = (i / specks.length) * Math.PI * 2 + rand(-0.2, 0.2), d = rand(60, 110); return { x: Math.cos(a) * d, y: Math.sin(a) * d }; });

    // new stamp centre → stage coords + scene coords
    const pos = { sx: 0, sy: 0, x: 0, y: 0, s: 1 };
    const layoutStamp = () => {
      // measure with the passport at rest (the scrubbed entrance tilts and offsets it)
      const was = ppHost.style.transform;
      ppHost.style.transform = 'scale(1.3)';
      const r = stampEls[NEW_IDX].getBoundingClientRect(), sr = stage.getBoundingClientRect(), cr = sec.getBoundingClientRect();
      ppHost.style.transform = was;
      const s = sr.width / (stage._w || +stage.dataset.w);
      pos.sx = (r.left + r.width / 2 - sr.left) / s; pos.sy = (r.top + r.height / 2 - sr.top) / s;
      pos.x = r.left + r.width / 2 - cr.left; pos.y = r.top + r.height / 2 - cr.top; pos.s = s;
      gsap.set([q('.ink-ring'), specksHost], { left: pos.sx, top: pos.sy });
      // "+250 points" sits over the map on the far side of the new stamp, clear of the stage edge
      const below = pos.sy < 190;
      gsap.set(q('.xp-float'), { left: ppHost.offsetLeft + 361 * 0.65, top: pos.sy + (below ? 100 : -100) });
      gsap.set(stub, { left: pos.x - 51, top: pos.y - 94 });
    };
    layoutStamp();
    L.on(ScrollTrigger, 'refresh', layoutStamp);

    // Badge ring, tier name, bar and the passport's LEVEL row all read one value (no XP numbers:
    // claim policy). The growth is exaggerated on purpose: Voyager (4,001–18,000) opens ~20% full
    // and each stamp moves it a lot.
    const xp = { v: MAYA.odysseyXp };
    let lastXp = -1;
    const tierEl = $('.lvl-tier', sec), barEl = $('.lvl-bar i', sec);
    const writeXP = () => {
      const v = Math.round(xp.v);
      if (v === lastXp) return; lastXp = v;
      const t = tierOf(v);
      tierEl.textContent = t.label; tierEl.style.color = t.theme.ringBright;
      barEl.style.transform = `scaleX(${window.PXI.getLevelProgress(v)})`; barEl.style.background = t.theme.ringBright;
      renderBadge(v); renderPassport(v);
    };
    writeXP();

    const tl = gsap.timeline({ paused: REDUCED, scrollTrigger: pinST(sec, 3.2, 0.6, { invalidateOnRefresh: true }) });
    gsap.set(ppHost, { scale: 1.3, transformOrigin: '0 0' });
    tl.fromTo(ppHost, { y: 90, rotationX: 24, opacity: 0, transformPerspective: 1400 }, { y: 0, rotationX: 0, opacity: 1, duration: 1.3, ease: 'power3.out' }, 0)
      .from(q('.lvl'), { y: 16, opacity: 0, duration: 0.7 }, 0.4);
    slamEls.forEach((el, i) => {
      const t = 1.5 + i * 0.65;
      tl.fromTo(el, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: 'power4.in' }, t)
        .to(ppHost, { keyframes: { x: [0, -3, 2, -1, 0] }, duration: 0.2, ease: 'none' }, t + 0.28)
        .to(xp, { v: MAYA.odysseyXp + 2350 * (i + 1), duration: 0.3, onUpdate: writeXP }, t + 0.28);
    });
    const tn = 5.9;
    tl.fromTo(stub, { x: () => innerWidth * 0.25, y: () => -(pos.y + 380), rotation: 34, scale: () => pos.s * 1.2, opacity: 1 },
      { x: 0, y: () => -34 * pos.s, rotation: -8, scale: () => pos.s * 1.35, duration: 1.3, ease: 'power3.out' }, 4.4)
      .to(stub, { y: () => -52 * pos.s, scale: () => pos.s * 1.45, duration: 0.4, ease: 'power1.out' }, tn - 0.4)
      .to(stub, { y: 0, scale: () => pos.s * 0.9, opacity: 0, duration: 0.16, ease: 'power3.in' }, tn)
      .fromTo(newEl, { scale: 3.4, opacity: 0 }, { scale: 1.3, opacity: 1, duration: 0.3, ease: 'power4.in' }, tn - 0.08)
      .fromTo(q('.ink-ring'), { scale: 0.3, opacity: 1 }, { scale: 2.4, opacity: 0, duration: 0.7, ease: 'power2.out', immediateRender: false }, tn + 0.22)
      .fromTo(specks, { x: 0, y: 0, opacity: 1, scale: 1 }, { x: (i) => speckV[i].x, y: (i) => speckV[i].y, opacity: 0, scale: 0.4, duration: 0.6, ease: 'power2.out', immediateRender: false }, tn + 0.22)
      .to(ppHost, { keyframes: { x: [0, -8, 6, -4, 2, 0], y: [0, 4, -2, 1, 0, 0] }, duration: 0.36, ease: 'none' }, tn + 0.22)
      // "+250 points": the outline arrives, then the gradient rises through the letters
      .fromTo(q('.xp-float'), { y: 18, scale: 0.92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' }, tn + 0.3)
      .fromTo(q('.xp-float'), { '--lvl': 0, '--wx': 0 }, { '--lvl': 1, '--wx': -320, duration: 1.1, ease: 'power1.inOut' }, tn + 0.45)
      // the bar tops out as the points pour in, then the passport turns Pathfinder
      .to(xp, { v: 18000, duration: 0.8, ease: 'power1.in', onUpdate: writeXP }, tn + 0.45)
      .to(xp, { v: 19200, duration: 0.3, onUpdate: writeXP }, tn + 1.3)
      // level up: a soft flash behind the badge and a small pulse, no pill
      .fromTo(q('.lvl-burst'), { scale: 0.4, opacity: 0 }, { keyframes: { scale: [0.4, 1.3, 1.7], opacity: [0, 0.9, 0] }, duration: 0.9, ease: 'none', immediateRender: false }, tn + 1.3)
      .fromTo(q('.lvl-badge'), { scale: 1 }, { keyframes: { scale: [1, 1.14, 1] }, duration: 0.5, ease: 'none', immediateRender: false }, tn + 1.3)
      .to(q('.xp-float'), { y: -24, opacity: 0, duration: 0.45, ease: 'power1.in' }, tn + 2.1)
      .to({}, { duration: 0.7 }, tn + 2.55);
    register('stamp', tl, [[0, T(9, 41, 1)], [tl.duration(), T(9, 44, 1)]], REDUCED ? still(tl, sec) : undefined);
  }

  /* ───────────────────────── 10:02 AM — POST (InstaShare polaroid → story) ───────────────────────── */
  function initPost() {
    const sec = $('#post'), q = gsap.utils.selector(sec);
    buildPhone($('.post-phone', sec));
    $('.ig-head img', sec).src = '/landing/assets/maya_profile_new.jpg';
    $('.ig-chrome', sec).insertAdjacentHTML('afterbegin', `<div class="ig-sb">${sbar('10:02', true)}</div>`);
    // sticker: the exact stamp artwork the passport just printed
    const st = shadowMount($('.sticker-stamp', sec));
    const src = stampEls[NEW_IDX], ar = src.offsetHeight / src.offsetWidth;
    const sw = $('.sticker-stamp', sec).offsetWidth;
    // copied from the live stamp once its text has been fitted (fonts can land after boot)
    const paintSticker = () => { st.mount.innerHTML = `<div style="width:${sw}px;height:${Math.round(sw * ar)}px;filter:${STAMP_GLOW}">${whiteSeal()}</div>`; };
    paintSticker();
    L.on(ScrollTrigger, 'refresh', paintSticker);
    const tl = gsap.timeline({ paused: REDUCED, scrollTrigger: pinST(sec, 2.6) });
    // the print arrives with its canvas, so the pin never opens on an empty blurred card
    tl.from(q('.canvas'), { y: 60, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0)
      .from(q('.polaroid-print'), { y: -50, rotation: -10, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.04)
      .from(q('.sticker-stamp'), { scale: 2, opacity: 0, rotation: 30, duration: 0.3, ease: 'power4.in' }, 1.0)
      .from(q('.rx-pill'), { scale: 0, opacity: 0, stagger: 0.12, duration: 0.3, ease: 'back.out(2)' }, 1.3)
      .from(q('.cm-stack'), { opacity: 0, duration: 0.3 }, 1.5)
      .from(q('.cm'), { y: 14, opacity: 0, stagger: 0.16, duration: 0.4, ease: 'power3.out' }, 1.6)
      .from(q('.ig-btn'), { y: 20, opacity: 0, duration: 0.5 }, 1.8)
      .to(q('.ig-btn'), { scale: 0.95, duration: 0.15 }, 2.6).to(q('.ig-btn'), { scale: 1, duration: 0.2 }, 2.75)
      .fromTo(q('.ig-btn .ripple'), { scale: 0, opacity: 0.7 }, { scale: 9, opacity: 0, duration: 0.6, immediateRender: false }, 2.6)
      .to(q('.ig-btn'), { opacity: 0, y: 16, duration: 0.4 }, 3.0)
      // the print becomes the story: the phone closes around it
      .fromTo(q('.post-phone'), { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 3.1)
      .to(q('.canvas'), { borderRadius: 38.4, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.8 }, 3.1)
      .fromTo(q('.ig-chrome'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 3.6)
      .fromTo(q('.ig-bars .run b'), { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: 'none' }, 3.8)
      .to({}, { duration: 0.6 }, 6);
    register('post', tl, [[0, T(10, 2, 1)], [tl.duration(), T(10, 5, 1)]], REDUCED ? still(tl, sec) : undefined);
  }

  /* ───────────────────────── FINALE ───────────────────────── */
  function initFinale() {
    const sec = $('#finale');
    const st = ScrollTrigger.create({ trigger: sec, start: 'top 90%', end: 'top 15%', scrub: true });
    register('finale', null, [[0, T(10, 5, 1)], [1, T(22, 0, 7)]], st);
    // "fan the deck" — the live EditorialStrip motion, on desktop only. Phones and tablets
    // (<=860px) get a flat, swipeable scroll-snap rail (no rotation, nothing clipped at the
    // edges). gsap.matchMedia reverts each mode's inline transforms when the other takes over.
    const BASE = [{ r: -7, y: 26 }, { r: 0, y: 0 }, { r: 7, y: 26 }];
    const cards = $$('.story');
    const RAIL = '(max-width: 860px)', DECK = '(min-width: 861px)';
    const mm = L.mm();
    const replay = $('.replay'); // the last thing in the finale, right before the footer
    if (replay) replay.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
    if (REDUCED) { mm.add(DECK, () => { gsap.set(cards, { y: (i) => BASE[i].y, rotation: (i) => BASE[i].r }); }); return; }
    gsap.from(['.finale .display-xl', '.finale > .lead', '.finale > .ctas'], { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: sec, start: 'top 70%', toggleActions: 'play none none reverse' } });
    gsap.from('.stories-head > *', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.stories', start: 'top 85%', toggleActions: 'play none none reverse' } });
    mm.add(RAIL, () => {
      gsap.from(cards, { x: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.story-fan', start: 'top 88%', toggleActions: 'play none none reverse' } });
    });
    mm.add(DECK, () => {
      gsap.fromTo(cards, { y: 150, opacity: 0, rotation: (i) => BASE[i].r * 2.4 }, { y: (i) => BASE[i].y, opacity: 1, rotation: (i) => BASE[i].r, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.story-fan', start: 'top 88%', toggleActions: 'play none none reverse' } });
      if (!FINE) return undefined;
      const off = cards.map((c, i) => {
        const lift = () => gsap.to(c, { y: BASE[i].y - 24, rotation: 0, scale: 1.05, duration: 0.5, ease: 'expo.out' });
        const drop = () => gsap.to(c, { y: BASE[i].y, rotation: BASE[i].r, scale: 1, duration: 0.6, ease: 'expo.out' });
        c.addEventListener('mouseenter', lift); c.addEventListener('mouseleave', drop);
        c.addEventListener('focus', lift); c.addEventListener('blur', drop);
        return () => { c.removeEventListener('mouseenter', lift); c.removeEventListener('mouseleave', drop); c.removeEventListener('focus', lift); c.removeEventListener('blur', drop); };
      });
      return () => off.forEach((f) => f());
    });
    gsap.from('.org', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.org', start: 'top 90%', toggleActions: 'play none none reverse' } });
  }

  /* ───────────────────────── boot ───────────────────────── */
  L.on(ScrollTrigger, 'refreshInit', fitStages);
  initHero();
  initDoors();
  initCamera();
  if (REDUCED) {
    const d = rollCopy('roll-d'), e = rollCopy('roll-e');
    $('#roll').after(d, e);
    initRoll($('#roll'), 'roll', 7.6); // every shot landed in the thread
    initRoll(d, 'roll-d', 18.5);       // the morning scrapbook
    initRoll(e, 'roll-e', null);       // the lock-screen pushes
  } else initRoll();
  initStamp();
  initPost();
  initFinale();
  initClock();
  const refresh = () => { fitStages(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  L.on(window, 'load', refresh);
  refresh();
  // back from a breakpoint reload: return to the same point of the night
  let savedRatio = null;
  try { savedRatio = sessionStorage.getItem(SCROLL_KEY); sessionStorage.removeItem(SCROLL_KEY); } catch { /* storage blocked */ }
  if (savedRatio !== null && isFinite(+savedRatio)) requestAnimationFrame(() => window.scrollTo(0, +savedRatio * (document.documentElement.scrollHeight - innerHeight)));
}
