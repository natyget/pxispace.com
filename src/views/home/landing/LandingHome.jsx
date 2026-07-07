'use client';

import React from 'react';

import HeroEditorial from './HeroEditorial';
import StoryIntro from './StoryIntro';
import ChapterFind from './ChapterFind';
import ChapterShoot from './ChapterShoot';
import ChapterLive from './ChapterLive';
import ChapterMorning from './ChapterMorning';
import ChapterPassport from './ChapterPassport';
import ChapterShare from './ChapterShare';
import EditorialStrip from './EditorialStrip';
import HomeClosing from './HomeClosing';
import HashtagTicker from './HashtagTicker';
import Footer from '@/components/layout/Footer';

/**
 * One night, told in order: find it, shoot it, watch it land, wake up to it,
 * stamp it, post it. Then the practical stuff and the close.
 */
export default function LandingHome() {
  return (
    <main className="landing-v2 w-full overflow-x-hidden bg-black text-white selection:bg-fuchsia-500/30">
      <HeroEditorial />
      <StoryIntro />
      <ChapterFind />
      <ChapterShoot />
      <ChapterLive />
      <ChapterMorning />
      <ChapterPassport />
      <ChapterShare />
      <EditorialStrip />
      <HomeClosing />

      <div className="mt-8">
        <HashtagTicker />
      </div>
      <Footer />
    </main>
  );
}
