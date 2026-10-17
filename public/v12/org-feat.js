// Organizer feature pages v9: the behaviour of obj_of.py's objects. Uses window.PXI from objects.js.
(() => {
  const { $, $$, seen, once, ticker, tap, pick, restart, reduce } = window.PXI;

  // a card keeps its size: the panel that is not showing stays in the layout (class off: invisible, out of reach), never display:none
  const off = (el, v) => { el.classList.toggle('off', v); el.setAttribute('aria-hidden', String(v)); el.toggleAttribute('inert', v); };

  // tabs that swap panels inside one object (the event card)
  $$('[data-of-tabs]').forEach((o) => {
    const tabs = $$('[role="tab"]', o), panels = $$('[data-p]', o);
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      panels.forEach((p) => off(p, p.dataset.p !== t.dataset.t));
    }));
  });

  // per day / total
  $$('[data-of-switch]').forEach((o) => {
    const btns = $$('[data-s]', o), views = $$('[data-v]', o);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      views.forEach((v) => off(v, v.dataset.v !== b.dataset.s));
    }));
  });

  // the live control room: people keep coming in; a door can be paused
  $$('[data-of-live]').forEach((o) => {
    const inEl = $('[data-in]', o), meter = $('[data-meter]', o), vel = $('[data-vel]', o), feed = $('[data-feed]', o);
    const gates = $$('[data-gate]', o);
    const NAMES = [['ines', 'Ines A.'], ['jules', 'Jules R.'], ['tess', 'Tess M.'], ['nia', 'Nia B.'], ['zoe', 'Zoe K.'], ['lila', 'Lila S.'], ['margot', 'Margot L.'], ['ama', 'Ama O.'], ['dre', 'Dre W.'], ['kofi', 'Kofi B.']];
    let n = 287, minute = 42, k = 0;
    gates.forEach((g) => { const b = $('[data-pause]', g); b.addEventListener('click', () => { const p = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(p)); b.textContent = p ? 'Paused' : 'Open'; }); });
    const open = () => gates.filter((g) => $('[data-pause]', g).getAttribute('aria-pressed') !== 'true');
    const scan = () => {
      const og = open(); if (!og.length || n >= 400) return;
      const g = og[Math.random() < .75 ? 0 : og.length - 1], gn = $('[data-gn]', g);
      gn.textContent = +gn.textContent + 1; n++;
      inEl.textContent = n; meter.style.setProperty('--w', (n / 400 * 100).toFixed(2) + '%');
      const [a, name] = NAMES[k++ % NAMES.length];
      const li = document.createElement('li');
      li.innerHTML = `<img src="/img/av2/${a}.webp" alt="" width="160" height="160">${name}, ${$('b', g).textContent}<time>11:${String(minute++ % 60).padStart(2, '0')} PM</time>`;
      feed.prepend(li); while (feed.children.length > 4) feed.lastElementChild.remove();
      const bars = [...vel.children]; bars.forEach((b, i) => { if (i < bars.length - 1) b.style.setProperty('--h', bars[i + 1].style.getPropertyValue('--h')); });
      bars[bars.length - 1].style.setProperty('--h', `${40 + Math.round(Math.random() * 50)}%`);
    };
    for (let i = 0; i < 3; i++) scan();
    ticker(o, scan, 1300, 0.4);
  });

  // costs: log an expense and the profit updates (its row was already in the card, invisible, so the card keeps its size)
  $$('[data-of-money]').forEach((o) => {
    const btn = $('[data-log-exp]', o), row = $('[data-new]', o), costs = $('[data-costs]', o), profit = $('[data-profit]', o);
    const payout = +o.dataset.payout, base = +o.dataset.costTotal, extra = +o.dataset.expense;
    const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let added = false;
    btn.addEventListener('click', () => {
      if (added) return; added = true;
      row.classList.remove('off'); row.removeAttribute('aria-hidden'); row.classList.add('new');
      costs.textContent = `-$${fmt(base + extra)}`; profit.textContent = `$${fmt(payout - base - extra)}`;
      btn.textContent = 'Logged'; btn.disabled = true;
    });
  });

  // team: tap a badge to see what that role can do
  $$('[data-of-team]').forEach((o) => {
    const roles = JSON.parse(o.dataset.roles), badges = $$('[data-role]', o), perms = $$('[data-perm]', o), who = $('[data-who]', o), rn = $('[data-role-name]', o);
    let auto = true, cur = 0;
    const show = (i) => {
      cur = i; const r = roles[i];
      badges.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      who.textContent = r.name; rn.textContent = r.role;
      perms.forEach((p) => p.classList.toggle('on', r.perms.includes(p.dataset.perm)));
    };
    badges.forEach((b, i) => b.addEventListener('click', () => { auto = false; show(i); }));
    show(0);
    ticker(o, () => { if (auto) show((cur + 1) % roles.length); }, 2600, 0.5);
  });
})();

(() => {
  const { $, $$, once, seen, ticker, wait, restart, reduce } = window.PXI;
  const press = (btns, b) => btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const toggle = (b) => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); return on; };
  const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // a card keeps its size: what is not showing stays in the layout, invisible and out of reach (class off), never display:none
  const off = (el, v) => { el.classList.toggle('off', v); el.setAttribute('aria-hidden', String(v)); el.toggleAttribute('inert', v); };

  // campaigns: who, what, how much, what it sold (rates: 5 cents an email, 8 cents a text, $1 minimum)
  $$('[data-cq]').forEach((o) => {
    const OPT = { email: 151, text: 112 }, RATE = { email: .05, text: .08 }, NARROW = { paid: .62, two: .41, tier: .55, near: .8 };
    const f = new Set(); let ch = 'email';
    const el = (k) => $(`[data-${k}]`, o);
    const update = () => {
      let n = OPT[ch]; f.forEach((k) => { n *= NARROW[k]; }); n = Math.round(n);
      el('opt').textContent = n; el('count').textContent = n; el('rate').textContent = `at ${ch === 'email' ? 5 : 8}¢`;
      el('price').textContent = money(Math.max(1, n * RATE[ch])); el('chname').textContent = ch === 'email' ? 'emails' : 'texts';
      $$('[data-prev]', o).forEach((p) => off(p, p.dataset.prev !== ch));
      off(el('res'), true); off(el('send'), false); el('send').disabled = false; el('send').textContent = 'Send it';
    };
    $$('[data-f]', o).forEach((b) => b.addEventListener('click', () => { toggle(b) ? f.add(b.dataset.f) : f.delete(b.dataset.f); update(); }));
    $$('[data-ch]', o).forEach((b) => b.addEventListener('click', () => { ch = b.dataset.ch; press($$('[data-ch]', o), b); update(); }));
    el('send').addEventListener('click', async () => {
      const n = +el('count').textContent, btn = el('send'); btn.disabled = true; btn.textContent = 'Sending';
      await wait(reduce ? 0 : 600);
      off(el('send'), true); off(el('res'), false); $('[data-r2l]', o).textContent = ch === 'email' ? 'opened' : 'tapped the link';
      const goal = [Math.round(n * .98), Math.round(n * (ch === 'email' ? .61 : .24)), Math.round(n * (ch === 'email' ? .19 : .24))], outs = [el('r1'), el('r2'), el('r3')], t0 = performance.now();
      const step = (now) => { const p = reduce ? 1 : Math.min(1, (now - t0) / 1300); outs.forEach((x, i) => { x.textContent = Math.round(goal[i] * (1 - (1 - p) ** 3)); }); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    update();
  });

  // ads: where, who, how often, how long; the price and the reach follow (real rates; $5 minimum). On a phone the groups are tabs.
  $$('[data-ads]').forEach((o) => {
    const surf = $$('[data-surf]', o), ints = $$('[data-int]', o), days = $('[data-days]', o), tg = $$('[data-tg]', o);
    const tabs = $$('[data-adtab]', o), groups = $$('[data-g]', o);
    tabs.forEach((t) => t.addEventListener('click', () => { tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t))); groups.forEach((g) => g.classList.toggle('is-on', g.dataset.g === t.dataset.adtab)); }));
    const NARROW = { genre: .42, age: .55, city: .7, crowd: .3, came: .12 };
    const update = () => {
      const d = +days.value, it = +($$('[data-int]', o).find((b) => b.getAttribute('aria-pressed') === 'true') || ints[1]).dataset.int;
      const daily = surf.filter((b) => b.getAttribute('aria-pressed') === 'true').reduce((s, b) => s + +b.dataset.rate, 0);
      const cost = daily ? Math.max(5, daily * it * d) : 0;
      let reach = 18000 * (daily ? Math.min(1, .35 + daily / 20) : 0) * Math.min(1.6, .6 + d / 14) * (.7 + it * .3);
      tg.forEach((b) => { if (b.getAttribute('aria-pressed') === 'true') reach *= NARROW[b.dataset.tg]; });
      $$('[data-days-l]', o).forEach((x) => { x.textContent = `${d} day${d === 1 ? '' : 's'}`; });
      $('[data-cost]', o).textContent = money(cost); $('[data-reach]', o).textContent = Math.round(reach / 10) * 10 >= 1000 ? (Math.round(reach / 100) * 100).toLocaleString('en-US') : Math.round(reach / 10) * 10;
    };
    surf.forEach((b) => b.addEventListener('click', () => { toggle(b); update(); }));
    tg.forEach((b) => b.addEventListener('click', () => { toggle(b); update(); }));
    ints.forEach((b) => b.addEventListener('click', () => { press(ints, b); update(); }));
    days.addEventListener('input', update);
    update();
  });

  // what each send sold: a pin, a tab and the detail all say the same number, the same word and the same colour
  $$('[data-sends]').forEach((o) => {
    const sends = JSON.parse(o.dataset.sends), bars = $$('.sd-bar', o), pins = $$('[data-send]', o), tabs = $$('[data-send-btn]', o), wins = $$('[data-win]', o), wls = $$('[data-wl]', o), lines = $$('.sd-ln', o);
    const c = (k) => $(`[data-c="${k}"]`, o);
    let cur = 1, auto = true;
    const show = (k) => {
      cur = k; const s = sends[k];
      pins.forEach((m, i) => m.classList.toggle('on', i === k)); tabs.forEach((b, i) => b.setAttribute('aria-pressed', String(i === k)));
      wins.forEach((w, i) => w.classList.toggle('on', i === k)); wls.forEach((w, i) => w.classList.toggle('on', i === k)); lines.forEach((l, i) => l.classList.toggle('on', i === k));
      bars.forEach((b, i) => b.classList.toggle('hl', i >= s.day && i < s.day + 7)); o.dataset.ch = s.ch;
      const no = c('no'); no.className = `sd-no c-${s.ch}`; no.textContent = k + 1;
      c('name').textContent = `${s.label}, ${s.when}`; c('sub').textContent = s.sub; c('cost').textContent = s.cost; c('sold').textContent = `${s.sold} tickets`; c('back').textContent = s.back;
    };
    tabs.forEach((b, i) => b.addEventListener('click', () => { auto = false; show(i); }));
    pins.forEach((m, i) => m.addEventListener('click', () => { auto = false; show(i); }));
    show(1);
    ticker(o, () => { if (auto) show((cur + 1) % sends.length); }, 3400, 0.5);
  });

  // why it costs less: people walk both roads from the same ad. On the long one some give up at every step; on PXI they are signed in and just tap.
  $$('[data-paths]').forEach((o) => {
    const lanes = $$('[data-lane]', o);
    let busy = false, visible = false, auto = true;
    const spring = 'cubic-bezier(.3, 1.2, .5, 1)';
    const walk = async (lane) => {
      const road = $('.pa-road', lane), vertical = getComputedStyle($('.pa-steps', lane)).flexDirection === 'column', items = $$('.pa-i', lane), leaks = (lane.dataset.leaks || '').split(',').filter(Boolean).map(Number);
      const rr = road.getBoundingClientRect(), pt = (i) => { const r = items[i].getBoundingClientRect(); return [r.left + r.width / 2 - rr.left - 6, r.top + r.height / 2 - rr.top - 6]; };
      const dot = document.createElement('i'); dot.className = 'pa-dot'; road.append(dot);
      let [x, y] = pt(0);
      dot.animate([{ transform: `translate(${x}px, ${y}px) scale(0)` }, { transform: `translate(${x}px, ${y}px) scale(1)` }], { duration: 300, easing: spring, fill: 'forwards' });
      await wait(450);
      for (let i = 1; i < items.length; i++) {
        const [nx, ny] = pt(i);
        dot.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: `translate(${nx}px, ${ny}px)` }], { duration: 620, easing: spring, fill: 'forwards' });
        [x, y] = [nx, ny]; await wait(700);
        if (leaks.includes(i)) {   // somebody gives up here
          const g = document.createElement('i'); g.className = 'pa-dot pa-ghost'; road.append(g);
          g.animate([{ transform: `translate(${x}px, ${y}px)`, opacity: 1 }, { transform: `translate(${vertical ? x + 46 : x}px, ${vertical ? y : y + 46}px) scale(.4)`, opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.5, 0, .9, .5)', fill: 'forwards' }).finished.then(() => g.remove());
        }
        await wait(200);
      }
      restart(items[items.length - 1].parentElement, 'hit');
      await wait(700);
      dot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).finished.then(() => dot.remove());
    };
    const run = async () => { if (busy) return; busy = true; await Promise.all(lanes.map(walk)); await wait(900); busy = false; };
    seen(o, (v) => { visible = v; if (v && auto && !reduce) run(); }, .4);
    o.addEventListener('click', () => { if (reduce) return; auto = false; run(); });
    if (!reduce) setInterval(() => { if (visible && auto && !document.hidden) run(); }, 9000);
  });

  // the ticket designer: the colour and the stamp (a ticket has no image on it)
  $$('[data-designer]').forEach((o) => {
    const tk = $('.ds-tk', o), big = $$('[data-st]', o);
    $$('[data-s]', o).forEach((b, i, all) => b.addEventListener('click', () => { press(all, b); tk.style.setProperty('--s', b.dataset.s); tk.style.setProperty('--i', b.dataset.i); }));
    $$('[data-stamp]', o).forEach((b, i, all) => b.addEventListener('click', () => { press(all, b); big.forEach((s) => { s.hidden = s.dataset.st !== b.dataset.stamp; }); }));
  });

  // what a ticket does: elsewhere it ends at the door; here the line goes on, and each thing it gives lands in turn
  $$('[data-power]').forEach((o) => {
    const ours = $('.pw-ours', o), items = $$('.pw-s', o);
    let running = false, seenOnce = false;
    const play = async () => {
      if (running) return; running = true;
      o.classList.add('arm'); void o.offsetWidth;
      const order = [...$$('.pw-other .pw-s', o), ...$$('.pw-ours .pw-s', o)];
      for (const li of order) { li.classList.add('on'); if (li.classList.contains('pw-n-stamp')) restart(li, 'slam'); await wait(reduce ? 0 : li.closest('.pw-other') ? 170 : 240); }
      running = false;
    };
    if (!reduce) { o.classList.add('arm'); }
    once(o, () => { seenOnce = true; play(); }, 0.45);
    o.addEventListener('click', () => { if (!seenOnce) return; items.forEach((li) => li.classList.remove('on', 'slam')); o.classList.add('arm'); play(); });
  });

  // nobody can fake a PXI ticket: the door scans the real ticket, then a fake, on both codes
  $$('[data-forge]').forEach((o) => {
    const STEPS = [
      { step: 'the real ticket', them: ['ok', 'Accepted', 'The real ticket'], us: ['ok', 'Accepted', 'The real ticket'] },
      { step: 'a fake ticket', fake: true, them: ['warn', 'Accepted', 'A fake got in'], us: ['no', 'Declined', 'Not a real PXI ticket'] },
    ];
    const stepEl = $('[data-step]', o), cards = $$('[data-card]', o);
    let i = 0;
    const show = async (k) => {
      const s = STEPS[k];
      stepEl.textContent = s.step;
      cards.forEach((c) => {
        const [q0, q1] = $$('.fg-qr > *', c);
        off(q0, !!s.fake); off(q1, !s.fake);
        c.classList.toggle('fake', !!s.fake);
        c.dataset.res = 'wait'; $('[data-why]', c).textContent = 'Scanning';
        restart(c, 'scan');
      });
      await wait(reduce ? 0 : 1000);
      cards.forEach((c) => {
        const [res, t, why] = s[c.dataset.card];
        c.dataset.res = res; $('[data-res]', c).textContent = t; $('[data-why]', c).textContent = why;
        restart($('[data-stamp]', c), 'slam');
      });
    };
    show(0);
    ticker(o, () => { i = (i + 1) % STEPS.length; show(i); }, 4200, 0.5);
  });

  // the patch maker (the app's steps: shape, emblem, thread, letters)
  $$('[data-maker]').forEach((o) => {
    const parts = JSON.parse(o.dataset.parts), prev = $('[data-prev]', o), top = $('[data-top]', o), bot = $('[data-bot]', o);
    const st = { shape: 'shield', emblem: 'moon', thread: '#3b2a6b' };
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const draw = () => {
      const [outer, inner] = parts.shapes[st.shape], bar = st.shape === 'bar';
      prev.innerHTML = `<svg class="patch" viewBox="0 0 200 230" style="--thread:${st.thread}" aria-hidden="true"><path class="pt-edge" d="${outer}"/><path class="pt-face" d="${outer}" transform="translate(10 10) scale(.9)"/><path class="pt-stitch" d="${inner}"/><g class="pt-emblem">${parts.emblems[st.emblem]}</g><text class="pt-txt" x="100" y="${bar ? 100 : 62}" text-anchor="middle">${esc(top.value.toUpperCase())}</text><text class="pt-txt pt-sm" x="100" y="${bar ? 152 : 196}" text-anchor="middle">${esc(bot.value.toUpperCase())}</text></svg>`;
      restart(prev, 'bump');
    };
    $$('[data-shape]', o).forEach((b, i, all) => b.addEventListener('click', () => { press(all, b); st.shape = b.dataset.shape; draw(); }));
    $$('[data-emblem]', o).forEach((b, i, all) => b.addEventListener('click', () => { press(all, b); st.emblem = b.dataset.emblem; draw(); }));
    $$('[data-thread]', o).forEach((b, i, all) => b.addEventListener('click', () => { press(all, b); st.thread = b.dataset.thread; draw(); }));
    [top, bot].forEach((x) => x.addEventListener('input', draw));
    draw();
  });

  // the scene chat: messages come in; the host's one pins and pings, the rest stay quiet
  $$('[data-scenechat]').forEach((o) => {
    const msgs = $$('[data-msgs] li', o), pin = $('[data-pin]', o), push = $('[data-push]', o);
    const play = async () => {
      for (const m of msgs) {
        await wait(reduce ? 0 : 750); m.classList.add('on');
        if (m.classList.contains('host')) { pin.hidden = false; push.classList.add('show'); }
      }
    };
    once(o, play, 0.45);
  });

  // the jacket: tap a patch to see whose crew it is
  $$('[data-jacket]').forEach((o) => {
    const pats = $$('.jk-p', o), cap = $('[data-jk-cap]', o);
    pats.forEach((p) => p.addEventListener('click', () => { pats.forEach((x) => x.setAttribute('aria-pressed', String(x === p))); cap.textContent = `${p.dataset.name}: sewn on, it shows on her passport`; }));
  });
})();
