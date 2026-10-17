// Pricing: the ticket receipt, the send calculator, the demo form. Everything works by tap, drag or keyboard.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const usd = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fix = (n) => Math.round(n * 100) / 100;

  // ---- ticket receipt
  const range = $('[data-price]');
  if (range) {
    const out = $('[data-price-out]');
    const r = (k) => $(`[data-r="${k}"]`);
    const keep = r('keep').closest('.l');
    const sub = $('[data-slip-sub]'), note = $('[data-slip-note]'), hero = $('[data-hero-note]');
    const quick = $$('[data-set]');
    const draw = () => {
      const p = +range.value;
      out.textContent = p === 0 ? 'Free' : '$' + p;
      range.setAttribute('aria-valuetext', p === 0 ? 'Free' : '$' + p);
      const fee = p === 0 ? 0 : 0.99;
      const svc = fix(p * 0.0549);
      r('price').textContent = usd(p);
      r('fee').textContent = fee ? '-' + usd(fee) : usd(0);
      r('keep').textContent = usd(fix(p - fee));
      r('svc').textContent = usd(svc);
      r('total').textContent = usd(fix(p + svc));
      sub.textContent = p === 0 ? 'FREE EVENT' : 'ONE TICKET';
      note.textContent = p === 0 ? 'NOTHING TO PAY' : 'PLUS CARD PROCESSING';
      hero.textContent = p === 0 ? 'Free events cost nothing, with every tool.'
        : p === 100 ? 'A $100 ticket costs you $0.99. So does a $10 one.'
        : `A $${p} ticket costs you $0.99. A $100 ticket does too.`;
      quick.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.set === p)));
      keep.classList.remove('bump'); void keep.offsetWidth; keep.classList.add('bump');
      setTimeout(() => keep.classList.remove('bump'), 260);
    };
    range.addEventListener('input', draw);
    quick.forEach((b) => b.addEventListener('click', () => { range.value = b.dataset.set; draw(); }));
    draw();
  }

  // ---- send calculator
  const aud = $('[data-aud]');
  if (aud) {
    let ch = 'email';
    const RATE = { email: 0.05, sms: 0.08 };
    const btns = $$('[data-ch]');
    const sizes = $$('[data-aud-set]');
    const draw = () => {
      const n = +aud.value, raw = n * RATE[ch], cost = Math.max(1, raw);
      $('[data-aud-out]').textContent = n.toLocaleString('en-US');
      $('[data-cost]').textContent = usd(cost);
      const cents = ch === 'email' ? '5¢' : '8¢';
      $('[data-cost-note]').textContent = raw < 1 ? `${n.toLocaleString('en-US')} people at ${cents} is ${usd(raw)}. The $1 minimum applies.` : `${n.toLocaleString('en-US')} people at ${cents}`;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ch === ch)));
      sizes.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.audSet === n)));
    };
    btns.forEach((b) => b.addEventListener('click', () => { ch = b.dataset.ch; draw(); }));
    sizes.forEach((b) => b.addEventListener('click', () => { aud.value = b.dataset.audSet; draw(); }));
    aud.addEventListener('input', draw);
    draw();
  }

  // ---- enterprise form (stays on the page, posts nowhere)
  const form = $('[data-demo-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = form.name.value.trim() && /^\S+@\S+\.\S+$/.test(form.email.value.trim());
      $('[data-err]').classList.toggle('on', !ok);
      if (!ok) return;
      form.classList.add('sent');
      const t = $('[data-thanks]');
      t.classList.add('on');
      t.focus();
    });
  }
})();
