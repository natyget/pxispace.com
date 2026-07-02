'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FaApple } from 'react-icons/fa';
import { PXI_IOS_DOWNLOAD_HREF } from '@/lib/appStoreLinks';
import SectionShell from '@/components/marketing/SectionShell';
import FaqList from '@/components/marketing/FaqList';
import InstaShareShowcase from '@/components/marketing/InstaShareShowcase';
import { INSTA_FAQS } from '@/content/faqs';

const STEPS = [
  {
    title: 'Shoot into the shared gallery',
    body: 'Everyone at the event shoots into one live thread. No group chats, no chasing pics.',
  },
  {
    title: 'The scrapbook compiles itself',
    body: 'The morning after, every frame from every phone is ranked and organized automatically.',
  },
  {
    title: 'One tap to a framed post',
    body: 'Pick a shot and PXI frames it, captioned and located, ready for Instagram instantly.',
  },
];

export default function InstagramSharingView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* Hero = the live showcase */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">Share to Instagram</span>
          <div className="mt-8">
            <InstaShareShowcase />
          </div>
        </div>
      </section>

      {/* How it works */}
      <SectionShell eyebrow="How it works" pad="loose">
        <h2 className="display-2 mt-6 max-w-2xl">From the night to your feed.</h2>
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
            >
              <span className="text-sm font-bold text-pxi-purple">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* FAQ */}
      <SectionShell eyebrow="FAQ" pad="loose">
        <h2 className="display-3 mt-6 mb-10">Questions</h2>
        <FaqList faqs={INSTA_FAQS} />
      </SectionShell>

      {/* CTA */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <h2 className="display-2 max-w-2xl">Your night, ready to post.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={PXI_IOS_DOWNLOAD_HREF} target="_blank" rel="noopener noreferrer" className="glow-cta px-8 py-4 text-sm">
              <FaApple className="h-5 w-5" />
              Get the app
            </a>
            <Link href="/features/shared-event-photo-gallery" className="pill-ghost px-8 py-4 text-sm font-semibold">
              See the shared gallery
            </Link>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
