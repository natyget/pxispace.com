// G1: behaviour for the guest feature pages. Every interaction answers a tap; motion stays inside its object.
(() => {
  const P = window.PXI;
  if (!P) return;
  const { $, $$, once, ticker, restart, reduce, wait } = P;
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';

  // FLIP: remember where each element is, change the order, and slide each one from the old spot to the new
  const flip = (els, change) => {
    const was = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
    change();
    if (reduce) return;
    els.forEach((el) => {
      const a = was.get(el), b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 560, easing: EASE });
    });
  };
  const tween = (el, to, fmt = (v) => String(v)) => {
    const from = parseFloat(String(el.dataset.v ?? 0)), t0 = performance.now();
    el.dataset.v = to;
    if (reduce) { el.textContent = fmt(to); return; }
    const step = (now) => { const p = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const fmtN = (v) => v.toLocaleString('en-US');

  // ---------------------------------------------------- tonight's crate: pick a sort and the sleeves reorder
  $$('[data-g1-crate]').forEach((c) => {
    const row = $('[data-g1-row]', c), figs = $$('[data-g1-sl]', c), btns = $$('[data-g1-sort]', c);
    const set = (k) => {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g1Sort === k)));
      row.scrollLeft = 0;
      const sorted = [...figs].sort((a, b) => (+a.dataset[k + 'N']) - (+b.dataset[k + 'N']));
      flip(figs, () => {
        sorted.forEach((f) => row.append(f));
        row.scrollLeft = 0;
        figs.forEach((f) => { const l = $('[data-g1-line]', f); l.textContent = f.dataset[k]; restart(l, 'chg'); });
      });
    };
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.g1Sort)));
  });

  // ---------------------------------------------------- the big record: tap a polaroid and it opens larger
  $$('[data-g1-rec]').forEach((rc) => {
    const pics = JSON.parse(rc.dataset.pics), box = $('.g1-rc-box', rc), pols = $$('[data-g1-pol]', rc), open = $('[data-g1-open]', rc), print = $('.g1-print', rc);
    let last = null;
    const show = (i) => {
      const p = pics[i];
      $('[data-g1-img]', rc).src = p.src;
      $('[data-g1-av]', rc).src = `/img/av2/${p.who}.webp`;
      $('[data-g1-who]', rc).textContent = `shot by @${p.who}`;
      $('[data-g1-time]', rc).textContent = `at ${p.t}`;
      $('[data-g1-rx]', rc).innerHTML = p.rx.map(([e, n]) => `<span><i class="emo" style="font-style:normal">${e}</i>${n}</span>`).join('');
      last = pols[i];
      open.hidden = false; box.parentElement.classList.add('is-open');
      if (!reduce) {
        const a = pols[i].getBoundingClientRect(), b = print.getBoundingClientRect();
        const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
        print.animate([{ transform: `translate(${dx}px, ${dy}px) rotate(${p.r}deg) scale(.4)`, opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: EASE });
      }
      $('[data-g1-close]', rc).focus({ preventScroll: true });
    };
    const close = () => { open.hidden = true; rc.classList.remove('is-open'); last?.focus({ preventScroll: true }); };
    pols.forEach((b, i) => b.addEventListener('click', () => show(i)));
    $('[data-g1-hint]', rc).addEventListener('click', () => show(0));
    $('[data-g1-close]', rc).addEventListener('click', (e) => { e.stopPropagation(); close(); });
    open.addEventListener('click', (e) => { if (!print.contains(e.target)) close(); });
    rc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !open.hidden) close(); });
  });

  // ---------------------------------------------------- who's going: Save and the perk's Claim keep their size and change their words
  $$('[data-g1-card]').forEach((c) => {
    const b = $('[data-g1-heart]', c), claim = $('[data-g1-claim]', c);
    b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      restart(b, 'pop');
    });
    claim.addEventListener('click', () => {
      claim.setAttribute('aria-pressed', String(claim.getAttribute('aria-pressed') !== 'true'));
      restart(claim, 'pop');
    });
  });

  // ---------------------------------------------------- the event's thread: the app's thread, with voice notes, GIFs and photos arriving
  $$('[data-g1-thread]').forEach((th) => {
    const rows = JSON.parse(th.dataset.rows), list = $('[data-g1-msgs]', th), cnt = $('[data-g1-n]', th);
    const input = $('[data-input]', th), send = $('[data-send]', th), mic = $('[data-mic]', th), rec = $('[data-rec]', th);
    let k = 0, n = +cnt.textContent, step = 0, quietUntil = 0, recT = 0, recS = 0;
    cnt.dataset.v = n;
    const make = (html) => { const w = document.createElement('div'); w.innerHTML = html.trim(); return w.firstElementChild; };
    const clock = (v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
    const quiet = () => { quietUntil = Date.now() + 10000; };
    const pills = () => $$('.g1-rp', list).filter((p) => !p.classList.contains('late') || p.classList.contains('on'));
    const put = (el) => {
      flip($$(':scope > *', list), () => list.append(el));
      el.classList.add('in');
      const late = $('.g1-rp.late', el);
      if (late) setTimeout(() => late.classList.add('on'), reduce ? 0 : 900);
      if (el.matches('[data-join]')) tween(cnt, ++n, fmtN);
      while (list.children.length > 12) list.firstElementChild.remove();
    };
    const bump = () => {
      const all = pills();
      if (!all.length) return;
      const p = all[Math.floor(Math.random() * all.length)], c = $('b', p) || p.appendChild(document.createElement('b'));
      c.textContent = (+c.textContent || 1) + 1; restart(p, 'bump');
    };

    // a voice note plays: the white button turns to pause and the bars fill, as the app's does
    const stopNote = (vn) => {
      clearInterval(vn._t); vn._t = 0; vn.classList.remove('go');
      $$('.g1-wv i', vn).forEach((b) => b.classList.remove('on'));
      $('[data-vt]', vn).textContent = clock(+vn.dataset.secs);
    };
    const playNote = (vn) => {
      if (vn._t) { stopNote(vn); return; }
      $$('.g1-vn.go', th).forEach(stopNote);
      const secs = +vn.dataset.secs, bars = $$('.g1-wv i', vn), t0 = performance.now(), label = $('[data-vt]', vn);
      vn.classList.add('go');
      vn._t = setInterval(() => {
        const el = (performance.now() - t0) / 1000;
        bars.forEach((b, i) => b.classList.toggle('on', (i + 0.5) / bars.length <= el / secs));
        label.textContent = clock(Math.min(secs, Math.floor(el)));
        if (el >= secs) stopNote(vn);
      }, 90);
    };

    list.addEventListener('click', (e) => {
      quiet();
      const pl = e.target.closest('[data-play]');
      if (pl) { playNote(pl.closest('[data-vn]')); return; }
      const ch = e.target.closest('[data-ch]');
      if (ch) {   // one reaction each: picking another moves yours
        const bar = ch.parentElement, was = $('.mine', bar), on = ch !== was;
        const set = (c, d) => { const v = Math.max(0, (+c.dataset.n || 0) + d); c.dataset.n = v; $('b', c).textContent = v || ''; c.classList.toggle('g1-ghost', v === 0 && !c.classList.contains('mine')); };
        if (was) { was.classList.remove('mine'); set(was, -1); }
        if (on) { ch.classList.add('mine'); set(ch, +1); restart(ch, 'pop'); }
        return;
      }
      const b = e.target.closest('[data-bub]');
      if (!b || b.classList.contains('g1-bare') && !e.target.closest('.g1-gif')) return;
      let p = $('.g1-rp', b.parentElement);
      if (!p) { p = make('<span class="g1-rp"><i class="e">🔥</i><b>1</b></span>'); b.parentElement.append(p); restart(p, 'bump'); return; }
      p.classList.remove('late');
      let c = $('b', p); if (!c) { c = document.createElement('b'); c.textContent = '1'; p.append(c); }
      c.textContent = +c.textContent + 1; restart(p, 'bump');
    });

    // the bar: type and send, a GIF, or record a voice note
    const mine = (inner, extra = '') => make(`<div class="g1-m g1-mine"><div class="g1-bw"><div class="g1-bub g1-me${extra}" data-bub>${inner}</div></div><img class="g1-ava" src="/img/av2/you.webp" alt="" width="160" height="160"></div>`);
    const sendText = () => {
      const v = input.value.trim(); if (!v) return;
      const el = mine('<p class="g1-bh"><b>You</b><time>now</time></p><p class="g1-bt"></p>');
      $('.g1-bt', el).textContent = v; put(el); input.value = ''; send.disabled = true; quiet();
    };
    input.addEventListener('input', () => { send.disabled = !input.value.trim(); quiet(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendText(); } });
    send.addEventListener('click', sendText);
    $('[data-gif]', th).addEventListener('click', () => { quiet(); put(make(th.dataset.mineGif)); });
    mic.addEventListener('click', () => {
      quiet();
      if (!recT) {
        recS = 0; rec.hidden = false; $('[data-rect]', th).textContent = '0:00'; mic.classList.add('on');
        recT = setInterval(() => { recS++; $('[data-rect]', th).textContent = clock(recS); if (recS >= 9) mic.click(); }, 1000);
        return;
      }
      clearInterval(recT); recT = 0; rec.hidden = true; mic.classList.remove('on');
      const el = make(th.dataset.mineVn); const vn = $('[data-vn]', el); vn.dataset.secs = Math.max(2, recS); $('[data-vt]', vn).textContent = clock(Math.max(2, recS));
      put(el);
    });

    ticker(th, () => {
      if (Date.now() < quietUntil || recT || list.querySelector('.g1-vn.go')) return;
      if (step++ % 2 === 0) put(make(rows[k++ % rows.length])); else bump();
    }, 2000, 0.35);
  });

  // ---------------------------------------------------- your sound: tap up to five genres, the nights re-score and reorder
  $$('[data-g1-sound]').forEach((s) => {
    const nights = JSON.parse(s.dataset.nights), gs = $$('[data-g1-g]', s), grid = $('.g1-gs-grid', s), list = $('.g1-nights', s), items = $$('.g1-nt', s), cnt = $('[data-g1-n]', s);
    const picks = new Set(gs.filter((g) => g.getAttribute('aria-pressed') === 'true').map((g) => g.dataset.g1G));
    const say = (a) => (a.length < 2 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
    const score = (genres) => {
      const m = genres.filter((g) => picks.has(g)), p = picks.size;
      if (!p) return { s: 20, m };
      return { s: Math.max(10, Math.round((20 + 80 * m.length / 3) * (1 - 0.05 * (p - m.length)))), m };
    };
    const render = (animate) => {
      const res = nights.map((n, i) => ({ i, ...score(n.g) }));
      const order = [...res].sort((a, b) => b.s - a.s || a.i - b.i);
      const apply = () => {
        order.forEach((r) => list.append(items[r.i]));
        res.forEach((r) => {
          const it = items[r.i];
          $('[data-g1-why]', it).textContent = r.m.length ? `you picked ${say(r.m.map((x) => x.toLowerCase()))}` : (picks.size ? 'none of your picks yet' : 'pick a sound to start');
          $('[data-g1-fill]', it).style.setProperty('--m', r.s + '%');
          tween($('[data-g1-pct]', it), r.s);
        });
      };
      animate ? flip(items, apply) : apply();
      cnt.textContent = picks.size; grid.classList.toggle('full', picks.size >= 5);
    };
    gs.forEach((g) => g.addEventListener('click', () => {
      const k = g.dataset.g1G;
      if (picks.has(k)) picks.delete(k); else if (picks.size < 5) picks.add(k); else return;
      g.setAttribute('aria-pressed', String(picks.has(k)));
      render(true);
    }));
    render(false);
  });

  // ---------------------------------------------------- what PXI learns from: tap a source to turn it on or off
  $$('[data-g1-learns]').forEach((ln) => {
    const ins = $$('[data-g1-in]', ln), paths = $$('[data-g1-ln]', ln);
    ins.forEach((b, i) => {
      const sync = () => paths[i].classList.toggle('off', b.getAttribute('aria-pressed') !== 'true');
      sync();
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        const st = $('[data-g1-state]', b); if (st) st.textContent = on ? 'On' : 'Off';
        sync();
      });
    });
  });

  // ---------------------------------------------------- the ad card: tick a row and the estimated reach changes
  $$('[data-g1-ads]').forEach((f) => {
    const m = JSON.parse(f.dataset.model), out = $('[data-g1-reach]', f), ageRow = $('.g1-ar-age', f), ages = $$('[data-g1-age]', f), ageBox = $('[data-g1-row="age"]', f);
    const calc = () => {
      let v = m.base;
      $$('[data-g1-row]', f).forEach((c) => { if (c.checked && c.dataset.g1Row !== 'age') v *= m.rows[c.dataset.g1Row]; });
      if (ageBox.checked) v *= Math.max(0.04, ages.filter((a) => a.checked).reduce((t, a) => t + m.ages[a.dataset.g1Age], 0));
      ageRow.classList.toggle('off', !ageBox.checked);
      tween(out, Math.max(40, Math.round(v / 10) * 10), fmtN);
    };
    f.addEventListener('change', (e) => { if (e.target.matches('[data-g1-age]') && e.target.checked) ageBox.checked = true; calc(); });
    calc();
  });

  // ---------------------------------------------------- one ticket, three places: tabs, and they turn by themselves until tapped
  $$('[data-g1-tabs]').forEach((tx) => {
    const tabs = $$('[data-g1-tab]', tx), panes = $$('[data-g1-pane]', tx);
    let cur = 0, touched = false;
    const go = (i) => {
      cur = i;
      tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
      panes.forEach((p, j) => { p.classList.toggle('on', j === i); p.setAttribute('aria-hidden', String(j !== i)); });
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => { touched = true; go(i); }));
    go(0);
    ticker(tx, () => { if (!touched) go((cur + 1) % panes.length); }, 4600, 0.5);
  });

  // ---------------------------------------------------- at the door: scan, ADMITTED on the stub, a stamp pops beside it
  $$('[data-g1-door]').forEach((d) => {
    const btn = $('[data-g1-scan]', d), hint = $('[data-g1-dh]', d);
    let state = 'idle', touched = false;
    const reset = () => { d.classList.remove('scanning', 'ok', 'done'); hint.textContent = 'Tap the ticket to scan it'; state = 'idle'; };
    const run = async () => {
      if (state === 'busy') return;
      if (state === 'done') { reset(); return; }
      state = 'busy';
      d.classList.add('scanning'); await wait(reduce ? 0 : 900);
      d.classList.remove('scanning'); d.classList.add('ok'); await wait(reduce ? 0 : 700);
      d.classList.add('done'); hint.textContent = 'Tap the ticket to scan it again'; state = 'done';
    };
    btn.addEventListener('click', () => { touched = true; run(); });
    once(d, () => setTimeout(() => { if (!touched && state === 'idle' && !reduce) run(); }, 2200), 0.6);
  });

  // ---------------------------------------------------- the signed code: it opens into a token; a copy scans as already used
  $$('[data-g1-signed]').forEach((sg) => {
    const code = $('[data-g1-code]', sg), res = $('[data-g1-res]', sg), who = $$('[data-g1-who]', sg);
    const open = (on) => { sg.classList.toggle('open', on); code.setAttribute('aria-expanded', String(on)); };
    code.addEventListener('click', () => open(!sg.classList.contains('open')));
    who.forEach((b) => b.addEventListener('click', () => {
      who.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      res.innerHTML = b.dataset.g1Who === 'copy' ? '<span class="g1-bad">Already used at 10:42 PM</span>' : '<span class="g1-ok">Admitted at 10:42 PM</span>';
    }));
    once(sg, () => setTimeout(() => open(true), reduce ? 0 : 900), 0.6);
  });

  // ---------------------------------------------------- the passport's levels: tap one and the page fills with its stamps and Scenes
  $$('[data-g1-ladder]').forEach((l) => {
    const lv = JSON.parse(l.dataset.levels), steps = $$('[data-g1-lv]', l), range = $('[data-g1-range]', l), pp = $('[data-pp]', l);
    const sts = $$('.pp-st', pp), nSt = $('[data-pp-n]', pp), nSc = $('[data-pp-sc]', pp), bd = $('[data-badge]', pp);
    const tiers = bd ? JSON.parse(bd.dataset.tiers) : {};
    const many = (n, w) => (n === 0 ? `no ${w}s` : `${n} ${w}${n === 1 ? '' : 's'}`);
    const set = (i) => {
      const v = lv[i], k = Math.min(v.st, sts.length);
      steps.forEach((s, j) => s.setAttribute('aria-pressed', String(j === i)));
      let d = 0;
      sts.forEach((s, j) => {                         // new stamps press in one after another; extra ones lift off
        const want = j < k;
        if (want === s.classList.contains('on')) return;
        s.style.setProperty('--d', `${want && !reduce ? d++ * 0.06 : 0}s`);
        s.classList.toggle('on', want);
      });
      nSt.textContent = v.st; nSc.textContent = v.sc;
      const t = Object.values(tiers).find((x) => x[1] === v.name);
      if (bd && t) {
        t[2].split(';').forEach((kv) => { const [a, b] = kv.split(':'); bd.style.setProperty(a, b); });
        bd.style.setProperty('--p', 0.62);
        $('[data-lv-l]', bd).textContent = t[0]; $('[data-lv-n]', bd).textContent = t[1];
        bd.classList.remove('up'); void bd.offsetWidth; bd.classList.add('up');
      }
      range.innerHTML = `<span><b>${v.name}</b> ${many(v.st, 'stamp')} and ${many(v.sc, 'Scene')} on this passport</span>`;
    };
    steps.forEach((s, i) => s.addEventListener('click', () => set(i)));
  });

  // ---------------------------------------------------- the stamps: tap one to see how you earn it
  $$('[data-g1-stamps]').forEach((g) => {
    const btns = $$('[data-g1-sc]', g), say = $('[data-g1-say]', g);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const t = b.dataset.g1Sc, i = t.indexOf(':');
      say.innerHTML = `<span><b>${t.slice(0, i)}</b>${t.slice(i)}</span>`;
    }));
    const on = btns.find((b) => b.getAttribute('aria-pressed') === 'true');
    if (on) { const t = on.dataset.g1Sc, i = t.indexOf(':'); say.innerHTML = `<span><b>${t.slice(0, i)}</b>${t.slice(i)}</span>`; }
  });

  // ---------------------------------------------------- the patches: tap one in the tray to sew it on the stamp page
  $$('[data-g1-patches]').forEach((g) => {
    const slots = $$('[data-g1-slot]', g), tray = $$('[data-g1-pt]', g), say = $('[data-g1-psay]', g);
    const names = tray.map((b) => $('span', b).textContent);
    const slotOf = (i) => slots.find((s) => s.dataset.from === String(i));
    const sew = (i, quiet) => {
      const b = tray[i], on = !!slotOf(i);
      if (on) {
        const s = slotOf(i); s.innerHTML = ''; delete s.dataset.from; b.setAttribute('aria-pressed', 'false');
        if (!quiet) say.innerHTML = `<span>${names[i]} is off your passport.</span>`;
        return;
      }
      const free = slots.find((s) => !s.dataset.from);
      if (!free) { say.innerHTML = '<span>Four patches fit. Tap one in the tray to take it off.</span>'; return; }
      free.dataset.from = i; free.innerHTML = ''; free.append($('svg', b).cloneNode(true)); b.setAttribute('aria-pressed', 'true');
      if (!quiet) say.innerHTML = `<span>${names[i]} is sewn on.</span>`;
    };
    tray.forEach((b, i) => b.addEventListener('click', () => sew(i)));
    sew(0, true); sew(1, true);
  });
})();
