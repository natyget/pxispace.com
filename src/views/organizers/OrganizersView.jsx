'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Layers } from 'lucide-react';

import SectionShell from '@/components/marketing/SectionShell';
import StatLine from '@/components/marketing/StatLine';
import FeatureRow from '@/components/marketing/FeatureRow';
import DualCtaCards from '@/components/marketing/DualCtaCards';
import PhoneMockup from '@/components/ui/PhoneMockup';
import CommandCenterShowcase from '@/components/marketing/DashboardMockup/CommandCenterShowcase';
import LiveScanMock from '@/components/marketing/DashboardMockup/LiveScanMock';
import EarningsMock from '@/components/marketing/DashboardMockup/EarningsMock';
import AnalyticsMock from '@/components/marketing/DashboardMockup/AnalyticsMock';
import VenueMapMock from '@/components/marketing/DashboardMockup/VenueMapMock';
import CreateEventMock from '@/components/marketing/DashboardMockup/CreateEventMock';
import SanaaTicketShowcase from '@/components/marketing/SanaaTicketShowcase';
import PlatformComparison from './PlatformComparison';
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

const CREATE_HREF = '/login?redirect=/dashboard/events/new';
const DEMO_HREF = '/book';

const MEMORY_STEPS = [
  {
    k: 'Scrapbooks',
    title: 'Promo that makes itself.',
    body: 'The morning-after scrapbook is your next campaign — real nights, real people, shot by the crowd. No photographers required.',
  },
  {
    k: 'Stamps',
    title: 'Turnout you can prove.',
    body: 'Cryptographic attendance stamps turn "trust me" into a verifiable track record for venues, sponsors, and partners.',
  },
  {
    k: 'Behavior',
    title: 'Targeting that converts.',
    body: 'Attendance, spend, and taste build segments of people who actually show up — and you can reach them over SMS, email, and the feed.',
  },
];

function MemoryIntroStep() {
  const local = useStepProgress();
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
      <StepItem start={0} end={0.3}>
        <div className="flex flex-col items-center gap-4">
          <Layers className="h-6 w-6 text-pxi-purple" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-pxi-purple">
            The memory layer
          </p>
        </div>
      </StepItem>
      <ScrubWords
        as="h2"
        text="Every night makes the next one smarter."
        className="display-2 mt-6 max-w-3xl"
        progress={local}
        range={[0.06, 0.7]}
      />
      <StepItem start={0.45} end={0.85}>
        <p className="body-lead mt-8 max-w-xl">
          Photos, stamps, tastes, and spend accumulate with every event you run — and the layer
          compounds.
        </p>
      </StepItem>
    </div>
  );
}

/** The compounding-data pitch as a pinned scroll story: each swipe reveals one layer. */
function MemoryLayerStory() {
  return (
    <ScrollStory steps={4} perStep={75} className="bg-black">
      <StoryDots />
      <StoryStep index={0} className="flex items-center justify-center">
        <MemoryIntroStep />
      </StoryStep>
      {MEMORY_STEPS.map((s, i) => (
        <StoryStep key={s.k} index={i + 1} className="flex items-center justify-center">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
            <StepItem start={0} end={0.4}>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-pxi-purple">
                {`${s.k} · 0${i + 1} / 03`}
              </p>
            </StepItem>
            <StepItem start={0.1} end={0.5}>
              <h3 className="display-2 mt-5 max-w-3xl">{s.title}</h3>
            </StepItem>
            <StepItem start={0.22} end={0.65}>
              <p className="body-lead mt-6 max-w-xl">{s.body}</p>
            </StepItem>
            {i === MEMORY_STEPS.length - 1 ? (
              <StepItem start={0.35} end={0.8}>
                <Link
                  href="/features/digital-event-passport"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-pxi-purple transition-colors hover:text-white"
                >
                  Verified turnout, explained <ArrowRight className="h-4 w-4" />
                </Link>
              </StepItem>
            ) : null}
          </div>
        </StoryStep>
      ))}
    </ScrollStory>
  );
}

export default function OrganizersView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[60vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-1 mt-6 max-w-4xl"
          >
            Your event. <span className="text-white">Your revenue.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Ticketing that wears your brand, live door control, and a behavioral layer on your
            crowd that other platforms keep for themselves. One command center runs the whole
            night.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href={CREATE_HREF} className="glow-cta px-8 py-4 text-sm">
              Start selling tickets
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={DEMO_HREF} className="pill-ghost px-8 py-4 text-sm font-semibold">
              Book a demo
            </Link>
          </motion.div>

          {/* command center on display */}
          <ScrubReveal
            distance={50}
            scaleStart={0.97}
            className="mt-16 md:mt-20"
          >
            <div className="mx-auto max-w-3xl">
              <CommandCenterShowcase />
            </div>
          </ScrubReveal>
        </div>
      </section>


      {/* ── Chapter: Launch ── */}
      <ScrollFadeOut>
      <SectionShell eyebrow="Launch" pad="default">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <ScrubReveal distance={40}>
            <ScrubWords
              as="h2"
              text="Sell out under your own name."
              className="display-2 mt-5 max-w-2xl"
            />
            <p className="body-lead mt-6 max-w-xl">
              Checkout, tickets, tiers and guest lists, and a live event thread from ticket number
              one — all wearing your brand. Your covers, your colors, your own stamps when you
              choose to customize.
            </p>
          </ScrubReveal>
          <ScrubReveal distance={60} scaleStart={0.96}>
            <SanaaTicketShowcase />
          </ScrubReveal>
        </div>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="Your branding, secured by PASETO"
            body="Every ticket carries your cover art, your colors, and your own stamps when you customize it — and it's signed with the industry-standard PASETO system competitors don't use. Safe Stripe payment with only a $0.99 platform fee."
            chip={<div className="p-5"><EarningsMock /></div>}
            href="/pricing"
            linkLabel="View Pricing"
          />
          <FeatureRow
            reverse
            title="Tiers, guest lists, comps"
            body="Free or paid, GA or VIP, invite only or open. Configure it in minutes and change it anytime, right from the event page your guests see."
            chip={<div className="p-5 w-full"><CreateEventMock /></div>}
          />
        </div>
      </SectionShell>
      </ScrollFadeOut>

      {/* ── Chapter: Run the night ── */}
      <ScrollFadeOut>
      <SectionShell eyebrow="Run the night" pad="default">
        <ScrubReveal distance={40}>
          <ScrubWords
            as="h2"
            text="Command the door. Read the room."
            className="display-2 mt-5 max-w-2xl"
          />
          <p className="body-lead mt-6 max-w-xl">
            Real time scanning across every gate, and spatial intel on how the room is actually
            moving. This is where the command center earns its name.
          </p>
        </ScrubReveal>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="Live scan and gates"
            body="Track velocity per entrance, catch duplicate passes, and watch capacity fill as it happens. Co-hosts, bouncers, and lineup each get exactly the access they need."
            chip={<div className="p-5"><LiveScanMock /></div>}
          />
          <FeatureRow
            reverse
            title="Spatial intel on the venue"
            body="Know which rooms perform, which installations actually pull people in, and how the crowd read every DJ set — each engagement spike is time-stamped to the lineup. Density, bar queues, and VIP dwell update live, so you move staff before the bottleneck forms, not after."
            chip={<div className="p-5"><VenueMapMock /></div>}
            href="/features/event-promoter-analytics"
            linkLabel="Analytics in depth"
          />
        </div>
      </SectionShell>
      </ScrollFadeOut>

      {/* ── Chapter: Know your crowd ── */}
      <ScrollFadeOut>
      <SectionShell eyebrow="Know your crowd" pad="default">
        <ScrubReveal distance={40}>
          <ScrubWords
            as="h2"
            text="A behavioral database on every guest."
            className="display-2 mt-5 max-w-2xl"
          />
          <p className="body-lead mt-6 max-w-xl">
            Attendance history, spend, music taste, who brings friends. Build segments from real
            behavior and reach them over SMS, email, and the feed.
          </p>
        </ScrubReveal>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="Analytics that mean something"
            body="One hype metric, conversion funnels, and heatmaps. Decisions backed by what your crowd actually does, not vibes."
            chip={<div className="p-5"><AnalyticsMock /></div>}
            href="/features/event-promoter-analytics"
            linkLabel="Promoter analytics in depth"
          />
          <FeatureRow
            reverse
            title="Your attendees are your content team"
            body="Every shot from the shared gallery is yours to promote the next one. No photographers required."
            phone={<PhoneMockup title="PXI shared event gallery" imgUrl="/landing/assets/morning_frame2.png" />}
            href="/features/shared-event-photo-gallery"
            linkLabel="The shared gallery in depth"
          />
        </div>
      </SectionShell>
      </ScrollFadeOut>

      {/* ── The memory layer — pinned scroll story ── */}
      <MemoryLayerStory />

      {/* ── Security beat ── */}
      <ScrollFadeOut>
      <SectionShell pad="default">
        <ScrubReveal
          distance={40}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12"
        >
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-pxi-purple" />
            <div>
              <ScrubWords as="h2" text="Tickets that can't be forged." className="display-3" />
              <p className="body-lead mt-4 max-w-2xl">
                Every pass is cryptographically signed with a modern token standard, meaningfully
                harder to fake than the aging formats most platforms still rely on. Attendance is
                verified with cryptographic stamps, not screenshots.
              </p>
            </div>
          </div>
        </ScrubReveal>
      </SectionShell>
      </ScrollFadeOut>

      {/* ── Comparison ── */}
      <PlatformComparison />

      {/* ── CTA ── */}
      <SectionShell pad="default">
        <DualCtaCards
          cards={[
            {
              eyebrow: 'Get started',
              title: 'Create your first event.',
              sub: 'Doors open in under two minutes.',
              image: '/landing/scattered/crowd.jpg',
              href: CREATE_HREF,
              primaryLabel: 'Start selling tickets',
              ghostHref: DEMO_HREF,
              ghostLabel: 'Book a demo',
            },
            {
              eyebrow: 'The attendee side',
              title: 'See what guests get.',
              sub: 'The shared camera, the scrapbook, the passport.',
              image: '/landing/scattered/group.jpg',
              href: '/',
              primaryLabel: 'Explore the app',
            },
          ]}
        />
      </SectionShell>
    </div>
  );
}
