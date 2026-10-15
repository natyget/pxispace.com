'use client';

import { PxiPassportSection } from '@/components/passport/PxiPassportSection';

/**
 * The owner's passport at the foot of their page: the same card /u/<id> draws for a member, without its own "PXI
 * Passport" heading (the page has its own section title and its one h1 is the name).
 */
export default function OrganizerPassport({ user }) {
  return <PxiPassportSection user={user} friendsCount={user?.friendsCount ?? 0} eventsMode="public" showHeader={false} />;
}
