'use client';

// The v12 pages' header and phone menu, the demo's markup (pxispace-redesign/site-v12/_src/partials/nav.html) on the
// real session (useAuth), as SiteNav does for the old pages:
//  - signed out: Log in (back to this page after), and in the phone menu Create account with Log in under it;
//  - signed in: your name and the account menu (Dashboard, Passport, Wishlist, Account, Sign out), and in the phone menu
//    you, Your dashboard, the account pages and Sign out.
// Nothing about the session shows until the auth context has read it, so a signed-in visitor never sees Log in flash.
// Links are plain <a>: every page switch is a full load (see V12Runtime).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/ui/UserAvatar';

const APP = 'https://apps.apple.com/app/pxi/id6751762197';
const PLAY = 'https://play.google.com/store/apps/details?id=com.pxistudio.PXIStudio';

const ACCOUNT = [
  { href: '/dashboard', label: 'Dashboard', d: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
  { href: '/dashboard/passport', label: 'Passport', d: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM9 17.5h6' },
  { href: '/wishlist', label: 'Wishlist', d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' },
  { href: '/dashboard/account', label: 'Account', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5' },
];
const OUT = 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h10';

const Ic = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const firstName = (u) => (u?.name || u?.displayName || u?.username || 'You').trim().split(/\s+/)[0];
const handle = (u) => (u?.username ? `@${u.username}` : u?.email || '');

function Stores() {
  return (
    <div className="stores">
      <a className="store store-ios" href={APP} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" /></svg>
        <span><small>Download on the</small><b>App Store</b></span>
      </a>
      <a className="store" href={PLAY} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1zm10.5 10.4 2.6 2.6-11 6.3 8.4-8.9zm3.6-3.5 2.9 1.7c.8.5.8 1.6 0 2.1l-2.9 1.7-2.8-2.7 2.8-2.8zM5.7 2.4l11 6.3-2.6 2.6-8.4-8.9z" /></svg>
        <span><small>Get it on</small><b>Google Play</b></span>
      </a>
    </div>
  );
}

/** @param {{ cur: string, path: string }} props */
export default function V12Nav({ cur, path }) {
  const auth = useAuth() || {};
  const [mounted, setMounted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [stuck, setStuck] = useState(false);
  const meRef = useRef(null);
  const burgerRef = useRef(null);
  const ready = mounted && auth.authReady !== false;
  const user = ready && auth.isAuthenticated && auth.user ? auth.user : null;
  const login = `/login?redirect=${encodeURIComponent(path || '/')}`;

  useEffect(() => {
    const f = requestAnimationFrame(() => setMounted(true));
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(f); window.removeEventListener('scroll', onScroll); };
  }, []);

  // the phone menu: the page stops scrolling, Escape closes it, widening to a desktop closes it
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', sheet);
    if (!sheet) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setSheet(false); burgerRef.current?.focus(); } };
    const mq = window.matchMedia('(min-width: 861px)');
    const onMq = (m) => { if (m.matches) setSheet(false); };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.documentElement.classList.remove('menu-open');
    };
  }, [sheet]);

  // the desktop account menu: a click outside or Escape closes it
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (meRef.current && !meRef.current.contains(e.target)) setMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const closeSheet = useCallback(() => setSheet(false), []);
  const signOut = () => {
    setMenu(false);
    setSheet(false);
    auth.logout?.();
  };
  const hide = ready ? undefined : { visibility: 'hidden' };

  return (
    <>
      <header className={`nav${stuck ? ' is-stuck' : ''}`} data-nav>
        <div className="wrap nav-in">
          <a className="logo" href="/" aria-label="PXI home"><img src="/img/brand/pxi-mark.svg" alt="PXI" width="38" height="38" /></a>
          <nav className="nav-links" aria-label="Primary">
            <a className="nav-events" href="/events">Events</a>
            <a href="/platform" aria-current={cur === 'platform' ? 'page' : undefined}>For organizers</a>
            <a href="/about" aria-current={cur === 'about' ? 'page' : undefined}>About</a>
          </nav>
          <div className="nav-right">
            {user ? (
              <div className="nav-me" ref={meRef}>
                <button type="button" className="nav-me-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                  <UserAvatar user={user} size={30} alt="" />
                  <span>{firstName(user)}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                {menu ? (
                  <div className="nav-me-menu" role="menu">
                    <div className="nav-me-head">
                      <UserAvatar user={user} size={40} alt="" />
                      <div><b>{user.name || firstName(user)}</b><small>{handle(user)}</small></div>
                    </div>
                    {ACCOUNT.map((a) => (
                      <a key={a.href} role="menuitem" href={a.href}><Ic d={a.d} />{a.label}</a>
                    ))}
                    <button type="button" role="menuitem" onClick={signOut}><Ic d={OUT} />Sign out</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <a className="nav-login" href={login} style={hide}>Log in</a>
            )}
            <a className="btn btn-solid nav-app" href={APP} target="_blank" rel="noopener noreferrer">Get the app</a>
            <a className="nav-events nav-events-m" href="/events">Events</a>
            <button
              ref={burgerRef}
              type="button"
              className="nav-burger"
              aria-label={sheet ? 'Close menu' : 'Open menu'}
              aria-expanded={sheet}
              aria-controls="mnav"
              onClick={() => setSheet((v) => !v)}
            >
              <span aria-hidden="true"><i></i><i></i></span>
            </button>
          </div>
        </div>
      </header>
      <div className={`mnav${sheet ? ' open' : ''}`} id="mnav">
        <nav className="mnav-links" aria-label="Menu">
          <a href="/platform" onClick={closeSheet}>For organizers</a>
          <a href="/about" onClick={closeSheet}>About</a>
          <a href="/features/event-discovery" onClick={closeSheet}>How PXI works</a>
        </nav>
        {user ? (
          <div className="mnav-acct mnav-in">
            <div className="mnav-me">
              <UserAvatar user={user} size={56} alt="" />
              <b>{user.name || firstName(user)}</b>
              <small>{handle(user)}</small>
            </div>
            <a className="btn btn-solid mnav-join" href="/dashboard">Your dashboard</a>
            <div className="mnav-sub">
              <a href="/dashboard/passport">Passport</a>
              <a href="/wishlist">Wishlist</a>
              <a href="/dashboard/account">Account</a>
            </div>
            <button type="button" className="mnav-login" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <div className="mnav-acct" style={hide}>
            <a className="btn btn-solid mnav-join" href="/login?mode=signup">Create account</a>
            <a className="mnav-login" href={login}>Log in</a>
          </div>
        )}
        <Stores />
      </div>
    </>
  );
}
