'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight02Icon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  HelpCircleIcon,
  Location01Icon,
  Message01Icon,
  PencilIcon,
  Search01Icon,
  Ticket01Icon,
  UserAdd01Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ActionMenu from '@/components/dashboard/ActionMenu';
import CreateEventSlideOver from '@/components/dashboard/CreateEventSlideOver';
import { PxiSpinner } from '@/components/loading/PxiLoading';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { Button, EmptyState, Notice, PageHeader, Skeleton, StateText, WordTabs } from '@/components/dashboard/ui/kit';
import Modal from '@/components/ui/Modal';
import { canHostEvents } from '@/lib/accountTier';
import { useAttendedEvents, useEvents } from '@/lib/dashboardStore';
import { count, dayDate, shortDate } from '@/lib/dashFormat';
import { eventsService } from '@/services/events';
import { HELP_REQUEST_STATUSES, HELP_REQUEST_TYPES, helpRequestsService } from '@/services/helpRequests';

const PINNED_LIVE_EVENTS_KEY = 'pxi_pinned_live_events_v1';
const TYPE_LABELS = Object.fromEntries(HELP_REQUEST_TYPES.map((item) => [item.value, item.label]));
const STATUS_LABELS = Object.fromEntries(HELP_REQUEST_STATUSES.map((item) => [item.value, item.label]));
const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live now' },
  { value: 'upcoming', label: 'Coming up' },
  { value: 'past', label: 'Past' },
];
const MODE_TABS = [
  { key: 'hosted', label: 'Hosted' },
  { key: 'attended', label: 'Attended' },
];
// The order a person acts in: what is happening now, what is next, then what is done.
const SECTIONS = [
  { key: 'live', title: 'Live now', tone: 'text-emerald-300' },
  { key: 'upcoming', title: 'Coming up', tone: 'text-white' },
  { key: 'past', title: 'Past', tone: 'text-white/60' },
];
const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
const FIELD = 'h-9 w-full rounded-2xl bg-pxi-field text-[14px] text-white outline-none transition placeholder:text-white/35 focus:shadow-[0_0_0_1.5px_#a523ef]';

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-US', options);
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function classifyEvent(event, now) {
  const start = event?.startDate ? new Date(event.startDate).getTime() : null;
  const end = event?.endDate ? new Date(event.endDate).getTime() : null;
  const status = String(event?.status || '').toLowerCase();
  if (status === 'live') return 'live';
  if (['ended', 'past', 'completed'].includes(status)) return 'past';
  if (['upcoming', 'scheduled', 'draft'].includes(status)) return 'upcoming';
  if (start && end) {
    if (start <= now && now <= end) return 'live';
    return now > end ? 'past' : 'upcoming';
  }
  if (start) return start <= now ? 'past' : 'upcoming';
  return 'upcoming';
}

function coverImage(event) {
  const value = typeof event?.coverImage === 'string' ? event.coverImage.trim() : '';
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/') ? value : null;
}

function matchesEvent(event, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [event?.name, event?.location, event?.venue].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
}

function eventTime(event) {
  const time = new Date(event?.startDate || 0).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function sortEvents(items, pinnedLiveIds, now) {
  const pinnedSet = new Set(pinnedLiveIds.map(String));
  return [...items].sort((a, b) => {
    const aSection = classifyEvent(a, now);
    const bSection = classifyEvent(b, now);
    const aRank = aSection === 'live' ? 0 : pinnedSet.has(String(a.id)) ? 1 : aSection === 'upcoming' ? 2 : 3;
    const bRank = bSection === 'live' ? 0 : pinnedSet.has(String(b.id)) ? 1 : bSection === 'upcoming' ? 2 : 3;
    if (aRank !== bRank) return aRank - bRank;
    if (aSection === 'past' && bSection === 'past') return eventTime(b) - eventTime(a);
    return eventTime(a) - eventTime(b);
  });
}

function timeLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "Fri, Oct 16, 10:00 PM" for a night still to come, "Aug 28" for one that is done. */
function whenLabel(event, section) {
  if (!event?.startDate) return 'Date to be set';
  if (section === 'past') return shortDate(event.startDate);
  const time = timeLabel(event.startDate);
  return time ? `${dayDate(event.startDate)}, ${time}` : dayDate(event.startDate);
}

/** What sold so far, from the numbers the list already loaded. The room size only matters before the night is over. */
function soldFigures(event, section) {
  const sold = event?._count?.tickets;
  if (sold == null) return null;
  const capacity = Number(event?.capacity) > 0 ? Number(event.capacity) : null;
  const shown = section === 'past' ? null : capacity;
  return {
    sold: Number(sold),
    capacity: shown,
    pct: shown ? Math.min(100, Math.round((Number(sold) / shown) * 100)) : 0,
    verb: String(event?.ticketType || '').toUpperCase() === 'FREE' ? 'going' : 'sold',
  };
}

function SearchField({ value, onChange, placeholder, className = '' }) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <HugeiconsIcon icon={Search01Icon} size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className={`${FIELD} pl-10 pr-4`} />
    </label>
  );
}

function FilterSelect({ ariaLabel, value, onChange, options, className = '' }) {
  return (
    <label className={`relative block ${className}`}>
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className={`${FIELD} appearance-none pl-4 pr-9 font-semibold`}>
        {options.map((option) => <option key={option.value} value={option.value} className="bg-[#1c1c1c]">{option.label}</option>)}
      </select>
      <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50" />
    </label>
  );
}

function menuIcon(icon) {
  return <HugeiconsIcon icon={icon} size={15} />;
}

function Cover({ src, alt, hosted }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[16/9] bg-pxi-surface sm:aspect-[4/3]">
      {src && !failed ? (
        <Image src={src} alt={alt} fill unoptimized sizes="(min-width: 1280px) 300px, (min-width: 640px) 33vw, 100vw" className="object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <HugeiconsIcon icon={hosted ? Calendar01Icon : Ticket01Icon} size={28} className="text-zinc-600" />
        </div>
      )}
    </div>
  );
}

function EventTile({ event, relation, section, pinned, requestCount = 0, onOpen, onNavigate, onDelete, onTogglePin }) {
  const isLive = section === 'live';
  const isPast = section === 'past';
  const isHosted = relation === 'hosted';
  const eventId = event.id;
  const cover = coverImage(event);
  const place = event.location || event.venue || '';
  const figures = isHosted ? soldFigures(event, section) : null;
  const marks = [
    !isLive && pinned ? <StateText key="pinned" tone="purple">Pinned</StateText> : null,
    requestCount > 0 ? <StateText key="requests" tone="purple">{requestCount} {requestCount === 1 ? 'request' : 'requests'}</StateText> : null,
  ].filter(Boolean);
  const menuItems = isHosted
    ? [
        !isLive && { id: 'pin', label: pinned ? 'Unpin' : 'Pin', onSelect: () => onTogglePin(eventId), icon: menuIcon(CheckmarkCircle02Icon) },
        { id: 'manage', label: 'Manage event', onSelect: () => onNavigate(`/dashboard/events/${eventId}`), icon: menuIcon(ArrowRight02Icon) },
        !isPast && { id: 'edit', label: 'Edit', onSelect: () => onNavigate(`/dashboard/events/${eventId}/edit`), icon: menuIcon(PencilIcon) },
        { id: 'delete', label: 'Delete', onSelect: () => onDelete(eventId, event.name), icon: menuIcon(Delete02Icon), tone: 'danger' },
      ].filter(Boolean)
    : [
        { id: 'details', label: 'Details', onSelect: () => onOpen(event), icon: menuIcon(Calendar01Icon) },
        { id: 'public', label: 'Public event page', onSelect: () => onNavigate(`/events/${eventId}`), icon: menuIcon(ArrowRight02Icon) },
      ];

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.25rem] bg-pxi-field transition hover:bg-[#3a3a3a] ${isLive ? 'ring-1 ring-emerald-400/40' : ''} ${
        isPast ? 'opacity-70 hover:opacity-100' : ''
      }`}
    >
      <button type="button" onClick={() => onOpen(event)} className="block w-full text-left" aria-label={`Open ${event.name || 'event'} details`}>
        <Cover key={cover || 'none'} src={cover} alt={event.name || 'Event cover'} hosted={isHosted} />
        <div className="p-4">
          {marks.length ? <p className="mb-1.5 flex gap-3">{marks}</p> : null}
          <h3 className="truncate text-[15px] font-semibold text-white">{event.name || 'Untitled event'}</h3>
          <p className="mt-1 truncate text-[12px] text-white/45">{whenLabel(event, section)}</p>
          {place ? (
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-white/45">
              <HugeiconsIcon icon={Location01Icon} size={12} className="shrink-0" />
              <span className="truncate">{place}</span>
            </p>
          ) : null}
          {figures ? (
            <div className="mt-3">
              <p className="text-[13px] font-semibold text-white">
                {count(figures.sold)} {figures.verb}
                {figures.capacity ? <span className="font-normal text-white/45"> of {count(figures.capacity)}</span> : null}
              </p>
              {figures.capacity ? (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#A523EF]" style={{ width: `${figures.pct}%` }} />
                </div>
              ) : null}
            </div>
          ) : null}
          {!isHosted ? <p className="mt-3 text-[13px] font-semibold capitalize text-white/70">{event.attendeeStatus || 'Ticketed'}</p> : null}
        </div>
      </button>
      <div className="absolute right-3 top-3 z-20">
        <ActionMenu items={menuItems} ariaLabel={`${event.name || 'Event'} actions`} />
      </div>
    </article>
  );
}

/** Live now, Coming up, Past: each its own grid under a small title. Sections with nothing in them stay out. */
function EventSections({ events, now, relation, pinnedIds = [], requestCounts = {}, onOpen, onNavigate, onDelete, onTogglePin }) {
  const groups = SECTIONS.map((section) => ({ ...section, items: events.filter((event) => classifyEvent(event, now) === section.key) })).filter((group) => group.items.length);
  return (
    <div className="space-y-5 md:space-y-6">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className={`mb-3 text-[15px] font-semibold ${group.tone}`}>
            {group.title}
            <span className="ml-2 text-[12px] font-semibold text-white/35">{group.items.length}</span>
          </h2>
          <div className={GRID}>
            {group.items.map((event) => (
              <EventTile
                key={relation === 'attended' ? `${event.id}-${event.ticketId || 'ticket'}` : event.id}
                event={event}
                relation={relation}
                section={group.key}
                pinned={pinnedIds.includes(String(event.id))}
                requestCount={requestCounts[String(event.id)] || 0}
                onOpen={onOpen}
                onNavigate={onNavigate}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HostedEventModal({ event, now, pinned, onClose, onNavigate, onTogglePin }) {
  if (!event) return null;
  const cover = coverImage(event);
  const section = classifyEvent(event, now);
  const isLive = section === 'live';
  const isPast = section === 'past';
  const attendees = event._count?.tickets != null ? `${event._count.tickets} attendees` : 'Attendee data pending';
  const go = (href) => {
    onClose();
    onNavigate(href);
  };

  return (
    <Modal open={!!event} onClose={onClose} title={event.name || 'Hosted event'} maxWidth="max-w-2xl">
      <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-pxi-field">
          {cover ? (
            <Image src={cover} alt={event.name || 'Event cover'} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <HugeiconsIcon icon={Calendar01Icon} className="text-zinc-600" size={38} />
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.42) 52%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-field rounded-2xl p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Status</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">{isLive ? 'Live' : isPast ? 'Past' : pinned ? 'Pinned' : 'Upcoming'}</p>
            </div>
            <div className="glass-field rounded-2xl p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Date</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(event.startDate)}</p>
            </div>
            <div className="glass-field rounded-2xl p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Location</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{event.location || event.venue || 'Location TBD'}</p>
            </div>
            <div className="glass-field rounded-2xl p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Attendance</p>
              <p className="mt-1 text-sm font-semibold text-white">{attendees}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(`/dashboard/events/${event.id}`)} className="pill-solid inline-flex min-h-[42px] items-center justify-center gap-2 px-4 text-sm">
              Manage event <HugeiconsIcon icon={ArrowRight02Icon} size={15} />
            </button>
            {!isPast ? <button type="button" onClick={() => go(`/dashboard/events/${event.id}/invite#event-invite`)} className="pill-ghost inline-flex min-h-[42px] items-center justify-center gap-2 px-4 text-sm font-bold"><HugeiconsIcon icon={UserAdd01Icon} size={16} />Invite</button> : null}
            <button type="button" onClick={() => go(`/dashboard/events/${event.id}/members`)} className="pill-ghost inline-flex min-h-[42px] items-center justify-center gap-2 px-4 text-sm font-bold"><HugeiconsIcon icon={UserCircleIcon} size={16} />Members</button>
            {!isLive ? <button type="button" onClick={() => onTogglePin(event.id)} className="pill-ghost inline-flex min-h-[42px] items-center justify-center gap-2 px-4 text-sm font-bold"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />{pinned ? 'Unpin' : 'Pin'}</button> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SubmitHelpRequestModal({ open, event, initialType = 'other', title = 'Help request', onClose, onSubmit }) {
  const { user } = useAuth();
  const [type, setType] = useState(initialType);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setSubject('');
    setMessage('');
  }, [initialType, open]);

  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 8;

  return (
    <Modal open={open} onClose={onClose} title={title} description={event?.name || undefined} className="max-w-xl">
      <form
        className="space-y-4"
        onSubmit={async (submitEvent) => {
          submitEvent.preventDefault();
          if (!canSubmit || submitting) return;
          setSubmitting(true);
          try {
            await onSubmit({
              eventId: event.id,
              eventName: event.name,
              ticketId: event.ticketId,
              requesterId: user?.id,
              requesterName: user?.name || user?.username || 'PXI attendee',
              requesterEmail: user?.email || '',
              type,
              subject: subject.trim(),
              message: message.trim(),
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <label className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Request type</label>
        <select value={type} onChange={(inputEvent) => setType(inputEvent.target.value)} className="glass-field min-h-[44px] w-full rounded-2xl px-3 text-sm font-semibold text-white outline-none">
          {HELP_REQUEST_TYPES.map((item) => <option key={item.value} value={item.value} className="bg-zinc-950 text-white">{item.label}</option>)}
        </select>
        <label className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Subject</label>
        <input value={subject} onChange={(inputEvent) => setSubject(inputEvent.target.value)} className="glass-field min-h-[44px] w-full rounded-2xl px-3 text-sm text-white outline-none placeholder:text-white/30" />
        <label className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Details</label>
        <textarea value={message} onChange={(inputEvent) => setMessage(inputEvent.target.value)} rows={5} className="glass-field w-full resize-none rounded-2xl px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/30" />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="pill-cancel px-5 py-2.5 text-[13px]">Cancel</button>
          <button type="submit" disabled={!canSubmit || submitting} className="pill-solid px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45">{submitting ? 'Submitting...' : 'Submit request'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ParticipantEventModal({ event, requests, onClose, onSubmitHelp }) {
  const [helpDraft, setHelpDraft] = useState(null);
  useEffect(() => {
    if (!event) setHelpDraft(null);
  }, [event]);
  if (!event) return null;
  const openHelp = (type, title) => setHelpDraft({ type, title });

  return (
    <>
      <Modal open={!!event} onClose={onClose} title={event.name || 'Attended event'} className="max-w-2xl">
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Ticket</p><p className="mt-1 text-sm font-semibold text-white">{event.ticketId ? `#${String(event.ticketId).slice(-8)}` : 'Ticketed'}</p></div>
              <div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Date</p><p className="mt-1 text-sm font-semibold text-white">{formatDate(event.startDate)}</p></div>
              <div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Odyssey XP</p><p className="mt-1 text-sm font-semibold text-white">{Number(event.xp || 0).toLocaleString()}</p></div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-[#9a9a9a]"><HugeiconsIcon icon={Location01Icon} size={16} className="mt-0.5 shrink-0 text-white opacity-35" />{event.location || event.venue || 'Location'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => openHelp('refund', 'Refund request')} className="pill-solid inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap px-4 text-sm"><HugeiconsIcon icon={Ticket01Icon} size={17} />Refund request</button>
            <button type="button" onClick={() => openHelp('contact-organizer', 'Contact organizer')} className="pill-ghost inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap px-4 text-sm font-bold"><HugeiconsIcon icon={Message01Icon} size={17} />Contact organizer</button>
            <button type="button" onClick={() => openHelp('other', 'Help request')} className="pill-ghost inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap px-4 text-sm font-bold"><HugeiconsIcon icon={HelpCircleIcon} size={17} />Help request</button>
          </div>
          <div className="glass-panel rounded-3xl p-5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">Your help requests</h3>
            {requests.length ? (
              <div className="mt-4 space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="glass-field rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-bold text-white">{request.subject}</p><p className="mt-1 text-xs text-[#9a9a9a]">{TYPE_LABELS[request.type] || request.type}, {formatDateTime(request.createdAt)}</p></div>
                      <span className="rounded-full glow-chip px-2.5 py-1 text-[10px] font-bold tracking-[0.02em] text-white/70">{STATUS_LABELS[request.status] || request.status}</span>
                    </div>
                    {request.message ? <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">{request.message}</p> : null}
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-[#9a9a9a]">No help requests for this event yet.</p>}
          </div>
        </div>
      </Modal>
      <SubmitHelpRequestModal open={!!helpDraft} event={event} initialType={helpDraft?.type} title={helpDraft?.title} onClose={() => setHelpDraft(null)} onSubmit={async (payload) => { await onSubmitHelp(payload); setHelpDraft(null); }} />
    </>
  );
}


function GridSkeleton() {
  return (
    <div className={GRID}>
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-[300px]" />
      ))}
    </div>
  );
}

export default function EventsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { events: cachedEvents, loading, error: loadError, invalidate, refresh: refreshHostedEvents } = useEvents({ limit: 100, offset: 0 });
  const { events: attendedEvents, loading: attendedLoading, error: attendedError, invalidate: invalidateAttended } = useAttendedEvents({ limit: 100, offset: 0 });
  const [mode, setMode] = useState('hosted');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deletedEventIds, setDeletedEventIds] = useState([]);
  const [hostedFilter, setHostedFilter] = useState('all');
  const [attendedFilter, setAttendedFilter] = useState('all');
  const [hostedQuery, setHostedQuery] = useState('');
  const [attendedQuery, setAttendedQuery] = useState('');
  const [pinnedLiveIds, setPinnedLiveIds] = useState([]);
  const [selectedHostedEvent, setSelectedHostedEvent] = useState(null);
  const [selectedAttendedEvent, setSelectedAttendedEvent] = useState(null);
  const [myHelpRequests, setMyHelpRequests] = useState([]);
  const now = useMemo(() => Math.floor(new Date().getTime() / 60_000) * 60_000, []);
  const hostedEvents = useMemo(() => cachedEvents.filter((event) => !deletedEventIds.includes(String(event.id))), [cachedEvents, deletedEventIds]);
  const canHost = canHostEvents(user);
  const createAction = useMemo(
    () => (canHost ? (
      <button type="button" onClick={() => setCreateOpen(true)} className="pill-ghost inline-flex min-h-[42px] items-center gap-2 px-5 text-sm font-bold">
        <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.5} />
        Create event
      </button>
    ) : null),
    [canHost]
  );
  usePageAction(createAction);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(PINNED_LIVE_EVENTS_KEY) || '[]');
      if (Array.isArray(parsed)) setPinnedLiveIds(parsed.map(String));
    } catch {
      setPinnedLiveIds([]);
    }
  }, []);

  const refreshHelpRequests = useCallback(async () => {
    if (!userId) {
      setMyHelpRequests([]);
      return;
    }
    const mine = await helpRequestsService.listMyHelpRequests({ userId });
    setMyHelpRequests(mine);
  }, [userId]);

  useEffect(() => {
    refreshHelpRequests();
  }, [refreshHelpRequests]);

  const persistPinnedLiveIds = useCallback((nextIds) => {
    setPinnedLiveIds(nextIds);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PINNED_LIVE_EVENTS_KEY, JSON.stringify(nextIds));
    } catch {
      /* local preference only */
    }
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeletingEventId(id);
    setDeleteTarget(null);
    try {
      await eventsService.deleteEvent(id);
      setDeletedEventIds((prev) => [...prev, String(id)]);
      invalidate();
      toast.success(`"${name || 'Event'}" deleted.`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete event.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const togglePinnedLiveEvent = (eventId) => {
    const id = String(eventId);
    persistPinnedLiveIds(pinnedLiveIds.includes(id) ? pinnedLiveIds.filter((current) => current !== id) : [id, ...pinnedLiveIds]);
  };

  const filteredHostedEvents = useMemo(() => {
    const filtered = hostedEvents.filter((event) => {
      const section = classifyEvent(event, now);
      return (hostedFilter === 'all' || hostedFilter === section) && matchesEvent(event, hostedQuery);
    });
    return sortEvents(filtered, pinnedLiveIds, now);
  }, [hostedEvents, hostedFilter, hostedQuery, now, pinnedLiveIds]);

  const filteredAttendedEvents = useMemo(() => {
    const filtered = attendedEvents.filter((event) => {
      const section = classifyEvent(event, now);
      return (attendedFilter === 'all' || attendedFilter === section) && matchesEvent(event, attendedQuery);
    });
    return sortEvents(filtered, [], now);
  }, [attendedEvents, attendedFilter, attendedQuery, now]);

  const myRequestCountByEventId = useMemo(() => myHelpRequests.reduce((acc, request) => {
    acc[request.eventId] = (acc[request.eventId] || 0) + 1;
    return acc;
  }, {}), [myHelpRequests]);
  const selectedEventRequests = useMemo(() => selectedAttendedEvent ? myHelpRequests.filter((request) => request.eventId === String(selectedAttendedEvent.id)) : [], [myHelpRequests, selectedAttendedEvent]);

  const hosted = mode === 'hosted';
  const listForMode = hosted ? hostedEvents : attendedEvents;
  const sectionCounts = useMemo(() => {
    const totals = { live: 0, upcoming: 0, past: 0 };
    listForMode.forEach((event) => {
      totals[classifyEvent(event, now)] += 1;
    });
    return totals;
  }, [listForMode, now]);
  // What is sold for the nights still to come: paid nights count tickets sold, free nights count people going.
  const comingUpSales = useMemo(() => {
    const upcoming = hostedEvents.filter((event) => classifyEvent(event, now) === 'upcoming');
    const isFree = (event) => String(event?.ticketType || '').toUpperCase() === 'FREE';
    const paid = upcoming.filter((event) => !isFree(event));
    const counted = paid.length ? paid : upcoming;
    return {
      label: paid.length || !upcoming.length ? 'Sold' : 'Going',
      total: counted.reduce((sum, event) => sum + Number(event?._count?.tickets || 0), 0),
    };
  }, [hostedEvents, now]);
  const showKpis = hosted ? !(loading && hostedEvents.length === 0) && !(loadError && hostedEvents.length === 0) : !attendedLoading && !attendedError;
  const kpis = showKpis
    ? [
        { label: 'Live now', value: count(sectionCounts.live), tone: sectionCounts.live ? 'good' : undefined },
        { label: 'Coming up', value: count(sectionCounts.upcoming) },
        hosted
          ? { label: comingUpSales.label, value: count(comingUpSales.total), hint: 'coming up' }
          : { label: 'Past', value: count(sectionCounts.past) },
        { label: hosted ? 'Hosted' : 'Attended', value: count(listForMode.length) },
      ]
    : null;

  const query = hosted ? hostedQuery : attendedQuery;
  const setQuery = hosted ? setHostedQuery : setAttendedQuery;
  const status = hosted ? hostedFilter : attendedFilter;
  const setStatus = hosted ? setHostedFilter : setAttendedFilter;

  const submitHelpRequest = async (payload) => {
    await helpRequestsService.createHelpRequest(payload);
    await refreshHelpRequests();
    toast.success('Help request submitted.');
  };

  const sectionProps = { now, onOpen: hosted ? setSelectedHostedEvent : setSelectedAttendedEvent, onNavigate: (href) => router.push(href) };
  let body;
  if (hosted) {
    if (loading && hostedEvents.length === 0) {
      body = <GridSkeleton />;
    } else if (loadError && hostedEvents.length === 0) {
      body = (
        <div className="flex flex-wrap items-center gap-3">
          <Notice tone="error" className="min-w-0 flex-1">We could not reach your events. Try again in a moment.</Notice>
          <Button onClick={() => refreshHostedEvents({ force: true })}>Refresh</Button>
        </div>
      );
    } else if (hostedEvents.length === 0) {
      body = (
        <EmptyState
          title="No events yet"
          line={canHost ? 'Create your first night.' : 'Hosting needs a passport.'}
          action={canHost ? <Button variant="primary" onClick={() => setCreateOpen(true)}>Create event</Button> : null}
        />
      );
    } else if (filteredHostedEvents.length === 0) {
      body = <EmptyState title="Nothing matches" line="Try another search or filter." />;
    } else {
      body = (
        <EventSections
          {...sectionProps}
          relation="hosted"
          events={filteredHostedEvents}
          pinnedIds={pinnedLiveIds}
          onDelete={(id, name) => setDeleteTarget({ id, name })}
          onTogglePin={togglePinnedLiveEvent}
        />
      );
    }
  } else if (attendedError) {
    body = <Notice tone="error">{attendedError.message || 'Failed to load attended events'}</Notice>;
  } else if (attendedLoading) {
    body = <GridSkeleton />;
  } else if (attendedEvents.length === 0) {
    body = <EmptyState title="No tickets yet" line="Events you go to show up here." action={<Button onClick={() => invalidateAttended()}>Refresh</Button>} />;
  } else if (filteredAttendedEvents.length === 0) {
    body = <EmptyState title="Nothing matches" line="Try another search or filter." />;
  } else {
    body = <EventSections {...sectionProps} relation="attended" events={filteredAttendedEvents} requestCounts={myRequestCountByEventId} />;
  }

  return (
    <>
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteTarget(null)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-pxi-surface p-6" onClick={(clickEvent) => clickEvent.stopPropagation()}>
            <h3 className="text-[17px] font-semibold text-white">Delete event?</h3>
            <p className="mt-2 text-[14px] text-white/60">
              <span className="font-semibold text-white">{deleteTarget.name || 'This event'}</span> will be deleted for good.
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={!!deletingEventId}>
                {deletingEventId ? <PxiSpinner size="sm" className="mx-auto" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-5 md:space-y-6">
        <PageHeader title="Events" kpis={kpis} />

        <div className="space-y-3 md:flex md:items-end md:justify-between md:gap-6 md:space-y-0 md:border-b md:border-white/[0.08]">
          <WordTabs className="md:border-b-0!" items={MODE_TABS} value={mode} onChange={setMode} />
          {listForMode.length > 0 ? (
            <div className="flex items-center gap-2 md:pb-1.5">
              <SearchField value={query} onChange={setQuery} placeholder="Search events" className="flex-1 md:w-[260px] md:flex-none" />
              <FilterSelect ariaLabel="Filter events" value={status} onChange={setStatus} options={STATUS_FILTERS} className="w-[132px] shrink-0 md:w-[148px]" />
            </div>
          ) : null}
        </div>

        {body}
      </div>

      <CreateEventSlideOver open={createOpen} onClose={() => setCreateOpen(false)} />
      <HostedEventModal event={selectedHostedEvent} now={now} pinned={selectedHostedEvent ? pinnedLiveIds.includes(String(selectedHostedEvent.id)) : false} onClose={() => setSelectedHostedEvent(null)} onNavigate={(href) => router.push(href)} onTogglePin={togglePinnedLiveEvent} />
      <ParticipantEventModal event={selectedAttendedEvent} requests={selectedEventRequests} onClose={() => setSelectedAttendedEvent(null)} onSubmitHelp={submitHelpRequest} />
    </>
  );
}
