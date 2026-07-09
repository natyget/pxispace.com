'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import SectionShell from '@/components/marketing/SectionShell';

const PRINCIPLES = [
  {
    title: 'Privacy is not a feature tier.',
    body: 'No location tracking, no selling your data. Ever. It is the floor, not an upsell.',
  },
  {
    title: 'The organizer keeps the money.',
    body: 'Revenue routes straight to the people who throw the party. PXI never sits on your payouts.',
  },
  {
    title: 'Everyone shoots, no one begs for pics.',
    body: 'One shared camera per night. The memory belongs to the room, not to whoever remembered to post.',
  },
];

const AboutPage = () => {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* 1 — Statement */}
      <section className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-1 max-w-4xl"
          >
            Memory is <span className="text-white">the product.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            Everything else, the tickets, the doors, the analytics, exists so the night survives.
          </motion.p>
        </div>
      </section>

      {/* 2 — Origin */}
      <SectionShell pad="loose">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="display-3 mt-5">Built from lost moments.</h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-zinc-400">
              <p>
                Before we built infrastructure, we were operators, hosting the nights people talked
                about for months. But the memory of them always scattered across dozens of phones,
                and the tools we used were built for broadcasting, not for being there.
              </p>
              <p className="text-white">
                So we stepped back from the noise and built the antidote: an event platform where the
                night compiles itself, the organizer keeps the money, and the memory is the point.
              </p>
            </div>
          </motion.div>

          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative"
          >
            <video
              src="/landing/assets/movie.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="aspect-square w-full rounded-3xl object-cover"
            />
          </motion.figure>
        </div>
      </SectionShell>

      {/* 3 — Principles */}
      <SectionShell eyebrow="What we believe" pad="loose">
        <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {PRINCIPLES.map((p) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-3 py-8 md:grid-cols-[1fr_1.2fr] md:gap-12"
            >
              <h3 className="display-3 text-2xl md:text-3xl">{p.title}</h3>
              <p className="self-center text-base leading-relaxed text-zinc-400">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      {/* 4 — Close */}
      <SectionShell pad="loose">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Built by operators, since 2024.
          </p>
          <h2 className="display-2 mt-6 max-w-2xl">We build the tools. You own the night.</h2>
          <div className="mt-10">
            <AppStoreCtaPair className="justify-center" />
          </div>
          <Link
            href="/platform"
            className="mt-8 text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            Throwing something? See the platform →
          </Link>
        </div>
      </SectionShell>
    </div>
  );
};

export default AboutPage;
