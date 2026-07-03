'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import SectionShell from '@/components/marketing/SectionShell';
import FeatureRow from '@/components/marketing/FeatureRow';
import AnalyticsMock from '@/components/marketing/DashboardMockup/AnalyticsMock';
import VenueMapMock from '@/components/marketing/DashboardMockup/VenueMapMock';
import LiveScanMock from '@/components/marketing/DashboardMockup/LiveScanMock';

const CREATE_HREF = '/login?redirect=/dashboard/events/new';

const DASHBOARD = [
  {
    title: 'Attendance funnel',
    body: 'Awareness, RSVP, purchase, check-in, participation. See exactly where people drop off and fix it for the next event.',
  },
  {
    title: 'Promoter leaderboard',
    body: 'Every promoter gets a unique trackable link. Rank them by tickets sold and revenue, reward the ones filling your room, cut the ones who are not.',
  },
  {
    title: 'Revenue breakdown',
    body: 'Gross revenue, refund rates, and net payout in one place. Stripe direct payouts mean no middleman holding your money.',
  },
  {
    title: 'Post-event report',
    body: 'An auto-generated summary of the night: peak attendance, top content creators, gallery engagement, exportable for sponsors and venues.',
  },
  {
    title: 'Crowd behavior signals',
    body: 'When photos peak, when chat spikes, when check-ins plateau. Use it to tune set times, DJ schedules, and bar service windows.',
  },
  {
    title: 'Multi-event trends',
    body: 'Compare attendance, revenue per head, and promoter effectiveness across your whole portfolio over time.',
  },
];

export default function AnalyticsView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">Promoter analytics</span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-2 mt-6 max-w-4xl"
          >
            Know the room before the baseline <span className="text-white">drops.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Real time visibility into every metric that matters, from ticket sales velocity to
            crowd engagement. Not vanity numbers: intelligence you can use to fill rooms and prove
            ROI to sponsors.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href={CREATE_HREF} className="glow-cta px-8 py-4 text-sm">
              Open the dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/platform" className="pill-ghost px-8 py-4 text-sm font-semibold">
              See the platform
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Signals ── */}
      <SectionShell eyebrow="The signals" pad="default" border={false}>
        <h2 className="display-2 mt-5 max-w-2xl">Three reads on every night.</h2>
        <p className="body-lead mt-6 max-w-xl">
          Momentum before the doors, truth at the door, and movement inside the room. All live,
          all in one dashboard.
        </p>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="One hype metric"
            body="The Hype Index is a real time pulse of your event's momentum, built from RSVP velocity, chat activity, ticket sales rate, and social sharing. Know whether hype is building or stalling before the first person walks in."
            chip={<div className="p-5"><AnalyticsMock /></div>}
          />
          <FeatureRow
            reverse
            title="The door tells the truth"
            body="Ticket-to-door conversion shows exactly how many ticket holders actually show up. Compare across events to spot day-of-week trends and pricing sensitivity, then plan the next one on evidence."
            chip={<div className="p-5"><LiveScanMock /></div>}
          />
          <FeatureRow
            title="Spatial intel on the venue"
            body="Density by zone, bar queue times, and VIP dwell while the night is live. Move staff before the bottleneck forms, not after."
            chip={<div className="p-5"><VenueMapMock /></div>}
            href="/features/branded-event-ticketing"
            linkLabel="The ticketing behind it"
          />
        </div>
      </SectionShell>

      {/* ── The full dashboard ── */}
      <SectionShell eyebrow="The full dashboard" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">Everything an operator needs.</h2>
        <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {DASHBOARD.map((item) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-3 py-7 md:grid-cols-[1fr_1.4fr] md:gap-12"
            >
              <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">
                {item.title}
              </h3>
              <p className="self-center text-base leading-relaxed text-zinc-400">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* ── CTA ── */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Stop guessing.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={CREATE_HREF} className="glow-cta px-8 py-4 text-sm">
              Create your event
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features/branded-event-ticketing"
              className="pill-ghost px-8 py-4 text-sm font-semibold"
            >
              Ticketing in your brand
            </Link>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
