'use client';

import React, { useEffect, useState } from 'react';
import CustomCursor, { CursorProvider } from '@/views/home/landing/CustomCursor';

export default function GlobalCursorLayer({ children }) {
  const [canUseCustomCursor, setCanUseCustomCursor] = useState(false);

  useEffect(() => {
    const forceDisable = process.env.NEXT_PUBLIC_DISABLE_CUSTOM_CURSOR === 'true';
    if (forceDisable) {
      setCanUseCustomCursor(false);
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const lowPowerCpu = navigator.hardwareConcurrency <= 4;
      const isMobileViewport = window.innerWidth < 768;
      const reducedMotion = media.matches;
      setCanUseCustomCursor(!isTouch && !lowPowerCpu && !reducedMotion && !isMobileViewport);
    };

    evaluate();
    window.addEventListener('resize', evaluate);
    media.addEventListener?.('change', evaluate);
    return () => {
      window.removeEventListener('resize', evaluate);
      media.removeEventListener?.('change', evaluate);
    };
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
