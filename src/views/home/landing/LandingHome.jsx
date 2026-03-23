'use client';

import React, { useEffect, useState } from 'react';
import { CursorProvider } from './CustomCursor';
import CustomCursor from './CustomCursor';
import ScrollProgressBar from './ScrollProgressBar';
import Hero from './Hero';
import ScrapbookPreview from './ScrapbookPreview';
import FeatureStory from './FeatureStory';
import Scrapbooks from './Scrapbooks';
import Milestones from './Milestones';
import FinalCTA from './FinalCTA';

export default function LandingHome() {
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    setIsTouch(
      typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  return (
    <CursorProvider>
      <div className="landing-v2 relative w-full min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">
        {!isTouch && <CustomCursor />}
        {!isTouch && <ScrollProgressBar />}
        <main>
          <Hero />
          <ScrapbookPreview />
          <FeatureStory />
          <Scrapbooks />
          <Milestones />
          <FinalCTA />
        </main>
      </div>
    </CursorProvider>
  );
}
