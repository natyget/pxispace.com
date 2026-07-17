import React from 'react';
import SectionShell from '@/components/marketing/SectionShell';
import PhoneMockup from '@/components/ui/PhoneMockup';
import ScrubReveal from '@/components/motion/ScrubReveal';

/** Chapter three: every shot lands in the shared thread, live. */
export default function ChapterLive() {
  return (
    <SectionShell eyebrow="Watch it land" pad="default">
      <div className="flex flex-col items-center text-center">
        <ScrubReveal
          as="h2"
          distance={30}
          className="display-2 mt-5 max-w-2xl"
        >
          Every shot lands in one thread.
        </ScrubReveal>
        <ScrubReveal distance={30} className="body-lead mt-6 max-w-lg">
          The whole room shoots into the same album. Watch it fill up live and react while it
          happens.
        </ScrubReveal>
      </div>

      <ScrubReveal
        distance={60}
        scaleStart={0.96}
        className="mt-14 flex items-center justify-center"
      >
        <PhoneMockup
          title="Live event thread with photos streaming in"
          imgUrl="/landing/assets/thread_frame2.png"
          className="z-20 -mr-10 -rotate-3 sm:-mr-14"
          glow
        />
        <PhoneMockup
          title="Shared event gallery"
          imgUrl="/landing/assets/morning_frame2.png"
          className="z-10 mt-10 rotate-3 scale-[0.92]"
        />
      </ScrubReveal>
    </SectionShell>
  );
}
