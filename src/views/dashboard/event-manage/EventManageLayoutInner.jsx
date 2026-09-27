'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { useEventManage } from './EventManageContext';
import { PxiSpinner } from '@/components/loading/PxiLoading';

const TABS = [
  { label: 'Details',  segment: null },
  { label: 'Members',  segment: 'members' },
  { label: 'Configuration', segment: 'upload' },
];

export default function EventManageLayoutInner({ children }) {
  const { loading, error, event, eventId, reloadEvent } = useEventManage();
  const pathname = usePathname();

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center py-16">
        <PxiSpinner size="md" />
      </div>
    );
  }

  if (error || !event || !eventId) {
    // WEB-2: three different problems used to read "Event not found" with one dead-end link.
    // A reader who was refused, a reader whose event was deleted, and a reader whose network
    // dropped each need a different next step — and the last one is usually fixed by trying
    // again, which the old copy never offered.
    const kind = error?.kind ?? 'missing';
    const message = error?.message ?? 'This event no longer exists.';
    return (
      <div className="max-w-lg">
        <p className="text-red-400">{message}</p>
        {kind === 'forbidden' ? (
          <p className="mt-2 text-sm text-white/50">
            Only the organizer and their co-hosts can manage an event. If you were just added as a
            co-host, sign out and back in to pick up the change.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {kind === 'unavailable' ? (
            <button
              type="button"
              onClick={() => reloadEvent()}
              className="text-sm font-semibold text-white hover:text-white/80"
            >
              Try again
            </button>
          ) : null}
          <Link href="/dashboard/events" className="text-sm font-semibold text-white/60 hover:text-white">
            Back to events
          </Link>
        </div>
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
            <p className="text-[10px] font-bold tracking-[0.02em] text-zinc-500 mb-0.5">Event</p>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-normal leading-tight truncate">
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
