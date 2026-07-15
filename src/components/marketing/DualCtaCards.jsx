'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Two full-height photo CTA cards side by side — posh's closing "Host / Find"
 * beat. Each card: darkened background photo, eyebrow, big label, one line,
 * a primary link. Hover scales the image and reveals a purple hairline top.
 *
 * @param {{eyebrow, title, sub, image, href, ghostHref?, ghostLabel?, primaryLabel}[]} cards
 */
export default function DualCtaCards({ cards = [], className = '' }) {
  return (
    <div className={['grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6', className].filter(Boolean).join(' ')}>
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="group relative min-h-[420px] overflow-hidden rounded-3xl border border-white/10 md:min-h-[520px]"
        >
          <Link href={card.href} className="absolute inset-0 z-20" aria-label={card.primaryLabel} />
          {/* background image */}
          <img
            src={card.image}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
          {/* purple hairline top, reveals on hover */}
          <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-pxi-purple to-pxi-orange transition-transform duration-500 group-hover:scale-x-100" />

          <div className="relative z-10 flex h-full flex-col justify-end p-7 md:p-10">
            <h3 className="display-3 text-white">{card.title}</h3>
            {card.sub ? <p className="mt-3 max-w-sm text-base text-zinc-300">{card.sub}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <span className="glow-cta pointer-events-none px-6 py-3 text-sm">
                {card.primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </span>
              {card.ghostHref ? (
                <Link
                  href={card.ghostHref}
                  className="relative z-30 text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
                >
                  {card.ghostLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
