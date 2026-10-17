// Scenes: the patch maker, the Scene chat's Going and Claim, the jacket, the passport tray. Tap first; no hover needed.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // the maker: one step changes one thing; each combination is one of the app's own renders
  $$('[data-sx-maker]').forEach((o) => {
    const prev = $('.sx-mk-prev', o), img = $('img', prev), st = { shape: 'shield', emblem: 'moon', thread: 'plum' };
    const src = () => `/img/patches/mk-${st.shape}-${st.emblem}-${st.thread}.webp`;
    const preload = () => { for (const s of ['circle', 'shield', 'bar', 'hexagon', 'star']) for (const e of ['moon', 'flame', 'bolt']) for (const t of ['plum', 'wine', 'gold']) new Image().src = `/img/patches/mk-${s}-${e}-${t}.webp`; };
    setTimeout(preload, 1500);
    $$('[data-sx]', o).forEach((b) => b.addEventListener('click', () => {
      $$(`[data-sx="${b.dataset.sx}"]`, o).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      st[b.dataset.sx] = b.dataset.v;
      const n = new Image(); n.src = src();
      const go = () => { img.src = n.src; img.width = n.naturalWidth || img.width; img.height = n.naturalHeight || img.height; prev.classList.remove('bump'); void prev.offsetWidth; prev.classList.add('bump'); };
      n.complete ? go() : n.addEventListener('load', go, { once: true });
    }));
  });

  // the chat: Going becomes "You're going" and counts you in; Claim becomes Claimed
  $$('[data-sx-ev]').forEach((ev) => {
    const b = $('[data-go]', ev), n = $('[data-n]', ev);
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on)); n.textContent = String(14 + (on ? 1 : 0));
    });
  });
  $$('[data-claim]').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));

  // the jacket: tap a patch to see whose crew it is
  $$('[data-sx-jacket]').forEach((o) => {
    const pats = $$('.sx-jp', o), cap = $('[data-cap]', o);
    pats.forEach((p) => p.addEventListener('click', () => { pats.forEach((x) => x.setAttribute('aria-pressed', String(x === p))); cap.textContent = `${p.dataset.name}: sewn on, it shows on her passport`; }));
  });

  // the passport: tap a patch in the tray to sew it on the stamp page (four fit)
  $$('[data-sx-passport]').forEach((g) => {
    const sewn = JSON.parse(g.dataset.sewn), slots = $$('[data-slot]', g), tray = $$('.sx-tp', g), say = $('[data-say]', g);
    const names = tray.map((b) => $('span', b).textContent);
    const slotOf = (i) => slots.find((s) => s.dataset.from === String(i));
    const sew = (i, quiet) => {
      const b = tray[i], s0 = slotOf(i);
      if (s0) { s0.innerHTML = ''; delete s0.dataset.from; b.setAttribute('aria-pressed', 'false'); if (!quiet) say.textContent = `${names[i]} is off your passport.`; return; }
      const free = slots.find((s) => !s.dataset.from);
      if (!free) { say.textContent = 'Four patches fit. Tap one in the tray to take it off.'; return; }
      free.dataset.from = i;
      const im = $('img', b).cloneNode(); im.src = sewn[b.dataset.id]; free.append(im); b.setAttribute('aria-pressed', 'true');
      if (!quiet) say.textContent = `${names[i]} is sewn on.`;
    };
    tray.forEach((b, i) => b.addEventListener('click', () => sew(i)));
    sew(0, true); sew(1, true);
  });
})();
