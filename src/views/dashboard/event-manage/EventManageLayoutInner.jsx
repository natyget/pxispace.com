'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useEventManage } from './EventManageContext';

const TABS = [
  { label: 'Details',  segment: null },
  { label: 'Invite',   segment: 'invite' },
  { label: 'Members',  segment: 'members' },
  { label: 'Upload',   segment: 'upload' },
  { label: 'Edit',     segment: 'edit' },
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

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard/events"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 shrink-0"
            aria-label="Back to events"
          >
            <ChevronLeft size={22} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Event</p>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
              {event.name?.trim() || 'Untitled event'}
            </h1>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-white/5 rounded-full p-2 w-full">
            {TABS.map(({ label, segment }) => {
              const href = segment ? `${base}/${segment}` : base;
              const active = isActive(segment);
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex-1 text-center px-4 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                    active
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
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
