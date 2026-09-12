'use client';

import Link from 'next/link';
import { PXI_GET_APP_HREF } from '@/lib/appStoreLinks';

/**
 * App download CTA: internal path uses Next Link (no new tab); absolute URL opens in new tab.
 *
 * PXI_GET_APP_HREF is the exception. It looks internal but is a route handler
 * that 302s to a store, so it needs a real document navigation — a client-side
 * Link would ask the router for an RSC payload and get a redirect it cannot use.
 */
export default function IosDownloadLink({
  href,
  children,
  className,
  'aria-label': ariaLabel,
  ...rest
}) {
  const isStoreRedirect = href === PXI_GET_APP_HREF;
  const isInternal = typeof href === 'string' && href.startsWith('/') && !isStoreRedirect;

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
      {...(isStoreRedirect ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      className={className}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </a>
  );
}
