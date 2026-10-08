import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import UiChip from './UiChip';
import ScrubReveal from '../motion/ScrubReveal';

/**
 * Feature row: bold caption + a short sentence on one side, a visual on the
 * other. Pass `chip` for a DOM mockup, `chipSrc` for an image, or `phone`
 * for a full uncropped app screenshot rendered inside a device frame.
 * Optional `href`/`linkLabel` adds a deep-dive link under the copy. `chipBare` drops the glass frame around a `chip`
 * that is a set of dashboard cards already, and keeps the row to one column until 1280px: the dashboard's panels
 * switch layout on the width of the window, not of their box, so they need a column as wide as they are designed for.
 */
export default function FeatureRow({
  title,
  body,
  chipSrc,
  chipAlt = '',
  chipAspect = '4/3',
  chip,
  chipBare = false,
  phone,
  href,
  linkLabel = 'Read more',
  reverse = false,
  className = '',
}) {
  const twoColumns = chipBare && !phone ? 'xl:grid-cols-2 xl:gap-12' : 'md:grid-cols-2 md:gap-12';
  const swap = chipBare && !phone ? 'xl:[&>*:first-child]:order-2' : 'md:[&>*:first-child]:order-2';
  return (
    <ScrubReveal
      distance={40}
      className={[
        'grid grid-cols-1 items-center gap-6',
        twoColumns,
        reverse ? swap : '',
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
          <UiChip src={chipSrc} alt={chipAlt} aspect={chipAspect} bare={chipBare}>
            {chip}
          </UiChip>
        )}
      </div>
    </ScrubReveal>
  );
}
