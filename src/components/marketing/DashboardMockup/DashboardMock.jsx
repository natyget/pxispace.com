'use client';

import React from 'react';

/**
 * A piece of the real dashboard on a marketing page. The page pins its own palette (.landing-v2), so the mockup's
 * wrapper puts the app's values back (.dashboard-mock in globals.css) and sits on the dashboard's own black
 * (.dashboard-page-surface). It is an illustration: out of the tab order and the accessibility tree, and out of
 * search snippets, like the platform page's stages.
 */
export default function DashboardMock({ children, className = '' }) {
  return (
    <div
      className={['dashboard-mock dashboard-page-surface', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      inert
      data-nosnippet
    >
      {children}
    </div>
  );
}

/** Holds a mockup's place while its chart code loads, so the page does not jump when it arrives. */
export function MockSkeleton({ className = 'h-[420px]' }) {
  return <div aria-hidden="true" className={`rounded-3xl bg-pxi-surface ${className}`} />;
}
