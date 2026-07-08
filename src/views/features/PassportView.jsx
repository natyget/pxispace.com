'use client';

import React from 'react';
import Link from 'next/link';
import { motion as Motion } from 'framer-motion';
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
    name: 'Wanderer',
    range: '0 – 500 XP',
    color: 'text-[#B026FF]',
    desc: 'The start of the journey. You showed up, got your stamp, and began your record of the night.',
  },
  {
    name: 'Seeker',
    range: '501 – 2.5K XP',
    color: 'text-indigo-400',
    desc: 'Building momentum. You’re actively attending and starting to interact with the event thread.',
  },
  {
    name: 'Voyager',
    range: '2.5K – 7K XP',
    color: 'text-emerald-500',
    desc: 'A regular. You’re consistently engaging, shooting photos, and adding to the collective memory.',
  },
  {
    name: 'Pathfinder',
    range: '7K – 15K XP',
    color: 'text-orange-500',
    desc: 'High engagement. You drive the energy, capturing and sharing iconic moments everyone reacts to.',
  },
  {
    name: 'Luminary',
    range: '15K – 30K XP',
    color: 'text-amber-400',
    desc: 'A pillar of the scene. Your presence is known and your contributions shape the night’s story.',
  },
  {
    name: 'Odyssey',
    range: '30K+ XP',
    color: 'text-zinc-300',
    desc: 'The inner circle. Maximum engagement across countless events. You are part of the core community.',
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
          <Motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-2 mt-6 max-w-4xl"
          >
            Proof you were <span className="text-white">there.</span>
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Every event you attend earns a stamp. Your Odyssey score is a living record of every
            show, every party, every rooftop. Not bought, not faked. Earned by showing up.
          </Motion.p>
          <Motion.div
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
          </Motion.div>

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

        <div className="mt-12 mb-16 flex flex-wrap items-center justify-center gap-6 max-w-5xl">
          <PassportStamp eventName="Afrodisiac" date="DEC 12" city="NYC" role="MEMBER" shape="star-burst" color="#c4b5fd" size="lg" className="-rotate-6" />
          <PassportStamp eventName="Boiler Room" date="JAN 05" city="LA" role="OWNER" shape="hologram-ticket" color="#FCD34D" textColor="#271600" size="lg" className="rotate-3" />
          <PassportStamp eventName="Summer Fest" date="JUN 21" city="MIA" role="STAFF" shape="arch-gate" color="#34D399" size="lg" className="-rotate-2 mt-4" />
          <PassportStamp eventName="Local Gig" date="FEB 14" city="CHI" role="MEMBER" shape="wax-seal" color="#FB923C" size="lg" className="rotate-6" />
          <PassportStamp eventName="Warehouse" date="MAR 02" city="LDN" role="MEMBER" shape="hexagon-pass" color="#60A5FA" size="lg" className="-rotate-12" />
          <PassportStamp eventName="Rooftop" date="AUG 30" city="BK" role="MEMBER" shape="visa-sticker" color="#E5E7EB" textColor="#111827" size="lg" className="rotate-12 mt-2" />
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
              <div className="flex flex-col items-center justify-center gap-14 p-8 w-full sm:w-auto h-full">
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
            href="/features/instagram-event-sharing"
            linkLabel="Share your memories"
          />
        </div>
      </SectionShell>

      {/* ── Tiers ── */}
      <SectionShell eyebrow="The tiers" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">From first stamp to inner circle.</h2>
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 overflow-hidden relative rounded-[2rem] border border-white/[0.08] bg-black p-8 md:p-14"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-x-0 bottom-0 top-1/2 -z-10 bg-gradient-to-r from-[#B026FF]/20 via-[#34D399]/20 to-[#E5E7EB]/20 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-5">
              A visual spectrum of engagement
            </h3>
            <p className="text-lg leading-relaxed text-zinc-400 mb-12 max-w-3xl">
              Your stamp's color isn't random. It’s a direct reflection of your energy in the room. From the moment you arrive, to how much you shoot, share, and interact—the stamp evolves. Organizers can glance at a passport and instantly know exactly who came for the vibe, and who got really turnt.
            </p>
            
            <div className="space-y-5">
               <div className="flex w-full h-5 rounded-full overflow-hidden">
                 <div className="h-full bg-[#B026FF] flex-1" title="Wanderer" />
                 <div className="h-full bg-[#60A5FA] flex-1" title="Seeker" />
                 <div className="h-full bg-[#34D399] flex-1" title="Voyager" />
                 <div className="h-full bg-[#FB923C] flex-1" title="Pathfinder" />
                 <div className="h-full bg-[#FCD34D] flex-1" title="Luminary" />
                 <div className="h-full bg-[#E5E7EB] flex-1" title="Odyssey" />
               </div>
               <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">
                 <span>Just showed up</span>
                 <span className="hidden sm:inline">Locked in</span>
                 <span>Ran the night</span>
               </div>
            </div>
          </div>
        </Motion.div>
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
            <Motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-3 py-7 md:grid-cols-[1fr_1.3fr] md:gap-12"
            >
              <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">{p.title}</h3>
              <p className="self-center text-base leading-relaxed text-zinc-400">{p.body}</p>
            </Motion.div>
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
