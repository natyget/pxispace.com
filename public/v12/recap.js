/* The photo recap page. Every interaction answers a tap; motion stays inside its object, springs, pauses off screen and holds
   still under reduced motion (the auto-play does not start, and a tap shows the end state). Uses window.PXI from objects.js. */

/* ---------------------------------------------------- the hero: pick five to seven of the room's shots, then send them */
(() => {
  const { $, $$, wait, seen, restart, reduce } = window.PXI;
  const SPRING = 'cubic-bezier(.3, 1.25, .5, 1)';
  const phone = () => matchMedia('(max-width: 979px)').matches;
  $$('[data-develop]').forEach((o) => {
    const grid = $('.dv-grid', o), shots = $$('[data-pick]', o), badges = shots.map((s) => $('.dv-no', s));
    const count = $('[data-picked]', o), meter = $('.dv-meter', o), send = $('[data-dv-send]', o), whens = $$('[data-when]', o);
    const ntTime = $('[data-nt-time]', o), sentText = $('[data-sent-text]', o), guests = +send.dataset.guests;
    let order = shots.map((s, i) => i).filter((i) => shots[i].getAttribute('aria-pressed') === 'true');   // the picks, in the order they were made
    let busy = false, auto = true, visible = false, step = 0, at = '10 AM';

    const render = () => {
      shots.forEach((s, i) => { const k = order.indexOf(i); s.setAttribute('aria-pressed', String(k > -1)); badges[i].dataset.n = k > -1 ? k + 1 : ''; });
      count.textContent = order.length;
      meter.style.setProperty('--p', (order.length / 7).toFixed(3));
      const ok = order.length >= 5;
      send.disabled = !ok || busy;
      send.textContent = ok ? 'Send the recap' : `Pick ${5 - order.length} more`;
    };
    const toggle = (i) => {
      const on = order.includes(i);
      if (!on && order.length >= 7) { restart(shots[i], 'nope'); return; }
      order = on ? order.filter((x) => x !== i) : [...order, i];
      if (!on) restart(shots[i], 'pop');
      render();
    };
    shots.forEach((s, i) => s.addEventListener('click', () => { if (busy) return; auto = false; toggle(i); }));
    whens.forEach((b) => b.addEventListener('click', () => { auto = false; at = b.dataset.when; whens.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));

    const countUp = (el, to) => {
      const t0 = performance.now();
      const run = (now) => { const p = reduce ? 1 : Math.min(1, (now - t0) / 800); el.textContent = Math.round(to * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(run); };
      requestAnimationFrame(run);
    };
    const doSend = async () => {
      if (busy || order.length < 5) return;
      busy = true; render(); send.textContent = 'Sending';
      const picks = [...order].sort((a, b) => a - b).map((i) => shots[i]), n = picks.length, now = at === 'now';
      const mine = [];
      o.classList.add('is-sending');
      if (!reduce) {
        // the picks gather into a deck in the middle of the shots, hold a beat, then the deck goes up to the guests
        o.classList.add('is-deck');
        const st = grid.getBoundingClientRect(), cx = st.left + st.width / 2, cy = st.top + st.height / 2, cw = st.width * (phone() ? .36 : .31);
        picks.forEach((el, i) => {
          const r = el.getBoundingClientRect(), k = i - (n - 1) / 2;
          const dx = cx + k * cw * .07 - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2) + Math.abs(k) * 4, s = cw / r.width, rot = k * 3.6;
          el.style.zIndex = 30 + n - i;
          mine.push(el.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${s})` }], { duration: 720, delay: i * 45, easing: SPRING, fill: 'forwards' }));
          el._deck = { dx, dy, rot, s, k, up: st.top + (phone() ? 34 : 48) - (r.top + r.height / 2), side: cx - (r.left + r.width / 2) };
        });
        await wait(720 + n * 45 + 260);
        picks.forEach((el, i) => {
          const { dx, dy, rot, s, k, up, side } = el._deck;   // the deck shrinks into the notification that is about to drop at the top of the shots
          mine.push(el.animate([{ transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${s})`, opacity: 1 },
            { transform: `translate(${side + k * 6}px, ${up}px) rotate(${rot + k * 4}deg) scale(${s * .26})`, opacity: 0 }], { duration: 560, delay: i * 35, easing: 'cubic-bezier(.55, 0, .9, .45)', fill: 'forwards' }));
        });
        await wait(560 + n * 35 + 30);
      }
      // the guests' notification drops in, and the picks settle back in their places
      picks.forEach((el) => { el.style.zIndex = ''; });
      mine.forEach((a) => a.cancel());
      o.classList.remove('is-deck');
      if (!reduce) picks.forEach((el, i) => el.animate([{ transform: 'scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 120 + i * 50, easing: SPRING, fill: 'backwards' }));
      ntTime.textContent = now ? 'now' : '10:00 AM';
      o.classList.add('is-note'); send.textContent = 'Sent';
      await wait(reduce ? 0 : 760);
      sentText.innerHTML = now ? 'Sent to <b>0</b>' : 'Goes out at 10 AM to <b>0</b>';
      o.classList.add('is-sent');
      countUp($('b', sentText), guests);
      await wait(reduce ? 2600 : 2800);
      o.classList.remove('is-note', 'is-sent');
      await wait(reduce ? 0 : 450);
      o.classList.remove('is-sending');
      busy = false; render();
    };
    send.addEventListener('click', () => { auto = false; doSend(); });

    // idle: it shows itself (pick two more, send seven, back to five) until someone taps
    seen(o, (v) => { visible = v; }, .35);
    setInterval(async () => {
      if (!auto || busy || !visible || reduce || document.hidden) return;
      const k = step++ % 6;
      if (k === 0) toggle(5);
      else if (k === 1) toggle(6);
      else if (k === 3) await doSend();
      else if (k === 4) { order = [0, 1, 2, 3, 4]; render(); }
    }, 1300);
    render();
  });
})();

/* ---------------------------------------------------- the proof: the next poster's record slides out with the last event's top shots */
(() => {
  const { $, $$, reduce } = window.PXI;
  $$('[data-rc-proof]').forEach((o) => {
    const sl = $('[data-sleeve]', o);
    const pop = () => { sl.classList.remove('is-popped'); if (reduce) { sl.classList.add('is-popped'); return; } void sl.offsetWidth; setTimeout(() => sl.classList.add('is-popped'), 350); };
    sl.addEventListener('click', pop);
    let seen = false;
    new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !seen) { seen = true; pop(); } }), { threshold: 0.5 }).observe(o);
  });
})();

/* ---------------------------------------------------- Post it anywhere: tap a look and a format, the piece is laid out for it */
(() => {
  const { $, $$, seen, reduce } = window.PXI;
  const AUTO = [['line', 'carousel'], ['print', 'story'], ['contact', 'carousel'], ['gallery', 'story'], ['print', 'carousel'], ['line', 'photo'], ['contact', 'story'], ['print', 'photo'], ['gallery', 'carousel'], ['line', 'story'], ['contact', 'photo'], ['gallery', 'photo']];
  $$('[data-post]').forEach((o) => {
    const panels = $$('.px-panel', o), looks = $$('[data-look]', o), fmts = $$('[data-fmt]', o);
    const prev = $('[data-prev]', o), next = $('[data-next]', o), prog = $('[data-prog]', o);
    let look = 'line', fmt = 'carousel', auto = true, visible = false, k = 1;
    const track = () => $(`.px-panel[data-p="${look}-carousel"] .px-track`, o);
    const pageW = (t) => { const p = t.children[1] || t.children[0]; return p ? p.getBoundingClientRect().width + 2 : 1; };
    const idx = (t) => Math.round(t.scrollLeft / pageW(t));
    const last = (t) => Math.max(0, Math.ceil((t.scrollWidth - t.clientWidth - 2) / pageW(t)));
    const go = (i) => { const t = track(); if (t) t.scrollTo({ left: Math.max(0, Math.min(last(t), i)) * pageW(t), behavior: reduce ? 'auto' : 'smooth' }); };
    const sync = () => {
      const t = track(); if (!t) return;
      const max = t.scrollWidth - t.clientWidth, share = t.clientWidth / t.scrollWidth;
      prog.style.setProperty('--pw-i', `${(share * 100).toFixed(1)}%`);
      prog.style.setProperty('--x', `${max > 0 ? ((t.scrollLeft / max) * (1 / share - 1) * 100).toFixed(1) : 0}%`);
      prev.disabled = t.scrollLeft < 4; next.disabled = t.scrollLeft > max - 4;
    };
    const show = (l, f) => {
      look = l || look; fmt = f || fmt; o.dataset.f = fmt;
      panels.forEach((p) => { const on = p.dataset.p === `${look}-${fmt}`; p.classList.toggle('on', on); p.setAttribute('aria-hidden', String(!on)); });
      looks.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.look === look)));
      fmts.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fmt === fmt)));
      const t = track(); if (t) { t.scrollTo({ left: 0, behavior: 'auto' }); requestAnimationFrame(sync); }
    };
    looks.forEach((b) => b.addEventListener('click', () => { auto = false; show(b.dataset.look); }));
    fmts.forEach((b) => b.addEventListener('click', () => { auto = false; show(null, b.dataset.fmt); }));
    prev.addEventListener('click', () => { auto = false; const t = track(); go(idx(t) - 1); });
    next.addEventListener('click', () => { auto = false; const t = track(); go(idx(t) + 1); });
    $$('.px-track', o).forEach((t) => {
      t.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); auto = false; go(idx(t) + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); auto = false; go(idx(t) - 1); } });
      $$('.px-pg', t).forEach((p, i) => p.addEventListener('click', () => { auto = false; go(i === idx(t) ? (idx(t) >= last(t) ? 0 : i + 1) : i); }));
    });
    show();
    addEventListener('resize', sync);
    seen(o, (v) => { visible = v; }, .4);
    setInterval(() => {
      if (!auto || !visible || reduce || document.hidden) return;
      const [l, f] = AUTO[k++ % AUTO.length];
      show(l, f);
      if (f === 'carousel') setTimeout(() => { if (auto) go(1); }, 1500);
    }, 3200);
  });
})();
