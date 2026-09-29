// Teardown for the redesign pages' scene scripts.
//
// The scripts were written for a static page that lives until the tab closes. Inside the
// Next app a page can be left without a reload (a <Link> elsewhere, the back button), so
// every global thing a script creates — window/document listeners, timers, rAF loops,
// observers, GSAP matchMedia contexts and ticker callbacks — is registered here and undone
// in dispose(). The scripts get these through `L.scope`, which shadows the browser globals
// of the same name, so their bodies stay as close to the demo as possible.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function createLifecycle() {
  const listeners = [];
  const timeouts = new Set();
  const intervals = new Set();
  const frames = new Set();
  const observers = [];
  const contexts = [];
  const tickers = [];
  const roots = [];
  const htmlClasses = new Set();

  const L = {
    alive: true,

    on(target, type, fn, opts) {
      // A script that waits for `load` after a client-side navigation would wait forever.
      if (target === window && type === 'load' && document.readyState === 'complete') {
        queueMicrotask(() => { if (L.alive) fn(new Event('load')); });
        return;
      }
      target.addEventListener(type, fn, opts);
      listeners.push([target, type, fn, opts]);
    },
    off(target, type, fn, opts) {
      target.removeEventListener(type, fn, opts);
    },

    /** gsap.matchMedia(), reverted on dispose. */
    mm() {
      const mm = gsap.matchMedia();
      contexts.push(mm);
      return mm;
    },
    /** gsap.ticker.add(), removed on dispose. */
    tick(fn, once, prioritize) {
      gsap.ticker.add(fn, once, prioritize);
      tickers.push(fn);
      return fn;
    },
    /** window.PXI.createRoot (the bundled app components), unmounted on dispose. */
    root(el) {
      const r = window.PXI.createRoot(el);
      roots.push(r);
      return r;
    },
    /** Classes that belong on <html> while the page is mounted (html.pxr-doc gates the page's <html>/<body> rules). */
    addHtmlClass(...names) {
      names.forEach((n) => htmlClasses.add(n));
      document.documentElement.classList.add(...names);
    },

    dispose() {
      if (!L.alive) return;
      L.alive = false;
      listeners.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      frames.forEach(cancelAnimationFrame);
      observers.forEach((o) => o.disconnect());
      tickers.forEach((fn) => gsap.ticker.remove(fn));
      contexts.forEach((c) => c.revert());
      // Only one redesign page is ever mounted, and nothing else in the app keeps GSAP
      // animations alive across a navigation, so everything left is this page's.
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.globalTimeline.getChildren(true, true, true).forEach((a) => a.kill());
      ScrollTrigger.clearScrollMemory();
      document.documentElement.classList.remove(...htmlClasses, 'mnav-open');
      // Unmount the bundled React roots outside the host React's commit.
      queueMicrotask(() => roots.forEach((r) => { try { r.unmount(); } catch { /* already gone */ } }));
    },
  };

  const track = (Base) => class extends Base {
    constructor(...args) {
      super(...args);
      observers.push(this);
    }
  };

  const mql = (q) => {
    const m = window.matchMedia(q);
    return {
      get matches() { return m.matches; },
      media: m.media,
      addEventListener: (type, fn, opts) => L.on(m, type, fn, opts),
      removeEventListener: (type, fn, opts) => L.off(m, type, fn, opts),
      addListener: (fn) => L.on(m, 'change', fn),
      removeListener: (fn) => L.off(m, 'change', fn),
    };
  };

  /** Drop-in replacements for the browser globals the scripts call bare. */
  L.scope = {
    setTimeout(fn, ms, ...args) {
      const id = window.setTimeout(() => { timeouts.delete(id); fn(...args); }, ms);
      timeouts.add(id);
      return id;
    },
    setInterval(fn, ms, ...args) {
      const id = window.setInterval(fn, ms, ...args);
      intervals.add(id);
      return id;
    },
    requestAnimationFrame(fn) {
      const id = window.requestAnimationFrame((t) => { frames.delete(id); fn(t); });
      frames.add(id);
      return id;
    },
    IntersectionObserver: typeof window.IntersectionObserver === 'function' ? track(window.IntersectionObserver) : undefined,
    ResizeObserver: typeof window.ResizeObserver === 'function' ? track(window.ResizeObserver) : undefined,
    MutationObserver: track(window.MutationObserver),
    matchMedia: mql,
    addEventListener: (type, fn, opts) => L.on(window, type, fn, opts),
    removeEventListener: (type, fn, opts) => L.off(window, type, fn, opts),
  };

  return L;
}
