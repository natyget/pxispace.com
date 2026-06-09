/**
 * Purple spinner — matches mobile Wall Circle strip loading
 * (`TheCircle` → ActivityIndicator, Colors.neonPurple / #B026FF).
 */
'use client';

import { useState, useEffect } from 'react';

const NEON_PURPLE = '#B026FF';

const SPINNER_SIZES = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

function PxiSpinner({ size = 'lg', className = '' }) {
  const dim = SPINNER_SIZES[size] ?? SPINNER_SIZES.lg;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`shrink-0 rounded-full border-solid animate-spin motion-reduce:animate-none ${dim} ${className}`}
      style={{
        borderColor: `${NEON_PURPLE}33`,
        borderTopColor: NEON_PURPLE,
      }}
    />
  );
}

/** Inline / navbar */
export function PxiLoadingIcon({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <PxiSpinner size="sm" />
    </div>
  );
}

/** Full viewport center — covers layout chrome during route transitions */
function PxiLoadingViewport({ className = '' }) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] ${className}`}
    >
      <PxiSpinner size="lg" />
    </div>
  );
}

/** Landing & root route loading */
export function PxiLoadingScreen() {
  return <PxiLoadingViewport />;
}

/**
 * Neo-Glass splash screen for landing page hydration.
 * Displays the PXI logo with CRT scan lines, neon purple pulse,
 * and a sleek reveal transition before showing the main site.
 */
export function PxiLoadingLanding() {
  const [phase, setPhase] = useState('showing'); // 'showing' | 'exiting' | 'done'

  useEffect(() => {
    // Hold the splash for a brief moment, then begin exit
    const showTimer = setTimeout(() => setPhase('exiting'), 1600);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (phase === 'exiting') {
      // After the exit animation completes, unmount
      const exitTimer = setTimeout(() => setPhase('done'), 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`splash-screen ${phase === 'exiting' ? 'splash-screen--exiting' : ''}`}
      aria-hidden="true"
    >
      {/* CRT scan line overlay — subtle horizontal lines */}
      <div className="splash-crt-overlay" />

      {/* Moving CRT scan line */}
      <div className="splash-crt-line" />

      {/* Neon purple pulse ring behind logo */}
      <div className="splash-neon-ring" />

      {/* PXI Logo — same PNG used on the login screen */}
      <img
        src="/favicon.png"
        alt=""
        width={160}
        height={160}
        className="splash-logo h-[120px] w-[120px] object-contain md:h-[160px] md:w-[160px]"
        draggable={false}
      />
    </div>
  );
}

/** Other public routes — same viewport-centered overlay */
export function PxiLoadingMain() {
  return <PxiLoadingViewport />;
}
