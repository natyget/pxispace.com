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

export default function EditorialIndex() {
  const [lead, ...rest] = EDITORIAL_STORIES;

  return (
    <div className="landing-v2 bg-black text-white">
      {/* Lead */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">Story</span>
          <h1 className="display-1 mt-6 max-w-3xl">Stories from the night.</h1>
        </div>
      </section>

      {lead ? (
        <SectionShell pad="default" border={false}>
          <Link href={`/story/${lead.slug}`} className="group grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10">
              <img
                src={lead.cover}
                alt=""
                aria-hidden
                className="h-full w-full object-cover transition-transform duration-700"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-pxi-purple">{lead.tag}</span>
              <h2 className="display-3 mt-4">{lead.title}</h2>
              <p className="body-lead mt-4 max-w-lg">{lead.dek}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:underline">
                Read story <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </SectionShell>
      ) : null}

      {/* Rest */}
      <SectionShell pad="loose">
        <div className="flex flex-wrap justify-center gap-6">
          {rest.map((story, i) => (
            <MotionDiv
              key={story.slug}
              className="w-full md:w-[calc((100%_-_3rem)/3)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={`/story/${story.slug}`} className="group block">
                <StoryCardMedia
                  story={story}
                  className={`${story.storyIndexCardAspectClass || story.cardAspectClass || 'aspect-square'} rounded-2xl border border-white/10`}
                />
                <h3 className="mt-4 text-lg font-semibold leading-snug text-white">{story.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{story.dek}</p>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
