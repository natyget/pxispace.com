'use client';

import React from 'react';

/**
 * Front-facing modern iPhone–style shell (flat, no 3D tilt): thin bezel + Dynamic Island pill.
 */
export default function DeviceFrame({ children, className = '' }) {
  return (
    <div
      className={`relative mx-auto w-[min(88vw,300px)] md:w-[min(82vw,320px)] ${className}`}
    >
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-[2.65rem] bg-gradient-to-br from-zinc-400/30 via-zinc-600/10 to-zinc-900/40 opacity-80"
          aria-hidden
        />

        <div className="relative rounded-[2.6rem] border border-zinc-600/50 bg-gradient-to-b from-zinc-800 via-zinc-950 to-black p-[2px] shadow-[0_32px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.14)]">
          {/* Side keys — subtle, current-gen proportions */}
          <div
            className="pointer-events-none absolute -left-[2px] top-[22%] h-9 w-[2px] rounded-l-[2px] bg-zinc-600/90"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-[2px] top-[30%] h-14 w-[2px] rounded-l-[2px] bg-zinc-600/90"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-[2px] top-[26%] h-20 w-[2px] rounded-r-[2px] bg-zinc-600/90"
            aria-hidden
          />

          <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.48rem] bg-black ring-1 ring-black">
            <div className="pointer-events-none absolute inset-0 z-40 rounded-[2.42rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />

            {/* Dynamic Island — simple black pill */}
            <div className="absolute left-1/2 top-[11px] z-50 flex -translate-x-1/2">
              <div
                className="h-[31px] w-[108px] rounded-full bg-black shadow-[0_2px_12px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.06]"
                aria-hidden
              />
            </div>

            {/* Screen — inset bezel, starts below Dynamic Island */}
            <div className="absolute inset-[5px] bottom-[6px] top-[40px] overflow-hidden rounded-[2.15rem] bg-[#050505]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
