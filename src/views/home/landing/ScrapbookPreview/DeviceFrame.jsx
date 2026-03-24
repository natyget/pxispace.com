'use client';

import React from 'react';

/**
 * Modern phone shell: perspective tilt on desktop, dynamic island, metal bezel.
 */
export default function DeviceFrame({ children, className = '' }) {
  return (
    <div className={`relative mx-auto w-[min(88vw,320px)] [perspective:1400px] ${className}`}>
      <div
        className="relative will-change-transform transition-transform duration-500 ease-out md:[transform:rotateY(-10deg)_rotateX(3deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="pointer-events-none absolute -inset-[2px] rounded-[2.85rem] bg-gradient-to-br from-white/25 via-white/[0.07] to-white/[0.02] opacity-90 blur-[1px]"
          aria-hidden
        />

        <div className="relative rounded-[2.75rem] border border-white/[0.18] bg-gradient-to-b from-zinc-700/90 via-zinc-900 to-black p-[3px] shadow-[0_40px_100px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="pointer-events-none absolute -left-[3px] top-28 h-14 w-[3px] rounded-l-sm bg-gradient-to-b from-zinc-500/80 to-zinc-800/80" />
          <div className="pointer-events-none absolute -left-[3px] top-48 h-20 w-[3px] rounded-l-sm bg-gradient-to-b from-zinc-500/80 to-zinc-800/80" />
          <div className="pointer-events-none absolute -right-[3px] top-36 h-24 w-[3px] rounded-r-sm bg-gradient-to-b from-zinc-500/80 to-zinc-800/80" />

          <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.62rem] bg-black ring-1 ring-black/80">
            <div className="pointer-events-none absolute inset-0 z-40 rounded-[2.55rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />

            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-[10px] z-50 flex -translate-x-1/2 items-center justify-center">
              <div className="flex h-[34px] min-w-[120px] items-center justify-center rounded-full bg-black px-4 shadow-[0_4px_24px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.08]">
                <div className="h-2 w-2 rounded-full bg-zinc-700/90" />
                <div className="mx-3 h-1.5 w-8 rounded-full bg-zinc-800/90" />
              </div>
            </div>

            {/* Screen */}
            <div className="absolute inset-[6px] top-[44px] overflow-hidden rounded-[2.25rem] bg-[#050505]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
