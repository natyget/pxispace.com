'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import UiChip from './UiChip';

/**
 * Feature row: bold caption + a short sentence on one side, a visual on the
 * other. Pass `chip` for a DOM mockup, `chipSrc` for an image, or `phone`
 * for a full uncropped app screenshot rendered inside a device frame.
 * Optional `href`/`linkLabel` adds a deep-dive link under the copy.
 */
export default function FeatureRow({
  title,
  body,
  chipSrc,
  chipAlt = '',
  chipAspect = '4/3',
  chip,
  phone,
  href,
  linkLabel = 'Read more',
  reverse = false,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={[
        'grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-12',
        reverse ? 'md:[&>*:first-child]:order-2' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="max-w-md">
        <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h3>
        {body ? <p className="mt-3 text-base leading-relaxed text-zinc-400">{body}</p> : null}
        {href ? (
          <Link
            href={href}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pxi-purple transition-colors hover:text-white"
          >
            {linkLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div>
        {phone ? (
          <div className="flex justify-center">{phone}</div>
        ) : (
          <UiChip src={chipSrc} alt={chipAlt} aspect={chipAspect}>
            {chip}
          </UiChip>
        )}
      </div>
    </motion.div>
  );
}
