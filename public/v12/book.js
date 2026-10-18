// Book a call: the next five weekdays, two times each, as on the live booking page (the same windows). Picking one prints
// it on the ticket, and typing your name prints that. Requesting opens the team's Zoho calendar request with everything
// filled in (the same request the live page makes) and stamps the ticket. On the live site the page also reports the
// lead (window.__pxi.hostLead, set by V12Runtime; absent in the demo).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('[data-bk]');
  if (!form) return;
  const days = $('[data-days]'), tk = $('[data-tk]'), note = $('[data-pick-note]');
  const CAL = 'https://calendar.zoho.com/eventreq/zz08011230966a69f6cf3661848a642f5bb3891b602ec3d013adfd5d004d1c52cbdb244ec514c600315637892b53e649a28e89876b';
  const WINDOWS = { 1: ['11:00', '14:30'], 2: ['10:30', '16:00'], 3: ['12:00', '15:30'], 4: ['11:30', '17:00'], 5: ['10:00', '13:30'] };
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  const pad = (n) => String(n).padStart(2, '0');
  let pick = null;

  // the next five weekdays, from tomorrow
  const d = new Date(); d.setHours(12, 0, 0, 0);
  const list = [];
  while (list.length < 5) { d.setDate(d.getDate() + 1); if (WINDOWS[d.getDay()]) list.push(new Date(d)); }
  days.innerHTML = list.map((x, i) => `<div class="bk-day"><p><small>${DAY[x.getDay()]}</small><b>${x.getDate()}</b></p>`
    + WINDOWS[x.getDay()].map((t) => `<button type="button" data-d="${i}" data-t="${t}" aria-pressed="false" aria-label="${DAY[x.getDay()]} ${MON[x.getMonth()]} ${x.getDate()} at ${label(t)}">${label(t)}</button>`).join('')
    + '</div>').join('');

  days.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const x = list[+b.dataset.d];
    pick = { date: `${pad(x.getMonth() + 1)}/${pad(x.getDate())}/${x.getFullYear()}`, time: b.dataset.t, day: `${DAY[x.getDay()]} ${MON[x.getMonth()]} ${x.getDate()}`, label: label(b.dataset.t) };
    days.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    $('[data-tk-day]').textContent = pick.day; $('[data-tk-time]').textContent = pick.label;
    note.classList.remove('want');
    tk.classList.remove('pop'); void tk.offsetWidth; tk.classList.add('pop');
    if (matchMedia('(max-width: 979px)').matches) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('[data-in-name]').addEventListener('input', (e) => { $('[data-tk-name]').textContent = e.target.value.trim() || 'Your name'; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pick) { note.textContent = 'Pick a time first.'; note.classList.add('want'); $('[data-bk-pick]').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const f = new FormData(form);
    const q = new URLSearchParams({ name: f.get('name'), mailId: f.get('email'), date: pick.date, time: pick.time, reason: f.get('reason') || 'PXI booking request' });
    window.open(`${CAL}?${q}`, '_blank', 'noopener,noreferrer');
    try { window.__pxi?.hostLead?.(f.get('email')); } catch {}
    tk.classList.add('sent'); $('[data-go]').classList.add('sent');
  });
})();
