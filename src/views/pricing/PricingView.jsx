'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import FaqList from '@/components/marketing/FaqList';
import { PRICING_FAQS } from '@/content/faqs';
import { trackHostLead } from '@/lib/analytics';
import { setEnhancedConversionData } from '@/lib/enhancedConversions';

const DEMO_HREF = '/book';
const CREATE_HREF = '/login?redirect=/dashboard/events/new';
const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;

const INCLUDED = [
  'Branded tickets — your name and artwork front and center, your revenue',
  'Live scan & door-control dashboard',
  'Real-time analytics: hype, funnels, heatmaps',
  'Audience segments + SMS, email & feed campaigns',
  'Live shared gallery + morning-after scrapbook',
  'Passport stamps, your living event catalogue',
  'One-tap share to Instagram',
];

export default function PricingView() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('https://formspree.io/f/xkolppvv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        // Formspree accepted it — this is a qualified organizer lead. Hash the
        // email first so the conversion is enhanced-conversion eligible.
        void setEnhancedConversionData({ email: form.email }).then(() =>
          trackHostLead({ source: 'pricing' }),
        );
      } else {
        setStatus('error');
        setErrorMsg("Something went wrong on our end. Please try again or email support@pxispace.com.");
      }
    } catch {
      setStatus('error');
      setErrorMsg("Something went wrong on our end. Please try again or email support@pxispace.com.");
    }
  };

  return (
    <div className="pricing-v2 landing-v2 bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-emerald-400/[0.06] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto max-w-[1200px] px-6">
          <MotionH1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="display-1 mt-6 max-w-4xl"
          >
            Free to host.{' '}
            <span className="inline-flex rounded-2xl border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-amber-100 shadow-[0_0_32px_rgba(251,191,36,0.12)]">
              $0.99
            </span>{' '}
            per paid ticket.
          </MotionH1>
          <MotionP
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="body-lead mt-8 max-w-2xl"
          >
            PXI is a free tool and free events cost nothing. On paid tickets a flat{' '}
            <strong>$0.99</strong> comes out of your payout, and buyers pay a{' '}
            <strong>5.49%</strong> service fee plus card processing at checkout. No monthly fees,
            no subscriptions, no setup cost — your revenue goes straight to your own Stripe
            account.
          </MotionP>
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href={CREATE_HREF} className="glow-cta px-8 py-4 text-sm">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={DEMO_HREF} className="pill-ghost px-8 py-4 text-sm font-semibold">
              Book a meeting
            </Link>
          </MotionDiv>
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
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-8 md:p-12">
          <div className="flex items-start gap-4">
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-amber-300" />
            <div>
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
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-300" />
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
            <Link href={DEMO_HREF} className="glow-cta mt-8 inline-flex px-8 py-4 text-sm">
              Book a meeting <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Contact form — posts to Formspree */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8">
            {status === 'success' ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="mt-4 text-base font-semibold text-white">
                  Message sent — we'll get back to you within a day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Name
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
                    placeholder="Your name"
                  />
                </label>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
                    placeholder="you@email.com"
                  />
                </label>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Message
                  <textarea
                    name="message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-300/50"
                    placeholder="Tell us about your events"
                  />
                </label>
                {status === 'error' ? <p className="mt-4 text-sm text-red-400">{errorMsg}</p> : null}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="glow-cta mt-6 w-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
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
