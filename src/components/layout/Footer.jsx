'use client';

import React from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { InstagramIcon } from '@hugeicons/core-free-icons';
import { FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { openConsentPreferences } from '@/lib/consent';
import { SOCIAL_PROFILES } from '@/lib/seo/social';

const LogoSVG = '/logo-mark.png';
const linkClass = 'text-zinc-500 hover:text-white transition-colors';

const ATTENDEE_LINKS = [
  { label: 'Shared Gallery', href: '/features/shared-event-photo-gallery' },
  { label: 'Digital Passport', href: '/features/digital-event-passport' },
  { label: 'Share to Instagram', href: '/features/instagram-event-sharing' },
  { label: 'Find Events', href: '/events' },
];

const ORGANIZER_LINKS = [
  { label: 'Ticketing in Your Brand', href: '/features/branded-event-ticketing' },
  { label: 'Promoter Analytics', href: '/features/event-promoter-analytics' },
  { label: 'PXI vs Everyone', href: '/competitors/partiful-luma-alternative' },
  { label: 'Pricing', href: '/pricing' },
];

const EXPLORE_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Platform', href: '/platform' },
  { label: 'Story', href: '/editorial' },
  { label: 'About Us', href: '/about' },
];

const CONNECT_LINKS = [
  { label: 'FAQ & Support', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Book a meeting', href: '/book' },
  { label: 'Legal', href: '/legal' },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-black pt-20 pb-12">
      {/* oversized ghost watermark */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[18%] select-none text-[22vw] font-black leading-none tracking-tighter text-white/[0.03]"
        aria-hidden
      >
        PXI
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 border-t border-white/[0.08] pt-14 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <img src={LogoSVG} alt="PXI" className="h-8 w-auto object-contain" />
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-zinc-500">
              Tickets, one shared camera roll, and the morning-after scrapbook. Never lose the night.
            </p>
            <AppStoreCtaPair variant="row" className="max-w-[280px]" />
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white">Explore</h4>
            <ul className="space-y-3 text-sm">
              {EXPLORE_LINKS.map((l) =>
                l.external ? (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Product (was Attendees) */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white">Product</h4>
            <ul className="space-y-3 text-sm">
              {ATTENDEE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform (was Organizers) */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white">Platform</h4>
            <ul className="space-y-3 text-sm">
              {ORGANIZER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect / Legal */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white">Connect</h4>
            <ul className="space-y-3 text-sm">
              {CONNECT_LINKS.map((l) =>
                l.external ? (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                )
              )}
              {/* Withdrawing consent has to be as easy as giving it (GDPR
                  Art. 7(3)), and this is also where a US visitor opts out of
                  ad personalisation. Renders in every region. */}
              <li>
                <button type="button" onClick={openConsentPreferences} className={`${linkClass} cursor-pointer text-left`}>
                  Cookie settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-sm text-zinc-600 md:flex-row">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} PXI App. All rights reserved.
          </p>
          {/* Driven by SOCIAL_PROFILES so these can never drift from the `sameAs` in the
              Organization JSON-LD. They carry no utm_* — a click out to our own profile is
              not a campaign, and tagging it would spawn junk sources in GA4. */}
          <div className="flex shrink-0 gap-4">
            {SOCIAL_PROFILES.map(({ key, label, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer me"
                className="text-zinc-600 transition-colors hover:text-white"
                aria-label={`PXI on ${label}`}
                data-social={key}
              >
                {key === 'instagram' ? (
                  <HugeiconsIcon icon={InstagramIcon} size={20} />
                ) : key === 'tiktok' ? (
                  <FaTiktok size={20} />
                ) : key === 'x' ? (
                  <FaXTwitter size={20} />
                ) : (
                  <FaYoutube size={20} />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
