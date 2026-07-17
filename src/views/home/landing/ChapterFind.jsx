import React from 'react';
import SectionShell from '@/components/marketing/SectionShell';
import DiscoveryFlow from '@/components/marketing/DiscoveryFlow';
import MusicMatchTeaser from '@/components/marketing/MusicMatchTeaser';
import ScrubReveal from '@/components/motion/ScrubReveal';

/** Chapter one: spot the night, see who's going, lock your ticket. */
export default function ChapterFind() {
  return (
    <SectionShell eyebrow="Find it" pad="default">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <ScrubReveal distance={40}>
          <h2 className="display-2 mt-5">Find your kind of night.</h2>
          <p className="body-lead mt-6 max-w-md">
            See what's on, see who's pulling up, and lock your spot in two taps.
          </p>
        </ScrubReveal>

        <ScrubReveal distance={60} scaleStart={0.97}>
          <DiscoveryFlow />
        </ScrubReveal>
      </div>

      <ScrubReveal distance={40}>
        <MusicMatchTeaser />
      </ScrubReveal>
    </SectionShell>
  );
}
