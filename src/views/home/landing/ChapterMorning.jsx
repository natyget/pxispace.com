import React from 'react';
import { motion } from 'framer-motion';
import SectionShell from '@/components/marketing/SectionShell';
import PhoneMockup from '@/components/ui/PhoneMockup';

const EASE = [0.16, 1, 0.3, 1];

/** Chapter four: the scrapbook builds itself overnight; keepers go in the vault. */
export default function ChapterMorning() {
  return (
    <SectionShell eyebrow="The morning after" pad="default">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <h2 className="display-2 mt-5">Wake up to the whole night.</h2>
          <p className="body-lead mt-6 max-w-md">
            The scrapbook builds itself while you sleep. Best shots rise to the top, and the
            keepers go in your vault.
          </p>
          <p className="mt-8 text-lg font-bold leading-snug text-white max-w-md sm:text-xl" style={{ textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
            No chasing the group chat. No begging for pics. It&apos;s all already there.
          </p>
        </motion.div>

        {/* Both phones enter as ONE composed unit (single wrapper transform),
            so they never move relative to each other — no jitter. The screen
            "wakes up" (exposure-lift on the scrapbook image) only after the
            pair has settled. */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
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

                {/* Image container — "wakes up": starts dim/blurred like eyes
                    adjusting to morning light, then clears to full exposure. */}
                <div className="relative flex-1 overflow-hidden">
                  <motion.img
                    src="/landing/assets/morning_frame1.png"
                    alt="Morning-after scrapbook wall"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    initial={{ filter: 'brightness(0.35) blur(6px)' }}
                    whileInView={{ filter: 'brightness(1) blur(0px)' }}
                    viewport={{ once: false, margin: '-80px' }}
                    transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                </div>
              </div>
            </PhoneMockup>
          <PhoneMockup
            title="Vault of favorite shots"
            className="z-10 mt-10 rotate-3 scale-[0.92]"
          >
            {/* Same wake-up exposure-lift as the first phone — both screens
                clear together, not just one. */}
            <motion.img
              src="/landing/assets/thread_frame1.png"
              alt="Vault of favorite shots"
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ filter: 'brightness(0.35) blur(6px)' }}
              whileInView={{ filter: 'brightness(1) blur(0px)' }}
              viewport={{ once: false, margin: '-80px' }}
              transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          </PhoneMockup>
        </motion.div>
      </div>
    </SectionShell>
  );
}
