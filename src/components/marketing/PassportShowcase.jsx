'use client';

import React from 'react';
import { PxiPassportCard } from '@/components/passport/PxiPassportCard';
import ScrubReveal from '@/components/motion/ScrubReveal';

/**
 * The real dashboard passport card rendered with a showcase profile:
 * a Diplomat (host) passport with a mix of everyday attendee stamps and
 * the rare, expensive host stamps.
 */
const SHOWCASE_USER = {
  id: 'MAYA426L',
  name: 'Maya Laurent',
  username: 'maya.lrnt',
  city: 'Brooklyn',
  bio: 'Rooftops, film cameras, front row.',
  instagramHandle: 'maya.lrnt',
  age: 21,
  isVendor: true, // Diplomat passport
  isPassportIssued: true,
  odysseyXp: 18450, // Luminary tier
  avatarUrl: '/landing/assets/maya_profile_new.jpg',
  createdAt: '2024-09-14T00:00:00.000Z',
};

// More stamps gives the shared farthest-point placement algorithm
// (src/utils/stampLayout.js) more points to spread across the passport area.
// MAX_VISIBLE_PASSPORT_STAMPS caps rendering at 14 — sitting right at that
// cap gives the spread algorithm the most points it can ever use, filling
// the area as densely as the real feature allows. All still 2026 (single
// year, no extra year-row) — just a full season.
const SHOWCASE_EVENTS = [
  { id: 'st-1', name: 'AFRODISIAC', location: 'Boston, MA', startDate: '2026-05-16', ticketPriceUsd: 30, albumRole: 'MEMBER' },
  { id: 'st-2', name: 'MAISON BLANCHE', location: 'Manhattan, NY', startDate: '2026-02-21', ticketPriceUsd: 140, albumRole: 'OWNER' },
  { id: 'st-3', name: 'CAMPUS CLOSING', location: 'Cambridge, MA', startDate: '2026-04-11', ticketPriceUsd: 0, albumRole: 'MEMBER' },
  { id: 'st-4', name: 'ROOFTOP CINÉ', location: 'Brooklyn, NY', startDate: '2026-06-05', ticketPriceUsd: 65, albumRole: 'ADMIN' },
  { id: 'st-5', name: 'SOUNDS OF EAST', location: 'Brooklyn, NY', startDate: '2026-01-24', ticketPriceUsd: 20, albumRole: 'MEMBER' },
  { id: 'st-6', name: 'GALA NOIR', location: 'Manhattan, NY', startDate: '2026-03-14', ticketPriceUsd: 220, albumRole: 'OWNER' },
  { id: 'st-7', name: 'RUN CLUB 5AM', location: 'Somerville, MA', startDate: '2026-06-21', ticketPriceUsd: 0, albumRole: 'MEMBER' },
  { id: 'st-8', name: 'WAREHOUSE 12', location: 'Brooklyn, NY', startDate: '2026-01-09', ticketPriceUsd: 45, albumRole: 'MEMBER' },
  { id: 'st-9', name: 'SUNSET TERRACE', location: 'Queens, NY', startDate: '2026-07-12', ticketPriceUsd: 0, albumRole: 'MEMBER' },
  { id: 'st-10', name: 'VELVET HOUR', location: 'Boston, MA', startDate: '2026-08-08', ticketPriceUsd: 95, albumRole: 'ADMIN' },
  { id: 'st-11', name: 'LOFT SESSIONS', location: 'Bushwick, NY', startDate: '2026-03-28', ticketPriceUsd: 15, albumRole: 'MEMBER' },
  { id: 'st-12', name: 'DIPLOMAT GALA', location: 'Back Bay, MA', startDate: '2026-09-19', ticketPriceUsd: 180, albumRole: 'OWNER' },
  { id: 'st-13', name: 'BASEMENT EDITS', location: 'Brooklyn, NY', startDate: '2026-10-03', ticketPriceUsd: 25, albumRole: 'MEMBER' },
  { id: 'st-14', name: 'NEW YEAR EVE', location: 'Manhattan, NY', startDate: '2026-12-31', ticketPriceUsd: 300, albumRole: 'OWNER' },
];

export default function PassportShowcase({ className = '' }) {
  return (
    <ScrubReveal
      distance={45}
      scaleStart={0.96}
      className={['flex w-full items-center justify-center', className].filter(Boolean).join(' ')}
      aria-label="Example PXI passport"
    >
      <PxiPassportCard user={SHOWCASE_USER} attendedEvents={SHOWCASE_EVENTS} animateStamps />
    </ScrubReveal>
  );
}
