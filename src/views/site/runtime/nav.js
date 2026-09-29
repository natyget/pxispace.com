/* Shared mobile menu. The desktop nav links stay in the HTML (crawlable);
 * on phones the hamburger opens a full-screen sheet built from those same links.
 *
 * Ported from pxispace-redesign/site/nav.js. Runs once per mount (see SiteShell):
 * PXR is the page's .pxr wrapper, L the lifecycle that undoes every global side effect.
 */
export default function initNav(PXR, L) {
  const { setTimeout, requestAnimationFrame, matchMedia } = L.scope;
  const nav = PXR.querySelector('.nav'), btn = PXR.querySelector('.nav-menu');
  if (!nav || !btn) return;
  const links = Array.from(PXR.querySelectorAll('.nav-links a'));
  const login = PXR.querySelector('.nav-login'), events = PXR.querySelector('.nav-events');
  const href = (a, fb) => (a && a.getAttribute('href')) || fb;

  btn.innerHTML = '<span class="nm-bars" aria-hidden="true"><i></i><i></i></span>';
  const sheet = document.createElement('div');
  sheet.className = 'mnav'; sheet.id = 'mnav';
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Menu');
  sheet.hidden = true;
  sheet.innerHTML = `<div class="mnav-in">
      <nav class="mnav-links" aria-label="Mobile">${links.map((a, i) => `<a href="${href(a, '#')}" style="--i:${i}"${a.classList.contains('on') ? ' class="on" aria-current="page"' : ''}><span>${a.textContent.trim()}</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`).join('')}</nav>
      <div class="mnav-foot" style="--i:${links.length}">
        <a class="btn btn-secondary" href="${href(login, '#')}">Log in</a>
        <a class="btn btn-primary" href="${href(events, '#')}">Events</a>
      </div>
    </div>`;
  PXR.appendChild(sheet);
  btn.setAttribute('aria-controls', 'mnav');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open menu');

  let open = false, closeT;
  function set(v) {
    if (v === open) return;
    open = v;
    clearTimeout(closeT);
    btn.setAttribute('aria-expanded', String(v));
    btn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    nav.classList.toggle('menu-open', v);
    document.documentElement.classList.toggle('mnav-open', v);
    if (v) {
      sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add('in'));
      const first = sheet.querySelector('a'); if (first) setTimeout(() => first.focus({ preventScroll: true }), 250);
    } else {
      sheet.classList.remove('in');
      closeT = setTimeout(() => { sheet.hidden = true; }, 380);
      btn.focus({ preventScroll: true });
    }
  }
  btn.addEventListener('click', (e) => { e.preventDefault(); set(!open); });
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); else if (e.target === sheet) set(false); });
  L.on(document, 'keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') set(false);
    if (e.key === 'Tab') { // keep focus inside the sheet + the close button
      const f = [btn, ...sheet.querySelectorAll('a')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches) set(false); });
}
