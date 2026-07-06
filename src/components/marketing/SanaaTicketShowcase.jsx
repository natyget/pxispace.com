'use client';

import React from 'react';
import { QRCode } from 'antd';
import { HugeiconsIcon } from '@hugeicons/react';
import { QrCodeIcon } from '@hugeicons/core-free-icons';

/**
 * Proof that tickets carry the organizer's brand, not ours. Both pieces are
 * dressed as a real client night — Sanaa Groove's "Groove n' find Love"
 * (Feb 13 2026, Revere MA) — using the collective's actual flyer and palette.
 *
 * `SanaaCheckoutCard` mirrors the Apple Wallet pass generated after checkout.
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
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-black p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={SANAA_COVER}
          alt=""
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-[28px] opacity-70"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_36%),linear-gradient(180deg,rgba(18,4,9,0.48),rgba(18,4,9,0.92)_52%,rgba(0,0,0,0.98))]" />
      </div>

      <div className="relative mx-auto flex aspect-[3/4] w-full max-w-[300px] flex-col justify-between overflow-hidden rounded-[1.55rem] border border-white/15 bg-black/35 p-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">
              Sanaa Groove
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: CREAM }}>
              PXI Wallet Pass
            </p>
          </div>
          <p className="text-right text-[10px] font-black uppercase tracking-[0.16em] text-white">
            Feb 13, 2026
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/50">
              Event
            </p>
            <h3 className="mt-1 text-[27px] font-black uppercase leading-[0.95] tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
              Groove n&rsquo;<br />find Love
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45">Location</p>
              <p className="mt-1 text-sm font-bold leading-tight text-white">Revere, MA</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45">Tier</p>
              <p className="mt-1 text-sm font-bold leading-tight text-white">Groovist</p>
              <p className="mt-0.5 text-[10px] font-bold" style={{ color: ROSE }}>Public</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="rounded-[1.2rem] bg-white p-2 shadow-[0_0_28px_rgba(255,255,255,0.35)]">
            <QRCode
              value="pxi://ticket/sanaa-groove-love-demo"
              size={118}
              color="#000000"
              bgColor="#ffffff"
              bordered={false}
            />
          </div>
          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.24em] text-white/55">
            #PXI-SANAA-0213
          </p>
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
