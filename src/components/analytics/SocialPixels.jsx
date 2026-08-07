'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Meta / TikTok / X pixels — the inventory Google cannot reach.
//
// These are injected IMPERATIVELY after consent, not rendered as <Script> tags.
// That is deliberate: next/script mounts as soon as the component renders, and a
// declarative `{allowed ? <Script/> : null}` would still have injected the pixel
// on the very first paint in a region where consent has not resolved yet. Doing
// it in an effect that reads the settled consent state means the network request
// cannot physically happen before permission exists.
//
// Each network is independent — a missing TikTok id must not stop Meta loading.
// See src/lib/socialPixels.js for the fail-closed id handling and event mapping.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { isTrackingAllowed, subscribeConsentChoice } from '@/lib/consent';
import { META_PIXEL_ID, TIKTOK_PIXEL_ID, X_PIXEL_ID, anySocialPixelConfigured } from '@/lib/socialPixels';

let injected = false;

function injectMeta(id) {
  if (window.fbq) return;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  // No Advanced Matching: we never hand an ad network an email, hashed or not.
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}

// TikTok's official loader, verbatim from Events Manager, with `holdConsent`,
// `revokeConsent` and `grantConsent` present in the methods list — those three are what
// make withdrawal work after load, and an older copy of this snippet omits them.
function injectTikTok(id) {
  if (window.ttq) return;
  /* eslint-disable */
  (function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    ttq.setAndDefer = function (obj, m) { obj[m] = function () { obj.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (k) { var e = ttq._i[k] || [], n = 0; for (; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e, n) {
      var r = 'https://analytics.tiktok.com/i18n/pixel/events.js', o = n && n.partner;
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      n = d.createElement('script'); n.type = 'text/javascript'; n.async = !0; n.src = r + '?sdkid=' + e + '&lib=' + t;
      e = d.getElementsByTagName('script')[0]; e.parentNode.insertBefore(n, e);
    };
    ttq.load(id);
    ttq.page();
  })(window, document, 'ttq');
  /* eslint-enable */
}

function injectX(id) {
  if (window.twq) return;
  /* eslint-disable */
  !(function (e, t, n, s, u, a) {
    e.twq || ((s = e.twq = function () { s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments); }),
      (s.version = '1.1'), (s.queue = []), (u = t.createElement(n)), (u.async = !0),
      (u.src = 'https://static.ads-twitter.com/uwt.js'),
      (a = t.getElementsByTagName(n)[0]), a.parentNode.insertBefore(u, a));
  })(window, document, 'script');
  /* eslint-enable */
  window.twq('config', id);
}

export default function SocialPixels() {
  useEffect(() => {
    if (!anySocialPixelConfigured) return undefined;

    const maybeInject = () => {
      if (injected || !isTrackingAllowed()) return;
      injected = true;
      try { if (META_PIXEL_ID) injectMeta(META_PIXEL_ID); } catch { /* ignore */ }
      try { if (TIKTOK_PIXEL_ID) injectTikTok(TIKTOK_PIXEL_ID); } catch { /* ignore */ }
      try { if (X_PIXEL_ID) injectX(X_PIXEL_ID); } catch { /* ignore */ }
    };

    // Withdrawal has to reach a pixel that is ALREADY running. A script cannot be
    // un-injected, so we tell each SDK to stop instead: Meta's consent API pauses
    // sending, TikTok's revokeConsent stops collection and drops its cookies. Without
    // this, "reject" only prevented a pixel that had not loaded yet — anyone who
    // accepted and then changed their mind kept being tracked until they navigated away.
    const revoke = () => {
      try { window.fbq?.('consent', 'revoke'); } catch { /* ignore */ }
      try { window.ttq?.revokeConsent?.(); } catch { /* ignore */ }
      try { window.ttq?.disableCookie?.(); } catch { /* ignore */ }
    };

    maybeInject();
    // A visitor who accepts from the banner must start being tracked without a reload,
    // and one who rejects must stop being tracked without one either.
    return subscribeConsentChoice((status) => {
      if (status === 'denied' || !isTrackingAllowed()) revoke();
      else maybeInject();
    });
  }, []);

  return null;
}
