'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Book,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  MoreHorizontal,
  Info,
  ImagePlus,
  UserCircle,
  UserPlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsService } from '../../services/events';

function DashboardEventCard({ event, section, delay = 0, menuOpen, onMenuToggle, onMenuClose, onDelete }) {
  const cover = (() => {
    const value = event.coverImage;
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')
      ? trimmed
      : null;
  })();

  const isLive = section === 'live';
  const isPast = section === 'past';
  const attendees = event._count?.tickets != null ? `${event._count.tickets} attendees` : null;
  const eventId = event.id;

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { dateStyle: 'medium' });
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

  const base =
    isLive
      ? 'border border-white/10 ring-2 ring-[#4ade80]/50 ring-offset-4 ring-offset-black'
      : isPast
        ? 'border border-white/5 opacity-70 grayscale-[50%] hover:opacity-100 hover:grayscale-0 hover:border-white/20 transition-all duration-500'
        : 'border border-white/10 hover:border-white/30 transition-colors';

  const menuItems = [
    { label: 'Details', href: `/dashboard/events/${eventId}`, icon: Info },
    !isPast && { label: 'Invite', href: `/dashboard/events/${eventId}/invite#event-invite`, icon: UserPlus },
    { label: 'Members', href: `/dashboard/events/${eventId}/members`, icon: UserCircle },
    { label: 'Upload', href: `/dashboard/events/${eventId}/upload`, icon: ImagePlus },
    !isPast && { label: 'Edit', href: `/dashboard/events/${eventId}/edit`, icon: Pencil },
    { label: 'Delete', onClick: () => onDelete?.(eventId, event.name), icon: Trash2, danger: true },
  ].filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className={`relative group rounded-[24px] overflow-hidden aspect-[3/4] bg-[#0A0A0A] ${base}`}>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="absolute inset-0 z-0"
          aria-label={`Open ${event.name || 'event'}`}
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
        </Link>

        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="absolute top-5 left-5 flex items-start gap-2">
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

          <div
            className="absolute top-5 right-5 pointer-events-auto"
            data-event-card-menu
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Event actions"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMenuToggle(eventId);
              }}
              className="w-9 h-9 rounded-full bg-black/50 border border-white/15 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/25 transition-colors"
            >
              <MoreHorizontal size={18} strokeWidth={2.25} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 min-w-[200px] rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-xl py-1 z-20"
              >
                {menuItems.map(({ label, href, onClick, icon: Icon, danger }) =>
                  href ? (
                    <Link
                      key={label}
                      href={href}
                      role="menuitem"
                      onClick={() => onMenuClose()}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                    >
                      <Icon size={16} className="text-pxi-purple shrink-0" />
                      {label}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      type="button"
                      role="menuitem"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMenuClose(); onClick?.(); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-200 hover:bg-white/10'}`}
                    >
                      <Icon size={16} className={`shrink-0 ${danger ? 'text-red-400' : 'text-pxi-purple'}`} />
                      {label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
            <h3
              className={`text-[28px] font-[900] tracking-tighter mb-3 leading-none ${isPast ? 'text-white/90' : 'text-white'}`}
            >
              {event.name || 'Untitled event'}
            </h3>
            <div className={`space-y-2 text-[13px] font-medium ${isPast ? 'text-white/50' : 'text-white/70'}`}>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2.5 opacity-50" /> {formatDate(event.startDate)}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2.5 opacity-50" /> {event.location || event.venue || 'Venue TBD'}
              </div>
              {attendees && (
                <div className={`flex items-center ${isLive ? 'text-[#4ade80] font-bold' : ''}`}>
                  <Users className="w-4 h-4 mr-2.5 opacity-80" /> {attendees}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuEventId, setOpenMenuEventId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    eventsService
      .getMyEvents()
      .then((res) => setEvents(res.events || []))
      .catch((err) => setError(err.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!openMenuEventId) return;
    const onDocDown = (e) => {
      const el = e.target;
      if (el instanceof Element && el.closest('[data-event-card-menu]')) return;
      setOpenMenuEventId(null);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [openMenuEventId]);

  const handleDeleteEvent = (eventId, eventName) => {
    setDeleteTarget({ id: eventId, name: eventName });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeletingEventId(id);
    setDeleteTarget(null);
    try {
      await eventsService.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success(`"${name || 'Event'}" deleted.`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete event.');
    } finally {
      setDeletingEventId(null);
    }
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

  const liveEvents = events.filter((e) => classifyEvent(e) === 'live');
  const upcomingEvents = events.filter((e) => classifyEvent(e) === 'upcoming');
  const pastEvents = events.filter((e) => classifyEvent(e) === 'past');

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
    <>
    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Delete event?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                <span className="text-white font-semibold">"{deleteTarget.name || 'This event'}"</span> will be permanently deleted. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 min-h-[44px] rounded-xl border border-white/10 text-sm font-semibold text-zinc-200 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!!deletingEventId}
              className="flex-1 min-h-[44px] rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deletingEventId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveEvents.map((event, i) => (
                  <DashboardEventCard
                    key={event.id}
                    event={event}
                    section="live"
                    delay={i * 0.1}
                    menuOpen={openMenuEventId === event.id}
                    onMenuToggle={(id) => setOpenMenuEventId((cur) => (cur === id ? null : id))}
                    onMenuClose={() => setOpenMenuEventId(null)}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            </section>
          )}

          {!!upcomingEvents.length && (
            <section className="space-y-6">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-white/40">Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, i) => (
                  <DashboardEventCard
                    key={event.id}
                    event={event}
                    section="upcoming"
                    delay={i * 0.1 + 0.2}
                    menuOpen={openMenuEventId === event.id}
                    onMenuToggle={(id) => setOpenMenuEventId((cur) => (cur === id ? null : id))}
                    onMenuClose={() => setOpenMenuEventId(null)}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            </section>
          )}

          {!!pastEvents.length && (
            <section className="space-y-6">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-white/40">Past / Scrapbook</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event, i) => (
                  <DashboardEventCard
                    key={event.id}
                    event={event}
                    section="past"
                    delay={i * 0.1 + 0.4}
                    menuOpen={openMenuEventId === event.id}
                    onMenuToggle={(id) => setOpenMenuEventId((cur) => (cur === id ? null : id))}
                    onMenuClose={() => setOpenMenuEventId(null)}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
    </>
  );
}
