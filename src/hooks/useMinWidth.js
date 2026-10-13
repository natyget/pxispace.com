'use client';

import { useSyncExternalStore } from 'react';

/**
 * True when the viewport is at least `px` wide. False on the server and until the browser answers,
 * so the narrow layout is the one that renders first.
 */
export function useMinWidth(px) {
  const query = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
