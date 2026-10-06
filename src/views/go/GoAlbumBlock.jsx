'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppPlatform } from '@/hooks/useAppPlatform';
import GoStoreButton from './GoStoreButton';

// Three photos from the landing page: friends at a night out, the album idea in one look.
const PHOTOS = ['/site/img/lib/k00.jpg', '/site/img/lib/h03.jpg', '/site/img/lib/t06.jpg'];

/**
 * Why this page exists: the invitation to make an album with your friends for this night. A small stack of
 * polaroids is the album, the App Store button is the way in, and "Open in PXI" is for people who already have it.
 *
 * The photos are in their fanned places in the server HTML. When the block is still below the fold on a screen
 * that allows motion, they are gathered into one pile and dealt out when it scrolls into view (about 350 ms).
 *
 * @param {{ storeHref: string, openHref: string, platform: 'ios' | 'android' | 'desktop', caption?: string }} props
 */
export default function GoAlbumBlock({ storeHref, openHref, platform, caption = '' }) {
  const root = useRef(null);
  const [phase, setPhase] = useState('rest');

  // The server's guess comes from the user agent. An iPad reports a Mac, which only the browser can tell apart.
  const detected = useAppPlatform();
  const device = detected === 'unknown' ? platform : detected;
  const canOpenApp = device === 'ios' || device === 'android';

  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) return undefined;
    setPhase('armed');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPhase('dealt');
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Try the app. If this page is still showing a moment later, the app is not installed: go to the store.
  const openApp = (event) => {
    if (device !== 'ios' && device !== 'android') return;
    event.preventDefault();
    const started = Date.now();
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', cleanup);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cleanup();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', cleanup);
    timer = setTimeout(() => {
      cleanup();
      if (Date.now() - started < 2500 && document.visibilityState === 'visible') window.location.href = storeHref;
    }, 1500);
    window.location.href = openHref;
  };

  return (
    <section className="go-pxi" ref={root} aria-labelledby="go-pxi-title">
      <div className={`go-stack${phase === 'armed' ? ' is-armed' : ''}`} aria-hidden="true">
        {PHOTOS.map((src, i) => (
          <figure className="go-pol" key={src}>
            <img src={src} alt="" width="750" height="1000" loading="lazy" decoding="async" />
            {i === PHOTOS.length - 1 && caption ? <figcaption className="go-pol-cap">{caption}</figcaption> : null}
          </figure>
        ))}
      </div>
      <div className="go-pxi-copy">
        <h2 id="go-pxi-title" className="go-pxi-title">Make the album with your friends.</h2>
        <p className="go-pxi-lead">One shared camera for this night. Wake up to the scrapbook.</p>
        <div className="go-pxi-actions">
          <GoStoreButton href={storeHref} platform={device === 'android' ? 'android' : 'ios'} />
          {canOpenApp ? (
            <a className="go-open" href={openHref} onClick={openApp}>Open in PXI</a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
