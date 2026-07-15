'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionShell from '@/components/marketing/SectionShell';
import PassportShowcase from '@/components/marketing/PassportShowcase';

/** Chapter five: verified stamps build a passport. Hosting earns the rare ones. */
export default function ChapterPassport() {
  return (
    <SectionShell eyebrow="Keep the receipts" pad="default">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="display-2 mt-5">Proof you were there.</h2>
          <p className="body-lead mt-6 max-w-md">
            Every night you make it out earns a real stamp. Your passport becomes the catalogue of
            your whole scene.
          </p>
          <p className="mt-6 text-sm text-zinc-500">
            Hosting earns the rare ones. Maya has two.
          </p>
          <Link
            href="/features/digital-event-passport"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            How the passport works <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <PassportShowcase />
      </div>
    </SectionShell>
  );
}
