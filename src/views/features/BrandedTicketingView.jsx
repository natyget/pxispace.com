'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import SectionShell from '@/components/marketing/SectionShell';
import FeatureRow from '@/components/marketing/FeatureRow';
import EarningsMock from '@/components/marketing/DashboardMockup/EarningsMock';
import LiveScanMock from '@/components/marketing/DashboardMockup/LiveScanMock';
import SanaaTicketShowcase from '@/components/marketing/SanaaTicketShowcase';
import CheckoutThreadMock from '@/components/marketing/CheckoutThreadMock';

const CREATE_HREF = '/login?redirect=/dashboard/events/new';

export default function BrandedTicketingView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-2 mt-6 max-w-4xl"
          >
            Your tickets. Your brand. Your <span className="text-white">revenue.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Your branding leads at every touchpoint. Attendees see your covers, your colors, and
            your stamps from checkout to scrapbook, with a subtle PXI mark that powers
            verification, and revenue routes straight to your Stripe account.
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
            <Link href="/platform" className="pill-ghost px-8 py-4 text-sm font-semibold">
              See the platform
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── The money ── */}
      <SectionShell eyebrow="The money" pad="default" border={false}>
        <h2 className="display-2 mt-5 max-w-2xl">PXI never holds your money.</h2>
        <p className="body-lead mt-6 max-w-xl">
          Stripe destination charges route every sale directly to your account. Full transparency
          on every transaction, from the first ticket to the final payout.
        </p>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="Revenue flows straight to you"
            body="No hidden fees, no delayed payouts. PXI handles the infrastructure while you keep full financial control over every transaction."
            chip={<div className="p-5"><EarningsMock /></div>}
            href="/pricing"
            linkLabel="See pricing"
          />
          <FeatureRow
            reverse
            title="The ticket is your canvas"
            body="Every ticket carries your cover art, your colors, and your own custom stamps when you choose to add them. This is Sanaa Groove's night, shown exactly as their attendees see it, from web checkout to the stub in the app."
            phone={<SanaaTicketShowcase />}
          />
        </div>
      </SectionShell>

      {/* ── The flow ── */}
      <SectionShell eyebrow="From purchase to party" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">Hype starts at checkout.</h2>
        <p className="body-lead mt-6 max-w-xl">
          Attendees buy on the web with no app store friction, then land straight in the event
          thread before the doors even open.
        </p>
        <div className="mt-14">
          <CheckoutThreadMock />
        </div>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            reverse
            title="Control the whole lifecycle"
            body="One command center runs every phase, from dormant announcement through live door operations to the post-event grace period. Ticketing, capacity, and attendee communication stay in your hands."
            chip={<div className="p-5"><LiveScanMock /></div>}
            href="/features/event-promoter-analytics"
            linkLabel="Promoter analytics in depth"
          />
        </div>
      </SectionShell>

      {/* ── CTA ── */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Open the doors under your own name.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={CREATE_HREF} className="glow-cta px-8 py-4 text-sm">
              Create your event
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/platform" className="pill-ghost px-8 py-4 text-sm font-semibold">
              See the platform
            </Link>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
