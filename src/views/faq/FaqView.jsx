'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import FaqList from '@/components/marketing/FaqList';
import { FAQ_PAGE_SECTIONS } from '@/content/faqs';

const EASE = [0.16, 1, 0.3, 1];

export default function FaqView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="display-1 mt-6 max-w-4xl"
          >
            Questions, <span className="text-pxi-purple">answered.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="body-lead mt-8 max-w-2xl"
          >
            Everything about tickets, shared albums, passport stamps, privacy, and your account.
            If it is not here, a real person at{' '}
            <Link href="/support" className="text-white underline-offset-4 hover:underline">
              support
            </Link>{' '}
            will sort it out.
          </motion.p>
        </div>
      </section>

      {/* One section per FAQ group */}
      {FAQ_PAGE_SECTIONS.map((section) => (
        <SectionShell key={section.heading} eyebrow={section.heading} pad="tight">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mt-8"
          >
            <FaqList faqs={section.items} />
          </motion.div>
        </SectionShell>
      ))}

      {/* Close */}
      <SectionShell pad="tight">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h2 className="display-3">Still stuck?</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-zinc-400">
              Tell us what happened and we will get you moving again, usually within a day.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="mailto:support@pxispace.com" className="glow-cta px-8 py-4 text-sm">
              Email support <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/support" className="pill-ghost px-8 py-4 text-sm font-semibold">
              Visit support
            </Link>
          </div>
        </motion.div>
      </SectionShell>
    </div>
  );
}
