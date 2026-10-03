'use client';

// The one phone menu. The landing page's sheet, shared: big page links on top, and at the
// bottom the account row — Dashboard and Wishlist side by side — then you + Events.
// Navbar (every public page) and SiteNav (landing / platform / about) both render this, so the
// hamburger is identical everywhere. `LinkComponent` lets Navbar keep client-side routing while
// SiteNav keeps plain <a> (its pages need a full load to start their scene scripts).

import { useEffect, useState } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';
import './mobile-menu.css';

const MENU_LINKS = [
  { page: 'home', href: '/', label: 'Home' },
  { page: 'platform', href: '/platform', label: 'Platform' },
  { page: 'about', href: '/about', label: 'About' },
];

const firstName = (u) => (u?.name || u?.displayName || u?.username || 'You').trim().split(/\s+/)[0];
const handle = (u) => (u?.username ? `@${u.username}` : u?.email || '');

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   page?: string,
 *   linkHref?: (l: { page: string, href: string }) => string,
 *   user?: object | null,
 *   loginHref?: string,
 *   onSignOut?: () => void,
 *   LinkComponent?: any,
 *   desktopMin?: number,   // px width at which the hamburger disappears and the sheet closes
 * }} props
 */
export default function MobileMenu({ open, ...rest }) {
  // the sheet is its own component so the avatar popover starts closed every time it opens
  return open ? <Sheet {...rest} /> : null;
}

function Sheet({ onClose, page, linkHref, user = null, loginHref = '/login', onSignOut, LinkComponent = 'a', desktopMin = 861 }) {
  const [outPop, setOutPop] = useState(false);
  const A = LinkComponent;
  const href = (l) => (linkHref ? linkHref(l) : l.href);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const mq = window.matchMedia(`(min-width: ${desktopMin}px)`);
    const onMq = (m) => { if (m.matches) onClose(); };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.body.style.overflow = prev;
    };
  }, [onClose, desktopMin]);

  const n = MENU_LINKS.length;
  return (
    <div className="pxm" id="mnav" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pxm-in">
        <nav className="pxm-links" aria-label="Mobile">
          {MENU_LINKS.map((l, i) => (
            <A key={l.page} href={href(l)} style={{ '--i': i }} className={l.page === page ? 'on' : undefined} aria-current={l.page === page ? 'page' : undefined} onClick={onClose}>
              <span>{l.label}</span>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </A>
          ))}
        </nav>
        {user ? (
          <div className="pxm-bottom" style={{ '--i': n }}>
            <div className="pxm-pair">
              <A href="/dashboard" onClick={onClose}>Dashboard</A>
              <A href="/wishlist" onClick={onClose}>Wishlist</A>
            </div>
            <div className="pxm-me">
              <div className="pxm-av">
                <button type="button" aria-label={`Account: ${user.name || firstName(user)}`} aria-expanded={outPop} onClick={() => setOutPop((v) => !v)}>
                  <UserAvatar user={user} size={44} alt="" />
                </button>
                {outPop ? (
                  <div className="pxm-out" role="menu">
                    <small>{handle(user) || firstName(user)}</small>
                    <button type="button" role="menuitem" onClick={onSignOut}>Log out</button>
                  </div>
                ) : null}
              </div>
              <A className="pxm-primary" href="/events" onClick={onClose}>Events</A>
            </div>
          </div>
        ) : (
          <div className="pxm-bottom pxm-pair" style={{ '--i': n }}>
            <A href={loginHref} onClick={onClose}>Log in</A>
            <A className="pxm-primary" href="/events" onClick={onClose}>Events</A>
          </div>
        )}
      </div>
    </div>
  );
}
