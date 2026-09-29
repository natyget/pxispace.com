/* Fashion Week Brooklyn guide.
 * 1. Marks the day chip for the card currently in view.
 * 2. Wide screens: the sticky left rail fades out just before its column ends.
 *    ≤1099px: the same chips become a bottom dock, shown only while the schedule is on screen,
 *    so nothing parks under the transparent header.
 *
 * Ported from pxispace-redesign/site/fwbk.js. Runs once per mount (see SiteShell):
 * PXR is the page's .pxr wrapper, L the lifecycle that undoes every global side effect.
 */
export default function initFwbk(PXR, L) {
  const { requestAnimationFrame, IntersectionObserver, matchMedia, addEventListener } = L.scope;
  highlightToday();
  const chips = new Map();
  PXR.querySelectorAll('.fw-days a[href^="#oct-"]').forEach((a) => chips.set(a.getAttribute('href').slice(1), a));
  const cards = [...chips.keys()].map((id) => PXR.querySelector(`#${id}`)).filter(Boolean);

  if (cards.length && 'IntersectionObserver' in window) {
    const visible = new Set();
    let current = null;
    const mark = (id) => {
      if (id === current) return;
      if (current && chips.get(current)) { chips.get(current).classList.remove('on'); chips.get(current).removeAttribute('aria-current'); }
      current = id;
      if (id && chips.get(id)) { chips.get(id).classList.add('on'); chips.get(id).setAttribute('aria-current', 'location'); }
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
      const first = cards.find((c) => visible.has(c.id));
      mark(first ? first.id : null);
    }, { rootMargin: '-38% 0px -52% 0px' });
    cards.forEach((c) => io.observe(c));
  }

  const rail = PXR.querySelector('.fw-days'), sched = PXR.querySelector('.fw-sched');
  if (!rail || !sched) return;
  const dock = matchMedia('(max-width: 1099px)');
  let ticking = false;
  const check = () => {
    ticking = false;
    const r = sched.getBoundingClientRect(), vh = innerHeight;
    if (dock.matches) {
      rail.classList.remove('gone');
      // on once the schedule reaches mid-screen, off once its end has passed mid-screen
      rail.classList.toggle('dock-on', r.top < vh * 0.6 && r.bottom > vh * 0.55);
    } else {
      rail.classList.remove('dock-on');
      const cs = getComputedStyle(rail);
      rail.classList.toggle('gone', r.bottom < rail.offsetHeight + parseFloat(cs.top) + parseFloat(cs.marginBottom) + 48);
    }
  };
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  dock.addEventListener('change', queue);
  // keyboard: a focused chip is always shown
  rail.addEventListener('focusin', () => rail.classList.add('dock-on'));
  rail.addEventListener('focusout', queue);
  check();

  // Highlight today's date (New York time). ?today=YYYY-MM-DD previews a date.
  // (Was the demo's inline <script> at the end of <body>.)
  function highlightToday() {
    const q = new URLSearchParams(location.search).get('today');
    const t = q || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
    const chip = PXR.querySelector('.fw-days a[data-date="' + t + '"]');
    if (!chip) return;
    chip.classList.add('is-today');
    chip.setAttribute('aria-label', chip.querySelector('.d').textContent + ' Oct ' + chip.querySelector('b').textContent + ', today');
    const day = PXR.querySelector('#' + chip.getAttribute('href').slice(1));
    if (!day) return;
    day.classList.add('is-today');
    const tag = document.createElement('span');
    tag.className = 'tag tag-today'; tag.textContent = 'Today';
    day.querySelector('.day-tags').prepend(tag);
    const jump = PXR.querySelector('#fw-jump');
    if (jump) { jump.href = '#' + day.id; jump.textContent = 'See today’s show'; }
  }
}
