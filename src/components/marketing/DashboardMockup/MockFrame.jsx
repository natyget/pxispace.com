'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Browser-chrome card wrapping a stylized dashboard scene. Non-interactive.
 * `bootIn`: "boot the command center" — the panel powers on (dark → brand
 * glow → steady) the first time it scrolls into view, like a screen switching
 * on, before its content (tabs/mock) plays its own entrance.
 */
export default function MockFrame({ label, children, className = '', tilt = false, bootIn = false }) {
  const Frame = bootIn ? motion.div : 'div';
  const bootProps = bootIn
    ? {
        initial: { opacity: 0.25, filter: 'brightness(0.25)' },
        whileInView: {
          opacity: [0.25, 1, 0.7, 1],
          filter: ['brightness(0.25)', 'brightness(1.6)', 'brightness(0.8)', 'brightness(1)'],
          boxShadow: [
            '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0px rgba(240,31,255,0)',
            '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 46px rgba(240,31,255,0.35)',
            '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0px rgba(240,31,255,0)',
            '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0px rgba(240,31,255,0)',
          ],
        },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.9, times: [0, 0.4, 0.62, 1], ease: 'easeOut' },
      }
    : {};

  return (
    <Frame
      aria-hidden
      {...bootProps}
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
    </Frame>
  );
}
