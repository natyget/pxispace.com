'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import SectionShell from '@/components/marketing/SectionShell';
import FeatureRow from '@/components/marketing/FeatureRow';
import PhoneMockup from '@/components/ui/PhoneMockup';
import PassportShowcase from '@/components/marketing/PassportShowcase';
import CameraDemo from '@/components/marketing/CameraDemo';
import PassportStamp from '@/components/ui/PassportStamp';
import { HeaderPolygonBadge } from '@/components/passport/passportVisualParts';
import { PXI_PASSPORT_LEVEL_BADGE_THEMES } from '@/utils/odysseyTier';
import { FaApple } from 'react-icons/fa';
import { PXI_IOS_DOWNLOAD_HREF } from '@/lib/appStoreLinks';

const ODYSSEY_BADGES = [
  { id: 'ODYSSEY', name: 'Odyssey', letter: 'O' },
  { id: 'LUMINARY', name: 'Luminary', letter: 'L' },
  { id: 'PATHFINDER', name: 'Pathfinder', letter: 'P' },
  { id: 'VOYAGER', name: 'Voyager', letter: 'V' },
  { id: 'SEEKER', name: 'Seeker', letter: 'S' },
  { id: 'WANDERER', name: 'Wanderer', letter: 'W' },
];

const TIERS = [
  {
    name: 'Bronze',
    range: 'Wanderer',
    color: 'text-orange-400',
    desc: 'Low engagement. You attended the event but barely interacted with the camera or the album.',
  },
  {
    name: 'Silver',
    range: 'Pathfinder',
    color: 'text-zinc-400',
    desc: 'Moderate engagement. You shared a few moments and interacted with the gallery, leaving a solid mark.',
  },
  {
    name: 'Gold',
    range: 'Luminary',
    color: 'text-amber-400',
    desc: 'High engagement. You were actively contributing to the night, taking photos, and engaging with others.',
  },
  {
    name: 'Platinum',
    range: 'Odyssey',
    color: 'text-violet-300',
    desc: 'Maximum engagement. You drove the night’s energy, capturing iconic moments that everyone reacted to.',
  },
];

const PRINCIPLES = [
  {
    title: 'Not a loyalty card.',
    body: 'Every stamp is verified by the organizer’s check-in data. It cannot be faked, bought, or inflated.',
  },
  {
    title: 'Your identity, not your data.',
    body: 'PXI does not sell your attendance history, location, or social graph. Zero tracking, zero surveillance.',
  },
  {
    title: 'Shareable, verifiable, permanent.',
    body: 'Each stamp links back to a real event with a real scrapbook. Proof of presence, not a screenshot of a ticket.',
  },
];

export default function PassportView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">The digital passport</span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-2 mt-6 max-w-4xl"
          >
            Proof you were <span className="text-white">there.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Every event you attend earns a stamp. Your Odyssey score is a living record of every
            show, every party, every rooftop. Not bought, not faked. Earned by showing up.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a href={PXI_IOS_DOWNLOAD_HREF} target="_blank" rel="noopener noreferrer" className="glow-cta px-8 py-4 text-sm">
              <FaApple className="h-5 w-5" />
              Get the app
            </a>
            <Link href="/platform" className="pill-ghost px-8 py-4 text-sm font-semibold">
              See the platform
            </Link>
          </motion.div>

          {/* the real passport card */}
          <div className="mt-16 md:mt-20">
            <PassportShowcase />
          </div>
        </div>
      </section>

      {/* ── How stamps work ── */}
      <SectionShell eyebrow="How stamps work" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">Show up. Get stamped.</h2>
        <p className="body-lead mt-6 max-w-xl">
          No manual action required. Being in the room is the whole mechanic.
        </p>

        <div className="mt-12 mb-16 flex flex-wrap items-center justify-center gap-4 max-w-4xl">
          <PassportStamp eventName="Afrodisiac" date="DEC 12" tier="Platinum" size="lg" className="-rotate-6" />
          <PassportStamp eventName="Boiler Room" date="JAN 05" tier="Gold" size="lg" className="rotate-3" />
          <PassportStamp eventName="Summer Fest" date="JUN 21" tier="Silver" size="lg" className="-rotate-2" />
          <PassportStamp eventName="Local Gig" date="FEB 14" tier="Bronze" size="lg" className="rotate-6" />
        </div>

        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="Every night earns a stamp"
            body="Check in through the event thread, shoot on the shared camera, or simply be on the attendee list. Every verified attendance stamps your passport, matched to the event size and your engagement that night."
            phone={
              <div className="w-full flex justify-center py-6">
                <CameraDemo />
              </div>
            }
          />
          <FeatureRow
            reverse
            title="A score that only goes up"
            body="Your Odyssey score is the running tally of all your stamps, and each one links back to a real event with a real scrapbook. Share it to your story or your bio. It goes up. It never goes down."
            phone={
              <div className="flex flex-col items-center justify-center gap-6 p-8 w-full sm:w-auto h-full">
                {ODYSSEY_BADGES.map((tier) => {
                  const theme = PXI_PASSPORT_LEVEL_BADGE_THEMES[tier.id];
                  return (
                    <div key={tier.name} className="flex items-center gap-6 w-full max-w-[200px]">
                      <div className="scale-125">
                        <HeaderPolygonBadge
                          letter={tier.letter}
                          progress={1}
                          hexFill={theme.fill}
                          hexStroke={theme.stroke}
                          ringMuted={theme.progressTrack}
                          ringBright={theme.progressFill}
                        />
                      </div>
                      <span className="text-lg font-black uppercase tracking-widest text-white">
                        {tier.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            }
            href="/features/shared-event-photo-gallery"
            linkLabel="Where the memories come from"
          />
        </div>
      </SectionShell>

      {/* ── Tiers ── */}
      <SectionShell eyebrow="The tiers" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">From first stamp to inner circle.</h2>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 md:p-8"
            >
              <div className="flex items-baseline justify-between">
                <h3 className={`text-xl font-semibold tracking-tight ${tier.color}`}>{tier.name}</h3>
                <span className="text-xs uppercase tracking-[0.18em] text-zinc-600">{tier.range}</span>
              </div>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">{tier.desc}</p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* ── Why it matters ── */}
      <SectionShell eyebrow="Why it matters" pad="default">
        <div className="mt-4">
          <FeatureRow
            title="Organizers see your tier"
            body="When you RSVP, organizers can see your Odyssey tier. Platinum signals reliability and community investment, which means early invites and priority access."
            phone={
              <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/10 h-full">
                <div className="relative">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-black">
                    <img src="/landing/assets/maya_profile_new.jpg" alt="Maya avatar" className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-4 rotate-6 px-4 py-1.5 rounded-full bg-violet-600 border border-violet-400 shadow-xl">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Odyssey</span>
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-black text-white">Maya J.</h3>
                <span className="mt-1 text-sm text-zinc-400">@mayaj</span>
              </div>
            }
          />
        </div>
        <div className="mt-16 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {PRINCIPLES.map((p) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-3 py-7 md:grid-cols-[1fr_1.3fr] md:gap-12"
            >
              <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">{p.title}</h3>
              <p className="self-center text-base leading-relaxed text-zinc-400">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* ── CTA ── */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Start earning stamps.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={PXI_IOS_DOWNLOAD_HREF} target="_blank" rel="noopener noreferrer" className="glow-cta px-8 py-4 text-sm">
              <FaApple className="h-5 w-5" />
              Get the app
            </a>
            <Link
              href="/features/shared-event-photo-gallery"
              className="pill-ghost px-8 py-4 text-sm font-semibold"
            >
              The shared gallery
            </Link>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
