'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { PXI_TESTFLIGHT_JOIN_URL } from '@/lib/appStoreLinks';

const EASE = [0.16, 1, 0.3, 1];

export default function IosBetaLanding() {
  return (
    <div className="landing-v2 bg-black text-white">
      <section className="relative overflow-hidden pt-32 pb-28 md:pt-40 md:pb-40">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[55vh] w-[80vw] max-w-[900px] -translate-x-1/2 rounded-full bg-pxi-purple/[0.08] blur-[160px]"
          aria-hidden
        />
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="display-1 mt-6 max-w-3xl"
          >
            Get PXI <span className="text-pxi-purple">early.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="body-lead mt-8 max-w-xl"
          >
            New builds land here first. Grab the app and be in the room before everyone else.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mt-10 w-full"
          >
            <AppStoreCtaPair className="justify-center" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="mt-8 max-w-md text-sm leading-relaxed text-zinc-500"
          >
            On iPhone, early builds install through Apple&apos;s free TestFlight app.{' '}
            <a
              href={PXI_TESTFLIGHT_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-white underline-offset-4 hover:underline"
            >
              Join the TestFlight beta <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </motion.p>
        </div>
      </section>
    </div>
  );
}
