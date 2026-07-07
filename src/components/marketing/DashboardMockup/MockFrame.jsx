'use client';

import React from 'react';

/** Browser-chrome card wrapping a stylized dashboard scene. Non-interactive. */
export default function MockFrame({ label, children, className = '', tilt = false }) {
  return (
    <div
      aria-hidden
      className={[
        'glass-panel relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]',
        tilt ? 'md:rotate-[-3deg]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        {label ? (
          <span className="ml-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </span>
        ) : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}
