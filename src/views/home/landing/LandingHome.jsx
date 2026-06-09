'use client';

import React, { useEffect } from 'react';
import ScrollProgressBar from './ScrollProgressBar';
import Hero from './Hero';
import ScrapbookPreview from './ScrapbookPreview';
import EventLifecycle from './EventLifecycle';
import TheLegacy from './TheLegacy';
import TheEthos from './TheEthos';
import HashtagTicker from './HashtagTicker';

export default function LandingHome() {
  /* Set landing class for scroll-behavior override (needed for scroll-driven sections) */
  useEffect(() => {
    document.documentElement.classList.add('landing-page-root');
    return () => document.documentElement.classList.remove('landing-page-root');
  }, []);

  return (
    <div className="landing-v2 relative w-full min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-body)]">
      <ScrollProgressBar />
      <main>
        <Hero />
        <div className="cv-auto">
          <article><ScrapbookPreview /></article>
        </div>
        <div className="cv-auto">
          <article><EventLifecycle /></article>
        </div>
        <div className="cv-auto">
          <article><TheLegacy /></article>
        </div>
        <div className="cv-auto">
          <article><TheEthos /></article>
        </div>
        <div className="cv-auto">
          <HashtagTicker />
        </div>
      </main>
    </div>
  );
}
