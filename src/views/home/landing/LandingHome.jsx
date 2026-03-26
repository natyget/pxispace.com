'use client';

import React, { useEffect, useState } from 'react';
import { CursorProvider } from './CustomCursor';
import CustomCursor from './CustomCursor';
import ScrollProgressBar from './ScrollProgressBar';
import Hero from './Hero';
import ScrapbookPreview from './ScrapbookPreview';
import FeatureStory from './FeatureStory';
import AuthenticContentSection from './AuthenticContentSection';
import BestMomentsVault from './BestMomentsVault';
import HashtagTicker from './HashtagTicker';

export default function LandingHome() {
  const [isTouch, setIsTouch] = useState(null);
  const [canUseCustomCursor, setCanUseCustomCursor] = useState(false);

  useEffect(() => {
    setIsTouch(
      typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  useEffect(() => {
    if (isTouch !== false) return;
    document.documentElement.classList.add('landing-page-root');
    return () => document.documentElement.classList.remove('landing-page-root');
  }, [isTouch]);

  useEffect(() => {
    if (!canUseCustomCursor) {
      document.documentElement.classList.remove('landing-hide-native-cursor');
      return;
    }
    document.documentElement.classList.add('landing-hide-native-cursor');
    return () => document.documentElement.classList.remove('landing-hide-native-cursor');
  }, [canUseCustomCursor]);

  useEffect(() => {
    if (isTouch !== false) {
      setCanUseCustomCursor(false);
      return;
    }
    const lowPowerCpu = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrowViewport = typeof window !== 'undefined' && window.innerWidth < 1024;
    setCanUseCustomCursor(!lowPowerCpu && !reducedMotion && !narrowViewport);
  }, [isTouch]);

  return (
    <CursorProvider>
      <div
        className="landing-v2 relative w-full min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-body)]"
      >
        {canUseCustomCursor && <CustomCursor />}
        {isTouch === false && <ScrollProgressBar />}
        <main>
          <Hero />
          <ScrapbookPreview />
          <FeatureStory />
          <AuthenticContentSection />
          <BestMomentsVault />
          <HashtagTicker />
        </main>
      </div>
    </CursorProvider>
  );
}
