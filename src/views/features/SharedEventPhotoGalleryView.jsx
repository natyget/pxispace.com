'use client';

import React from 'react';
import Link from 'next/link';
import { FaApple } from 'react-icons/fa';
import { PXI_IOS_DOWNLOAD_HREF } from '@/lib/appStoreLinks';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import SectionShell from '@/components/marketing/SectionShell';
import FeatureRow from '@/components/marketing/FeatureRow';
import PhoneMockup from '@/components/ui/PhoneMockup';
import CameraDemo from '@/components/marketing/CameraDemo';

const STRIP = [
  '/landing/album/gallery/afrodisiac/DSC02918.jpg',
  '/landing/album/gallery/afrodisiac/DSC02954.jpg',
  '/landing/album/gallery/afrodisiac/DSC03010.jpg',
  '/landing/album/gallery/afrodisiac/DSC03036.jpg',
];

export default function SharedEventPhotoGalleryView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">The shared gallery</span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-2 mt-6 max-w-4xl"
          >
            One camera. The whole <span className="text-white">room.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Every attendee is a creator. PXI's native camera streams photos into the event's
            shared thread in real time. No uploads, no group texts, no algorithms. Just the night,
            preserved exactly as it happened.
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
        </div>
      </section>

      {/* ── Real shots ── */}
      <SectionShell pad="default" border={false}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {STRIP.map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt="Photo from a PXI shared event gallery"
              loading="lazy"
              decoding="async"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="aspect-[3/4] w-full rounded-2xl border border-white/10 object-cover"
            />
          ))}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-600">
          Shot by the room, on the shared camera
        </p>
      </SectionShell>

      {/* ── How it works ── */}
      <SectionShell eyebrow="How it works" pad="default">
        <h2 className="display-2 mt-5 max-w-2xl">The night compiles itself.</h2>
        <p className="body-lead mt-6 max-w-xl">
          From the first flash to the morning-after scrapbook, nobody has to collect, upload, or
          chase a single photo.
        </p>
        <div className="mt-14 flex flex-col gap-16">
          <FeatureRow
            title="A camera built for every moment"
            body="A tactile native camera engineered for the energy of the night. It captures the raw, unfiltered atmosphere without pulling you out of the moment. No filters, no staging."
            phone={<div className="-mx-8 md:mx-0"><CameraDemo onFilterChange={() => {}} /></div>}
          />
          <FeatureRow
            reverse
            title="Every shot lands in the thread"
            body="Photos bypass your personal camera roll and stream instantly into the event's shared thread. One communal pulse where every attendee adds to the story."
            phone={<PhoneMockup title="PXI live event thread" imgUrl="/landing/assets/thread_frame2.png" />}
          />
          <FeatureRow
            title="The best moments rise"
            body="Wilson scoring ranks every photo by collective reaction, so the most iconic shots surface on their own. The top of the gallery is decided by the room, not an algorithm."
            phone={<PhoneMockup title="PXI shared event photo gallery" imgUrl="/landing/assets/morning_frame2.png" />}
            href="/features/instagram-event-sharing"
            linkLabel="Share it to Instagram"
          />
          <FeatureRow
            reverse
            title="It ends as a scrapbook"
            body="When the event concludes, the PXI engine clusters the whole thread into a permanent, interactive digital scrapbook using DBSCAN clustering. No manual uploading, no chasing lost links."
            phone={<PhoneMockup title="PXI scrapbook wall" imgUrl="/landing/assets/morning_frame1.png" />}
            href="/features/digital-event-passport"
            linkLabel="Then earn the stamp"
          />
        </div>
      </SectionShell>

      {/* ── CTA ── */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Never beg for pics again.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={PXI_IOS_DOWNLOAD_HREF} target="_blank" rel="noopener noreferrer" className="glow-cta px-8 py-4 text-sm">
              <FaApple className="h-5 w-5" />
              Get the app
            </a>
            <Link
              href="/features/digital-event-passport"
              className="pill-ghost px-8 py-4 text-sm font-semibold"
            >
              The digital passport
            </Link>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
