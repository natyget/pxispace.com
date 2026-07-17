import React from 'react';
import SectionShell from '@/components/marketing/SectionShell';
import PhoneMockup from '@/components/ui/PhoneMockup';
import ScrubReveal from '@/components/motion/ScrubReveal';
import { ScrubWords, ScrollFadeOut } from '@/components/motion/ScrollStory';

/** Chapter four: the scrapbook builds itself overnight; keepers go in the vault. */
export default function ChapterMorning() {
  return (
    <ScrollFadeOut>
    <SectionShell eyebrow="The morning after" pad="default">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <ScrubReveal
          distance={40}
        >
          <ScrubWords as="h2" text="Wake up to the whole night." className="display-2 mt-5" />
          <p className="body-lead mt-6 max-w-md">
            The scrapbook builds itself while you sleep. Best shots rise to the top, and the
            keepers go in your vault.
          </p>
          <p className="mt-8 text-lg font-bold leading-snug text-white max-w-md sm:text-xl" style={{ textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
            No chasing the group chat. No begging for pics. It&apos;s all already there.
          </p>
        </ScrubReveal>

        <ScrubReveal
          distance={60}
          scaleStart={0.96}
          className="flex items-center justify-center"
        >
          <PhoneMockup
            title="Morning-after scrapbook wall"
            className="z-20 -mr-10 -rotate-3 sm:-mr-14"
            glow
          >
            <div className="relative flex h-full w-full flex-col bg-black">
              {/* Status Bar */}
              <div className="flex h-[38px] shrink-0 items-center justify-between px-6 pt-[10px] lg:h-[44px] lg:pt-[12px]">
                <span className="text-[11px] font-semibold tracking-tight text-white/90 lg:text-[13px] ml-1">
                  5:09
                </span>
                <div className="flex items-center gap-1.5 mr-1 text-white/90">
                  {/* Signal Bars */}
                  <div className="flex items-end gap-[1.5px] pb-[1px]">
                    <div className="h-[5px] w-[2px] rounded-[1px] bg-current" />
                    <div className="h-[6.5px] w-[2px] rounded-[1px] bg-current" />
                    <div className="h-[8px] w-[2px] rounded-[1px] bg-current" />
                    <div className="h-[9.5px] w-[2px] rounded-[1px] bg-current" />
                  </div>
                  {/* WiFi Icon */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                    <path d="M12 18.51l.01-.011M4 8C7 5.5 10 4.5 12 4.5c2 0 5 1 8 3.5M6 11.5c1.5-1.2 3.2-1.8 6-1.8 2.8 0 4.5.6 6 1.8M9 15c.8-.6 1.8-.9 3-.9 1.2 0 2.2.3 3 .9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {/* Battery Icon */}
                  <div className="flex items-center opacity-90">
                    <div className="w-[19px] h-[9px] rounded-[3px] border border-current p-[1px]">
                      <div className="w-full h-full bg-current rounded-[1px]" />
                    </div>
                    <div className="w-[1.5px] h-[3px] bg-current rounded-r-sm opacity-80" />
                  </div>
                </div>
              </div>

              {/* Image container */}
              <div className="relative flex-1 overflow-hidden">
                <img
                  src="/landing/assets/morning_frame1.png"
                  alt="Morning-after scrapbook wall"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </PhoneMockup>
          <PhoneMockup
            title="Vault of favorite shots"
            imgUrl="/landing/assets/thread_frame1.png"
            className="z-10 mt-10 rotate-3 scale-[0.92]"
          />
        </ScrubReveal>
      </div>
    </SectionShell>
    </ScrollFadeOut>
  );
}
