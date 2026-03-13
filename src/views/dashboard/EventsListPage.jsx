'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Users, Image } from 'lucide-react';
import { eventsService } from '../../services/events';

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    eventsService
      .getMyEvents()
      .then((res) => setEvents(res.events || []))
      .catch((err) => setError(err.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-white tracking-tight mb-6">My Events</h1>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-pxi-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-white tracking-tight mb-6">My Events</h1>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          My Events
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage events and staff (BOUNCER) for gatekeeping and moderation.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center">
          <Calendar className="mx-auto text-zinc-600 mb-4" size={48} />
          <p className="text-zinc-400 font-medium">No events yet</p>
          <p className="text-zinc-500 text-sm mt-1">
            Create events from the PXI mobile app to see them here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/events/${event.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-zinc-900/50 hover:border-pxi-purple/30 hover:bg-zinc-900/80 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                  {event.coverImage ? (
                    <img
                      src={event.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <Calendar size={24} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate">{event.name}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                    <span>{formatDate(event.startDate)}</span>
                    {event._count?.tickets != null && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {event._count.tickets} tickets
                      </span>
                    )}
                    {event.mediaCount != null && event.mediaCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Image size={12} />
                        {event.mediaCount} media
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-zinc-500 flex-shrink-0" size={20} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
