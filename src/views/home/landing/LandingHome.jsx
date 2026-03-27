'use client';

import React, { useEffect, useState } from 'react';
import ScrollProgressBar from './ScrollProgressBar';
import Hero from './Hero';
import ScrapbookPreview from './ScrapbookPreview';
import FeatureStory from './FeatureStory';
import AuthenticContentSection from './AuthenticContentSection';
import BestMomentsVault from './BestMomentsVault';
import HashtagTicker from './HashtagTicker';

export default function LandingHome() {
  const [isTouch, setIsTouch] = useState(null);

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

  return (
    <div
      className="landing-v2 relative w-full min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-body)]"
    >
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
  );
}
