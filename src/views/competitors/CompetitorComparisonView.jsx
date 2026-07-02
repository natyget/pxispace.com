'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Minus } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

import SectionShell from '@/components/marketing/SectionShell';

const CREATE_HREF = '/login?redirect=/dashboard/events/new';

/* ── Feature advantages (SEO content, keep intact) ── */
const ADVANTAGES = [
  {
    title: 'Shared Photo Gallery',
    pxi: 'Every shot from every attendee lands in a single, unified gallery automatically. No uploads, no links, no friction.',
    them: "Partiful and Luma have zero gallery features. You're stuck airdropping photos or creating shared albums manually after the event.",
  },
  {
    title: 'Built-In Event Camera',
    pxi: "A native camera that adapts to the room's lighting in real time. Every capture is automatically tagged to the event thread.",
    them: "No competitor offers a built-in camera. You're using your native camera app and manually adding photos to group chats afterward.",
  },
  {
    title: 'White-Label Ticketing',
    pxi: 'Zero platform branding. Your event, your brand. Web-based sign-ups bypass app store friction entirely.',
    them: "Eventbrite plasters their logo everywhere. Partiful doesn't even offer paid ticketing. Luma's branding is baked into every page.",
  },
  {
    title: 'Event Chat Thread',
    pxi: 'A dedicated, persistent chat thread per event, from pre-event hype to post-event memories. RSVP, coordination, and reactions all in one place.',
    them: 'Partiful has basic comments. Luma and DICE have none. You end up creating WhatsApp groups that die after the event.',
  },
  {
    title: 'Digital Event Passport',
    pxi: 'Every event you attend earns a verified stamp. Your Odyssey score builds over time: a gamified social resume of your entire event life.',
    them: 'No competitor tracks your event history. Once the event ends, there is zero record of your attendance anywhere.',
  },
  {
    title: 'Auto Scrapbook',
    pxi: 'PXI automatically compiles every photo, reaction, and comment into a permanent, shareable scrapbook the moment the event ends.',
    them: 'SWSH offers basic albums. Every other platform (Partiful, Luma, DICE, Eventbrite) has zero post-event content.',
  },
  {
    title: 'Promoter Attribution',
    pxi: "Every promoter gets a unique trackable link. Know exactly who's filling the room, measure per-promoter ROI, and reward performance.",
    them: "Eventbrite offers basic referral tracking. Partiful and Luma have zero attribution. You're guessing who's driving your audience.",
  },
  {
    title: 'Privacy-First Architecture',
    pxi: 'Zero location tracking. Zero behavioral surveillance. Your data stays yours. We monetize the product, not your identity.',
    them: 'Eventbrite, DICE, and Luma all track location and behavioral data. Your attendees are the product.',
  },
];

/* ── Head-to-head table (SEO content, keep intact) ── */
const COMPARISON = [
  //                          Partiful  Luma  DICE  Eventbrite  SWSH  Lapse
  { f: 'Invites / RSVP',     c: [true,  true,  false, true,  false, false] },
  { f: 'Paid Ticketing',     c: [false, true,  true,  true,  false, false] },
  { f: 'White-Label',        c: [false, false, false, false, false, false] },
  { f: 'Event Discovery',    c: [false, true,  true,  true,  false, false] },
  { f: 'Shared Gallery',     c: [false, false, false, false, true,  false] },
  { f: 'Live Camera',        c: [false, false, false, false, false, true ] },
  { f: 'Event Chat',         c: [true,  false, false, false, false, false] },
  { f: 'Auto Scrapbook',     c: [false, false, false, false, true,  false] },
  { f: 'Passport / XP',      c: [false, false, false, false, false, false] },
  { f: 'Promoter Analytics', c: [false, false, false, true,  false, false] },
  { f: 'QR Door Scan',       c: [false, true,  true,  true,  false, false] },
  { f: 'Zero Tracking',      c: [false, false, false, false, false, false] },
];

const COMPETITORS = ['Partiful', 'Luma', 'DICE', 'Eventbrite', 'SWSH', 'Lapse'];

const Check = () => (
  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="inline-block text-emerald-400" />
);
const None = () => <Minus className="inline-block h-4 w-4 text-zinc-700" aria-label="No" />;

export default function CompetitorComparisonView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">PXI vs the rest</span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-2 mt-6 max-w-4xl"
          >
            Invite apps end at the <span className="text-pxi-purple">door.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Partiful handles invites. Luma handles ticketing. SWSH handles photos. Lapse handles
            cameras. PXI handles all of it, before, during, and after, in one platform with zero
            compromise.
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

      {/* ── Feature by feature ── */}
      <SectionShell eyebrow="Feature by feature" pad="default" border={false}>
        <h2 className="display-2 mt-5 max-w-2xl">What you get with PXI.</h2>
        <p className="body-lead mt-6 max-w-xl">
          A side-by-side breakdown of how PXI stacks up against the tools you're currently
          duct-taping together.
        </p>
        <div className="mt-12 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {ADVANTAGES.map((adv) => (
            <motion.div
              key={adv.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[0.8fr_1.1fr_1.1fr] md:gap-10"
            >
              <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">
                {adv.title}
              </h3>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pxi-purple">
                  With PXI
                </p>
                <p className="mt-2 text-base leading-relaxed text-zinc-300">{adv.pxi}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  Everyone else
                </p>
                <p className="mt-2 text-base leading-relaxed text-zinc-500">{adv.them}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* ── Head-to-head table ── */}
      <SectionShell eyebrow="The whole stack" pad="default">
        <h2 className="display-2 mt-5 max-w-3xl">The complete breakdown.</h2>
        <p className="body-lead mt-6 max-w-2xl">
          Stop juggling six tools. PXI replaces your entire event stack, from the first invite to
          the last scrapbook.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 w-full overflow-x-auto"
        >
          <table className="w-full min-w-[680px] border-collapse overflow-hidden rounded-2xl border border-white/[0.06]">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 md:px-5 md:text-xs">
                  Feature
                </th>
                {COMPETITORS.map((name) => (
                  <th
                    key={name}
                    className="whitespace-nowrap px-2 py-4 text-center text-[9px] font-medium text-zinc-500 md:px-3 md:text-[11px]"
                  >
                    {name}
                  </th>
                ))}
                <th className="border-l border-pxi-purple/20 bg-pxi-purple/[0.08] px-3 py-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-pxi-purple md:px-5 md:text-xs">
                  PXI
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {COMPARISON.map((row, i) => (
                <tr
                  key={row.f}
                  className={`${i < COMPARISON.length - 1 ? 'border-b border-white/[0.04]' : ''} transition-colors hover:bg-white/[0.02]`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium text-white/80 md:px-5 md:text-sm">
                    {row.f}
                  </td>
                  {row.c.map((has, j) => (
                    <td key={j} className="px-2 py-3 text-center md:px-3">
                      {has ? <Check /> : <None />}
                    </td>
                  ))}
                  <td className="border-l border-pxi-purple/20 bg-pxi-purple/[0.08] px-3 py-3 text-center md:px-5">
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={22}
                      className="inline-block text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </SectionShell>

      {/* ── CTA ── */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Replace the stack.</h2>
          <p className="body-lead mt-6 max-w-xl">
            One platform that handles everything from the first RSVP to the last scrapbook.
          </p>
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
