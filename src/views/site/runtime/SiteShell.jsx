'use client';

// The redesign pages (/, /platform, /about, /editorial/fashion-week-brooklyn) are ported
// from the static demo in pxispace-redesign/site. Their markup is server-rendered JSX;
// this wrapper is the `.pxr` element every ported rule is scoped under, and it runs the
// page's scene script once the markup has hydrated.
//
// The scripts mutate the DOM they are given, so they must run exactly once per DOM. React
// StrictMode (dev) and Fast Refresh unmount and remount effects on the SAME DOM: cleanup
// sees the wrapper still connected and keeps the running instance. A real unmount (leaving
// the page) happens after the DOM is detached, and disposes everything.

import { useEffect, useRef } from 'react';
import { preload } from 'react-dom';
import { createLifecycle } from './lifecycle';
import { loadScript } from './loadScript';
import initNav from './nav';

const V = '/site/vendor/';
const PAGES = {
  home: { vendor: [`${V}hugeicons.js`, `${V}pxi-react.js`], load: () => import('../home/home.scenes') },
  platform: {
    vendor: [`${V}hugeicons.js`, `${V}hugeicons-p.js`, `${V}pxi-react.js`],
    load: () => import('../platform/platform.scenes'),
  },
  about: { vendor: [`${V}hugeicons.js`, `${V}hugeicons-p.js`], load: () => import('../about/about.scenes') },
  fwbk: { vendor: [], load: () => import('../fwbk/fwbk.scenes'), htmlClass: ['fwbk-doc'] },
};

const running = new WeakMap();

function start(el, page) {
  const L = createLifecycle();
  const cfg = PAGES[page];
  // html.pxr-doc switches on the page's <html>/<body> rules (see styles/base.css).
  L.addHtmlClass('pxr-doc', `pxr-${page}`, ...(cfg.htmlClass || []));
  initNav(el, L);
  (async () => {
    for (const src of cfg.vendor) await loadScript(src);
    if (!L.alive) return;
    const { default: init } = await cfg.load();
    if (!L.alive) return;
    await init(el, L);
  })().catch((err) => console.error(`[site:${page}]`, err));
  return L;
}

/**
 * @param {{ page: keyof typeof PAGES, className?: string, children: React.ReactNode }} props
 */
export default function SiteShell({ page, className, children }) {
  const ref = useRef(null);
  // Start the vendor bundles downloading with the HTML instead of after hydration.
  PAGES[page].vendor.forEach((src) => preload(src, { as: 'script' }));

  useEffect(() => {
    const el = ref.current;
    let L = running.get(el);
    if (!L) {
      L = start(el, page);
      running.set(el, L);
    }
    return () => {
      if (el.isConnected) return;
      running.delete(el);
      L.dispose();
    };
  }, [page]);

  return (
    <div ref={ref} className={`pxr ${page}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
