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
  city: 'Montréal',
  bio: 'Rooftops, film cameras, front row.',
  instagramHandle: 'maya.lrnt',
  age: 21,
  isVendor: true, // Diplomat passport
  isPassportIssued: true,
  odysseyXp: 18450, // Luminary tier
  avatarUrl: '/landing/assets/maya_profile_new.jpg',
  createdAt: '2024-09-14T00:00:00.000Z',
};

const SHOWCASE_EVENTS = [
  { id: 'st-1', name: 'AFRODISIAC', location: 'Boston, MA', startDate: '2026-05-16', ticketPriceUsd: 30, albumRole: 'MEMBER' },
  { id: 'st-2', name: 'MAISON BLANCHE', location: 'Montréal, QC', startDate: '2026-02-21', ticketPriceUsd: 140, albumRole: 'OWNER' },
  { id: 'st-3', name: 'CAMPUS CLOSING', location: 'Montréal, QC', startDate: '2026-04-11', ticketPriceUsd: 0, albumRole: 'MEMBER' },
  { id: 'st-4', name: 'ROOFTOP CINÉ', location: 'Montréal, QC', startDate: '2026-06-05', ticketPriceUsd: 65, albumRole: 'ADMIN' },
  { id: 'st-5', name: 'SOUNDS OF EAST', location: 'Brooklyn, NY', startDate: '2026-01-24', ticketPriceUsd: 20, albumRole: 'MEMBER' },
  { id: 'st-6', name: 'GALA NOIR', location: 'Montréal, QC', startDate: '2026-03-14', ticketPriceUsd: 220, albumRole: 'OWNER' },
  { id: 'st-7', name: 'RUN CLUB 5AM', location: 'Montréal, QC', startDate: '2026-06-21', ticketPriceUsd: 0, albumRole: 'MEMBER' },
];

export default function PassportShowcase({ className = '' }) {
  return (
    <ScrubReveal
      distance={45}
      scaleStart={0.96}
      className={['flex w-full items-center justify-center', className].filter(Boolean).join(' ')}
      aria-label="Example PXI passport"
    >
      <PxiPassportCard user={SHOWCASE_USER} attendedEvents={SHOWCASE_EVENTS} />
    </ScrubReveal>
  );
}
