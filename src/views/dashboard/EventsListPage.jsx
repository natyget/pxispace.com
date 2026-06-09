'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  ArrowRight02Icon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  ClockIcon,
  Delete02Icon,
  HelpCircleIcon,
  ImageAdd02Icon,
  Location01Icon,
  Message01Icon,
  PencilIcon,
  Search01Icon,
  Ticket01Icon,
  UserAdd01Icon,
  UserCircleIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ActionMenu from '@/components/dashboard/ActionMenu';
import CreateEventSlideOver from '@/components/dashboard/CreateEventSlideOver';
import GlowCard from '@/components/dashboard/GlowCard';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import Modal from '@/components/ui/Modal';
import { useAttendedEvents, useEvents } from '@/lib/dashboardStore';
import { eventsService } from '@/services/events';
import { HELP_REQUEST_STATUSES, HELP_REQUEST_TYPES, helpRequestsService } from '@/services/helpRequests';

const PINNED_LIVE_EVENTS_KEY = 'pxi_pinned_live_events_v1';
const TYPE_LABELS = Object.fromEntries(HELP_REQUEST_TYPES.map((item) => [item.value, item.label]));
const STATUS_LABELS = Object.fromEntries(HELP_REQUEST_STATUSES.map((item) => [item.value, item.label]));
const SORT_OPTIONS = [
  { value: 'live-first', label: 'Live first' },
  { value: 'soonest', label: 'Soonest' },
  { value: 'latest', label: 'Latest' },
  { value: 'name', label: 'Name' },
];
const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', options);
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
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

function startsIn(value, now) {
  if (!value) return 'Starting soon';
  const ms = new Date(value).getTime() - now;
  if (ms <= 0) return 'Starting soon';
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  return `Starts in ${hours}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
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

function sortEvents(items, sort, pinnedLiveIds, now) {
  const pinnedSet = new Set(pinnedLiveIds.map(String));
  return [...items].sort((a, b) => {
    const aSection = classifyEvent(a, now);
    const bSection = classifyEvent(b, now);
    const aRank = aSection === 'live' ? (pinnedSet.has(String(a.id)) ? 0 : 1) : aSection === 'upcoming' ? 2 : 3;
    const bRank = bSection === 'live' ? (pinnedSet.has(String(b.id)) ? 0 : 1) : bSection === 'upcoming' ? 2 : 3;
    if (aRank !== bRank) return aRank - bRank;
    if (sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
    if (sort === 'latest') return eventTime(b) - eventTime(a);
    return eventTime(a) - eventTime(b);
  });
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="flex min-h-[42px] items-center gap-2 rounded-xl bg-white/[0.04] px-3 text-sm text-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      <HugeiconsIcon icon={Search01Icon} size={15} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
    </label>
  );
}

function SelectControl({ ariaLabel, value, onChange, options }) {
  return (
    <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[42px] min-w-[132px] rounded-xl bg-white/[0.04] px-3 text-sm font-semibold text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      {options.map((option) => <option key={option.value} value={option.value} className="bg-zinc-950 text-white">{option.label}</option>)}
    </select>
  );
}

function EventControls({ query, onQueryChange, status, onStatusChange, sort, onSortChange }) {
  return (
    <GlowCard className="p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchBox value={query} onChange={onQueryChange} placeholder="Search events" />
        <div className="flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none">
          <SelectControl ariaLabel="Filter events" value={status} onChange={onStatusChange} options={STATUS_FILTERS} />
          <SelectControl ariaLabel="Sort events" value={sort} onChange={onSortChange} options={SORT_OPTIONS} />
        </div>
      </div>
    </GlowCard>
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <GlowCard className="p-12 text-center">
      <HugeiconsIcon icon={icon} className="mx-auto mb-4 text-zinc-600" size={48} />
      <p className="font-semibold text-zinc-300">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{body}</p>
      {action}
    </GlowCard>
  );
}

function menuIcon(icon) {
  return <HugeiconsIcon icon={icon} size={15} />;
}

function EventCard({ event, relation, now, pinned, requestCount = 0, onOpen, onNavigate, onDelete, onTogglePin }) {
  const cover = coverImage(event);
  const section = classifyEvent(event, now);
  const isLive = section === 'live';
  const isPast = section === 'past';
  const eventId = event.id;
  const attendees = event._count?.tickets != null ? `${event._count.tickets} attendees` : null;
  const isHosted = relation === 'hosted';
  const keyDetail = isHosted ? (attendees || event.location || event.venue || 'Organizer view') : (event.attendeeStatus || 'Ticketed');
  const base = isLive
    ? pinned
      ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_24px_70px_rgba(0,0,0,0.65)]'
      : 'shadow-[0_0_0_1px_rgba(74,222,128,0.28),0_0_34px_rgba(74,222,128,0.12)]'
    : isPast
      ? 'opacity-80 grayscale-[45%] shadow-[0_0_0_1px_rgba(255,255,255,0.035)] transition-all duration-500 hover:opacity-100 hover:grayscale-0'
      : 'shadow-[0_0_0_1px_rgba(255,255,255,0.055)] transition-all duration-500 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_45px_rgba(0,0,0,0.6)]';
  const menuItems = isHosted
    ? [
        { id: 'details', label: 'Details', onSelect: () => onOpen(event), icon: menuIcon(Calendar01Icon) },
        !isPast && { id: 'invite', label: 'Invite', onSelect: () => onNavigate(`/dashboard/events/${eventId}/invite#event-invite`), icon: menuIcon(UserAdd01Icon) },
        { id: 'members', label: 'Members', onSelect: () => onNavigate(`/dashboard/events/${eventId}/members`), icon: menuIcon(UserCircleIcon) },
        { id: 'upload', label: 'Upload', onSelect: () => onNavigate(`/dashboard/events/${eventId}/upload`), icon: menuIcon(ImageAdd02Icon) },
        isLive && { id: 'pin', label: pinned ? 'Unpin live' : 'Pin live', onSelect: () => onTogglePin(eventId), icon: menuIcon(CheckmarkCircle02Icon) },
        !isPast && { id: 'edit', label: 'Edit', onSelect: () => onNavigate(`/dashboard/events/${eventId}/edit`), icon: menuIcon(PencilIcon) },
        { id: 'delete', label: 'Delete', onSelect: () => onDelete(eventId, event.name), icon: menuIcon(Delete02Icon), tone: 'danger' },
      ].filter(Boolean)
    : [
        { id: 'details', label: 'Details', onSelect: () => onOpen(event), icon: menuIcon(Calendar01Icon) },
        { id: 'public', label: 'Public event page', onSelect: () => onNavigate(`/events/${eventId}`), icon: menuIcon(ArrowRight02Icon) },
      ];

  return (
    <article className={`group relative aspect-[3/4] overflow-hidden rounded-[24px] bg-[#0A0A0A] ${base}`}>
      <button type="button" onClick={() => onOpen(event)} className="absolute inset-0 z-0 block w-full text-left" aria-label={`Open ${event.name || 'event'} details`}>
        {cover ? (
          <Image src={cover} alt={event.name || 'Event cover'} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
            <HugeiconsIcon icon={isHosted ? Calendar01Icon : Ticket01Icon} className="text-zinc-600" size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
        <div
          className="absolute inset-x-0 bottom-0 h-[68%]"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.78) 36%, rgba(0,0,0,0.28) 68%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div className="absolute left-4 top-4 flex max-w-[calc(100%-5.5rem)] flex-wrap items-start gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${isLive ? 'bg-emerald-400/18 text-emerald-200 shadow-[0_0_18px_rgba(74,222,128,0.22)]' : isPast ? 'bg-black/40 text-white/65' : 'bg-black/40 text-white/80'}`}>
            {isLive ? 'Live' : isPast ? 'Past' : startsIn(event.startDate, now)}
          </span>
          {pinned ? <span className="rounded-full bg-white/[0.14] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">Pinned</span> : null}
          {requestCount > 0 ? <span className="rounded-full bg-white/[0.14] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">{requestCount} request{requestCount === 1 ? '' : 's'}</span> : null}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <h3 className="mb-3 line-clamp-2 text-[26px] font-[900] leading-none tracking-tighter text-white md:text-[28px]">{event.name || 'Untitled event'}</h3>
          <div className="space-y-2 text-[13px] font-medium text-white/72">
            <div className="flex min-w-0 items-center"><HugeiconsIcon icon={ClockIcon} className="mr-2.5 h-4 w-4 shrink-0 opacity-55" /> <span className="truncate">{formatDate(event.startDate)}</span></div>
            <div className="flex min-w-0 items-center capitalize"><HugeiconsIcon icon={isHosted && attendees ? UserGroupIcon : Location01Icon} className="mr-2.5 h-4 w-4 shrink-0 opacity-55" /> <span className="truncate">{keyDetail}</span></div>
          </div>
        </div>
      </button>
      <div className="absolute right-4 top-4 z-20" onClick={(clickEvent) => clickEvent.stopPropagation()}>
        <ActionMenu items={menuItems} ariaLabel={`${event.name || 'Event'} actions`} />
      </div>
    </article>
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
    <Modal open={!!event} onClose={onClose} title={event.name || 'Hosted event'} description="Organizer detail view" maxWidth="max-w-2xl">
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
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
            <div className="dashboard-surface-b rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Status</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">{isLive ? 'Live' : isPast ? 'Past' : 'Upcoming'}{pinned ? ' / pinned' : ''}</p>
            </div>
            <div className="dashboard-surface-b rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Date</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(event.startDate)}</p>
            </div>
            <div className="dashboard-surface-b rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Location</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{event.location || event.venue || 'Location TBD'}</p>
            </div>
            <div className="dashboard-surface-b rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Attendance</p>
              <p className="mt-1 text-sm font-semibold text-white">{attendees}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(`/dashboard/events/${event.id}`)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-white/[0.12] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.16]">
              Manage event <HugeiconsIcon icon={ArrowRight02Icon} size={15} />
            </button>
            {!isPast ? <button type="button" onClick={() => go(`/dashboard/events/${event.id}/invite#event-invite`)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"><HugeiconsIcon icon={UserAdd01Icon} size={16} />Invite</button> : null}
            <button type="button" onClick={() => go(`/dashboard/events/${event.id}/members`)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"><HugeiconsIcon icon={UserCircleIcon} size={16} />Members</button>
            {isLive ? <button type="button" onClick={() => onTogglePin(event.id)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 text-sm font-bold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />{pinned ? 'Unpin' : 'Pin live'}</button> : null}
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
        <label className="block text-xs font-bold uppercase tracking-widest text-white/45">Request type</label>
        <select value={type} onChange={(inputEvent) => setType(inputEvent.target.value)} className="min-h-[44px] w-full rounded-xl bg-white/[0.04] px-3 text-sm font-semibold text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          {HELP_REQUEST_TYPES.map((item) => <option key={item.value} value={item.value} className="bg-zinc-950 text-white">{item.label}</option>)}
        </select>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/45">Subject</label>
        <input value={subject} onChange={(inputEvent) => setSubject(inputEvent.target.value)} className="min-h-[44px] w-full rounded-xl bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
        <label className="block text-xs font-bold uppercase tracking-widest text-white/45">Details</label>
        <textarea value={message} onChange={(inputEvent) => setMessage(inputEvent.target.value)} rows={5} className="w-full resize-none rounded-xl bg-white/[0.04] px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white">Cancel</button>
          <button type="submit" disabled={!canSubmit || submitting} className="rounded-xl bg-white/[0.9] px-4 py-2.5 text-sm font-black text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45">{submitting ? 'Submitting...' : 'Submit request'}</button>
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
          <div className="rounded-2xl bg-white/[0.035] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.055)]">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Ticket</p><p className="mt-1 text-sm font-semibold text-white">{event.ticketId ? `#${String(event.ticketId).slice(-8)}` : 'Ticketed'}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Date</p><p className="mt-1 text-sm font-semibold text-white">{formatDate(event.startDate)}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Odyssey XP</p><p className="mt-1 text-sm font-semibold text-white">{Number(event.xp || 0).toLocaleString()}</p></div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-zinc-400"><HugeiconsIcon icon={Location01Icon} size={16} className="mt-0.5 shrink-0 text-white/35" />{event.location || event.venue || 'Location'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => openHelp('refund', 'Refund request')} className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.09] px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.13]"><HugeiconsIcon icon={Ticket01Icon} size={17} />Refund request</button>
            <button type="button" onClick={() => openHelp('contact-organizer', 'Contact organizer')} className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white"><HugeiconsIcon icon={Message01Icon} size={17} />Contact organizer</button>
            <button type="button" onClick={() => openHelp('other', 'Help request')} className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.04] px-4 text-sm font-bold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"><HugeiconsIcon icon={HelpCircleIcon} size={17} />Help request</button>
          </div>
          <div className="rounded-2xl bg-white/[0.025] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.045)]">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Your help requests</h3>
            {requests.length ? (
              <div className="mt-4 space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-black/20 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.045)]">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-bold text-white">{request.subject}</p><p className="mt-1 text-xs text-zinc-500">{TYPE_LABELS[request.type] || request.type} • {formatDateTime(request.createdAt)}</p></div>
                      <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/70">{STATUS_LABELS[request.status] || request.status}</span>
                    </div>
                    {request.message ? <p className="mt-3 text-sm leading-relaxed text-zinc-400">{request.message}</p> : null}
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-zinc-500">No help requests for this event yet.</p>}
          </div>
        </div>
      </Modal>
      <SubmitHelpRequestModal open={!!helpDraft} event={event} initialType={helpDraft?.type} title={helpDraft?.title} onClose={() => setHelpDraft(null)} onSubmit={async (payload) => { await onSubmitHelp(payload); setHelpDraft(null); }} />
    </>
  );
}

export default function EventsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { events: cachedEvents, loading, error: loadError, invalidate } = useEvents({ limit: 100, offset: 0 });
  const { events: attendedEvents, loading: attendedLoading, error: attendedError, invalidate: invalidateAttended } = useAttendedEvents({ limit: 100, offset: 0 });
  const [mode, setMode] = useState('hosted');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deletedEventIds, setDeletedEventIds] = useState([]);
  const [hostedFilter, setHostedFilter] = useState('all');
  const [attendedFilter, setAttendedFilter] = useState('all');
  const [hostedSort, setHostedSort] = useState('live-first');
  const [attendedSort, setAttendedSort] = useState('live-first');
  const [hostedQuery, setHostedQuery] = useState('');
  const [attendedQuery, setAttendedQuery] = useState('');
  const [pinnedLiveIds, setPinnedLiveIds] = useState([]);
  const [selectedHostedEvent, setSelectedHostedEvent] = useState(null);
  const [selectedAttendedEvent, setSelectedAttendedEvent] = useState(null);
  const [myHelpRequests, setMyHelpRequests] = useState([]);
  const now = useMemo(() => Math.floor(new Date().getTime() / 60_000) * 60_000, []);
  const hostedEvents = useMemo(() => cachedEvents.filter((event) => !deletedEventIds.includes(String(event.id))), [cachedEvents, deletedEventIds]);

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
    if (!user?.id) {
      setMyHelpRequests([]);
      return;
    }
    const mine = await helpRequestsService.listMyHelpRequests({ userId: user.id });
    setMyHelpRequests(mine);
  }, [user?.id]);

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
    return sortEvents(filtered, hostedSort, pinnedLiveIds, now);
  }, [hostedEvents, hostedFilter, hostedQuery, hostedSort, now, pinnedLiveIds]);

  const filteredAttendedEvents = useMemo(() => {
    const filtered = attendedEvents.filter((event) => {
      const section = classifyEvent(event, now);
      return (attendedFilter === 'all' || attendedFilter === section) && matchesEvent(event, attendedQuery);
    });
    return sortEvents(filtered, attendedSort, [], now);
  }, [attendedEvents, attendedFilter, attendedQuery, attendedSort, now]);

  const myRequestCountByEventId = useMemo(() => myHelpRequests.reduce((acc, request) => {
    acc[request.eventId] = (acc[request.eventId] || 0) + 1;
    return acc;
  }, {}), [myHelpRequests]);
  const selectedEventRequests = useMemo(() => selectedAttendedEvent ? myHelpRequests.filter((request) => request.eventId === String(selectedAttendedEvent.id)) : [], [myHelpRequests, selectedAttendedEvent]);

  const submitHelpRequest = async (payload) => {
    await helpRequestsService.createHelpRequest(payload);
    await refreshHelpRequests();
    toast.success('Help request submitted.');
  };

  if (loading && hostedEvents.length === 0) {
    return <div className="mx-auto max-w-6xl"><h1 className="mb-6 text-2xl font-black tracking-tight text-white">My Events</h1><div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-pxi-purple border-t-transparent" /></div></div>;
  }
  if (loadError) {
    return <div className="mx-auto max-w-6xl"><h1 className="mb-6 text-2xl font-black tracking-tight text-white">My Events</h1><div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">{loadError.message || 'Failed to load events'}</div></div>;
  }

  return (
    <>
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <GlowCard className="w-full max-w-sm overflow-hidden">
            <div className="flex flex-col items-center gap-4 px-6 pb-4 pt-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10"><HugeiconsIcon icon={Delete02Icon} size={24} className="text-red-400" /></div>
              <div><h3 className="text-lg font-bold text-white">Delete event?</h3><p className="mt-1.5 text-sm leading-relaxed text-zinc-400"><span className="font-semibold text-white">"{deleteTarget.name || 'This event'}"</span> will be permanently deleted. This action cannot be undone.</p></div>
            </div>
            <div className="mt-2 flex gap-3 px-6 pb-6">
              <button type="button" onClick={() => setDeleteTarget(null)} className="min-h-[44px] flex-1 rounded-xl text-sm font-semibold text-zinc-200 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition-colors hover:bg-white/5">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={!!deletingEventId} className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/90 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50">{deletingEventId ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}Delete</button>
            </div>
          </GlowCard>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div><h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">My Events</h1></div>
          <button type="button" onClick={() => setCreateOpen(true)} aria-label="Create event" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-white/[0.12]"><HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2.5} /></button>
        </div>

        <div className="flex justify-center">
          <SegmentedToggle
            value={mode}
            onChange={setMode}
            ariaLabel="Switch event list"
            items={[
              { value: 'hosted', label: 'Hosted' },
              { value: 'attended', label: 'Attended' },
            ]}
          />
        </div>

        {mode === 'hosted' ? (
          <div className="space-y-8">
            <EventControls query={hostedQuery} onQueryChange={setHostedQuery} status={hostedFilter} onStatusChange={setHostedFilter} sort={hostedSort} onSortChange={setHostedSort} />
            {hostedEvents.length === 0 ? (
              <EmptyState icon={Calendar01Icon} title="No hosted events yet" body="Create your first event." action={<button type="button" onClick={() => setCreateOpen(true)} className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-white/[0.12]" aria-label="Create event"><HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2.5} /></button>} />
            ) : filteredHostedEvents.length === 0 ? (
              <EmptyState icon={Search01Icon} title="No hosted events match your filters" body="Try clearing the search or changing the event status filter." />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredHostedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    relation="hosted"
                    now={now}
                    pinned={pinnedLiveIds.includes(String(event.id))}
                    onOpen={setSelectedHostedEvent}
                    onNavigate={(href) => router.push(href)}
                    onDelete={(id, name) => setDeleteTarget({ id, name })}
                    onTogglePin={togglePinnedLiveEvent}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <EventControls query={attendedQuery} onQueryChange={setAttendedQuery} status={attendedFilter} onStatusChange={setAttendedFilter} sort={attendedSort} onSortChange={setAttendedSort} />
            {attendedError ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">{attendedError.message || 'Failed to load attended events'}</div>
              : attendedLoading ? <GlowCard className="p-10 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent" /><p className="mt-4 text-sm text-zinc-500">Loading attended events...</p></GlowCard>
                : attendedEvents.length === 0 ? <EmptyState icon={Ticket01Icon} title="No attended events yet" body="Your tickets will appear here." action={<button type="button" onClick={() => invalidateAttended()} className="mt-6 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.08] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-white/[0.12]"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />Refresh</button>} />
                  : filteredAttendedEvents.length === 0 ? <EmptyState icon={Search01Icon} title="No attended events match your filters" body="Try clearing the search or changing the event status filter." />
                    : <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredAttendedEvents.map((event) => <EventCard key={`${event.id}-${event.ticketId || 'ticket'}`} event={event} relation="attended" now={now} requestCount={myRequestCountByEventId[String(event.id)] || 0} onOpen={setSelectedAttendedEvent} onNavigate={(href) => router.push(href)} />)}</div>}
          </div>
        )}
      </div>

      <CreateEventSlideOver open={createOpen} onClose={() => setCreateOpen(false)} />
      <HostedEventModal event={selectedHostedEvent} now={now} pinned={selectedHostedEvent ? pinnedLiveIds.includes(String(selectedHostedEvent.id)) : false} onClose={() => setSelectedHostedEvent(null)} onNavigate={(href) => router.push(href)} onTogglePin={togglePinnedLiveEvent} />
      <ParticipantEventModal event={selectedAttendedEvent} requests={selectedEventRequests} onClose={() => setSelectedAttendedEvent(null)} onSubmitHelp={submitHelpRequest} />
    </>
  );
}