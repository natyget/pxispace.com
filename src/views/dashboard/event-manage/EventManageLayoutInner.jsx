'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { useEventManage } from './EventManageContext';

const TABS = [
  { label: 'Details',  segment: null },
  { label: 'Members',  segment: 'members' },
  { label: 'Gallery',  segment: 'upload' },
];

export default function EventManageLayoutInner({ children }) {
  const { loading, error, event, eventId } = useEventManage();
  const pathname = usePathname();

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-pxi-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event || !eventId) {
    return (
      <div>
        <p className="text-red-400">{error || 'Event not found'}</p>
        <Link href="/dashboard/events" className="text-pxi-purple mt-4 inline-block">
          ← Back to events
        </Link>
      </div>
    );
  }

  const base = `/dashboard/events/${eventId}`;

  const isActive = (segment) => {
    if (segment === null) return pathname === base;
    return pathname === `${base}/${segment}`;
  };

  const tabs = TABS;

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard/events"
            className="pill-ghost shrink-0 p-2 text-zinc-400 hover:text-white"
            aria-label="Back to events"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Event</p>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
              {event.name?.trim() || 'Untitled event'}
            </h1>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <div className="dashboard-segmented-toggle w-full">
            {tabs.map(({ label, segment }) => {
              const href = segment ? `${base}/${segment}` : base;
              const active = isActive(segment);
              return (
                <Link
                  key={label}
                  href={href}
                  className="dashboard-segmented-toggle__item flex-1"
                  data-active={active}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
