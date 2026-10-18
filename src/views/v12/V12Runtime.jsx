'use client';

// Runs the page's demo scripts (public/v12/*.js) once, in the demo's order. They are plain scripts that bind to the
// server-rendered markup when they run, so every v12 page needs a fresh document: its links are plain <a>, and a page
// reached by a client-side navigation (a <Link> elsewhere in the app, or Back into it) reloads itself once.

import { useEffect } from 'react';
import { loadScript } from '@/views/site/runtime/loadScript';
import { trackHostLead } from '@/lib/analytics';
import { setEnhancedConversionData } from '@/lib/enhancedConversions';

// What the demo scripts may report through the app: the booking page's request is the lead (as on the old /book page:
// hash the email for enhanced conversions first, then send the lead; the Zoho tab is already open, so nothing waits).
const BRIDGE = {
  hostLead: (email) => {
    void setEnhancedConversionData({ email }).then(() => trackHostLead({ source: 'book_meeting' }));
  },
};

const started = new Set();

/** @param {{ scripts: string[] }} props */
export default function V12Runtime({ scripts }) {
  useEffect(() => {
    const root = document.documentElement;
    if (window.__v12doc !== location.pathname) {
      location.reload();
      return undefined;
    }
    root.classList.add('v12-doc');
    window.__pxi = BRIDGE;
    if (!started.has(location.pathname)) {   // once per document (StrictMode runs effects twice)
      started.add(location.pathname);
      (async () => {
        for (const src of scripts) await loadScript(src);
      })().catch((err) => console.error('[v12]', err));
    }
    return () => {
      // a real unmount (leaving for an app page) takes the page's <html> classes with it
      if (document.querySelector('.v12')) return;
      root.classList.remove('v12-doc', 'hx-intro', 'hx-in', 'menu-open');
    };
  }, [scripts]);
  return null;
}
