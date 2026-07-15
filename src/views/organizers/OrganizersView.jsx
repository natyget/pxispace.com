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

const CREATE_HREF = '/login?redirect=/dashboard/events/new';
const DEMO_HREF = '/book';

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
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 md:mt-20"
          >
            <div className="mx-auto max-w-3xl">
              <CommandCenterShowcase />
            </div>
          </motion.div>
        </div>
      </section>


      {/* ── Chapter: Launch ── */}
      <SectionShell eyebrow="Launch" pad="default">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="display-2 mt-5 max-w-2xl">Sell out under your own name.</h2>
            <p className="body-lead mt-6 max-w-xl">
              Checkout, tickets, tiers and guest lists, and a live event thread from ticket number
              one — all wearing your brand. Your covers, your colors, your own stamps when you
              choose to customize.
            </p>
          </div>
          <SanaaTicketShowcase />
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

      {/* ── Chapter: Run the night ── */}
      <SectionShell eyebrow="Run the night" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">Command the door. Read the room.</h2>
        <p className="body-lead mt-6 max-w-xl">
          Real time scanning across every gate, and spatial intel on how the room is actually
          moving. This is where the command center earns its name.
        </p>
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

      {/* ── Chapter: Know your crowd ── */}
      <SectionShell eyebrow="Know your crowd" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">A behavioral database on every guest.</h2>
        <p className="body-lead mt-6 max-w-xl">
          Attendance history, spend, music taste, who brings friends. Build segments from real
          behavior and reach them over SMS, email, and the feed.
        </p>
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

      {/* ── The memory layer ── */}
      <SectionShell pad="default">
        <div className="overflow-hidden rounded-3xl border border-pxi-purple/20 bg-gradient-to-b from-pxi-purple/[0.06] to-transparent p-8 md:p-12">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Layers className="h-6 w-6 text-pxi-purple" />
              </div>
              <h2 className="display-3 mt-5">Every night makes the next one smarter.</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">
                Photos, stamps, tastes, and spend accumulate with every event you run. That layer
                compounds: the scrapbook markets the next drop, the passport proves real turnout,
                and the audience data targets people who actually show up.
              </p>
              <Link
                href="/features/digital-event-passport"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-pxi-purple transition-colors hover:text-white"
              >
                Verified turnout, explained <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { k: 'Scrapbooks', v: 'promo that makes itself' },
                { k: 'Stamps', v: 'turnout you can prove' },
                { k: 'Behavior', v: 'targeting that converts' },
              ].map((cell) => (
                <div key={cell.k} className="rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                  <p className="text-sm font-black uppercase tracking-wide text-white">{cell.k}</p>
                  <p className="mt-2 text-[11px] leading-snug text-zinc-500">{cell.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── Security beat ── */}
      <SectionShell pad="default">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-pxi-purple" />
            <div>
              <h2 className="display-3">Tickets that can't be forged.</h2>
              <p className="body-lead mt-4 max-w-2xl">
                Every pass is cryptographically signed with a modern token standard, meaningfully
                harder to fake than the aging formats most platforms still rely on. Attendance is
                verified with cryptographic stamps, not screenshots.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

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
