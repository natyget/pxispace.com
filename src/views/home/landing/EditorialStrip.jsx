'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import { EDITORIAL_STORIES } from '@/content/editorial';

const MotionDiv = motion.div;

function StoryCardMedia({ story, className = '' }) {
  if (story.preserveCardFrame) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={story.cover}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl"
        />
        <img
          src={story.cover}
          alt=""
          aria-hidden
          loading="lazy"
          className="relative z-10 h-full w-full object-contain transition-transform duration-700"
        />
        <div className={`absolute inset-0 z-20 ${story.cardOverlayClass || 'bg-gradient-to-t from-black/70 to-transparent'}`} />
        <span className="absolute left-4 top-4 z-30 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
          {story.tag}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={story.cover}
        alt=""
        aria-hidden
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-700 ${story.imageClass || ''}`}
        style={story.imageStyle}
      />
      <div className={`absolute inset-0 ${story.cardOverlayClass || 'bg-gradient-to-t from-black/70 to-transparent'}`} />
      <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
        {story.tag}
      </span>
    </div>
  );
}

/** Posh-style "Editorial" beat — a lead story headline + a row of cover cards. */
export default function EditorialStrip() {
  const [lead, ...rest] = EDITORIAL_STORIES;
  if (!lead) return null;

  return (
    <SectionShell eyebrow="Story" pad="loose">
      <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <h2 className="display-2 max-w-xl">Stories from the night.</h2>
        <Link
          href="/story"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          Read all stories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[lead, ...rest].slice(0, 3).map((story, i) => (
          <MotionDiv
            key={story.slug}
            // "Fan the deck": each cover is dealt in from a tilted, stacked
            // position and straightens as it lands in its slot, like fanning out
            // printed editorial covers.
            initial={{ opacity: 0, y: 44, rotate: (i - 1) * 8, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 1.15, delay: 0.15 + i * 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={`/story/${story.slug}`} className="group block">
              <StoryCardMedia
                story={story}
                className={`${story.cardAspectClass || 'aspect-[309/362]'} rounded-2xl border border-white/10`}
              />
              <h3 className="mt-4 text-lg font-semibold leading-snug text-white group-hover:text-white">
                {story.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{story.dek}</p>
            </Link>
          </MotionDiv>
        ))}
      </div>
    </SectionShell>
  );
}
