/* PXI — Platform. The host's side of one night.
 * Demo event "Late Checkout" (fictional; Fri Oct 2, Seaport, Boston) runs from draft to the sequel.
 * Desktop (≥861px): each chapter is a pinned, scrubbed composition of real product surfaces
 *   (web dashboard + mobile host tools), laid out on a 16px grid and scaled to fit its column.
 * Mobile (≤860px): a dedicated layout, not the collage scaled down. One surface per beat at 1:1 CSS px,
 *   crossfading in sequence, with the chapter heading docked and shorter pins.
 * Both branches live in gsap.matchMedia, so crossing the breakpoint rebuilds cleanly, and
 * prefers-reduced-motion renders every end state with no pin and no scrub.
 * UI state that isn't a transform (typing, counters, chips) is derived from the timeline's time in an
 * idempotent render(t), so scrubbing backwards is exact.
 * Numbers follow the real formulas: turnout = scanned / sold,
 * hype = 10 × (reactions + comments + chat + 2 × media) / scanned.
 *
 * Ported from pxispace-redesign/site/platform.js. Runs once per mount (see SiteShell):
 * PXR is the page's .pxr wrapper, L the lifecycle that undoes every global side effect.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default async function initPlatform(PXR, L) {
  const { setTimeout, matchMedia } = L.scope;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $ = (s, r = PXR) => r.querySelector(s);
  const $$ = (s, r = PXR) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (p) => p * p * (3 - 2 * p);
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const int = (n) => Math.round(n).toLocaleString('en-US');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const txt = (el, v) => { if (el && el.textContent !== String(v)) el.textContent = v; };
  const html = (el, h) => { if (el && el._h !== h) { el.innerHTML = h; el._h = h; } };
  const HUGE = window.HUGE || {};
  // the app's own Hugeicons that the page's icon set (public/site/vendor/hugeicons-p.js) does not carry: same paths
  const HUGE_X = {
    RefreshIcon: '<path d="M20.0092 2V5.13219C20.0092 5.42605 19.6418 5.55908 19.4537 5.33333C17.6226 3.2875 14.9617 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>',
    Sorting01Icon: '<path d="M11.0001 8L19.0001 8.00006" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M11.0001 12H16.0001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M11.0001 16H14.0001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M11.0001 4H21.0001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M5.5 21V3M5.5 21C4.79977 21 3.49153 19.0057 3 18.5M5.5 21C6.20023 21 7.50847 19.0057 8 18.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>',
    Home05Icon: `<path d="M3 11.9896V14.5C3 17.7998 3 19.4497 4.02513 20.4749C5.05025 21.5 6.70017 21.5 10 21.5H14C17.2998 21.5 18.9497 21.5 19.9749 20.4749C21 19.4497 21 17.7998 21 14.5V11.9896C21 10.3083 21 9.46773 20.6441 8.74005C20.2882 8.01237 19.6247 7.49628 18.2976 6.46411L16.2976 4.90855C14.2331 3.30285 13.2009 2.5 12 2.5C10.7991 2.5 9.76689 3.30285 7.70242 4.90855L5.70241 6.46411C4.37533 7.49628 3.71179 8.01237 3.3559 8.74005C3 9.46773 3 10.3083 3 11.9896Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M14 15C14 13.8954 13.1046 13 12 13C10.8954 13 10 13.8954 10 15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/>`,
    DashboardSquare03Icon: `<path d="M9.75 3H5.75C5.05222 3 4.70333 3 4.41943 3.08612C3.78023 3.28002 3.28002 3.78023 3.08612 4.41943C3 4.70333 3 5.05222 3 5.75C3 6.44778 3 6.79667 3.08612 7.08057C3.28002 7.71977 3.78023 8.21998 4.41943 8.41388C4.70333 8.5 5.05222 8.5 5.75 8.5H9.75C10.4478 8.5 10.7967 8.5 11.0806 8.41388C11.7198 8.21998 12.22 7.71977 12.4139 7.08057C12.5 6.79667 12.5 6.44778 12.5 5.75C12.5 5.05222 12.5 4.70333 12.4139 4.41943C12.22 3.78023 11.7198 3.28002 11.0806 3.08612C10.7967 3 10.4478 3 9.75 3Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/><path d="M21 9.75V5.75C21 5.05222 21 4.70333 20.9139 4.41943C20.72 3.78023 20.2198 3.28002 19.5806 3.08612C19.2967 3 18.9478 3 18.25 3C17.5522 3 17.2033 3 16.9194 3.08612C16.2802 3.28002 15.78 3.78023 15.5861 4.41943C15.5 4.70333 15.5 5.05222 15.5 5.75V9.75C15.5 10.4478 15.5 10.7967 15.5861 11.0806C15.78 11.7198 16.2802 12.22 16.9194 12.4139C17.2033 12.5 17.5522 12.5 18.25 12.5C18.9478 12.5 19.2967 12.5 19.5806 12.4139C20.2198 12.22 20.72 11.7198 20.9139 11.0806C21 10.7967 21 10.4478 21 9.75Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/><path d="M16.9194 20.9139C17.2033 21 17.5522 21 18.25 21C18.9478 21 19.2967 21 19.5806 20.9139C20.2198 20.72 20.72 20.2198 20.9139 19.5806C21 19.2967 21 18.9478 21 18.25C21 17.5522 21 17.2033 20.9139 16.9194C20.72 16.2802 20.2198 15.78 19.5806 15.5861C19.2967 15.5 18.9478 15.5 18.25 15.5C17.5522 15.5 17.2033 15.5 16.9194 15.5861C16.2802 15.78 15.78 16.2802 15.5861 16.9194C15.5 17.2033 15.5 17.5522 15.5 18.25C15.5 18.9478 15.5 19.2967 15.5861 19.5806C15.78 20.2198 16.2802 20.72 16.9194 20.9139Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/><path d="M8.5 11.5H7C5.11438 11.5 4.17157 11.5 3.58579 12.0858C3 12.6716 3 13.6144 3 15.5V17C3 18.8856 3 19.8284 3.58579 20.4142C4.17157 21 5.11438 21 7 21H8.5C10.3856 21 11.3284 21 11.9142 20.4142C12.5 19.8284 12.5 18.8856 12.5 17V15.5C12.5 13.6144 12.5 12.6716 11.9142 12.0858C11.3284 11.5 10.3856 11.5 8.5 11.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/>`,
    Passport01Icon: `<path d="M12.9503 22C15.595 22 16.9173 22 17.8667 21.2437C18.8161 20.4874 19.1189 19.1927 19.7247 16.6033L21.642 8.40697C21.9773 6.97363 22.145 6.25696 21.8406 5.7379C21.2878 4.79529 19.8789 5.00001 18.9593 5.00001" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M2 9C2 5.70017 2 4.05025 3.02513 3.02513C4.05025 2 5.70017 2 9 2H12C15.2998 2 16.9497 2 17.9749 3.02513C19 4.05025 19 5.70017 19 9V15C19 18.2998 19 19.9497 17.9749 20.9749C16.9497 22 15.2998 22 12 22H9C5.70017 22 4.05025 22 3.02513 20.9749C2 19.9497 2 18.2998 2 15V9Z" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 6C12.7091 6 14.5 7.79086 14.5 10C14.5 12.2091 12.7091 14 10.5 14M10.5 6C8.29086 6 6.5 7.79086 6.5 10C6.5 12.2091 8.29086 14 10.5 14M10.5 6C9.67157 6 9 7.79086 9 10C9 12.2091 9.67157 14 10.5 14M10.5 6C11.3284 6 12 7.79086 12 10C12 12.2091 11.3284 14 10.5 14" stroke="currentColor" stroke-width="1.5"/><path d="M7 17L14 17" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/>`,
    ImageAdd01Icon: '<path d="M11.5085 2.9903C7.02567 2.9903 4.78428 2.9903 3.39164 4.38238C1.99902 5.77447 1.99902 8.015 1.99902 12.4961C1.99902 16.9771 1.99902 19.2176 3.39164 20.6098C4.78428 22.0018 7.02567 22.0018 11.5085 22.0018C15.9912 22.0018 18.2326 22.0018 19.6253 20.6098C21.0179 19.2176 21.0179 16.9771 21.0179 12.4961V11.9958" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/><path d="M4.99902 20.9898C9.209 16.2385 13.9402 9.93727 20.999 14.6632" stroke="currentColor" stroke-width="1.5"/><path d="M17.9958 1.99829V10.0064M22.0014 5.97728L13.9902 5.99217" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>',
  };
  const hi = (name, size = 24) => `<svg class="hg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none">${HUGE[name] || HUGE_X[name] || ''}</svg>`;
  const lu = (paths, size = 24, sw = 2) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const LU = {
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  };
  $$('svg.huge[data-icon]').forEach((s) => { s.setAttribute('fill', 'none'); s.innerHTML = HUGE[s.dataset.icon] || ''; });
  $$('[data-i]').forEach((el) => { el.innerHTML = hi(el.dataset.i, el.classList.contains('term-ic') ? 22 : 16); });

  /* ───────────────────────── phones ───────────────────────── */
  const sbar = (t) => `<div class="sbar"><span class="tm">${t}</span><span class="ic"><span class="bars"><i></i><i></i><i></i><i></i></span>${hi('Wifi01Icon', 18)}<span class="bat"></span></span></div>`;
  function mkPhone(cls, pw) {
    const el = document.createElement('div'), k = (pw * 0.932) / 402;
    el.className = 'iphone ' + cls;
    el.style.setProperty('--pw', pw + 'px');
    el.innerHTML = '<i class="ib l act"></i><i class="ib l vu"></i><i class="ib l vd"></i><i class="ib r pw"></i><i class="ib r cc"></i>' +
      `<div class="iphone-body"><div class="iphone-screen"><div class="scr" style="--k:${k}"><div class="island"></div></div></div></div>`;
    return { el, scr: $('.scr', el), k, pw };
  }
  // mobile: crop the phone to the height it has, with a short fade, and move the app's bottom-anchored UI up with it
  function cropPhone(ph, vis) {
    // The stage box stops 70px above the screen bottom (room for the status pill). Let the phone
    // run most of the way down behind that pill instead of cutting it off at the box edge.
    vis += 54;
    const full = ph.pw * 2.094;
    if (vis >= full - 2) { ph.el.classList.remove('crop'); ph.scr.style.height = ''; return; }
    ph.el.classList.add('crop');
    ph.el.style.setProperty('--vis', Math.round(vis) + 'px');
    ph.scr.style.height = Math.round(Math.min(874, (vis - 40 - ph.pw * 0.034) / ph.k)) + 'px';
  }
  const mPW = () => Math.min(Math.round(window.innerWidth * 0.76), 300);

  // app TicketCard (ticketShape.ts): same geometry as the landing
  function sawSegs(yStart, yEnd, tipX, valleyX, pitch, downward, startAtTip) {
    let d = '', y = yStart, atTip = startAtTip;
    const cond = downward ? (v) => v < yEnd - 0.01 : (v) => v > yEnd + 0.01;
    while (cond(y)) { const ny = downward ? Math.min(y + pitch, yEnd) : Math.max(y - pitch, yEnd); atTip = !atTip; d += ` L ${atTip ? tipX : valleyX} ${ny}`; y = ny; }
    return d;
  }
  const TS = 248, TT = 10, TB = 178, TR = 10;
  const TICKET_PATH = `M 6 ${TT} H ${TS - TR} A ${TR} ${TR} 0 0 0 ${TS + TR} ${TT} H 344 L 349 ${TT}` + sawSegs(TT, TB, 349, 344, 6, true, true) +
    ` L 344 ${TB} H ${TS + TR} A ${TR} ${TR} 0 0 0 ${TS - TR} ${TB} H 6 L 1 ${TB}` + sawSegs(TB, TT, 1, 6, 6, false, true) + ` L 6 ${TT} Z`;
  const dx = +Math.sqrt(18 * 18 - 8 * 8).toFixed(2);
  const INNER = `M 14 18 H ${TS - dx} A 18 18 0 0 0 ${TS + dx} 18 H 336 V 170 H ${TS + dx} A 18 18 0 0 0 ${TS - dx} 170 H 14 V 18`;
  // the app's flat ticket (TicketCard): one #1C1C1C shape with a 1px #2E2E2E edge, and the stitching (the dashed line
  // just inside the edge and down the tear) in the state's thread: purple while upcoming, orange while live
  const T_FILL = '#1C1C1C', T_EDGE = '#2E2E2E', T_UP = '#A523EF', T_LIVE = '#FF5A1F';
  // back = tucked under the front ticket in the Studio's stack: the name and the date replace the tier and the thread button
  const ticketHTML = (ev, live = false, back = false) => {
    const thread = `fill="none" stroke="${live ? T_LIVE : T_UP}" stroke-width="1.6" stroke-dasharray="5 3.5" stroke-linecap="round" stroke-linejoin="round"`;
    return `<div class="aticket${live ? ' live' : ''}${back ? ' back' : ''}">
    <svg class="at-svg" viewBox="0 0 350 188" preserveAspectRatio="xMidYMid meet">
      <path d="${TICKET_PATH}" fill="${T_FILL}" stroke="${T_EDGE}" stroke-width="1" stroke-linejoin="round"/>
      <path d="${INNER}" ${thread}/>
      <line x1="${TS}" y1="${TT + TR + 8 + 3}" x2="${TS}" y2="${TB - TR - 8 - 3}" ${thread}/>
    </svg>
    <div class="at-main">
      <div class="at-status"><span class="at-st">${live ? 'Live now' : 'Upcoming'}</span><span class="at-vis">Public</span></div>
      <div class="at-title">${ev.name}</div>
      <div class="at-grid"><div class="at-field"><small>Date &amp; time</small><b>${ev.date}<br>${ev.time}</b></div><div class="at-field"><small>Location</small><b>${ev.where}</b></div></div>
      <div class="at-action"><div class="at-field"><small>Tier</small><b>${ev.tier}</b></div><span class="at-thread">Open thread</span></div>
      ${back ? `<div class="at-back"><span class="at-title">${ev.name}</span><span class="at-vis">${ev.date}</span></div>` : ''}
    </div>
    <div class="at-stub"><div class="at-qr-anchor"><span class="at-tap">Tap to scan</span><div class="at-qr">${hi('QrCodeIcon', 34)}</div><span class="at-note">Non-refundable</span></div></div>
  </div>`;
  };
  const EV = { name: 'Late Checkout', date: 'OCT 2', time: '10:00 PM', where: 'SEAPORT, BOSTON', tier: 'GENERAL' };
  const AV = (n) => `/site/img/av/${n}.jpg`;
  const P = {
    maya: { n: 'Maya Laurent', u: 'maya.lrnt', img: '/site/img/av/maya.jpg' },
    kofi: { n: 'Kofi Asante', u: 'kofi.a', img: AV('A10') }, nia: { n: 'Nia Brooks', u: 'niab', img: AV('A14') },
    zee: { n: 'Zee Mensah', u: 'zee.m', img: AV('A20') }, tay: { n: 'Taylor Reid', u: 'tay.reid', img: AV('A2') },
    jo: { n: 'Jo Okafor', u: 'jo.okafor', img: AV('A7') }, sade: { n: 'Sade Adeyemi', u: 'sade.a', img: AV('A13') },
    mo: { n: 'Mo Diallo', u: 'mo.diallo', img: AV('A5') }, rae: { n: 'Rae Carter', u: 'raecarter', img: AV('A16') },
    ty: { n: 'Ty Bennett', u: 'tyb', img: AV('A12') }, ari: { n: 'Ari Cohen', u: 'ari.c', img: AV('A24') },
    lu: { n: 'Lu Chen', u: 'luchen', img: AV('A11') }, kev: { n: 'Kev Owens', u: 'kevo', img: AV('A9') },
  };

  /* ───────────────────────── charts (Recharts look, chartStyles.js tokens) ───────────────────────── */
  function curve(pts, base) {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(base, p1[1] + (p2[1] - p0[1]) / 6)];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(base, p2[1] - (p3[1] - p1[1]) / 6)];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  let gid = 0;
  /** series: [{values, color}] stacked bottom→top. fs = tick size in px at 1:1. */
  function areaChart({ w, h, series, max, ticks = [], xl = [], padL = 30, padT = 8, fs = 11, fill = [0.34, 0], stacked = false, yfmt = (v) => v, noAxis = false }) {
    const id = 'c' + (++gid), n = series[0].values.length, padB = noAxis ? 2 : Math.round(fs * 1.9), pl = noAxis ? 0 : padL;
    const X = (i) => pl + (i / (n - 1)) * (w - pl - 3), Y = (v) => padT + (1 - v / max) * (h - padT - padB), base = Y(0);
    let acc = new Array(n).fill(0), defs = '', body = '';
    series.forEach((s, k) => {
      const lo = acc.slice(), hiV = s.values.map((v, i) => (stacked ? acc[i] : 0) + v);
      if (stacked) acc = hiV;
      const line = curve(hiV.map((v, i) => [X(i), Y(v)]), base);
      const bottom = stacked && k > 0 ? curve(lo.map((v, i) => [X(i), Y(v)]).reverse(), base).replace(/^M/, 'L') : `L${X(n - 1)},${base} L${X(0)},${base}`;
      defs += `<linearGradient id="${id}g${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity="${fill[0]}"/><stop offset="1" stop-color="${s.color}" stop-opacity="${fill[1]}"/></linearGradient>`;
      body += `<path d="${line} ${bottom} Z" fill="url(#${id}g${k})"/><path d="${line}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round"/>`;
    });
    const grid = ticks.map((v) => `<line x1="${pl}" x2="${w}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,.06)"/><text x="${pl - 8}" y="${(Y(v) + fs * 0.36).toFixed(1)}" text-anchor="end">${yfmt(v)}</text>`).join('');
    const xs = xl.map(([i, t], j) => `<text x="${X(i)}" y="${h - 2}" text-anchor="${xl.length > 1 && j === 0 && i === 0 ? 'start' : j === xl.length - 1 && i === n - 1 ? 'end' : 'middle'}">${t}</text>`).join('');
    const svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="font-size:${fs}px"><defs>${defs}<clipPath id="${id}clip"><rect class="clip" x="0" y="0" width="${w}" height="${h}"/></clipPath></defs>${grid}${xs}<g clip-path="url(#${id}clip)">${body}</g></svg>`;
    return { svg, X, Y, id, base };
  }
  function countUp(el, dur = 1.6, delay = 0, rm = false) {
    const to = +el.dataset.to, f = el.dataset.f, o = { v: 0 };
    const out = (v) => { el.textContent = f === 'money' ? money(v) : f === 'pct' ? Math.round(v) + '%' : int(v); };
    if (rm) return out(to);
    out(0);
    return gsap.to(o, { v: to, duration: dur, delay, ease: 'power3.out', onUpdate: () => out(o.v) });
  }

  /* ───────────────────────── scene scaffolding ───────────────────────── */
  const SCENES = [], RELAY = [];
  const register = (sec, label, tl, status) => SCENES.push({ sec, label, tl, st: tl.scrollTrigger, status });
  function prep(sec, mode) {
    const st = $('.stage', sec), box = $('.stage-box', sec);
    st.className = 'stage dash ' + mode;
    st.removeAttribute('style');
    st.innerHTML = '';
    box.style.top = ''; box.style.height = '';
    return st;
  }
  // mobile: the stage box starts under the h2; the lead sits over its top until it fades (stage is offset by _leadOff)
  function mLayout(sec, rm) {
    const copy = $('.copy', sec), h2 = $('h2', copy), more = $('.more', copy), box = $('.stage-box', sec);
    if (rm) { box.style.top = ''; box.style.height = Math.round(Math.max(540, Math.min(640, window.innerHeight - 200))) + 'px'; sec._leadOff = 0; }
    else {
      const h2b = h2.offsetTop + h2.offsetHeight;
      box.style.top = Math.round(copy.offsetTop + h2b + 16) + 'px';
      sec._leadOff = more ? Math.round(more.offsetTop + more.offsetHeight - h2b + 6) : 0;
    }
    return { W: box.clientWidth, H: box.clientHeight };
  }
  function mkTL(sec, mode, rm, lenD) {
    if (rm) return gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    const m = mode === 'm';
    return gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * (m ? 1.4 : lenD), pin: true, scrub: m ? 0.5 : 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
  }
  // mobile: after ~12% of the pin the lead fades (eyebrow + h2 stay) and the stage rises into its place
  function mLead(tl, sec, stage, rm) {
    if (rm) return;
    tl.fromTo(stage, { y: () => sec._leadOff || 0 }, { y: 0, duration: 0.6, ease: 'power2.inOut' }, 1.15)
      .fromTo($$('.more > *', sec), { opacity: 1 }, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 1.1);
  }
  function done(tl, rm) { if (rm) { tl.progress(1); const f = tl.eventCallback('onUpdate'); if (f) f(); } }
  // crossfade helpers for mobile beats
  const fadeIn = (tl, el, at, y = 24, d = 0.4) => tl.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, duration: d, ease: 'power2.out' }, at);
  const fadeOut = (tl, el, at, y = -24, d = 0.35) => tl.to(el, { opacity: 0, y, duration: d, ease: 'power2.in' }, at);

  function fitStages() {
    $$('.scene .stage.d').forEach((st) => {
      const box = st.parentElement, w = +st.dataset.w, h = +st.dataset.h;
      const s = Math.min(box.clientWidth / w, box.clientHeight / h, +(st.dataset.max || 1.2));
      st.style.width = w + 'px'; st.style.height = h + 'px';
      st.style.transform = `translate(-50%, -50%) scale(${s})`;
      st._s = s;
    });
  }

  /* ───────────────────────── status pill ───────────────────────── */
  function initStatus() {
    const box = $('.status'), pill = $('.clock-pill', box), menu = $('.clock-menu', box);
    const prog = $('.dial .prog', box), pct = $('.st-pct', box), small = $('.st-text small', box), b = $('.st-text b', box);
    const CIRC = 2 * Math.PI * 17;
    prog.style.strokeDasharray = CIRC;
    let last = '';
    const close = () => { menu.hidden = true; pill.setAttribute('aria-expanded', 'false'); };
    const active = (s) => (s.st ? window.scrollY + 2 >= s.st.start : s.sec.getBoundingClientRect().top < window.innerHeight * 0.5);
    L.tick(() => {
      if (!SCENES.length) { box.classList.remove('on'); return; }
      let cur = null;
      for (const s of SCENES) if (active(s)) cur = s;
      const L = SCENES[SCENES.length - 1];
      const past = L.st ? window.scrollY > L.st.end + window.innerHeight * 0.15 : L.sec.getBoundingClientRect().bottom < window.innerHeight * 0.4;
      const on = !!cur && !past;
      box.classList.toggle('on', on);
      if (!on && !menu.hidden) close();
      if (!cur) return;
      const r = cur.status(cur.tl.time()), p = clamp(r.p);
      const key = r.k + '|' + r.v + '|' + p.toFixed(3);
      if (key === last) return;
      last = key;
      small.textContent = r.k; b.textContent = r.v;
      prog.style.strokeDashoffset = CIRC * (1 - p);
      pct.textContent = Math.round(p * 100);
    });
    const jumpY = (s) => (s.st ? s.st.start + 4 : s.sec.getBoundingClientRect().top + window.scrollY);
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      $('ul', menu).innerHTML = SCENES.map((s, k) => `<li><button type="button"><b>0${k + 1}</b><span>${s.label}</span></button></li>`).join('');
      const open = menu.hidden;
      menu.hidden = !open; pill.setAttribute('aria-expanded', String(open));
      if (open) {
        let ci = 0; SCENES.forEach((s, k) => { if (window.scrollY + 3 >= jumpY(s)) ci = k; });
        $$('li', menu).forEach((li, k) => {
          li.classList.toggle('cur', k === ci);
          li.querySelector('button').onclick = () => { close(); window.scrollTo({ top: jumpY(SCENES[k]), behavior: 'smooth' }); };
        });
      }
    });
    L.on(document, 'click', (e) => { if (!menu.hidden && !e.target.closest('.status')) close(); });
    L.on(document, 'keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { close(); pill.focus(); } });
  }

  /* ═════════════════════════ HERO — the Command Center ═════════════════════════ */
  // last 30 days (Sep 2 → Oct 1): Late Checkout from Sep 8, Sunday Session from Sep 15
  const LC_DAILY = [22, 19, 14, 5, 3, 4, 2, 3, 2, 3, 9, 14, 11, 7, 5, 6, 10, 18, 12, 9, 2];
  const SS_DAILY = [6, 5, 3, 2, 4, 3, 2, 6, 5, 4, 3, 5, 6, 7, 4, 5, 4];
  const T30 = Array.from({ length: 30 }, (_, d) => ([3, 2, 4, 1, 2, 3][d] || 0) + (LC_DAILY[d - 6] || 0) + (SS_DAILY[d - 13] || 0));
  const R30 = Array.from({ length: 30 }, (_, d) => ([3, 2, 4, 1, 2, 3][d] || 0) * 29 + (LC_DAILY[d - 6] || 0) * (d - 6 < 4 ? 24 : 40) + (SS_DAILY[d - 13] || 0) * 24);
  const X30 = [[0, 'Sep 2'], [14, 'Sep 16'], [29, 'Oct 1']];
  const METRICS = [['Net revenue', 'Money01Icon', 38406, 'money'], ['Tickets sold', 'Ticket01Icon', 1126, ''], ['Turnout', 'CheckmarkCircle02Icon', 91, 'pct'], ['Live now', 'Activity01Icon', 1, '']];
  function buildCC(el) {
    const nav = [['Hub'], ['DashboardSquare01Icon', 'Command Center', 'on'], ['Calendar01Icon', 'My Events'], ['Business'], ['Wallet01Icon', 'Earnings'], ['Shield01Icon', 'Teams & Security'],
      ['People'], ['UserGroupIcon', 'CRM'], ['Megaphone01Icon', 'Ads Manager'], ['Mail01Icon', 'Email Campaigns'], ['Intelligence'], ['Activity01Icon', 'Analytics'], ['QrCodeIcon', 'Live Operations', 'cc-ops'], ['FloorPlanIcon', 'Venues']];
    const rev = areaChart({ w: 237, h: 122, series: [{ values: R30, color: '#d84aff' }], max: 900, ticks: [0, 400, 800], xl: X30, padL: 44, fs: 14, yfmt: (v) => '$' + v });
    const tix = areaChart({ w: 237, h: 122, series: [{ values: T30, color: '#8b8d98' }], max: 32, ticks: [0, 15, 30], xl: X30, padL: 30, fs: 14 });
    const nx = (n, sub, chip, cls, dot) => `<div class="nx"><i class="dot ${dot}"></i><div><b>${n}</b><small>${sub}</small></div></div>`;
    el.innerHTML = `
      <aside class="cc-side">
        <div class="cc-logo"><img src="/site/img/pxi-mark-small.svg?v=grit5" alt=""><span>${lu(LU.panel, 18, 1.8)}</span></div>
        <div class="cc-nav">${nav.map((x) => x.length === 1 ? `<p class="cc-sec">${x[0]}</p>` : `<div class="cc-item ${x[2] || ''}">${hi(x[0], 18)}${x[1]}</div>`).join('')}</div>
        <div class="cc-acct"><img src="/site/img/lib/w06.jpg" alt=""><div><b>Late Checkout Co.</b><small>@latecheckout</small></div>${hi('Settings01Icon', 16)}</div>
      </aside>
      <div class="cc-main">
        <div class="cc-head">
          <div><p class="eb">Command center</p><h3>Run the room</h3><p class="desc">Live work, the next events and the money, in one read.</p>
            <div class="acts"><span class="d-pill solid">${hi('Add01Icon', 16)}Create event</span><span class="d-pill ghost">See what moved the room</span></div></div>
          <div class="d-strip s2">${METRICS.map(([l, , v, f]) => `<div><small>${l}</small><b data-to="${v}" data-f="${f}">0</b></div>`).join('')}</div>
        </div>
        <div class="cc-row">
          <div class="dcard cc-chart"><p class="d-eb">Ticket sales per day, 30 days</p><p class="d-h">Revenue</p>${rev.svg}</div>
          <div class="dcard cc-chart"><p class="d-eb">Sold per day, 30 days</p><p class="d-h">Tickets</p>${tix.svg}</div>
          <div class="dcard cc-next">
            <div class="d-headrow"><div><p class="d-eb">Now / next</p><p class="d-h">Upcoming + live</p></div><span class="va">View all</span></div>
            <div class="nx-list">${nx('Late Checkout', 'Live · Fri, Oct 2 · 180 tickets', 'Live', 'ok', 'live')}${nx('Sunday Session', 'Upcoming · Sun, Oct 11', 'Upcoming', 'warn', 'up')}</div>
          </div>
        </div>
        <div class="dcard cc-band">
          <p class="d-eb">Only on PXI</p><p class="d-h">What you get here and nowhere else</p>
          <div class="trio">
            <div class="cc-tile"><p class="stat"><b>91%</b>turnout verified</p><h5>Where the room was alive</h5><p>Photo capture points, on your floor plan.</p></div>
            <div class="cc-tile"><p class="stat"><b>214</b>moments captured</p><h5>Your crowd shot your marketing</h5><p>Every album photo, ranked by reaction.</p></div>
            <div class="cc-tile"><p class="stat"><b>164</b>verified attendees</p><h5>Guests you can prove came</h5><p>Scanned at the door, then segmented.</p></div>
          </div>
        </div>
      </div>`;
  }
  function buildMCC(el, W) {
    const rev = areaChart({ w: W - 32, h: Math.round(clamp(window.innerHeight - 670, 100, 150)), series: [{ values: R30, color: '#d84aff' }], max: 900, ticks: [0, 400, 800], xl: X30, padL: 36, fs: 11, yfmt: (v) => '$' + v });
    el.innerHTML = `<div class="mcc-grid">${METRICS.map(([l, i, v, f]) => `<div class="mc"><div class="top"><small>${l}</small><span class="ic">${hi(i, 14)}</span></div><b data-to="${v}" data-f="${f}">0</b></div>`).join('')}</div>
      <div class="dcard mcc-chart"><p class="d-eb">Ticket sales per day, last 30 days</p><p class="d-h">Revenue</p>${rev.svg}</div>
      <div class="dcard mcc-only"><p class="d-eb">Only on PXI</p><p class="d-h">What you get here and nowhere else</p>
        <div class="mo3"><div><b>91%</b><small>turnout verified</small></div><div><b>214</b><small>moments captured</small></div><div><b>164</b><small>verified attendees</small></div></div></div>`;
  }
  function initHero(mode, rm, first) {
    const sec = $('#hero'), copy = $('.p-hero-copy', sec), h1 = $('h1', sec), more = $('.hero-more', sec);
    sec.classList.toggle('rm', rm);
    if (first && !rm) {
      gsap.from('.p-hero .ln > span', { yPercent: 112, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.1 });
      gsap.from(['.p-hero .hero-lead', '.p-hero .ctas'], { y: 26, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.35 });
    }
    if (mode === 'd') {
      buildCC($('#cc'));
      const st = $('.cc-stage'), ccBox = $('.cc-box', sec);
      $$('.cc .d-strip b[data-to]').forEach((b, i) => countUp(b, 1.8, 0.9 + i * 0.08, rm));
      const fit = () => { const W = window.innerWidth, H = window.innerHeight; return { W, H, s: Math.min((W - 96) / 1200, (H - 130) / 740, 1.04) }; };
      if (rm) { const f = fit(); ccBox.style.height = Math.round(740 * f.s) + 'px'; gsap.set(st, { xPercent: -50, yPercent: 0, y: 0, scale: f.s, transformOrigin: '50% 0' }); return; }
      ccBox.style.height = '';
      $$('.cc .chart .clip').forEach((r, i) => gsap.fromTo(r, { attr: { width: 0 } }, { attr: { width: 237 }, duration: 1.8, ease: 'power2.inOut', delay: 1 + i * 0.15 }));
      if (first) gsap.from('.cc-tilt', { y: 160, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.45 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 1.25, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true } });
      tl.fromTo(st,
        { xPercent: -50, yPercent: -50, transformPerspective: 1900, rotationX: 34, scale: () => fit().s * 0.8, y: () => { const f = fit(); return f.H * 0.27 + 370 * f.s * 0.62; } },
        { rotationX: 0, scale: () => fit().s, y: () => { const f = fit(); return 96 + 370 * f.s - f.H / 2; }, ease: 'power2.inOut', duration: 1 }, 0)
        .to(copy, { y: -90, opacity: 0, ease: 'power1.out', duration: 0.34 }, 0)
        .to({}, { duration: 0.35 });
    } else {
      const box = $('.mcc-box', sec), el = $('#mcc');
      buildMCC(el, box.clientWidth);
      $$('.mc b[data-to]', el).forEach((b, i) => countUp(b, 1.6, 0.6 + i * 0.08, rm));
      if (rm) return;
      $$('.mcc .chart .clip').forEach((r) => gsap.fromTo(r, { attr: { width: 0 } }, { attr: { width: box.clientWidth }, duration: 1.8, ease: 'power2.inOut', delay: 0.8 }));
      const big = () => parseFloat(getComputedStyle(h1).fontSize) || 40;
      const dockS = () => Math.min(1, 34 / big());
      const y0 = () => more.offsetTop + more.offsetHeight + 28;
      const y1 = () => 64 + h1.offsetHeight * dockS() + 14;
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 0.8, pin: true, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true } });
      tl.to(more, { opacity: 0, y: -24, duration: 0.22, ease: 'power1.out' }, 0)
        .fromTo(h1, { y: 0, scale: 1 }, { y: () => 64 - h1.offsetTop, scale: dockS, duration: 0.6, ease: 'power2.inOut' }, 0)
        .fromTo(box, { y: y0 }, { y: y1, duration: 0.64, ease: 'power2.inOut' }, 0.08)
        .to({}, { duration: 0.25 });
    }
  }

  /* ═════════════════════════ 01 LAUNCH — Create Event sheet ═════════════════════════ */
  const TIERS = [['Early Bird', '60', '25'], ['General', '90', '35'], ['VIP', '30', '60']];
  // the Studio's next nights: the one just created in front, the two after it tucked under (the app's wheel)
  const STACK = [EV, { name: 'Sunday Session', date: 'OCT 11', time: '4:00 PM', where: 'SOUTH END, BOSTON', tier: 'GENERAL' }, { name: 'Afterglow', date: 'OCT 17', time: '11:00 PM', where: 'FENWAY, BOSTON', tier: 'FREE' }];
  function launchScreen(scr) {
    const plus = hi('Add01Icon', 20);
    scr.insertAdjacentHTML('beforeend', `<div class="cs">
      <div class="studio">${sbar('9:41')}<p class="st-h">STUDIO</p><span class="st-bell">${hi('Notification03Icon', 24)}</span>
        <div class="st-seg"><span class="on">Event</span><span>Scrapbook</span><span>VAULT</span></div>
        <div class="st-bar"><div class="st-create">${plus}CREATE</div><span class="st-round">${hi('Sorting01Icon', 23)}</span><span class="st-round">${hi('Search01Icon', 23)}</span></div>
        <div class="st-stack">${[2, 1, 0].map((i) => `<div class="st-t t${i + 1}">${ticketHTML(STACK[i], false, i > 0)}</div>`).join('')}</div>
        <div class="tabbar"><span>${hi('Home05Icon')}</span><span>${hi('Camera02Icon')}</span><span class="on">${hi('DashboardSquare03Icon')}</span><span>${hi('Passport01Icon')}</span></div>
      </div>
      <div class="cs-sheet"><div class="cs-grab"></div>
        <div class="cs-head">Create event<span class="btns"><i>${hi('RefreshIcon', 20)}</i><i>${hi('Cancel01Icon', 20)}</i></span></div>
        <div class="cs-view"><div class="cs-body">
          <div class="cs-name"><div class="cs-in" data-type="Late Checkout" data-ph="Event name"></div></div>
          <div class="cs-cover"><img src="/site/img/posters/late-checkout.jpg" alt="">${hi('ImageAdd01Icon', 34)}<b>ADD COVER</b><small>Shown in Discover and on every ticket</small></div>
          <div class="cs-loc"><div class="cs-in" data-type="Seaport, Boston, MA" data-ph="Location"></div></div>
          <div class="cs-pills cs-config"><div class="cs-in" data-type="Fri, Oct 2" data-ph="Date"></div><div class="cs-in" data-type="10:00 PM" data-ph="Time"></div></div>
          <div class="cs-f cs-lineup"><label>LINE UP / STAFF</label>
            <div class="cs-lu"><span class="r">DJ</span><span class="u">@kwame.selects</span></div>
            <div class="cs-lu"><span class="r">Co-host</span><span class="u">@ama.k</span></div>
            <div class="cs-lu"><span class="r">Bouncer</span><span class="u">@dre.door</span></div>
            <div class="cs-addbtn">${plus}ADD</div>
          </div>
          <div class="cs-f cs-descf"><label>DESCRIPTION</label><div class="cs-desc">A rooftop night above the Seaport. Doors at 10, last call at 2.</div></div>
          <div class="cs-tg first"><div><b>PUBLIC EVENT</b><small class="cap">Invite only</small></div><span class="sw"></span></div>
          <div class="cs-tg"><div><b>PAID EVENT</b><small>Needs a verified vendor</small></div><span class="sw"></span></div>
          <div class="cs-tiers"><b>TICKET TIERS</b><small>VVIP, VIP, general admission and more.</small>
            ${TIERS.map(([n, c, p]) => `<div class="cs-tier"><div class="row"><div><label>TIER</label><div class="cs-in" data-type="${n}" data-ph="Name"></div></div><div><label>CAPACITY</label><div class="cs-in" data-type="${c}" data-ph="Unlimited"></div></div><div><label>PRICE</label><div class="cs-in usd" data-type="${p}" data-ph="0"></div></div></div></div>`).join('')}
            <div class="cs-addbtn">${plus}ADD TIER</div>
          </div>
          <div class="cs-f cs-rec"><label>REPEAT</label><div class="cs-seg"><span>One-off</span><span>Weekly</span><span>Biweekly</span><span>Monthly</span></div></div>
          <div class="cs-f"><label>CUSTOM PASSPORT STAMP (OPTIONAL)</label><div class="cs-stamp"><span class="th">${hi('ImageAdd01Icon', 22)}<i>ADD STAMP</i><span class="mini"></span></span><p>Shown on attendees' passports for this series.</p></div></div>
        </div></div>
        <div class="cs-foot"><span class="cancel">Cancel</span><span class="go">CREATE EVENT</span></div>
      </div></div>`);
  }
  function typeInto(el, t, a, b) {
    const s = el.dataset.type, n = t <= a ? 0 : t >= b ? s.length : Math.max(1, Math.round(((t - a) / (b - a)) * s.length));
    const focus = t > a && t < b + Math.min(0.3, (b - a) * 0.6);
    html(el, n ? esc(s.slice(0, n)) + (focus ? '<i class="caret"></i>' : '') : (focus ? '<i class="caret"></i>' : '') + `<span class="ph">${el.dataset.ph}</span>`);
    el.classList.toggle('focus', focus);
    el.classList.toggle('filled', n > 0);
  }
  let PCSS = null;
  async function renderStamp(host, size) {
    if (!PCSS) PCSS = (await (await fetch('/site/vendor/pxi-passport.css')).text());
    if (!L.alive) return;
    if (!host.isConnected || host.shadowRoot) return;
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${PCSS}:host{display:block}.m{width:${size}px;height:${size}px}</style><div class="m"></div>`;
    const { h, StampShapeGraphic, stamp } = window.PXI;
    const createRoot = L.root;
    createRoot($('.m', root)).render(h(StampShapeGraphic, { shape: 'circle-exit', color: '#d84aff', name: stamp.formatStampName('LATE CHECKOUT'), date: '', city: stamp.formatStampCity('Boston'), role: 'MONTHLY', seed: 'late-checkout-series' }));
  }
  function initLaunch(mode, rm) {
    const sec = $('#launch'), stage = prep(sec, mode), M = mode === 'm';
    const L = M ? mLayout(sec, rm) : null;
    stage.innerHTML = `<div class="made"><div class="made-ticket">${ticketHTML(EV)}</div><p class="made-cap"><b>What buyers get</b>Your name, your tiers, one signed pass.</p></div>
      <div class="made-stamp"><div class="series-stamp"></div><i class="ink"></i><p class="made-cap"><b>Series stamp</b>Lands on every passport, every month.</p></div>`;
    const ph = mkPhone('create-phone', M ? mPW() : 320);
    stage.prepend(ph.el);
    const scr = ph.scr;
    launchScreen(scr);
    const stampHost = $('.series-stamp', stage);
    renderStamp(stampHost, M ? 120 : 150).catch(() => {});
    renderStamp($('.cs-stamp .mini', scr), 60).catch(() => {});
    if (M) {
      const lay = (l) => {
        ph.el.style.left = Math.round((l.W - ph.pw) / 2) + 'px'; ph.el.style.top = '0px';
        cropPhone(ph, l.H);
        const ts = Math.min(1.08, l.W / 350), tk = $('.made-ticket', stage), made = $('.made', stage), ms = $('.made-stamp', stage);
        tk.style.height = Math.round(188 * ts) + 'px'; $('.aticket', tk).style.transform = `scale(${ts})`;
        const side = Math.max(0, Math.round((l.W - 350 * ts) / 2)), gh = 8 + 188 * ts + 88 + 124, off = Math.max(0, Math.round((l.H - gh) * 0.38));
        made.style.left = ms.style.left = side + 'px'; made.style.right = ms.style.right = side + 'px';
        made.style.top = (8 + off) + 'px';
        ms.style.top = Math.round(8 + 188 * ts + 88 + off) + 'px';
      };
      lay(L);
      RELAY.push(() => lay(mLayout(sec, rm)));
    }
    const view = $('.cs-view', scr), body = $('.cs-body', scr), ins = $$('.cs-in', scr), sw = $$('.sw', scr), rec = $$('.cs-seg span', scr);
    const lineup = $$('.cs-lu', scr), tiers = $$('.cs-tier', scr), go = $('.cs-foot .go', scr), pubCap = $('.cs-tg .cap', scr), tiersCard = $('.cs-tiers', scr);
    const off = (sel) => { const e = $(sel, scr); return e ? e.offsetTop : 0; };
    const scrollTo = (y) => -clamp(y - 14, 0, body.offsetHeight - view.offsetHeight);
    const TYPE = [[0.8, 1.9], [2.0, 2.7], [3.9, 4.25], [4.3, 4.55], [5.2, 5.35], [5.37, 5.45], [5.47, 5.55], [5.6, 5.75], [5.77, 5.85], [5.87, 5.95], [6.0, 6.15], [6.17, 6.25], [6.27, 6.35]];
    const tl = mkTL(sec, mode, rm, 2.6);
    if (M) mLead(tl, sec, stage, rm);
    tl.fromTo($('.cs-cover img', scr), { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0.1)
      .to(body, { y: () => scrollTo(off('.cs-lineup')), duration: 0.5, ease: 'power2.inOut' }, 2.75)
      .fromTo(lineup, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.2, ease: 'power2.out' }, 2.95)
      .to(body, { y: () => scrollTo(off('.cs-config')), duration: 0.5, ease: 'power2.inOut' }, 3.4)
      .to(body, { y: () => scrollTo(off('.cs-tiers')), duration: 0.45, ease: 'power2.inOut' }, 4.75)
      .fromTo(tiers, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.15, ease: 'power2.out' }, 5.0)
      .to(body, { y: () => scrollTo(off('.cs-rec')), duration: 0.5, ease: 'power2.inOut' }, 6.7)
      .fromTo($('.cs-stamp .mini', scr), { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 7.35)
      .to(go, { scale: 0.95, duration: 0.12 }, 7.8).to(go, { scale: 1, duration: 0.12 }, 7.92)
      .to($('.cs-sheet', scr), { yPercent: 104, duration: 0.6, ease: 'power2.in' }, 8.25);
    const ink = $('.ink', stage), T = M ? { made: 9.4, stamp: 9.95 } : { made: 8.7, stamp: 9.35 };
    if (M) { fadeOut(tl, ph.el, 9.0, -24, 0.35); fadeIn(tl, $('.made', stage), T.made, 24, 0.45); }
    else tl.fromTo($('.made', stage), { opacity: 0, x: -170, y: 60, scale: 0.72, rotation: -4 }, { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 0.8, ease: 'power3.out' }, T.made);
    tl.fromTo(stampHost, { opacity: 0, scale: 2.6, rotation: -24 }, { opacity: 1, scale: 1, rotation: -8, duration: 0.3, ease: 'power4.in' }, T.stamp)
      .fromTo(ink, { opacity: 0, scale: 0.7 }, { opacity: 0.9, scale: 0.7, duration: 0.01 }, T.stamp + 0.29).to(ink, { opacity: 0, scale: 1.6, duration: 0.5, ease: 'power2.out' }, T.stamp + 0.3)
      .to($('.made-stamp .made-cap', stage), { opacity: 1, duration: 0.3 }, T.stamp + 0.35)
      .to({}, { duration: 0.6 }, T.stamp + 0.65);
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      ins.forEach((el, i) => typeInto(el, t, TYPE[i][0], TYPE[i][1]));
      sw[0].classList.toggle('on', t > 4.55); sw[1].classList.toggle('on', t > 4.75);
      txt(pubCap, t > 4.55 ? 'Listed in Discover' : 'Invite only'); tiersCard.classList.toggle('on', t > 4.75);
      rec.forEach((s, i) => s.classList.toggle('on', t > 7.05 ? i === 3 : i === 0));
      txt(go, t > 7.85 ? 'CREATING...' : 'CREATE EVENT');
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'Launch', tl, (t) => t < 8.3 ? { k: 'Late Checkout', v: `Draft · ${Math.round(seg(t, 0.1, 7.4) * 100)}% set up`, p: seg(t, 0.1, 7.4) } : { k: 'Late Checkout', v: 'On sale', p: 1 });
    done(tl, rm);
  }

  /* ═════════════════════════ 02 SELL — Analytics › Sell the room ═════════════════════════ */
  const DAYS = LC_DAILY.length, DOORS_DAY = 24;
  const CUM = LC_DAILY.reduce((a, v) => (a.push((a[a.length - 1] || 0) + v), a), []);
  const gross = (s) => (s <= 60 ? s * 25 : 1500 + (s - 60) * 41.25);
  const INS = [
    ['ins-a', 'good', 'Your email moved tickets', '41 tickets within 7 days of your Sep 18 email.', 'See the send →'],
    ['ins-b', 'warn', 'Sales are spiking', '18 sold yesterday, 3× your 7-day pace.', ''],
    ['ins-c', 'good', 'Sold out early', 'All 180 gone 4 days before doors.', ''],
  ];
  const insHTML = ([c, dot, b, p, cta], extra = '') => `<article class="insight ${c} ${extra}"><i class="dot ${dot}"></i><div><b>${b}</b><p>${p}</p>${cta && !extra ? `<span class="ins-cta">${cta}</span>` : ''}</div></article>`;
  function initSell(mode, rm) {
    const sec = $('#sell'), stage = prep(sec, mode), M = mode === 'm', q = (s) => $(s, stage);
    const L = M ? mLayout(sec, rm) : null;
    const card = `<div class="dcard sell-card">
        <p class="d-eb">Before doors</p><p class="d-h">Sell the room</p><p class="d-sub pace"></p>
        <div class="sell-value"><b class="n-gross">$0</b><span>ticket sales</span><span class="d-chip change"><span class="n-sold">0</span>&nbsp;sold</span></div>
        <div class="sell-chart"></div>
        <div class="sell-cum"><span>Cumulative</span><div class="cum-bar"><i></i></div><span class="cum-n">0 / 180</span></div>
      </div>`;
    const MK = [['Marketing spend', '$126', ''], ['Attributed tickets', '0', 'n-att'], ['Attributed revenue', '$0', 'n-attr'], ['Return on spend', '0x', 'n-ros']];
    const sold = `<div class="soldout"><span>Sold out</span><small>${M ? '180 / 180 sold' : '180 / 180 · 4 days early'}</small></div>`;
    if (!M) {
      stage.innerHTML = card + `<div class="ins-panel"><p class="ins-eb">What we noticed at this event</p><p class="ins-empty">Insights appear here as sales come in.</p><div class="ins-list">${INS.map((x) => insHTML(x)).join('')}</div></div>
        <div class="dcard mkt"><div class="d-headrow"><div><p class="d-eb">Marketing</p><p class="d-h">Spend → tickets, attributed</p></div><div class="mkt-r"><span class="d-chip brand">7-day attribution</span><span class="d-chip">Campaigns</span><span class="d-chip">Ads</span></div></div>
          <div class="d-strip s4">${MK.map(([l, v, c]) => `<div><small>${l}</small><b class="${c}">${v}</b></div>`).join('')}</div></div>` + sold;
    } else {
      stage.innerHTML = INS.slice(0, 2).map((x) => insHTML(x, 'toast')).join('') + card +
        `<div class="mkt-m">${MK.map(([l, v, c]) => `<div class="mtile"><small>${l}</small><b class="${c}">${v}</b></div>`).join('')}</div>` + sold;
    }
    const cw = M ? L.W - 32 : 492;
    const ch = M ? areaChart({ w: cw, h: 146, series: [{ values: LC_DAILY, color: '#d84aff' }], max: 24, ticks: [0, 10, 20], xl: [[0, 'Sep 8'], [10, 'Sep 18'], [20, 'Sep 28']], padL: 26, fs: 11 })
      : areaChart({ w: cw, h: 196, series: [{ values: LC_DAILY, color: '#d84aff' }], max: 24, ticks: [0, 10, 20], xl: [[0, 'Sep 8'], [7, 'Sep 15'], [14, 'Sep 22'], [20, 'Sep 28']], padL: 34, fs: 14 });
    q('.sell-chart').innerHTML = ch.svg;
    const svg = $('svg', q('.sell-chart')), clip = $('.clip', svg), mfs = M ? 11 : 13, mw = M ? 44 : 54, mh = M ? 18 : 22;
    const mk = (d, lab, col) => `<g class="mk" data-d="${d}" opacity="0"><line x1="${ch.X(d)}" x2="${ch.X(d)}" y1="${mh}" y2="${ch.base}" stroke="${col}" stroke-dasharray="3 4" stroke-width="1.2"/><rect x="${ch.X(d) - mw / 2}" y="0" width="${mw}" height="${mh}" rx="${mh / 2}" fill="${col}"/><text x="${ch.X(d)}" y="${mh / 2 + mfs * 0.36}" text-anchor="middle" style="fill:#fff;font-weight:700;font-size:${mfs}px">${lab}</text></g>`;
    svg.insertAdjacentHTML('beforeend', mk(10, 'Email', '#0d9488') + mk(15, 'Ads', '#d97706') + `<line class="cur" y1="${mh + 4}" y2="${ch.base}" stroke="rgba(255,255,255,.14)" stroke-width="1"/><circle class="pdot" r="4" fill="#fff" stroke="#09090b" stroke-width="2"/>`);
    const cur = $('.cur', svg), dot = $('.pdot', svg), marks = $$('.mk', svg);
    const nSold = q('.n-sold'), nGross = q('.n-gross'), cum = q('.cum-bar i'), cumN = q('.cum-n'), pace = q('.pace');
    const nAtt = q('.n-att'), nAttr = q('.n-attr'), nRos = q('.n-ros');
    const tl = mkTL(sec, mode, rm, 2.6);
    tl.fromTo(q('.sell-card'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0);
    if (M) {
      mLead(tl, sec, stage, rm);
      tl.to(q('.sell-card'), { y: 88, duration: 0.4, ease: 'power2.inOut' }, 4.2);
      fadeIn(tl, q('.ins-a'), 4.45, 16, 0.3); fadeOut(tl, q('.ins-a'), 5.9, -12, 0.25);
      fadeIn(tl, q('.ins-b'), 6.15, 16, 0.3); fadeOut(tl, q('.ins-b'), 7.35, -12, 0.25);
      tl.to(q('.sell-card'), { y: 0, duration: 0.5, ease: 'power2.inOut' }, 7.55);
      fadeIn(tl, q('.mkt-m'), 7.85, 20, 0.4);
    } else {
      tl.to(q('.ins-empty'), { opacity: 0, duration: 0.2 }, 4.45);
      fadeIn(tl, q('.ins-a'), 4.6, 18, 0.3); fadeIn(tl, q('.ins-b'), 6.6, 18, 0.3);
      fadeIn(tl, q('.mkt'), 7.7, 30, 0.4);
      fadeIn(tl, q('.ins-c'), 9.0, 18, 0.3);
    }
    // the stamp carries the sold count from here, so the chip under it steps aside (no data hidden under the stamp)
    tl.fromTo(q('.soldout'), { opacity: 0, scale: 2.4, rotation: -20 }, { opacity: 1, scale: 1, rotation: -8, duration: 0.3, ease: 'power4.in' }, 8.9)
      .to(q('.sell-value .d-chip'), { opacity: 0, duration: 0.2 }, 8.95)
      .to({}, { duration: 0.8 }, 9.4);
    const W0 = 0.4, W1 = 7.4;
    tl.eventCallback('onUpdate', () => {
      const t = tl.time(), f = seg(t, W0, W1) * (DAYS - 1), d = Math.floor(f), fr = f - d;
      const s = Math.round(lerp(CUM[d], CUM[Math.min(d + 1, DAYS - 1)], fr) * (t > W0 ? 1 : 0));
      const x = ch.X(f), y = ch.Y(lerp(LC_DAILY[d], LC_DAILY[Math.min(d + 1, DAYS - 1)], fr));
      clip.setAttribute('width', x + 1);
      cur.setAttribute('x1', x); cur.setAttribute('x2', x); dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      cur.style.opacity = dot.style.opacity = t > W1 + 0.2 ? 0 : 1;
      marks.forEach((m) => m.setAttribute('opacity', f >= +m.dataset.d ? 1 : 0));
      txt(nSold, s); txt(nGross, money(gross(s))); txt(cumN, s + ' / 180');
      cum.style.transform = `scaleX(${s / 180})`;
      const last = LC_DAILY.slice(Math.max(0, d - 6), d + 1), pc = last.reduce((a, v) => a + v, 0) / last.length, away = DOORS_DAY - d;
      html(pace, s >= 180 ? `Sold out <b>${away} days</b> before doors.` : t < W0 ? 'Waiting on the first sale.' : `Selling <b>${Math.round(pc)}/day</b>. At this pace, about <b>${Math.min(180, Math.round(s + pc * away))}</b> sold by doors.`);
      const a = seg(t, 7.9, 8.7);
      txt(nAtt, Math.round(63 * a)); txt(nAttr, money(2205 * a)); txt(nRos, (17.5 * a).toFixed(1) + 'x');
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'Sell', tl, (t) => {
      const f = seg(t, W0, W1) * (DAYS - 1), d = Math.floor(f), s = Math.round(lerp(CUM[d], CUM[Math.min(d + 1, DAYS - 1)], f - d)) * (t > W0 ? 1 : 0);
      return s >= 180 ? { k: 'Late Checkout', v: 'Sold out · 180/180', p: 1 } : { k: 'Late Checkout', v: `On sale · ${s}/180`, p: s / 180 };
    });
    done(tl, rm);
  }

  /* ═════════════════════════ 03 DOORS — ScannerModal + Live control room ═════════════════════════ */
  // arrivals per minute, 9:30 PM → 11:30 PM, bell around 10:20; exactly 164 scans
  const ARR = (() => {
    const raw = Array.from({ length: 121 }, (_, m) => Math.exp(-(((m - 50) / 24) ** 2)) + 0.12 * Math.exp(-(((m - 95) / 14) ** 2)));
    const sum = raw.reduce((a, v) => a + v, 0);
    let acc = 0, prev = 0;
    return raw.map((v) => { acc += (v / sum) * 164; const n = Math.round(acc) - prev; prev += n; return n; });
  })();
  const ARR_CUM = ARR.reduce((a, v) => (a.push((a[a.length - 1] || 0) + v), a), []);
  const clockStr = (min) => { const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  function qrSVG(seed) {
    let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const N = 25; let r = '';
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#000"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#000"/>`;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if ((x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)) continue;
      if (rnd() > 0.52) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges"><g fill="#000">${r}</g>${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}</svg>`;
  }
  const SCANS = [
    { p: 'maya', a: 0.9, b: 2.3, ok: true, tier: 'EARLY BIRD' },
    { p: 'kofi', a: 2.5, b: 3.9, ok: true, tier: 'GENERAL' },
    { p: 'kofi', a: 4.1, b: 5.5, ok: false, tier: 'GENERAL' },
    { p: 'nia', a: 5.7, b: 7.1, ok: true, tier: 'VIP' },
    { p: 'zee', a: 7.3, b: 8.7, ok: true, tier: 'GENERAL' },
  ];
  function initDoors(mode, rm) {
    const sec = $('#doors'), stage = prep(sec, mode), M = mode === 'm', q = (s) => $(s, stage);
    const L = M ? mLayout(sec, rm) : null;
    const capBox = `<div class="ops-box cap"><p class="t">Capacity</p><div class="cap-row"><p class="cap-n"><span class="o-in">0</span><small>/ 180</small></p><p class="cap-pct"><span class="o-pct">0</span>% full</p></div><div class="cap-bar"><i></i></div></div>`;
    const velBox = (n) => `<div class="ops-box vel"><div class="vel-top"><p class="t">Entry velocity</p><span class="vel-cap">Last hour, per minute</span></div><p class="vel-n"><span class="o-vel">0</span><small>entries / 5 min</small></p><div class="vel-bars">${'<i></i>'.repeat(n)}</div></div>`;
    const gates = `<div class="gates"><div class="gate g1"><i class="gdot"></i><div><b>Main door</b><small class="gm">0 issues flagged</small></div><span class="n o-g1">0</span></div><div class="gate g2"><i class="gdot"></i><div><b>Door 2</b><small class="gm">0 issues flagged</small></div><span class="n o-g2">0</span></div></div>`;
    if (!M) {
      stage.innerHTML = `<div class="dcard ops">
        <div class="ops-head"><p class="d-eb">Live Operations</p><h4>Live control room</h4><p>Gate flow, entry pace and incidents, updated from every scan.</p></div>
        <div class="ops-tiles"><div><small>Mode</small><b>Live</b></div><div><small>Gates</small><b>2</b></div><div class="t-flags"><small>Flags</small><b class="o-flags">0</b></div><div><small>Staff</small><b>6</b></div></div>
        <div class="ops-2">${capBox}${velBox(60)}</div>
        ${gates}
        <div class="scans-h"><p class="t">Recent scans</p><small>Newest first</small></div>
        <div class="scans"></div></div>`;
    } else {
      stage.innerHTML = `<div class="d-strip s4 door-strip"><div><small>Inside</small><b class="o-in">0</b></div><div><small>Full</small><b><span class="o-pct">0</span>%</b></div><div><small>Per 5 min</small><b class="o-vel">0</b></div><div class="t-flags"><small>Flags</small><b class="o-flags">0</b></div></div>
        <div class="dcard cap-card">${capBox}${velBox(40)}${gates}</div>`;
    }
    const ph = mkPhone('scan-phone', M ? mPW() : 286), scr = ph.scr;
    stage.appendChild(ph.el);
    if (M) {
      const lay = (l) => { ph.el.style.left = Math.round((l.W - ph.pw) / 2) + 'px'; ph.el.style.top = '76px'; cropPhone(ph, l.H - 76); };
      lay(L); RELAY.push(() => lay(mLayout(sec, rm)));
    }
    scr.insertAdjacentHTML('beforeend', `<div class="sc"><div class="sc-cam"></div>${sbar('9:52')}
      <div class="sc-guest"><p class="gt">LATE CHECKOUT</p><p class="gs"></p><div class="gq"></div><p class="gn"></p></div>
      <div class="sc-head">SCAN TICKET<i>${lu(LU.x, 18)}</i></div>
      <div class="sc-door"><small>DOOR</small><span>Main door</span><span class="on">Door 2</span><span>No door</span></div>
      <div class="sc-frame"><span class="ic okc">${lu(LU.check, 64)}</span><span class="ic bdc">${lu(LU.alert, 64)}</span></div>
      <p class="sc-hint">Align QR code within frame</p>
      <div class="sc-card"></div></div>`);
    const guest = $('.sc-guest', scr), frame = $('.sc-frame', scr), card = $('.sc-card', scr), hint = $('.sc-hint', scr), tm = $('.sbar .tm', scr);
    const all = (s) => $$(s, stage);
    const bars = all('.vel-bars i'), scans = q('.scans'), flagT = all('.t-flags');
    const FILL = ['tay', 'jo', 'sade', 'mo', 'rae', 'ty', 'ari', 'lu', 'kev'];
    const T0 = 21 * 60 + 44, T1 = 22 * 60 + 56, A = 0.4, B = 9.4;
    const clockAt = (t) => lerp(T0, T1, seg(t, A, B));
    const DUP = SCANS[2].a + 0.5;
    const LOG = [];
    const tc = (x) => x.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    SCANS.forEach((s) => LOG.push({ p: s.p, at: clockAt(s.a + 0.5), gate: 'Door 2', tier: tc(s.tier), bad: !s.ok }));
    FILL.forEach((p, i) => LOG.push({ p, at: T0 + 6 + i * 8.3, gate: i % 3 ? 'Main door' : 'Door 2', tier: i % 4 ? 'General' : 'Early Bird' }));
    LOG.sort((a, b) => a.at - b.at);
    const tl = mkTL(sec, mode, rm, 2.6);
    if (M) {
      mLead(tl, sec, stage, rm);
      tl.fromTo(q('.door-strip'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0)
        .fromTo(ph.el, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.05);
      fadeOut(tl, ph.el, 8.85, -24, 0.35); fadeIn(tl, q('.cap-card'), 9.22, 24, 0.4);
      tl.to({}, { duration: 0.6 }, 9.6);
    } else {
      tl.fromTo(q('.ops'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .fromTo(ph.el, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.05)
        .to({}, { duration: 0.6 }, 9.4);
    }
    let cardKey = '';
    tl.eventCallback('onUpdate', () => {
      const t = tl.time(), c = clockAt(t), mi = clamp(Math.floor(c - (21 * 60 + 30)), 0, 120);
      const inside = ARR_CUM[mi], d2 = Math.round(inside * 0.28), flags = t >= DUP ? 1 : 0;
      txt(tm, clockStr(c).replace(/ [AP]M/, ''));
      all('.o-in').forEach((e) => txt(e, inside)); all('.o-pct').forEach((e) => txt(e, Math.round((inside / 180) * 100)));
      all('.cap-bar i').forEach((e) => { e.style.transform = `scaleX(${inside / 180})`; });
      all('.o-g1').forEach((e) => txt(e, inside - d2)); all('.o-g2').forEach((e) => txt(e, d2));
      all('.o-vel').forEach((e) => txt(e, ARR.slice(Math.max(0, mi - 4), mi + 1).reduce((a, v) => a + v, 0)));
      all('.o-flags').forEach((e) => txt(e, flags));
      flagT.forEach((e) => e.classList.toggle('hit', !!flags));
      all('.gate.g2').forEach((g) => { g.classList.toggle('warn', !!flags); txt($('.gm', g), flags ? '1 issue flagged' : '0 issues flagged'); });
      const nb = bars.length;
      bars.forEach((b, i) => { const k = mi - (nb - 1) + i; b.style.height = (k >= 0 ? 2 + ARR[k] * (M ? 6 : 7) : 2) + 'px'; });
      if (scans) {
        const seen = LOG.filter((l) => l.at <= c).slice(-3).reverse();
        const key = seen.map((l) => l.p + l.at).join();
        if (scans._k !== key) {
          scans._k = key;
          scans.innerHTML = seen.map((l, i) => `<div class="scan-row" style="top:${i * 54}px"><div><b>${P[l.p].n}</b><small>${l.tier}</small></div><span class="sr-g">${l.gate}</span><span class="d-chip ${l.bad ? 'bad' : 'ok'}">${l.bad ? 'Duplicate' : 'Accepted'}</span><span class="sr-t">${clockStr(l.at)}</span></div>`).join('');
          const first = scans.firstElementChild;
          if (first && seen.length && !rm) gsap.fromTo(first, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
        }
      }
      // the phone
      const s = SCANS.find((x) => t >= x.a && t < x.b);
      if (!s) { gsap.set(guest, { x: 300, opacity: 0 }); frame.className = 'sc-frame'; card.style.opacity = 0; hint.style.opacity = 1; return; }
      const phs = t - s.a;
      gsap.set(guest, { x: phs < 0.45 ? lerp(300, 0, ease(phs / 0.45)) : phs > 1.15 ? lerp(0, -300, ease(seg(phs, 1.15, 1.4))) : 0, opacity: 1 });
      txt($('.gs', guest), s.tier); txt($('.gn', guest), P[s.p].n);
      if ($('.gq', guest)._p !== s) { $('.gq', guest).innerHTML = qrSVG(s.p.length * 7919 + s.a * 1000); $('.gq', guest)._p = s; }
      const res = phs > 0.5 && phs < 1.25;
      frame.className = 'sc-frame' + (res ? (s.ok ? ' ok' : ' bad') : '');
      hint.style.opacity = res ? 0 : 1;
      card.style.opacity = res ? 1 : 0;
      const k = s.p + s.ok;
      if (res && cardKey !== k) {
        cardKey = k;
        card.className = 'sc-card' + (s.ok ? '' : ' bad');
        card.innerHTML = s.ok ? `<img src="${P[s.p].img}" alt=""><div><b>${P[s.p].n}</b><small>@${P[s.p].u}</small><em>Valid Ticket · Door 2</em></div>` : `<span class="bad-ic">${lu(LU.alert, 28)}</span><div><b>Ticket already scanned</b><small>Door 2 at ${clockStr(clockAt(SCANS[1].a + 0.5))}</small><em>Tap to Retry</em></div>`;
      }
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'Doors', tl, (t) => { const c = clockAt(t), n = ARR_CUM[clamp(Math.floor(c - 1290), 0, 120)]; return { k: `Doors · ${clockStr(c)}`, v: `${n} in · ${Math.round((n / 180) * 100)}% full`, p: n / 180 }; });
    done(tl, rm);
  }

  /* ═════════════════════════ 04 THE ROOM — heat map + hype ═════════════════════════ */
  const H_CHAT = [60, 70, 45, 40, 38, 35, 22], H_RX = [20, 90, 210, 260, 220, 130, 50], H_CAP = [4, 22, 58, 64, 41, 20, 5], H_COM = [3, 12, 30, 38, 32, 18, 7];
  const HOURS = ['9 PM', '10 PM', '11 PM', '12 AM', '1 AM', '2 AM', '3 AM'];
  const cumAt = (arr, c) => arr.reduce((a, v, h) => a + v * clamp((c - h * 60 + 30) / 60), 0); // c = minutes since 9 PM
  const hypeAt = (c) => Math.round((10 * (cumAt(H_RX, c) + cumAt(H_COM, c) + cumAt(H_CHAT, c) + 2 * cumAt(H_CAP, c))) / 164);
  const tierOf = (s) => (s < 20 ? 'Quiet' : s < 50 ? 'Warm' : s < 90 ? 'Buzzing' : s < 150 ? 'Electric' : 'Wildfire');
  // DBSCAN clusters; bumps are [minutes since 9 PM, width, amplitude]
  const BUMPS = [[[150, 70, 1], [228, 60, 0.9]], [[182, 48, 0.85]], [[78, 40, 0.85], [272, 40, 0.5]], [[242, 50, 0.85]], [[302, 40, 0.75]], [[62, 32, 0.8]]];
  const CL_D = [[236, 150, 118], [118, 150, 72], [552, 64, 82], [788, 152, 84], [480, 206, 70], [632, 246, 56]];
  const CL_M = [[132, 100, 80], [56, 124, 46], [322, 56, 54], [322, 152, 46], [92, 258, 50], [346, 262, 40]];
  const inten = (k, c) => Math.min(1, BUMPS[k].reduce((a, [m, w, amp]) => a + amp * Math.exp(-(((c - m) / w) ** 2)), 0));
  const PLAN_D = { vb: '14 6 872 290', fs: 16, pins: [[632, 284], [220, 284]], body: `
      <rect class="wall" x="30" y="16" width="676" height="268" rx="4"/>
      <line x1="404" y1="16" x2="404" y2="284"/><line x1="404" y1="112" x2="706" y2="112"/><line x1="562" y1="112" x2="562" y2="284"/><line x1="562" y1="206" x2="706" y2="206"/>
      <rect x="56" y="124" width="40" height="64" rx="4"/><path class="dash" d="M706 40 H872 V262 H706"/>
      <rect x="440" y="30" width="230" height="16" rx="3"/>
      <text x="170" y="46">Main room</text><text x="58" y="114">DJ</text><text x="440" y="80">Bar</text><text x="420" y="268">Lounge</text><text x="572" y="164">Coat check</text><text x="592" y="238">Entry</text><text x="730" y="70">Terrace</text>` };
  const PLAN_M = { vb: '0 0 400 320', fs: 15, pins: [[346, 312], [96, 312]], body: `
      <rect class="wall" x="8" y="8" width="384" height="304" rx="6"/>
      <line x1="250" y1="8" x2="250" y2="190"/><line x1="8" y1="190" x2="392" y2="190"/><line x1="180" y1="190" x2="180" y2="312"/><line x1="300" y1="190" x2="300" y2="312"/>
      <path class="dash" d="M250 110 H392"/>
      <rect x="26" y="98" width="30" height="56" rx="4"/><rect x="266" y="62" width="110" height="10" rx="3"/>
      <text x="80" y="38">Main room</text><text x="26" y="90">DJ</text><text x="266" y="96">Bar</text><text x="266" y="140">Terrace</text><text x="22" y="226">Lounge</text><text x="190" y="226">Coat</text><text x="190" y="244">check</text><text x="312" y="226">Entry</text>` };
  function heatSVG(plan, cl) {
    const pin = ([x, y], cls) => `<g class="pin ${cls}" transform="translate(${x} ${y})"><circle r="4"/><rect x="-${plan.fs * 2}" y="-${plan.fs * 2.4}" width="${plan.fs * 4}" height="${plan.fs * 1.6}" rx="${plan.fs * 0.8}"/><text y="-${(plan.fs * 1.6 - plan.fs * 0.36).toFixed(1)}" style="font-size:${plan.fs}px">+0</text></g>`;
    return `<svg viewBox="${plan.vb}" preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id="hb${plan.fs}"><stop offset="0" stop-color="#f2c2ff" stop-opacity=".92"/><stop offset=".3" stop-color="#e98bff" stop-opacity=".62"/><stop offset=".68" stop-color="#d84aff" stop-opacity=".22"/><stop offset="1" stop-color="#d84aff" stop-opacity="0"/></radialGradient></defs>
      <g class="plan" style="font-size:${plan.fs}px">${plan.body}</g>
      <g class="blobs">${cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#hb${plan.fs})" opacity="0"/>`).join('')}</g>
      <g class="rings">${cl.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 0.55}" opacity="0"/>`).join('')}</g>
      ${pin(plan.pins[0], 'p1')}${pin(plan.pins[1], 'p2')}
    </svg>`;
  }
  function initRoom(mode, rm) {
    const sec = $('#room'), stage = prep(sec, mode), M = mode === 'm', q = (s) => $(s, stage);
    const L = M ? mLayout(sec, rm) : null;
    const plan = M ? PLAN_M : PLAN_D, cl = M ? CL_M : CL_D;
    const act = (h) => H_RX[h] + H_CHAT[h] + H_CAP[h] * 2;
    const rib = Array.from({ length: 73 }, (_, i) => { const c = 30 + i * 5, x = clamp((c - 30) / 60, 0, 6), h = Math.floor(x), f = x - h; return lerp(act(h), act(Math.min(6, h + 1)), ease(f)); });
    if (!M) {
      const ch = areaChart({ w: 560, h: 150, series: [{ values: H_CHAT, color: '#c93df2' }, { values: H_RX, color: '#0d9488' }, { values: H_CAP.map((v) => v * 2), color: '#d97706' }], max: 480, ticks: [0, 200, 400], xl: HOURS.map((h, i) => [i, h]), padL: 38, fs: 14, stacked: true, fill: [0.18, 0.02] });
      stage.innerHTML = `<div class="dcard heat">
          <div class="d-headrow"><div><p class="d-eb">Spatial intelligence</p><p class="d-h">Seaport Loft<span class="d-chip">Auto-mapped from photo GPS</span></p></div><span class="d-pill ghost sm">Recalibrate</span></div>
          <div class="heat-map">${heatSVG(plan, cl)}<span class="heat-time">9:30 PM</span><span class="heat-peak">Peak · 11:42 PM · Main room</span></div>
          <div class="play"><span class="pb">${hi('PlayIcon', 15)}</span><span class="lbl">Play the night back</span><div class="hist">${'<i></i>'.repeat(48)}</div><span class="pfoot"><b class="h-geo">0</b> geotagged photos · <b class="h-sc">0</b> scans</span></div>
        </div>
        <div class="dcard hype">
          <div class="d-headrow"><div><p class="d-eb">Run the night</p><p class="d-h">Hype through the night</p></div><div class="seg"><span class="on">All activity</span><span>Chat</span><span>Reactions</span><span>Captures</span></div></div>
          <div class="hype-body"><div class="hype-chart">${ch.svg}</div>
            <div class="hype-score"><p class="lab">Hype score</p><div class="v"><b class="h-score">0</b><span class="tier" data-t="Quiet">Quiet</span></div>
              <div class="hype-mini"><div><small>Chat</small><b class="h-chat">0</b></div><div><small>Reactions</small><b class="h-rx">0</b></div><div><small>Captures</small><b class="h-cap">0</b></div></div></div></div>
        </div>`;
      const hsvg = $('.hype-chart svg', stage);
      hsvg.insertAdjacentHTML('beforeend', `<line class="hc" y1="6" y2="${ch.base}" stroke="rgba(255,255,255,.14)"/><circle class="spike" cx="${ch.X(3)}" cy="${ch.Y(H_CAP[3] * 2 + H_CHAT[3] + H_RX[3])}" r="5" fill="#d84aff" stroke="#0e0e13" stroke-width="2" opacity="0"/>`);
      stage._ch = ch;
    } else {
      const sp = areaChart({ w: L.W - 32, h: 44, series: [{ values: rib, color: '#d84aff' }], max: Math.max(...rib) * 1.05, noAxis: true, fill: [0.3, 0.02] });
      stage.innerHTML = `<div class="dcard heat">
          <div class="d-headrow"><div><p class="d-eb">Spatial intelligence</p><p class="d-h">Seaport Loft</p></div><span class="d-chip">From photo GPS</span></div>
          <div class="heat-map" style="height:${Math.round((L.W - 32) * 0.8)}px">${heatSVG(plan, cl)}<span class="heat-time">9:30 PM</span></div>
          <div class="heat-foot"><span><b class="h-geo">0</b> geotagged photos</span><span><b class="h-sc">0</b> scans</span></div>
        </div>
        <div class="dcard hype-m hype-score"><div class="top"><div><p class="lab">Hype score</p><div class="v"><b class="h-score">0</b><span class="tier" data-t="Quiet">Quiet</span></div></div><div class="hype-mini"><div><small>Chat</small><b class="h-chat">0</b></div><div><small>Reactions</small><b class="h-rx">0</b></div><div><small>Captures</small><b class="h-cap">0</b></div></div></div><div class="spark">${sp.svg}</div></div>`;
      const ssvg = $('.spark svg', stage);
      ssvg.insertAdjacentHTML('beforeend', `<line class="hc" y1="0" y2="44" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>`);
      stage._ch = sp;
      const lay = () => { q('.hype-m').style.top = (q('.heat').offsetHeight + 12) + 'px'; };
      lay(); RELAY.push(() => { mLayout(sec, rm); lay(); });
    }
    const ch = stage._ch, csvg = M ? $('.spark svg', stage) : $('.hype-chart svg', stage), cclip = $('.clip', csvg), hc = $('.hc', csvg), spike = $('.spike', csvg);
    const blobs = $$('.blobs circle', stage), rings = $$('.rings circle', stage), peak = q('.heat-peak'), hist = $$('.hist i', stage), pins = $$('.pin', stage);
    const C0 = 30, C1 = 390, A = 0.4, B = 8.2, AGG = [1, 0.8, 0.72, 0.66, 0.52, 0.46];
    const tl = mkTL(sec, mode, rm, 2.6);
    if (M) { mLead(tl, sec, stage, rm); tl.fromTo(q('.heat'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0); fadeIn(tl, q('.hype-m'), 1.5, 24, 0.4); }
    else tl.fromTo(q('.heat'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0).fromTo(q('.hype'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.2);
    tl.to({}, { duration: 0.9 }, 9.2);
    let lastTier = '';
    tl.eventCallback('onUpdate', () => {
      const t = tl.time(), c = lerp(C0, C1, seg(t, A, B)), p = (c - C0) / (C1 - C0), ag = ease(seg(t, 8.5, 9.1));
      txt(q('.heat-time'), ag > 0.5 ? 'Whole night' : clockStr(21 * 60 + c));
      blobs.forEach((b, i) => { const v = lerp(inten(i, c), AGG[i], ag); b.setAttribute('opacity', (v * 0.95).toFixed(3)); b.setAttribute('r', (cl[i][2] * (0.55 + 0.45 * v)).toFixed(1)); });
      rings.forEach((r, i) => r.setAttribute('opacity', lerp(inten(i, c), AGG[i], ag) > 0.5 ? 1 : 0));
      if (peak) {
        const pk = c >= 162;
        peak.style.opacity = pk ? 1 : 0;
        if (pk && !peak._placed) { const box = q('.heat-map'); peak.style.left = Math.round((236 - 14) / 872 * box.clientWidth - 40) + 'px'; peak.style.top = Math.round((60 / 290) * box.clientHeight) + 'px'; peak._placed = 1; }
      }
      const cur = Math.round(p * (hist.length - 1));
      hist.forEach((b, i) => { b.className = i === cur ? 'cur' : i < cur ? 'on' : ''; b.style.height = (6 + (rib[Math.round((i / (hist.length - 1)) * 72)] / 540) * 30) + 'px'; });
      const mi = clamp(Math.floor(c - 30), 0, 120), d2 = Math.round(ARR_CUM[mi] * 0.28);
      const pv = [ARR_CUM[mi] - d2, d2];
      pins.forEach((g, i) => { txt($('text', g), '+' + pv[i]); g.classList.toggle('act', c < 150 && pv[i] > 0); });
      txt(q('.h-geo'), Math.round(cumAt(H_CAP, c) * 0.61)); txt(q('.h-sc'), ARR_CUM[mi]);
      // hype chart / spark + score
      const hx = M ? ch.X(p * 72) : ch.X(clamp(c / 60, 0, 6));
      cclip.setAttribute('width', hx + 1); hc.setAttribute('x1', hx); hc.setAttribute('x2', hx); hc.style.opacity = p < 0.995 ? 1 : 0;
      if (spike) spike.setAttribute('opacity', c >= 186 ? 1 : 0);
      const sc = hypeAt(c), tr = tierOf(sc);
      txt(q('.h-score'), sc);
      if (tr !== lastTier) {
        const el = q('.tier'); el.dataset.t = tr; el.textContent = tr;
        if (lastTier && !rm) gsap.fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
        lastTier = tr;
      }
      txt(q('.h-chat'), int(cumAt(H_CHAT, c))); txt(q('.h-rx'), int(cumAt(H_RX, c))); txt(q('.h-cap'), int(cumAt(H_CAP, c)));
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'The room', tl, (t) => { const c = lerp(C0, C1, seg(t, A, B)), s = hypeAt(c); return { k: `Live · ${clockStr(21 * 60 + c)}`, v: `Hype ${s} · ${tierOf(s)}`, p: s / 150 }; });
    done(tl, rm);
  }

  /* ═════════════════════════ 05 RECAP — top moments → marketing kit ═════════════════════════ */
  const ALBUM = ['w24', 'k02', 'w10', 'w31', 'w05', 't06', 'w26', 'w17', 'k00', 'w06', 't02', 'w30', 'w04', 'w28', 'w21', 'w36'];
  const RX = [96, 241, 77, 312, 61, 204, 150, 52, 288, 187, 219, 44, 84, 163, 31, 18];
  function initRecap(mode, rm) {
    const sec = $('#recap'), stage = prep(sec, mode), M = mode === 'm', q = (s) => $(s, stage);
    const L = M ? mLayout(sec, rm) : null;
    const N = M ? 9 : 16, COLS = M ? 3 : 4, G = M ? 8 : 12;
    const TW = M ? Math.floor((L.W - 32 - 2 * G) / 3) : 116;
    const ids = ALBUM.slice(0, N), rxs = RX.slice(0, N);
    const rank = rxs.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
    const slot = (k) => ({ x: (k % COLS) * (TW + G), y: Math.floor(k / COLS) * (TW + G) });
    const gridH = Math.ceil(N / COLS) * (TW + G) - G;
    stage.innerHTML = `<div class="dcard album">
        <div class="d-headrow"><div><p class="d-h">Top moments</p><p class="d-sub">Ranked by what the room reacted to.</p></div><span class="d-pill solid sm kit-btn">Marketing kit</span></div>
        <div class="seg"><span class="on">Newest</span><span>Most reacted</span></div>
        <div class="${M ? 'grid9' : 'grid16'}" style="height:${gridH}px">${ids.map((n, i) => `<div class="tile16" style="left:${slot(i).x}px;top:${slot(i).y}px;width:${TW}px;height:${TW}px"><img src="/site/img/lib/${n}.jpg" alt=""><span class="rx">${lu(LU.heart, 13, 2.4)}<b>${rxs[i]}</b></span><i class="dim"></i><i class="ring"></i><span class="rk"></span></div>`).join('')}</div>
      </div>
      <div class="scrim"></div>
      <div class="dcard kit">${M ? '<div class="grab"></div>' : ''}
        <div class="d-headrow"><div><h6>Use this content</h6><p class="kit-d">8 photos from the top of the album.</p></div><span class="kit-x">${hi('Cancel01Icon', 14)}</span></div>
        <div class="kit-grid">${rank.slice(0, 8).map((i) => `<div><img src="/site/img/lib/${ids[i]}.jpg" alt=""></div>`).join('')}</div>
        <div class="kit-cap"><small>Caption</small><p>Late Checkout, Oct 2. 214 photos from 38 phones. Thank you, Boston. Vol. II soon.</p></div>
        <div class="kit-actions"><span class="d-pill solid">Download 8 photos</span><span class="d-pill ghost">Copy caption</span></div>
      </div>`;
    const tiles = $$('.tile16', stage);
    rank.forEach((ti, k) => { $('.rk', tiles[ti]).textContent = k + 1; });
    if (M) {
      const lay = () => { q('.scrim').style.height = q('.album').offsetHeight + 'px'; };
      lay(); RELAY.push(() => { mLayout(sec, rm); lay(); });
    }
    const segs = $$('.album .seg span', stage), dl = $('.kit-actions .solid', stage);
    const tl = mkTL(sec, mode, rm, 2.4);
    if (M) mLead(tl, sec, stage, rm);
    tl.fromTo(q('.album'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(tiles, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' }, 0.2);
    tiles.forEach((el, i) => { const k = rank.indexOf(i), a = slot(i), b = slot(k); tl.to(el, { x: b.x - a.x, y: b.y - a.y, duration: 1.4, ease: 'power3.inOut' }, 1.8 + (k % 8) * 0.05); });
    rank.forEach((ti, k) => {
      if (k < 8) tl.to([$('.ring', tiles[ti]), $('.rk', tiles[ti])], { opacity: 1, duration: 0.2 }, 3.9 + k * 0.08);
      else tl.to($('.dim', tiles[ti]), { opacity: 1, duration: 0.3 }, 4.1);
    });
    tl.to(q('.scrim'), { opacity: 1, duration: 0.3 }, 5.5)
      .fromTo(q('.kit'), M ? { opacity: 0, y: 120 } : { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }, 5.55)
      .fromTo($$('.kit-grid div', stage), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.22, stagger: 0.05, ease: 'back.out(2)' }, 5.75)
      .to(dl, { scale: 0.95, duration: 0.1 }, 8.2).to(dl, { scale: 1, duration: 0.1 }, 8.3)
      .to({}, { duration: 1.2 }, 8.8);
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      segs[0].classList.toggle('on', t < 1.6); segs[1].classList.toggle('on', t >= 1.6);
      q('.kit-btn').classList.toggle('pressed', t > 5.2 && t < 5.7);
      const got = t > 8.3;
      dl.classList.toggle('done', got);
      txt(dl, got ? '8 photos saved' : 'Download 8 photos');
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'The recap', tl, (t) => ({ k: 'Wrapped', v: t > 6 ? 'Kit · 8 photos' : '214 photos', p: 1 }));
    done(tl, rm);
  }

  /* ═════════════════════════ 06 CROWD — attendance path, CRM, campaign ═════════════════════════ */
  function initCrowd(mode, rm) {
    const sec = $('#crowd'), stage = prep(sec, mode), M = mode === 'm', q = (s) => $(s, stage);
    const L = M ? mLayout(sec, rm) : null;
    const F = [['Sold', 180, '#efc7ff'], ['Scanned', 164, '#d76bff'], ['Posted media', 38, '#8f2bb8']];
    const funnel = `<div class="dcard funnel${M ? ' crowd-b' : ''}"><p class="d-eb">Audience</p><p class="d-h">Attendance path</p>
      <div class="fun">${F.map(([n, v, c], i) => `${i ? `<span class="fun-chip">${Math.round((v / F[i - 1][1]) * 100)}% advance <em>· ${F[i - 1][1] - v} drop</em></span>` : ''}<div class="fun-r"><div class="fun-l"><b><i style="background:${c}"></i>${n}</b><small>${Math.round((v / 180) * 100)}% of sold</small></div><div class="fun-t"><div class="bar" style="width:${Math.max(10, (v / 180) * 100)}%;background:${c}"><b class="fv" data-v="${v}">0</b></div></div></div>`).join('')}</div></div>`;
    const strip = `<div class="d-strip s4"><div><small>Attendees</small><b class="cv" data-v="164">0</b></div><div><small>Passports</small><b class="cv" data-v="131">0</b></div><div><small>Emailable</small><b class="cv" data-v="118">0</b></div><div><small>Repeat</small><b class="cv" data-v="31" data-f="pct">0%</b></div></div>`;
    const filters = '<div class="filters"><span class="flt">Email opt-in</span><span class="flt">City · Boston</span><span class="flt">Passport holder</span></div>';
    const saved = '<span class="seg-saved">Boston regulars <em>86</em><span>Send →</span></span>';
    const crm = M ? `<div class="dcard crm crowd-b"><div class="d-headrow"><div><p class="d-eb">CRM</p><p class="d-h">Know your crowd</p></div><span class="d-chip ok">${hi('CheckmarkCircle02Icon', 12)}Scanned</span></div>${strip}${filters}
        <div class="match-m"><span class="match-l"><b class="match">164</b>attendees match</span></div>
        <div class="seg-act"><span class="d-pill ghost seg-save">Save as segment</span>${saved}</div></div>`
      : `<div class="dcard crm"><div class="d-headrow"><div><p class="d-eb">CRM</p><p class="d-h">Know your crowd</p></div><span class="d-chip ok">${hi('CheckmarkCircle02Icon', 14)}Scanned, not self-reported</span></div>${strip}${filters}
        <div class="seg-row"><span class="match-l"><b class="match">164</b>attendees match</span><span class="seg-act" style="position:relative;display:inline-grid"><span class="d-pill ghost sm seg-save" style="grid-area:1/1">Save as segment</span><span style="grid-area:1/1;justify-self:end">${saved}</span></span></div></div>`;
    const send = `<div class="dcard send${M ? ' crowd-b' : ''}"><div class="d-headrow"><div><p class="d-eb">Campaigns</p><p class="d-h">Compose send</p></div><div class="seg"><span class="on">Email</span><span>SMS</span></div></div>
      <div class="send-body"><div class="composer"><div class="snd-f"><small>To</small>Boston regulars (86)</div><div class="snd-f"><small>Subject</small><span class="subj"></span></div></div>
        <div class="quote"><div class="q2"><div><small>Consent</small><b>Enforced</b></div><div><small>Unsubscribe</small><b>Automatic</b></div></div><span class="d-pill solid sendbtn">Send campaign</span></div></div></div>`;
    stage.innerHTML = funnel + crm + send;
    if (M) {
      const lay = (l) => {
        const cards = $$('.crowd-b', stage);
        cards.forEach((c) => { c.style.top = '0px'; });
        const off = Math.max(0, Math.round((l.H - Math.max(...cards.map((c) => c.offsetHeight))) * 0.38));
        cards.forEach((c) => { c.style.top = off + 'px'; });
      };
      lay(L); RELAY.push(() => lay(mLayout(sec, rm)));
    }
    const SUBJ = 'Late Checkout II: you\'re first in line';
    const fv = $$('.fv', stage), cv = $$('.cv', stage), flt = $$('.flt', stage), match = q('.match'), save = q('.seg-save'), savedEl = q('.seg-saved'), subj = q('.subj'), sendbtn = q('.sendbtn');
    const T = M ? { bars: 0.3, chips: 1.2, crm: 3.62, cnt: [3.8, 4.5], f: [4.4, 4.9, 5.35], save: [5.6, 5.9], send: 6.85, typ: [7.3, 8.25], press: 8.55, sent: 8.7 }
      : { bars: 0.3, chips: 1.2, crm: 1.8, cnt: [2.0, 2.9], f: [3.1, 3.7, 4.3], save: [4.8, 5.1], send: 5.55, typ: [6.3, 7.8], press: 8.2, sent: 8.35 };
    const tl = mkTL(sec, mode, rm, 2.5);
    if (M) mLead(tl, sec, stage, rm);
    tl.fromTo(q('.funnel'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0)
      .to($$('.fun .bar', stage), { scaleX: 1, duration: 0.6, stagger: 0.25, ease: 'power3.out' }, T.bars)
      .to($$('.fun-chip', stage), { opacity: 1, duration: 0.2, stagger: 0.25 }, T.chips);
    if (M) { fadeOut(tl, q('.funnel'), 3.25); fadeIn(tl, q('.crm'), T.crm); fadeOut(tl, q('.crm'), 6.45); fadeIn(tl, q('.send'), T.send); }
    else { tl.fromTo(q('.crm'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, T.crm); fadeIn(tl, q('.send'), T.send, 50); }
    tl.fromTo(savedEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(2)' }, T.save[1])
      .to(save, { opacity: 0, duration: 0.2 }, T.save[1])
      .to(sendbtn, { scale: 0.96, duration: 0.1 }, T.press).to(sendbtn, { scale: 1, duration: 0.1 }, T.press + 0.1)
      .to({}, { duration: 1 }, 9.2);
    tl.eventCallback('onUpdate', () => {
      const t = tl.time(), a = seg(t, T.bars, T.bars + 1), b = seg(t, T.cnt[0], T.cnt[1]);
      fv.forEach((el) => txt(el, Math.round(+el.dataset.v * a)));
      cv.forEach((el) => { const v = Math.round(+el.dataset.v * b); txt(el, el.dataset.f === 'pct' ? v + '%' : v); });
      const on = T.f.map((x) => t > x);
      flt.forEach((f, i) => f.classList.toggle('on', on[i]));
      txt(match, on[2] ? 86 : on[1] ? 97 : on[0] ? 118 : 164);
      save.classList.toggle('solid', t > T.save[0] && t < T.save[1]); save.classList.toggle('ghost', !(t > T.save[0] && t < T.save[1]));
      const n = Math.round(seg(t, T.typ[0], T.typ[1]) * SUBJ.length);
      html(subj, n ? esc(SUBJ.slice(0, n)) + (t < T.typ[1] + 0.1 ? '<i class="caret"></i>' : '') : '<span class="ph">Subject</span>');
      const sent = t > T.sent;
      sendbtn.classList.toggle('sent', sent);
      txt(sendbtn, sent ? 'Sent to 86 guests' : 'Send campaign');
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'Your crowd', tl, (t) => t > T.sent ? { k: 'Campaign · Email', v: 'Sent to 86', p: 1 } : t > T.save[1] ? { k: 'Segment saved', v: 'Boston regulars · 86', p: 86 / 164 } : { k: 'After the night', v: '164 verified guests', p: 164 / 180 });
    done(tl, rm);
  }

  /* ═════════════════════════ 07 NEXT — sequel + OG attendees ═════════════════════════ */
  const OG = ['maya', 'kofi', 'nia', 'zee', 'tay', 'sade'];
  function initNext(mode, rm) {
    const sec = $('#next'), stage = prep(sec, mode), M = mode === 'm', q = (s) => $(s, stage);
    const L = M ? mLayout(sec, rm) : null;
    stage.innerHTML = `<div class="dcard sequel">
        <p class="d-eb">Afterglow</p><p class="d-h">Ready for the sequel?</p>
        <p class="d-sub">164 people scanned in. 38 of them shot the night. Bring them back.</p>
        <div class="d-strip s3"><div><small>Scanned in</small><b>164</b></div><div><small>Shot the night</small><b>38</b></div><div><small>Past guests</small><b>212</b></div></div>
        <div class="sq-actions"><span class="d-pill solid sm sq-plan">Plan the next event</span><span class="d-pill ghost sm">Message past attendees</span></div>
      </div>
      <div class="sq-pill"><b>Late Checkout II</b><small>Fri, Nov 6</small><span class="d-chip">Draft</span></div>`;
    const ph = mkPhone('invite-phone', M ? mPW() : 300), scr = ph.scr;
    stage.appendChild(ph.el);
    if (M) {
      const lay = (l) => { ph.el.style.left = Math.round((l.W - ph.pw) / 2) + 'px'; ph.el.style.top = '56px'; cropPhone(ph, l.H - 56); };
      lay(L); RELAY.push(() => lay(mLayout(sec, rm)));
    }
    scr.insertAdjacentHTML('beforeend', `<div class="iv">${sbar('10:14')}<div class="iv-sheet">
      <div class="iv-head">INVITE PEOPLE<i>${lu(LU.x, 18)}</i></div>
      <p class="iv-name">Late Checkout II</p>
      <div class="iv-meta"><span>${lu(LU.cal, 13)} Fri, Nov 6</span><span>${lu(LU.pin, 13)} Seaport, Boston</span></div>
      <div class="iv-boost">${lu(LU.mega, 22)}<div><b>Boost this event</b><small>Feed and discovery ads, featured slots and email blasts from your campaign dashboard.</small></div></div>
      <div class="iv-share"><span>LINK${lu(LU.share, 22)}</span><span class="ig">STORY${hi('InstagramIcon', 22)}</span><span>SCAN${hi('QrCodeIcon', 22)}</span></div>
      <div class="iv-chips"><span class="og">OG Attendees</span><span>All Friends</span><span>Clear</span></div>
      <div class="iv-sec"><span>OG ATTENDEES</span><span class="all">INVITE ALL (212)</span></div>
      <div class="iv-list">${OG.map((p) => `<div class="iv-row"><img src="${P[p].img}" alt=""><div><b>${P[p].n}</b><small>@${P[p].u}</small></div><span class="ck">+</span></div>`).join('')}</div>
    </div><div class="iv-send"><span>Send Invites · 212</span></div><div class="iv-dim"></div><div class="iv-alert"><b>Sent 212/212 invites.</b><p>Everyone from your past nights is on the list for Late Checkout II.</p><span>OK</span></div></div>`);
    const rows = $$('.iv-row', scr), cks = $$('.ck', scr), og = $('.iv-chips .og', scr), all = $('.iv-sec .all', scr), plan = q('.sq-plan'), sendb = $('.iv-send', scr);
    const tl = mkTL(sec, mode, rm, 2.2);
    tl.fromTo(q('.sequel'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0);
    if (M) {
      mLead(tl, sec, stage, rm);
      tl.to(q('.sequel'), { opacity: 0, scale: 0.94, y: -16, duration: 0.35, ease: 'power2.in' }, 2.1);
      fadeIn(tl, q('.sq-pill'), 2.45, -10, 0.3);
      tl.fromTo(ph.el, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 2.45);
    } else {
      tl.fromTo(ph.el, { opacity: 0, y: 140 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.8);
    }
    tl.fromTo(rows, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.18, ease: 'power2.out' }, 3.5)
      .to(all, { scale: 0.93, duration: 0.1 }, 5.2).to(all, { scale: 1, duration: 0.1 }, 5.3)
      .fromTo(sendb, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, 6.3)
      .to($('span', sendb), { scale: 0.96, duration: 0.1 }, 7.0).to($('span', sendb), { scale: 1, duration: 0.1 }, 7.1)
      .to($('.iv-dim', scr), { opacity: 1, duration: 0.25 }, 7.3)
      .fromTo($('.iv-alert', scr), { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, 7.35)
      .to({}, { duration: 1.4 }, 8.6);
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      plan.classList.toggle('pressed', t > 1.3 && t < 1.9);
      og.classList.toggle('on', t > 3.1);
      all.classList.toggle('pressed', t > 5.2 && t < 5.4);
      cks.forEach((c, i) => { const on = t > 5.45 + i * 0.12; c.classList.toggle('on', on); txt(c, on ? '✓' : '+'); });
    });
    tl.eventCallback('onUpdate')();
    register(sec, 'The next one', tl, (t) => t > 7.35 ? { k: 'Late Checkout II', v: '212 invites sent', p: 1 } : { k: 'Late Checkout II', v: 'Draft · inviting', p: seg(t, 3.1, 7) });
    done(tl, rm);
  }

  /* ═════════════════════════ the whole night / fine print / final ═════════════════════════ */
  const STEPS = [['Calendar01Icon', 'Create', 'Live in minutes'], ['AddTeamIcon', 'Invite', 'Past guests first'], ['Ticket01Icon', 'Sell', 'In your name'], ['QrCodeIcon', 'Door', 'Signed, scanned'],
    ['FireIcon', 'Room', 'Heat map, hype'], ['Camera02Icon', 'Album', 'Everyone shoots'], ['SparklesIcon', 'Recap', 'Top moments, kit'], ['Mail01Icon', 'Reach', 'Segments, email, SMS'], ['RotateClockwiseIcon', 'Repeat', 'The sequel']];
  const ol = $('.track-steps');
  ol.innerHTML = STEPS.map(([i, b, s]) => `<li><span class="dot" aria-hidden="true">${hi(i, 22)}</span><div><b>${b}</b><small>${s}</small></div></li>`).join('');
  function initStack(mode, rm) {
    const lis = $$('li', ol), fill = $('.rail-fill'), br = $('.track-bracket');
    if (rm) { gsap.set(fill, { scaleX: 1, scaleY: 1 }); gsap.set(br, { opacity: 1 }); lis.forEach((li) => li.classList.add('lit')); return; }
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.track', start: 'top 78%', end: 'bottom 42%', scrub: 0.6 } });
    tl.fromTo(fill, mode === 'm' ? { scaleY: 0, scaleX: 1 } : { scaleX: 0, scaleY: 1 }, mode === 'm' ? { scaleY: 1, duration: 1, ease: 'none' } : { scaleX: 1, duration: 1, ease: 'none' }, 0)
      .to(br, { opacity: 1, duration: 0.12 }, 0.3);
    tl.eventCallback('onUpdate', () => { const p = tl.progress(); lis.forEach((li, k) => li.classList.toggle('lit', p >= k / (lis.length - 1) - 0.02)); });
    gsap.from(['#stack .display', '#stack .lead'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#stack', start: 'top 75%' } });
    gsap.from('.term', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.terms', start: 'top 80%' } });
    gsap.from(['#final .display-xl', '#final .ctas', '#final .guest-link'], { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: '#final', start: 'top 75%' } });
  }
  // copy beats in every scene rise in as the scene arrives
  function initCopy() {
    $$('.scene').forEach((sec) => gsap.from($$('.copy .beat > :not(.sr-only)', sec), { y: 34, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: sec, start: 'top 70%', toggleActions: 'play none none reverse' } }));
  }

  /* ───────────────────────── boot ───────────────────────── */
  initStatus();
  const nav = $('.nav');
  ScrollTrigger.create({ start: 40, onUpdate: (s) => nav.classList.toggle('scrolled', s.scroll() > 40) }); // padding only: the header stays transparent
  const PHONE = '(max-width: 860px), (max-width: 1024px) and (max-height: 500px)', DESK = '(min-width: 861px) and (min-height: 501px), (min-width: 1025px)';
  let mm, first = true, curMode = '', builtW = window.innerWidth;
  function run(ctx) {
    const { m, short } = ctx.conditions, rm = ctx.conditions.rm || short, mode = m ? 'm' : 'd';
    curMode = mode; builtW = window.innerWidth;
    SCENES.length = 0; RELAY.length = 0;
    $$('.scene').forEach((s) => s.classList.toggle('rm', !!rm));
    initHero(mode, !!rm, first);
    initLaunch(mode, !!rm); initSell(mode, !!rm); initDoors(mode, !!rm); initRoom(mode, !!rm);
    initRecap(mode, !!rm); initCrowd(mode, !!rm); initNext(mode, !!rm);
    initStack(mode, !!rm);
    if (!rm) initCopy();
    first = false;
    if (mode === 'd') fitStages();
    const onRI = () => { if (mode === 'd') fitStages(); else RELAY.forEach((f) => f()); };
    L.on(ScrollTrigger, 'refreshInit', onRI);
    return () => L.off(ScrollTrigger, 'refreshInit', onRI);
  }
  function boot() {
    if (mm) mm.revert();
    mm = L.mm();
    // a landscape phone is too short for a pinned scene: it gets the static end states
    mm.add({ d: DESK, m: PHONE, rm: '(prefers-reduced-motion: reduce)', short: '(max-width: 1024px) and (max-height: 500px)' }, run);
  }
  boot();
  // mobile layouts are built for the width they have: rebuild when a phone rotates or the window is resized within the mobile range
  let rz;
  L.on(window, 'resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (curMode === 'm' && matchMedia(PHONE).matches && Math.abs(window.innerWidth - builtW) > 24) { boot(); ScrollTrigger.refresh(); } }, 220);
  });
  await document.fonts.ready;
  if (!L.alive) return;
  ScrollTrigger.refresh();
}
