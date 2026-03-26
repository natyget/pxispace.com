'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Book, Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';
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
    return date.toLocaleDateString('en-US', { dateStyle: 'medium' });
  };

  const getRenderableCover = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')
      ? trimmed
      : null;
  };

  const classifyEvent = (event) => {
    const now = Date.now();
    const start = event?.startDate ? new Date(event.startDate).getTime() : null;
    const end = event?.endDate ? new Date(event.endDate).getTime() : null;
    const status = String(event?.status || '').toLowerCase();

    if (status === 'live') return 'live';
    if (status === 'ended' || status === 'past' || status === 'completed') return 'past';
    if (status === 'upcoming' || status === 'scheduled' || status === 'draft') return 'upcoming';

    if (start && end) {
      if (start <= now && now <= end) return 'live';
      if (now > end) return 'past';
      return 'upcoming';
    }
    if (start) return start <= now ? 'past' : 'upcoming';
    return 'upcoming';
  };

  const formatStartsIn = (d) => {
    if (!d) return 'Starting soon';
    const ms = new Date(d).getTime() - Date.now();
    if (ms <= 0) return 'Starting soon';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days >= 1) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    const remMins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `Starts in ${hours}h ${remMins}m`;
  };

  const liveEvents = events.filter((e) => classifyEvent(e) === 'live');
  const upcomingEvents = events.filter((e) => classifyEvent(e) === 'upcoming');
  const pastEvents = events.filter((e) => classifyEvent(e) === 'past');

  const EventCard = ({ event, section, delay = 0 }) => {
    const cover = getRenderableCover(event.coverImage);
    const isLive = section === 'live';
    const isPast = section === 'past';
    const attendees = event._count?.tickets != null ? `${event._count.tickets} attendees` : null;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <Link
          href={`/dashboard/events/${event.id}`}
          className={`relative block cursor-pointer group rounded-[24px] overflow-hidden aspect-[3/4] bg-[#0A0A0A] ${
            isLive
              ? 'border border-white/10 ring-2 ring-[#4ade80]/50 ring-offset-4 ring-offset-black'
              : isPast
                ? 'border border-white/5 opacity-70 grayscale-[50%] hover:opacity-100 hover:grayscale-0 hover:border-white/20 transition-all duration-500'
                : 'border border-white/10 hover:border-white/30 transition-colors'
          }`}
        >
          {cover ? (
            <Image
              src={cover}
              alt={event.name || 'Event cover'}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <Calendar className="text-zinc-600" size={40} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

          <div className="absolute top-5 right-5">
            {isLive ? (
              <span className="status-pill status-active animate-pulse">Live</span>
            ) : isPast ? (
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Book className="w-4 h-4 text-white/70" />
              </span>
            ) : (
              <span className="status-pill bg-white/10 text-white border border-white/20">
                {formatStartsIn(event.startDate)}
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
            <h3 className={`text-[28px] font-[900] tracking-tighter mb-3 leading-none ${isPast ? 'text-white/90' : 'text-white'}`}>
              {event.name || 'Untitled event'}
            </h3>
            <div className={`space-y-2 text-[13px] font-medium ${isPast ? 'text-white/50' : 'text-white/70'}`}>
              <div className="flex items-center"><Clock className="w-4 h-4 mr-2.5 opacity-50" /> {formatDate(event.startDate)}</div>
              <div className="flex items-center"><MapPin className="w-4 h-4 mr-2.5 opacity-50" /> {event.location || event.venue || 'Venue TBD'}</div>
              {attendees && (
                <div className={`flex items-center ${isLive ? 'text-[#4ade80] font-bold' : ''}`}>
                  <Users className="w-4 h-4 mr-2.5 opacity-80" /> {attendees}
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-white tracking-tight mb-6">My Events</h1>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-pxi-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-white tracking-tight mb-6">My Events</h1>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">My Events</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your live, upcoming, and past events.</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pxi-purple text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shrink-0 ml-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center">
          <Calendar className="mx-auto text-zinc-600 mb-4" size={48} />
          <p className="text-zinc-400 font-medium">No events yet</p>
          <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">
            Create an event on the web or in the PXI mobile app.
          </p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center justify-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-pxi-purple text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create event
          </Link>
        </div>
      ) : (
        <>
          {!!liveEvents.length && (
            <section className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#4ade80]">Live Now</h2>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                {liveEvents.map((event, i) => <EventCard key={event.id} event={event} section="live" delay={i * 0.1} />)}
              </div>
            </section>
          )}

          {!!upcomingEvents.length && (
            <section className="space-y-6">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-white/40">Upcoming</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                {upcomingEvents.map((event, i) => <EventCard key={event.id} event={event} section="upcoming" delay={i * 0.1 + 0.2} />)}
              </div>
            </section>
          )}

          {!!pastEvents.length && (
            <section className="space-y-6">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-white/40">Past / Scrapbook</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                {pastEvents.map((event, i) => <EventCard key={event.id} event={event} section="past" delay={i * 0.1 + 0.4} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
