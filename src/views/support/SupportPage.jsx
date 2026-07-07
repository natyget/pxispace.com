'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Images, Printer, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import FaqList from '@/components/marketing/FaqList';

const EASE = [0.16, 1, 0.3, 1];

const TOPICS = [
  {
    icon: UserRound,
    title: 'Account & Access',
    body: 'Sign up, log back in, recover a password, or delete your account for good.',
    href: '/faq',
    cta: 'Read the answers',
  },
  {
    icon: Images,
    title: 'Events & Albums',
    body: 'Joining events, unlocking shared albums, hosting your own, and saving your shots.',
    href: '/faq',
    cta: 'Read the answers',
  },
  {
    icon: Ticket,
    title: 'Tickets & Payments',
    body: 'Buying tickets, passes that have not landed yet, and how host payouts work via Stripe.',
    href: '/faq',
    cta: 'Read the answers',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy & Safety',
    body: 'How Find My Shots works, how your data is protected, and how to report anything off.',
    href: '/faq',
    cta: 'Read the answers',
  },
  {
    icon: Printer,
    title: 'PXIClip Device',
    body: 'Pairing your Clip, loading ZINK paper, and fixing faded or streaky prints.',
    href: '#pxiclip',
    cta: 'Jump to device help',
  },
];

const PXICLIP_FAQS = [
  {
    q: 'How do I set up PXIClip?',
    a: 'Charge PXIClip fully before first use. Open the PXI app, go to the Clip tab, and tap Connect Device. Enable Bluetooth when prompted and hold the power button for 3 seconds to enter pairing mode. The app finds it automatically.',
  },
  {
    q: "PXIClip won't pair with my phone. How do I fix it?",
    a: 'Make sure Bluetooth is on and PXI has Bluetooth permission in your phone settings. Force close the app, restart PXIClip, and try again. If it still fails, forget the device in your Bluetooth settings and re-pair from scratch. Still not working? Email support@pxispace.com with your device serial number.',
  },
  {
    q: 'What paper does PXIClip use?',
    a: 'PXIClip uses standard 2x3 inch ZINK (Zero Ink) paper. PXI-branded packs give the best colour accuracy and print life, and third-party ZINK paper works in most cases.',
  },
  {
    q: 'My prints look faded or streaky. What is wrong?',
    a: 'Faded prints usually mean low battery or paper loaded face down. Keep PXIClip at least 50% charged and load the paper glossy side up with the blue calibration sheet at the bottom of the stack.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: EASE },
};

export default function SupportPage() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">Support</span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="display-1 mt-6 max-w-4xl"
          >
            Here to <span className="text-pxi-purple">help.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="body-lead mt-8 max-w-2xl"
          >
            A real person reads every message. Most answers already live in the FAQ, and everything
            else lands at <strong>support@pxispace.com</strong>, usually answered within a day.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href="/faq" className="glow-cta px-8 py-4 text-sm">
              Browse the full FAQ <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:support@pxispace.com" className="pill-ghost px-8 py-4 text-sm font-semibold">
              Email support
            </a>
          </motion.div>
        </div>
      </section>

      {/* Topics */}
      <SectionShell eyebrow="Browse by topic" pad="default">
        <motion.h2 {...fadeUp} className="display-2 mt-6 max-w-2xl">
          Find your answer fast.
        </motion.h2>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => {
            const Icon = topic.icon;
            const isAnchor = topic.href.startsWith('#');
            const inner = (
              <>
                <Icon className="h-6 w-6 text-pxi-purple" />
                <h3 className="mt-5 text-lg font-semibold text-white">{topic.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{topic.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  {topic.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </>
            );
            const cardClass =
              'group flex flex-col items-start rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.16]';
            return (
              <motion.div key={topic.title} {...fadeUp}>
                {isAnchor ? (
                  <a href={topic.href} className={cardClass}>
                    {inner}
                  </a>
                ) : (
                  <Link href={topic.href} className={cardClass}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </SectionShell>

      {/* PXIClip device help */}
      <SectionShell id="pxiclip" eyebrow="PXIClip device" pad="default" className="scroll-mt-20">
        <motion.h2 {...fadeUp} className="display-3 mt-6">
          Get your Clip printing.
        </motion.h2>
        <motion.div {...fadeUp} className="mt-10">
          <FaqList faqs={PXICLIP_FAQS} />
        </motion.div>
      </SectionShell>

      {/* Trust & safety */}
      <SectionShell pad="default">
        <motion.div
          {...fadeUp}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12"
        >
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-pxi-purple" />
            <div>
              <h2 className="display-3">Trust and safety, taken seriously.</h2>
              <p className="body-lead mt-4 max-w-2xl">
                For content or behaviour that breaks our community guidelines, use the in-app report
                button on any photo, profile, or event. For urgent matters, email{' '}
                <a
                  href="mailto:trust@pxispace.com"
                  className="text-pxi-purple underline-offset-4 hover:underline"
                >
                  trust@pxispace.com
                </a>{' '}
                and it goes straight to the team.
              </p>
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* Close */}
      <SectionShell pad="loose">
        <motion.div {...fadeUp} className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Still need a hand?</h2>
          <p className="body-lead mt-6 max-w-xl">
            Send as much detail as you can, screenshots help, and we will get you back to the night.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:support@pxispace.com" className="glow-cta px-8 py-4 text-sm">
              Email support@pxispace.com <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/faq" className="pill-ghost px-8 py-4 text-sm font-semibold">
              Read the FAQ
            </Link>
          </div>
        </motion.div>
      </SectionShell>
    </div>
  );
}
