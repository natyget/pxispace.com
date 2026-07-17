'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import SectionShell from '@/components/marketing/SectionShell';
import ScrubReveal from '@/components/motion/ScrubReveal';
import {
  ScrollStory,
  StoryStep,
  StoryDots,
  StepItem,
  ScrubWords,
  ScrollFadeOut,
  useStepProgress,
} from '@/components/motion/ScrollStory';

const PRINCIPLES = [
  {
    title: 'Privacy is not a feature tier.',
    body: 'No location tracking, no selling your data. Ever. It is the floor, not an upsell.',
  },
  {
    title: 'The organizer keeps the money.',
    body: 'Revenue routes straight to the people who throw the party. PXI never sits on your payouts.',
  },
  {
    title: 'Everyone shoots, no one begs for pics.',
    body: 'One shared camera per night. The memory belongs to the room, not to whoever remembered to post.',
  },
];

function PrinciplesIntroStep() {
  const local = useStepProgress();
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
      <StepItem start={0} end={0.3}>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-pxi-purple">
          What we believe
        </p>
      </StepItem>
      <ScrubWords
        as="h2"
        text="Three things we will not compromise."
        className="display-2 mt-6 max-w-3xl"
        progress={local}
        range={[0.06, 0.7]}
      />
    </div>
  );
}

const AboutPage = () => {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* 1 — Statement */}
      <section className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-1 max-w-4xl"
          >
            Memory is <span className="text-white">the product.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Everything else, the tickets, the doors, the analytics, exists so the night survives.
          </motion.p>
        </div>
      </section>

      {/* 2 — Origin */}
      <ScrollFadeOut>
      <SectionShell pad="loose">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <ScrubReveal
            distance={40}
          >
            <ScrubWords as="h2" text="Built from lost moments." className="display-3 mt-5" />
            <div className="mt-6 space-y-5 text-base leading-relaxed text-zinc-400">
              <p>
                Before we built infrastructure, we were operators, hosting the nights people talked
                about for months. But the memory of them always scattered across dozens of phones,
                and the tools we used were built for broadcasting, not for being there.
              </p>
              <ScrubWords
                as="p"
                baseOpacity={0.3}
                text="So we stepped back from the noise and built the antidote: an event platform where the night compiles itself, the organizer keeps the money, and the memory is the point."
                className="text-white"
              />
            </div>
          </ScrubReveal>

          <ScrubReveal
            as="figure"
            distance={60}
            scaleStart={0.96}
            className="group relative"
          >
            <video
              src="/landing/assets/movie.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="aspect-square w-full rounded-3xl object-cover"
            />
          </ScrubReveal>
        </div>
      </SectionShell>
      </ScrollFadeOut>

      {/* 3 — Principles — pinned scroll story: each swipe brings the next one */}
      <ScrollStory steps={PRINCIPLES.length + 1} perStep={70} className="bg-black">
        <StoryDots />
        <StoryStep index={0} className="flex items-center justify-center">
          <PrinciplesIntroStep />
        </StoryStep>
        {PRINCIPLES.map((p, i) => (
          <StoryStep key={p.title} index={i + 1} className="flex items-center justify-center">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
              <StepItem start={0} end={0.4}>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-pxi-purple">
                  {`0${i + 1} / 0${PRINCIPLES.length}`}
                </p>
              </StepItem>
              <StepItem start={0.1} end={0.5}>
                <h3 className="display-2 mt-5 max-w-3xl">{p.title}</h3>
              </StepItem>
              <StepItem start={0.22} end={0.65}>
                <p className="body-lead mt-6 max-w-xl">{p.body}</p>
              </StepItem>
            </div>
          </StoryStep>
        ))}
      </ScrollStory>

      {/* 4 — Close */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Built by operators, since 2024.
          </p>
          <ScrubWords
            as="h2"
            text="We build the tools. You own the night."
            className="display-2 mt-6 max-w-2xl"
          />
          <div className="mt-10">
            <AppStoreCtaPair className="justify-center" />
          </div>
          <Link
            href="/platform"
            className="mt-8 text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            Throwing something? See the platform →
          </Link>
        </div>
      </SectionShell>
    </div>
  );
};

export default AboutPage;
