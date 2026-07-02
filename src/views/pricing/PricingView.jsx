'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import FaqList from '@/components/marketing/FaqList';
import { PRICING_FAQS } from '@/content/faqs';

const DEMO_HREF = 'https://calendar.app.google/K9ZbdBemhS4c9f3b8';
const CREATE_HREF = '/login?redirect=/dashboard/events/new';

const INCLUDED = [
  'White label ticketing, your brand and your revenue',
  'Live scan & door-control dashboard',
  'Real-time analytics: hype, funnels, heatmaps',
  'Audience segments + SMS, email & feed campaigns',
  'Live shared gallery + morning-after scrapbook',
  'Passport stamps, your living event catalogue',
  'One-tap share to Instagram',
];

export default function PricingView() {
  return (
    <div className="landing-v2 bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="eyebrow">Pricing</span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-1 mt-6 max-w-4xl"
          >
            Free. <span className="text-pxi-purple">$0.99</span> per paid ticket. That's it.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            PXI is a free tool. Free events cost nothing. On paid tickets there's a flat{' '}
            <strong>$0.99</strong> platform fee, and your revenue is paid straight to your Stripe
            account. No monthly fees, no percentage cuts, no surprises.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href={CREATE_HREF} className="glow-cta px-8 py-4 text-sm">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={DEMO_HREF} target="_blank" rel="noopener noreferrer" className="pill-ghost px-8 py-4 text-sm font-semibold">
              Book a meeting
            </a>
          </motion.div>
        </div>
      </section>

      {/* What's included */}
      <SectionShell eyebrow="Everything included" pad="loose">
        <h2 className="display-2 mt-6 max-w-2xl">The whole stack, no tiers.</h2>
        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-start gap-3 border-b border-white/[0.06] py-4">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <span className="text-base text-white/85">{item}</span>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Early access */}
      <SectionShell pad="default">
        <div className="rounded-3xl border border-pxi-purple/20 bg-pxi-purple/[0.05] p-8 md:p-12">
          <div className="flex items-start gap-4">
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-pxi-purple" />
            <div>
              <span className="eyebrow">Early access</span>
              <h2 className="display-3 mt-4">Move fast, get more free.</h2>
              <p className="body-lead mt-4 max-w-2xl">
                Organizers who get moving quickly on PXI earn <strong>free promotional credits</strong>{' '}
                and full access to the dashboard analytics and ops tools while we roll out. Build your
                first nights with us and the whole stack is on the house.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Security */}
      <SectionShell pad="default">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-pxi-purple" />
            <div>
              <h2 className="display-3">Tickets that can't be forged.</h2>
              <p className="body-lead mt-4 max-w-2xl">
                Every pass is cryptographically signed with a modern token standard, meaningfully
                harder to fake than the aging formats most platforms still rely on. And every stamp
                and scrapbook becomes your event catalogue: proof of the nights you actually threw.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Contact */}
      <SectionShell eyebrow="Talk to us" pad="loose">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h2 className="display-2">Get a walkthrough.</h2>
            <p className="body-lead mt-6 max-w-md">
              Throwing something big, or moving from another platform? Book a meeting and we'll get
              you set up, or send us a note and we'll reply fast.
            </p>
            <a href={DEMO_HREF} target="_blank" rel="noopener noreferrer" className="glow-cta mt-8 inline-flex px-8 py-4 text-sm">
              Book a meeting <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Contact form — no backend endpoint yet; submits via mailto */}
          <form
            action="mailto:support@pxispace.com"
            method="post"
            encType="text/plain"
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8"
          >
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Name
              <input
                name="name"
                type="text"
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-pxi-purple/50"
                placeholder="Your name"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-pxi-purple/50"
                placeholder="you@email.com"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Message
              <textarea
                name="message"
                rows={4}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-pxi-purple/50"
                placeholder="Tell us about your events"
              />
            </label>
            <button type="submit" className="glow-cta mt-6 w-full py-3.5 text-sm">
              Send message
            </button>
          </form>
        </div>
      </SectionShell>

      {/* FAQ */}
      <SectionShell eyebrow="FAQ" pad="loose">
        <h2 className="display-3 mt-6 mb-10">Pricing questions</h2>
        <FaqList faqs={PRICING_FAQS} />
      </SectionShell>
    </div>
  );
}
