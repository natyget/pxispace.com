'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';

export default function EditorialArticle({ story }) {
  if (!story) return null;
  const date = new Date(story.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);

  return (
    <article className="landing-v2 bg-black text-white">
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div className="mx-auto max-w-[820px] px-6">
          <Link href="/story" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Story
          </Link>
          <p className="mt-8 block text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">{story.tag}</p>
          <h1 className="display-2 mt-5">{story.title}</h1>
          <p className="body-lead mt-6">{story.dek}</p>
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-zinc-600">
            {date} · {story.readMinutes} min read
          </p>
        </div>
      </section>

      <div className={`mx-auto mt-12 px-6 ${story.articleMaxWidthClass || 'max-w-[980px]'}`}>
        <div className={`relative ${story.articleImageAspectClass || 'aspect-[16/9]'} overflow-hidden rounded-3xl border border-white/10`}>
          <img
            src={story.articleCover || story.cover}
            alt={story.title}
            className={`h-full w-full object-cover ${story.articleImageClass || ''}`}
            style={story.articleImageStyle}
          />
          {story.articleVignette && (
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />
          )}
        </div>
      </div>

      <SectionShell pad="default" border={false}>
        <div className="mx-auto max-w-[720px] space-y-6">
          {story.body.map((para, i) => (
            <p key={i} className="text-lg leading-relaxed text-zinc-300">
              {para}
            </p>
          ))}
        </div>

        {story.gallery?.length ? (
          <div className="mx-auto mt-14 grid max-w-[720px] grid-cols-3 gap-3">
            {story.gallery.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                {isVideo(src) ? (
                  <video
                    src={src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label={`${story.title} scrapbook clip`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img src={src} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </SectionShell>

      <SectionShell pad="default">
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <h2 className="display-3">Keep your own nights.</h2>
          <Link href="/events" className="glow-cta mt-6 px-8 py-4 text-sm">
            Explore events
          </Link>
        </div>
      </SectionShell>
    </article>
  );
}
