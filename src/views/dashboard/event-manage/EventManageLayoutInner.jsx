'use client';

import Link from 'next/link';
import { useEventManage } from './EventManageContext';

export default function EventManageLayoutInner({ children }) {
  const { loading, error, event, eventId } = useEventManage();

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

  const title = event.name?.trim() || 'Untitled event';

  return (
    <>
      <header className="mb-6 pb-4 border-b border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Event</p>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
          {title}
        </h1>
      </header>
      {children}
    </>
  );
}
