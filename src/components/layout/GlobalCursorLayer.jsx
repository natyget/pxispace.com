'use client';

import React, { useEffect, useState } from 'react';
import CustomCursor, { CursorProvider } from '@/views/home/landing/CustomCursor';

export default function GlobalCursorLayer({ children }) {
  const [canUseCustomCursor, setCanUseCustomCursor] = useState(false);

  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) {
      setCanUseCustomCursor(false);
      return;
    }

    const lowPowerCpu = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrowViewport = typeof window !== 'undefined' && window.innerWidth < 1024;
    setCanUseCustomCursor(!lowPowerCpu && !reducedMotion && !narrowViewport);
  }, []);

  useEffect(() => {
    if (!canUseCustomCursor) {
      document.documentElement.classList.remove('landing-hide-native-cursor');
      return;
    }
    document.documentElement.classList.add('landing-hide-native-cursor');
    return () => document.documentElement.classList.remove('landing-hide-native-cursor');
  }, [canUseCustomCursor]);

  return (
    <CursorProvider>
      {canUseCustomCursor && <CustomCursor />}
      {children}
    </CursorProvider>
  );
}
