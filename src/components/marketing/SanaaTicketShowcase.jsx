'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { QrCodeIcon } from '@hugeicons/core-free-icons';

/**
 * Proof that tickets carry the organizer's brand, not ours. Both pieces are
 * dressed as a real client night — Sanaa Groove's "Groove n' find Love"
 * (Feb 13 2026, Revere MA) — using the collective's actual flyer and palette.
 *
 * `SanaaCheckoutCard` mirrors the web checkout's cover column
 * (EventCheckout.jsx: blurred cover backdrop + 3/4 cover card + info text).
 * `SanaaAppTicket` mirrors the app's Studio ticket stub — zigzag edges,
 * dashed inner frame, perforated QR stub — re-themed from PXI magenta to
 * Sanaa's rose-and-cream.
 */
export const SANAA_COVER = '/landing/posters_lineups/Poster/poster4.jpg';

/* Sanaa Groove flyer palette */
const ROSE = '#f2688c';
const CREAM = '#f3ecd7';

/* Zigzag ticket silhouette (left/right toothed edges, straight top/bottom),
   generated once as a clip-path polygon. */
function zigzagPolygon(teeth = 14, inset = 1.8) {
  const pts = [`${inset}% 0%`, `${100 - inset}% 0%`];
  for (let i = 0; i < teeth * 2; i += 1) {
    const x = i % 2 === 0 ? 100 : 100 - inset;
    pts.push(`${x}% ${((i + 1) / (teeth * 2)) * 100}%`);
  }
  pts.push(`${100 - inset}% 100%`, `${inset}% 100%`);
  for (let i = teeth * 2 - 1; i >= 0; i -= 1) {
    const x = i % 2 === 0 ? 0 : inset;
    pts.push(`${x}% ${((i + 1) / (teeth * 2)) * 100}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

const TICKET_CLIP = zigzagPolygon();

export function SanaaCheckoutCard({ className = '' }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8 ${className}`}
    >
      {/* Blurred flyer backdrop — same treatment as the live checkout page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={SANAA_COVER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-150 blur-[60px] opacity-[0.25]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0a0a0a]/80 to-black/90" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[260px] flex-col gap-4">
        <div className="w-full aspect-[3/4] overflow-hidden rounded-[1.6rem] shadow-2xl bg-zinc-900/50">
          <img src={SANAA_COVER} alt="Sanaa Groove — Groove n' find Love event cover" className="h-full w-full object-cover" />
        </div>
        <div className="px-1 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: ROSE }}>
            Their cover · their colors
          </p>
          <p className="text-xl font-black uppercase tracking-tight text-white leading-tight">
            Groove n&rsquo; find Love
          </p>
          <p className="text-sm text-zinc-400">Feb 13, 2026 · Revere, MA</p>
        </div>
      </div>
    </div>
  );
}

export function SanaaAppTicket({ className = '' }) {
  return (
    <div
      aria-hidden
      className={`relative ${className}`}
      style={{ filter: `drop-shadow(0 0 22px ${ROSE}66)` }}
    >
      {/* zigzag border layer */}
      <div className="p-[3px]" style={{ clipPath: TICKET_CLIP, background: ROSE }}>
        {/* ticket face */}
        <div className="relative bg-[#120409]" style={{ clipPath: TICKET_CLIP }}>
          <div className="flex">
            {/* body */}
            <div className="min-w-0 flex-1 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-black uppercase leading-tight tracking-wide text-white">
                  Groove n&rsquo; find Love
                </p>
                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] underline underline-offset-2" style={{ color: ROSE }}>
                  Public
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: ROSE }}>Date &amp; time</p>
                  <p className="mt-0.5 text-[12px] font-bold tracking-wide text-white">Feb 13 / 6:00 PM</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: ROSE }}>Location</p>
                  <p className="mt-0.5 text-[12px] font-bold tracking-wide text-white">Revere, MA</p>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: ROSE }}>Tier</p>
                  <p className="mt-0.5 text-[12px] font-bold tracking-wide text-white">Groovist</p>
                </div>
                <span
                  className="rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ background: ROSE, color: '#2b0714', boxShadow: `0 0 16px ${ROSE}80` }}
                >
                  Open thread
                </span>
              </div>

              <div
                className="mt-3.5 rounded-lg border px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ borderColor: `${ROSE}55`, color: CREAM }}
              >
                Ticket is non refundable
              </div>
            </div>

            {/* perforation + QR stub */}
            <div className="relative flex w-[104px] shrink-0 items-center justify-center border-l border-dashed" style={{ borderColor: `${ROSE}66` }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]">
                <HugeiconsIcon icon={QrCodeIcon} size={44} className="text-black" />
              </div>
            </div>
          </div>

          {/* dashed inner frame, like the app ticket */}
          <div
            className="pointer-events-none absolute inset-2 rounded-md border border-dashed"
            style={{ borderColor: `${ROSE}66` }}
          />
        </div>
      </div>

      {/* perforation notches at the stub divider */}
      <span className="absolute -top-[5px] right-[104px] h-3 w-3 rounded-full bg-black" />
      <span className="absolute -bottom-[5px] right-[104px] h-3 w-3 rounded-full bg-black" />
    </div>
  );
}

export default function SanaaTicketShowcase({ className = '' }) {
  return (
    <div className={`mx-auto flex w-full max-w-[420px] flex-col gap-5 ${className}`}>
      <SanaaCheckoutCard />
      <SanaaAppTicket />
      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-600">
        A real client night · Sanaa Groove, Boston
      </p>
    </div>
  );
}
