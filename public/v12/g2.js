// PXI v9, guest feature pages part two. Every interaction answers a tap; nothing flies outside its own object.
(() => {
  const P = window.PXI;
  if (!P) return;
  const { $, $$, once, seen, ticker, tap, restart, reduce, pick } = P;
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const make = (html) => { const w = document.createElement('div'); w.innerHTML = html.trim(); return w.firstElementChild; };
  // FLIP: remember where each element is, change the order, and slide each one from the old spot to the new
  const flip = (els, change) => {
    const was = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
    change();
    if (reduce) return;
    els.forEach((el) => {
      const a = was.get(el), b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 600, easing: EASE });
    });
  };

  // ---------------------------------------------------- the PXI camera: the shutter drops the shot on the polaroid, then the next friend's phone
  $$('[data-g2-cam]').forEach((cm) => {
    const phones = JSON.parse(cm.dataset.phones), body = $('[data-body]', cm), view = $('[data-view]', cm), frames = $$('.g2-cm-f', cm), items = $$('[data-ph]', cm);
    const who = $('[data-cwho]', cm), wname = $('[data-wname]', cm), wsub = $('[data-wsub]', cm), pol = $('[data-pol]', cm), polImg = $('img', pol);
    const shutter = $('[data-shutter]', cm), flashEl = $('[data-flash]', cm), focus = $('[data-focus]', cm), fbtn = $('[data-flashbtn]', cm);
    const zoomBtns = $$('[data-z]', cm), SCALE = { 0.5: 1, 1: 1.08, 3: 1.45 };
    const flashOf = phones.map((p) => p.flash);
    let cur = 0, touched = false;
    const setZoom = (z) => {
      zoomBtns.forEach((b) => b.classList.toggle('on', +b.dataset.z === z));
      frames[cur].style.setProperty('--zs', SCALE[z]);
    };
    const setFlash = () => {
      const f = flashOf[cur];
      fbtn.classList.toggle('on', f === 'on'); fbtn.classList.toggle('auto', f === 'auto'); fbtn.setAttribute('aria-label', `Flash ${f}`);
    };
    const show = (i) => {
      const p = phones[i];
      cur = i;
      body.dataset.p = i;   // the phone changes: colour, corners, island or notch, size
      frames.forEach((f, j) => f.classList.toggle('on', j === i));
      items.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-pressed', String(j === i)); });
      who.classList.add('swap');
      setTimeout(() => { wname.textContent = `@${p.who}’s ${p.model}`; wsub.textContent = p.t; who.classList.remove('swap'); }, reduce ? 0 : 280);
      view.style.setProperty('--fx', p.fx + '%'); view.style.setProperty('--fy', p.fy + '%');
      setZoom(p.zoom); setFlash();
      restart(focus, 'lock');
    };
    const shoot = (next) => {
      const f = flashOf[cur], fires = f === 'on' || f === 'auto';
      flashEl.classList.toggle('dim', !fires); restart(flashEl, 'go');
      restart(shutter, 'press'); setTimeout(() => shutter.classList.remove('press'), 160);
      polImg.src = phones[cur].src; restart(pol, 'pop');   // the newest shot lands on the polaroid
      if (next !== false) setTimeout(() => show((cur + 1) % phones.length), reduce ? 0 : 420);
    };
    shutter.addEventListener('click', () => { touched = true; shoot(); });
    items.forEach((b, j) => b.addEventListener('click', () => { touched = true; if (j !== cur) show(j); }));
    zoomBtns.forEach((b) => b.addEventListener('click', () => { touched = true; setZoom(+b.dataset.z); }));
    fbtn.addEventListener('click', () => { touched = true; flashOf[cur] = { off: 'on', on: 'auto', auto: 'off' }[flashOf[cur]]; setFlash(); });
    $('[data-flip]', cm).addEventListener('click', () => { touched = true; view.classList.toggle('front'); });
    view.style.setProperty('--fx', phones[0].fx + '%'); view.style.setProperty('--fy', phones[0].fy + '%');
    setZoom(phones[0].zoom); setFlash();
    ticker(cm, () => { if (!touched) shoot(); }, 3400, 0.4);
    seen(cm, (v) => { if (v) restart(focus, 'lock'); }, 0.5);
  });

  // ---------------------------------------------------- the deck of prints: reactions stick to the edge, tap or swipe for the next
  $$('[data-g2-deck]').forEach((dk) => {
    const stack = $('.g2-stack', dk), SP = ['r1', 'l1', 'r2', 'l2', 'r3', 'l3'];   // down both side edges
    const top = () => stack.lastElementChild;
    let idle = true, busy = false;
    const bump = (s) => { const b = $('b', s); b.textContent = +b.textContent + 1; restart(s, 'bump'); };
    const react = (emo) => {
      const card = top(), stickers = $$('.g2-st', card), has = stickers.find((s) => s.dataset.e === emo);
      if (has) return bump(has);
      const used = stickers.map((s) => [...s.classList].find((c) => c.startsWith('at-')));
      const free = SP.filter((p) => !used.includes('at-' + p));
      if (!free.length) return bump(pick(stickers));
      const s = document.createElement('span');
      s.className = 'g2-st at-' + pick(free); s.dataset.e = emo; s.innerHTML = `<span class="e">${emo}</span><b>1</b>`;
      card.append(s); restart(s, 'pop');
    };
    const next = (dir = 1) => {
      if (busy) return; busy = true;
      const t = top();
      t.style.setProperty('--gx', dir > 0 ? '50%' : '-50%'); t.classList.add('gone');
      setTimeout(() => { t.classList.remove('gone'); stack.prepend(t); busy = false; }, reduce ? 0 : 450);
    };
    $$('[data-rx]', dk).forEach((b) => b.addEventListener('click', () => { idle = false; react(b.dataset.rx); }));
    $('[data-next]', dk).addEventListener('click', () => { idle = false; next(); });
    let x0 = null;
    stack.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    stack.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; idle = false; next(dx < -8 ? -1 : 1); });
    stack.addEventListener('pointercancel', () => { x0 = null; });
    const emos = $$('[data-rx]', dk).map((b) => b.dataset.rx);
    let n = 0;
    ticker(dk, () => { if (!idle) return; if (n++ % 3 === 2) next(); else react(emos[(n * 3) % emos.length]); }, 2200, 0.4);
  });

  // ---------------------------------------------------- the contact sheet: tap a frame
  $$('[data-g2-sheet]').forEach((s) => {
    const frs = $$('.g2-fr', s), cap = $('[data-scap]', s);
    frs.forEach((f) => f.addEventListener('click', () => {
      frs.forEach((x) => { x.classList.toggle('on', x === f); x.setAttribute('aria-pressed', String(x === f)); });
      cap.textContent = `Shot on @${f.dataset.w}'s phone, ${f.dataset.t}`;
    }));
  });

  // ---------------------------------------------------- Night Wrap: bars, tap right or left, auto-advance
  $$('[data-g2-wrap]').forEach((w) => {
    const f = $('.g2-wf', w), slides = $$('.g2-ws', w), bars = $$('.g2-wb i', w), n = slides.length;
    let cur = 0;
    const show = (i) => {
      cur = (i + n) % n;
      slides.forEach((s, j) => s.classList.toggle('on', j === cur));
      bars.forEach((b, j) => { b.classList.remove('cur'); b.classList.toggle('done', j < cur); });
      void f.offsetWidth; bars[cur].classList.add('cur');
    };
    bars.forEach((b, j) => $('b', b).addEventListener('animationend', () => { if (j === cur && !reduce) show(cur + 1); }));
    $('[data-next]', w).addEventListener('click', () => show(cur + 1));
    $('[data-prev]', w).addEventListener('click', () => show(cur - 1));
    f.classList.add('paused'); show(0);
    seen(f, (v) => f.classList.toggle('paused', !v || document.hidden), 0.4);
    document.addEventListener('visibilitychange', () => f.classList.toggle('paused', document.hidden));
  });

  // ---------------------------------------------------- the album: Your night | Everyone, who shot a photo, and the thread beside it
  $$('[data-g2-album]').forEach((al) => {
    // The app's album, played like a video. Each step is a state of the screen; the finger taps what moves it on. A tap of your own
    // jumps to that step, and it plays on from there.
    const ph = JSON.parse(al.dataset.photos), scr = $('[data-scr]', al), list = $('[data-list]', al), grid = $('[data-grid]', al);
    const tabs = $$('[data-tab]', al), shots = $$('[data-view]', al), focus = $('[data-focus]', al), sheet = $('[data-sheet]', al), add = $('[data-add]', al), tp = $('[data-tp]', al);
    const rows = $$('[data-q]', list);
    let k = 'you2', step = 0, timer = 0, live = false;
    const STEPS = [   // [what the screen shows, how long, what the finger taps to move on]
      ['thread', 1500], ['q1', 1500], ['q2', 1300], ['q3', 1300], ['q4', 1800, () => $('[data-tab="gallery"]', al)],
      ['gallery', 2200, () => $('[data-view="yours"]', al)], ['mine', 2000, () => $('.g2-al-tile.me[data-k="you2"] [data-pic]', al)],
      ['focus', 2000, () => $('[data-who]', al)], ['card', 1400, () => add], ['added', 2200],
    ];
    const at = (n) => STEPS.findIndex((s) => s[0] === n);
    const tap = (el) => {   // the finger lands on what is tapped next
      if (!el || reduce) return;
      const a = el.getBoundingClientRect(), b = scr.getBoundingClientRect();
      tp.style.left = a.left - b.left + a.width / 2 + 'px'; tp.style.top = a.top - b.top + a.height / 2 + 'px';
      restart(tp, 'go');
    };
    const showFocus = () => {
      const p = ph[k], br = $('[data-fbr]', al);
      $('[data-fimg]', al).src = p.src; $('[data-fimg]', al).alt = `A photo from All Black Party, shot by @${p.who}`;
      $('[data-fav]', al).src = `/img/av2/${p.who}.webp`; $('[data-fname]', al).textContent = `@${p.who}`; $('[data-ftime]', al).textContent = p.t;
      $('[data-frx]', al).innerHTML = p.rx.map(([e, n]) => `<span class="g2-al-chip"><i class="e">${e}</i><b>${n}</b></span>`).join('');
      br.hidden = !p.me;
      if (p.me) { const [x, y, w, h] = p.box; Object.assign(br.style, { left: x * 100 + '%', top: y * 100 + '%', width: w * 100 + '%', height: h * 100 + '%' }); }
    };
    const show = (i) => {
      step = i;
      const n = STEPS[i][0], q = n.startsWith('q') ? +n.slice(1) : n === 'thread' ? 0 : 9;
      const view = q < 9 ? 'thread' : 'gallery';
      scr.dataset.view = view;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === view)));
      rows.forEach((r) => r.classList.toggle('in', +r.dataset.q <= q));
      const mine = ['mine', 'focus', 'card', 'added'].includes(n);
      scr.dataset.shots = mine ? 'mine' : 'all';
      shots.forEach((t) => t.setAttribute('aria-selected', String((t.dataset.view === 'yours') === mine)));
      focus.hidden = !['focus', 'card', 'added'].includes(n);
      if (!focus.hidden) showFocus();
      sheet.hidden = !['card', 'added'].includes(n);
      if (!sheet.hidden) { $('[data-cav]', al).src = `/img/av2/${ph[k].who}.webp`; $('[data-ch]', al).textContent = `@${ph[k].who}`; }
      add.classList.toggle('sent', n === 'added');
      if (n === 'added') restart(add, 'pop');
    };
    const run = () => {
      clearTimeout(timer);
      if (!live || reduce) return;
      const [, ms, next] = STEPS[step];
      if (next) timer = setTimeout(() => tap(next()), ms - 420);
      timer = setTimeout(() => { show((step + 1) % STEPS.length); run(); }, ms);
    };
    const go = (n) => { show(at(n)); run(); };   // a tap of your own: jump there, and play on
    tabs.forEach((t) => t.addEventListener('click', () => go(t.dataset.tab === 'thread' ? 'thread' : 'gallery')));
    shots.forEach((t) => t.addEventListener('click', () => go(t.dataset.view === 'yours' ? 'mine' : 'gallery')));
    grid.addEventListener('click', (e) => { const t = e.target.closest('.g2-al-tile'); if (!t) return; k = t.dataset.k; go(e.target.closest('[data-av]') ? 'card' : 'focus'); });
    list.addEventListener('click', (e) => { const o = e.target.closest('[data-open], [data-av]'); if (!o) return; k = o.dataset.open || o.dataset.av; go(o.dataset.av ? 'card' : 'focus'); });
    $('[data-who]', al).addEventListener('click', () => go('card'));
    $('[data-fclose]', al).addEventListener('click', () => go(scr.dataset.shots === 'mine' ? 'mine' : 'gallery'));
    $$('[data-sclose]', sheet).forEach((b) => b.addEventListener('click', () => go('focus')));
    add.addEventListener('click', () => go('added'));
    show(0);
    // the gallery's photos wait off to the side, where lazy loading never sees them: load them once the album is in view
    once(al, () => $$('img[loading="lazy"]', scr).forEach((i) => { i.loading = 'eager'; }), 0.05);
    seen(al, (v) => { live = v; if (v) run(); else clearTimeout(timer); }, 0.4);
  });

  // ---------------------------------------------------- a year of scrapbooks: tap a cover on the timeline and its shots land below
  $$('[data-g2-sb]').forEach((sb) => {
    const books = JSON.parse(sb.dataset.books), covers = $$('[data-book]', sb), strip = $('.g2-sb-tl', sb), closed = $('[data-closed]', sb);
    const sets = $$('[data-set]', sb), live = covers.filter((c) => books[c.dataset.book].live).map((c) => c.dataset.book);
    const SP = ['tr', 'tl', 'br', 'bl', 'lm', 'rm'];
    let cur = sb.dataset.start, touched = false;
    const center = (c) => {   // phones: the timeline is a row you swipe; bring the cover to the middle
      if (strip.scrollWidth <= strip.clientWidth + 1) return;
      const a = c.getBoundingClientRect(), b = strip.getBoundingClientRect();
      strip.scrollTo({ left: strip.scrollLeft + a.left - b.left - (b.width - a.width) / 2, behavior: reduce ? 'auto' : 'smooth' });
    };
    const select = (id) => {
      cur = id;
      const bk = books[id];
      covers.forEach((c) => { c.setAttribute('aria-pressed', String(c.dataset.book === id)); });
      $$('.g2-sb-mo', sb).forEach((m) => m.classList.toggle('on', !!$('[aria-pressed="true"]', m)));
      $('[data-name]', sb).textContent = bk.name; $('[data-when]', sb).textContent = bk.when; $('[data-count]', sb).textContent = bk.live ? `${bk.n} photos` : 'No scrapbook';
      sets.forEach((st) => { st.hidden = st.dataset.set !== id; });
      closed.hidden = bk.live;
      if (bk.live) { const st = sets.find((x) => x.dataset.set === id); restart(st, 'in'); }
      else restart(closed, 'in');   // where its photos went instead
    };
    covers.forEach((c) => c.addEventListener('click', () => { touched = true; select(c.dataset.book); center(c); }));

    // tap a shot to react to it, as on the home roll
    const react = (card, emo) => {
      const has = $$('.g2-sb-st', card).find((s) => s.dataset.e === emo);
      if (has) { const b = $('b', has); b.textContent = +b.textContent + 1; restart(has, 'bump'); return; }
      const used = $$('.g2-sb-st', card).map((s) => [...s.classList].find((c) => c.startsWith('sp-')));
      const free = SP.filter((p) => !used.includes('sp-' + p));
      if (!free.length) { const s = pick($$('.g2-sb-st', card)), b = $('b', s); b.textContent = +b.textContent + 1; restart(s, 'bump'); return; }
      const s = document.createElement('span');
      s.className = `g2-sb-st sp-${pick(free)}`; s.dataset.e = emo; s.innerHTML = `<i class="e">${emo}</i><b>1</b>`;
      card.append(s); restart(s, 'pop');
    };
    $$('.g2-sb-card', sb).forEach((card) => card.addEventListener('click', () => {
      touched = true;
      const emo = pick(['😭', '🔥', '🫶', '😍', '✨']);
      const h = document.createElement('span'); h.className = 'g2-sb-heart'; h.textContent = emo;
      card.append(h); setTimeout(() => h.remove(), 850); react(card, emo);
    }));

    // until it is touched, the timeline opens one scrapbook after another
    ticker(sb, () => { if (!touched) { select(live[(live.indexOf(cur) + 1) % live.length]); center($(`[data-book="${cur}"]`, sb)); } }, 5200, 0.5);
    center($(`[data-book="${cur}"]`, sb));
  });

  // ---------------------------------------------------- spotted: the notification, then the boxes
  $$('[data-g2-spotted]').forEach((s) => {
    const note = $('.g2-note', s), cards = $$('[data-sp]', s);
    s.classList.add('arm');
    once(s, () => { restart(note, 'go'); cards.forEach((c, i) => setTimeout(() => restart(c, 'go'), 500 + i * 380)); }, 0.4);
    cards.forEach((c) => tap(c, () => restart(c, 'go')));
  });

  // ---------------------------------------------------- the story: the print slides into the frame
  $$('[data-g2-sty]').forEach((s) => {
    const fr = $('.g2-sf', s), w = $('.g2-spw', s), pr = $('.g2-sp-hero', s), btn = $('[data-share]', s), when = $('[data-when]', s);
    let auto = true, on = false;
    const measure = () => {
      const a = fr.getBoundingClientRect(), b = w.getBoundingClientRect();
      s.style.setProperty('--dx', (a.left + a.width / 2 - (b.left + b.width / 2)).toFixed(1) + 'px');
      s.style.setProperty('--dy', (a.top + a.height / 2 - (b.top + b.height / 2)).toFixed(1) + 'px');
      s.style.setProperty('--s', ((a.width * 0.86) / pr.offsetWidth).toFixed(3));
    };
    const set = (v) => {
      on = v; if (v) measure();
      s.classList.toggle('shared', v);
      btn.textContent = v ? 'Shared. Again?' : 'Share to story';
      when.textContent = v ? 'now' : 'Your story';
    };
    btn.addEventListener('click', () => { auto = false; set(!on); });
    ticker(s, () => { if (auto) set(!on); }, 3800, 0.4);
    addEventListener('resize', () => { if (on) measure(); });
  });

  // ---------------------------------------------------- what's on the print: tap a note and the piece lights up
  $$('[data-g2-print]').forEach((b) => {
    const notes = $$('.g2-pn', b);
    let auto = true, k = 0;
    const light = (n) => { notes.forEach((x) => x.classList.toggle('on', x === n)); $$(`[data-n="${n.dataset.t}"]`, b).forEach((e) => restart(e, 'hl')); };
    notes.forEach((n) => n.addEventListener('click', () => { auto = false; light(n); }));
    ticker(b, () => { if (auto) light(notes[k++ % notes.length]); }, 2200, 0.5);
  });
})();
