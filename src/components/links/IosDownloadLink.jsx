'use client';

import Link from 'next/link';

/**
 * iOS download CTA: internal path uses Next Link (no new tab); absolute URL opens in new tab.
 */
export default function IosDownloadLink({
  href,
  children,
  className,
  'aria-label': ariaLabel,
  ...rest
}) {
  const isInternal = typeof href === 'string' && href.startsWith('/');

  if (isInternal) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </a>
  );
}
