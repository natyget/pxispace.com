'use client';

// Shared header for the redesign pages. The desktop links stay in the server HTML so they are
// crawlable; the right side follows the signed-in state (Log in ↔ your profile), and the phone
// menu is rendered here too so it always matches that state. Links are plain <a> on purpose:
// every page switch is a full load, so each page's scene script starts from a clean document.

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/ui/UserAvatar';

const LINKS = [
  { page: 'home', href: '/', label: 'Home' },
  { page: 'platform', href: '/platform', label: 'Platform' },
  { page: 'about', href: '/about', label: 'About' },
];

const LOGIN = {
  home: '/login',
  platform: '/login?redirect=%2Fplatform',
  about: '/login?redirect=%2Fabout',
  fwbk: '/login?redirect=%2Feditorial%2Ffashion-week-brooklyn',
};

const ACCOUNT = [
  { href: '/dashboard', label: 'Dashboard', d: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
  { href: '/dashboard/passport', label: 'Passport', d: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM9 17.5h6' },
  { href: '/wishlist', label: 'Wishlist', d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' },
  { href: '/dashboard/account', label: 'Account', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5' },
];

const Ic = ({ d }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const firstName = (u) => (u?.name || u?.displayName || u?.username || 'You').trim().split(/\s+/)[0];
const handle = (u) => (u?.username ? `@${u.username}` : u?.email || '');

/** @param {{ page: 'home' | 'platform' | 'about' | 'fwbk' }} props */
export default function SiteNav({ page }) {
  const auth = useAuth() || {};
  const [mounted, setMounted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [outPop, setOutPop] = useState(false);
  const meRef = useRef(null);
  const btnRef = useRef(null);
  const signedIn = mounted && Boolean(auth.isAuthenticated && auth.user);

  useEffect(() => {
    const f = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(f);
  }, []);

  // phone sheet: lock the page, Escape closes, widening to desktop closes
  useEffect(() => {
    document.documentElement.classList.toggle('mnav-open', sheet);
    if (!sheet) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setSheet(false); btnRef.current?.focus(); } };
    const mq = window.matchMedia('(min-width: 861px)');
    const onMq = (m) => { if (m.matches) setSheet(false); };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.documentElement.classList.remove('mnav-open');
    };
  }, [sheet]);

  // desktop profile menu: outside click and Escape close it
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (meRef.current && !meRef.current.contains(e.target)) setMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const signOut = () => {
    setMenu(false);
    setSheet(false);
    auth.logout?.();
  };

  const linkHref = (l) => (l.page === page && page === 'platform' ? '#top' : l.href);

  return (
    <>
      <header className={`nav${sheet ? ' menu-open' : ''}`}>
        <a className="nav-logo" href="/" aria-label="PXI home">
          <img src="/site/img/pxi-mark-small.svg?v=grit5" alt="PXI" width="44" height="44" />
        </a>{' '}
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.page} href={linkHref(l)} className={l.page === page ? 'on' : undefined} aria-current={l.page === page ? 'page' : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          {signedIn ? (
            <div className="nav-me" ref={meRef}>
              <button type="button" className="nav-me-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                <UserAvatar user={auth.user} size={28} alt="" />
                <span>{firstName(auth.user)}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className={menu ? 'up' : undefined}>
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {menu ? (
                <div className="nav-me-menu" role="menu">
                  <div className="nav-me-head">
                    <UserAvatar user={auth.user} size={40} alt="" />
                    <div><b>{auth.user.name || firstName(auth.user)}</b><small>{handle(auth.user)}</small></div>
                  </div>
                  {ACCOUNT.map((a) => (
                    <a key={a.href} role="menuitem" href={a.href}><Ic d={a.d} />{a.label}</a>
                  ))}
                  <button type="button" role="menuitem" className="out" onClick={signOut}>
                    <Ic d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h10" />Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <a className="nav-login" href={LOGIN[page]} style={mounted ? undefined : { visibility: 'hidden' }}>Log in</a>
          )}{' '}
          <a className="nav-events" href="/events">Events</a>{' '}
          <button ref={btnRef} className="nav-menu" type="button" aria-label={sheet ? 'Close menu' : 'Open menu'} aria-expanded={sheet} aria-controls="mnav" onClick={() => { setOutPop(false); setSheet((v) => !v); }}>
            <span className="nm-bars" aria-hidden="true"><i></i><i></i></span>
          </button>
        </div>
      </header>

      {sheet ? (
        <div className="mnav in" id="mnav" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="mnav-in">
            <nav className="mnav-links" aria-label="Mobile">
              {LINKS.map((l, i) => (
                <a key={l.page} href={linkHref(l)} style={{ '--i': i }} className={l.page === page ? 'on' : undefined} aria-current={l.page === page ? 'page' : undefined} onClick={() => setSheet(false)}>
                  <span>{l.label}</span>
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              ))}
            </nav>
            {signedIn ? (
              <>
                {/* signed in: two quiet rows, then your avatar (tap for Log out) beside Events */}
                <nav className="mnav-sub" aria-label="Your account" style={{ '--i': LINKS.length }}>
                  <a href="/dashboard">Dashboard</a>
                  <a href="/wishlist">Wishlist</a>
                </nav>
                <div className="mnav-bottom" style={{ '--i': LINKS.length + 1 }}>
                  <div className="mnav-av">
                    <button type="button" aria-label={`Account: ${auth.user.name || firstName(auth.user)}`} aria-expanded={outPop} onClick={() => setOutPop((v) => !v)}>
                      <UserAvatar user={auth.user} size={44} alt="" />
                    </button>
                    {outPop ? (
                      <div className="mnav-out" role="menu">
                        <small>{handle(auth.user) || firstName(auth.user)}</small>
                        <button type="button" role="menuitem" onClick={signOut}>Log out</button>
                      </div>
                    ) : null}
                  </div>
                  <a className="btn btn-primary" href="/events">Events</a>
                </div>
              </>
            ) : (
              <div className="mnav-foot" style={{ '--i': LINKS.length }}>
                <a className="btn btn-secondary" href={LOGIN[page]}>Log in</a>
                <a className="btn btn-primary" href="/events">Events</a>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
