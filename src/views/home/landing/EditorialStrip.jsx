'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import { EDITORIAL_STORIES } from '@/content/editorial';

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
          <motion.div
            key={story.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={`/story/${story.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
                <img
                  src={story.cover}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className={`h-full w-full object-cover transition-transform duration-700 ${story.imageClass || ''}`}
                  style={story.imageStyle}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  {story.tag}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug text-white group-hover:text-white">
                {story.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{story.dek}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
