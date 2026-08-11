'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, ShieldAlert, Scale } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';

const EASE = [0.16, 1, 0.3, 1];

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'General Support',
    body: 'Having trouble with your account, events, or tickets? We are here to help.',
    email: 'support@pxispace.com',
  },
  {
    icon: ShieldAlert,
    title: 'Trust & Safety',
    body: 'Report a safety concern, harassment, or violation of our community guidelines.',
    email: 'trust@pxispace.com',
  },
  {
    icon: Scale,
    title: 'Legal & Privacy',
    body: 'For privacy inquiries, law enforcement requests, or other legal matters.',
    email: 'legal@pxispace.com',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: EASE },
};

export default function ContactPage() {
  return (
    <div className="landing-v2 bg-black text-white min-h-screen">
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
            Get in <span className="text-pxi-purple">touch.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="body-lead mt-8 max-w-2xl text-white/60"
          >
            Whether you need help with your account, have a question, or want to report an issue, we're here for you. Reach out to the right team below.
          </motion.p>
        </div>
      </section>

      {/* Contact Methods */}
      <SectionShell borderTop={false} className="py-20 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            variants={fadeUp}
            initial="initial"
            whileInView="whileInView"
            className="grid gap-6 md:grid-cols-3"
          >
            {CONTACT_METHODS.map((method, i) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.title}
                  className="group relative flex flex-col rounded-3xl bg-white/[0.02] p-8 ring-1 ring-white/10 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pxi-purple/10 text-pxi-purple ring-1 ring-pxi-purple/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="heading-3 mb-3">{method.title}</h3>
                  <p className="body-base mb-8 flex-1 text-white/60">
                    {method.body}
                  </p>
                  <a
                    href={`mailto:${method.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Email {method.email} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </motion.div>
        </div>
      </SectionShell>
    </div>
  );
}
