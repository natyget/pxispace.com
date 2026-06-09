'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Alert02Icon,
  ArrowRight02Icon,
  BookIcon,
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
  Shield01Icon,
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
import Modal from '@/components/ui/Modal';
import { useAttendedEvents, useEvents } from '@/lib/dashboardStore';
import { eventsService } from '@/services/events';
import { HELP_REQUEST_STATUSES, HELP_REQUEST_TYPES, helpRequestsService } from '@/services/helpRequests';

const PINNED_LIVE_EVENTS_KEY = 'pxi_pinned_live_events_v1';
const TYPE_LABELS = Object.fromEntries(HELP_REQUEST_TYPES.map((item) => [item.value, item.label]));
const STATUS_LABELS = Object.fromEntries(HELP_REQUEST_STATUSES.map((item) => [item.value, item.label]));

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

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${active ? 'bg-white/[0.13] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]' : 'bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/70'}`}
    >
      {children}
    </button>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="flex min-h-[42px] items-center gap-2 rounded-xl bg-white/[0.04] px-3 text-sm text-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      <HugeiconsIcon icon={Search01Icon} size={15} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
    </label>
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

function HostedEventCard({ event, section, now, pinned, supportCount, onDelete, onTogglePin, onOpenSupport }) {
  const cover = coverImage(event);
  const isLive = section === 'live';
  const isPast = section === 'past';
  const eventId = event.id;
  const attendees = event._count?.tickets != null ? `${event._count.tickets} attendees` : null;
  const base = isLive
    ? pinned
      ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_24px_70px_rgba(0,0,0,0.65)]'
      : 'shadow-[0_0_0_1px_rgba(74,222,128,0.28),0_0_34px_rgba(74,222,128,0.12)]'
    : isPast
      ? 'opacity-70 grayscale-[50%] shadow-[0_0_0_1px_rgba(255,255,255,0.035)] transition-all duration-500 hover:opacity-100 hover:grayscale-0'
      : 'shadow-[0_0_0_1px_rgba(255,255,255,0.055)] transition-colors hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_45px_rgba(0,0,0,0.6)]';
  const menuItems = [
    { label: 'Details', href: `/dashboard/events/${eventId}`, icon: Calendar01Icon },
    !isPast && { label: 'Invite', href: `/dashboard/events/${eventId}/invite#event-invite`, icon: UserAdd01Icon },
    { label: 'Members', href: `/dashboard/events/${eventId}/members`, icon: UserCircleIcon },
    { label: 'Upload', href: `/dashboard/events/${eventId}/upload`, icon: ImageAdd02Icon },
    { label: 'Support inbox', onClick: () => onOpenSupport(eventId), icon: HelpCircleIcon },
    !isPast && { label: 'Edit', href: `/dashboard/events/${eventId}/edit`, icon: PencilIcon },
    { label: 'Delete', onClick: () => onDelete(eventId, event.name), icon: Delete02Icon, danger: true },
  ].filter(Boolean);

  return (
    <div className={`group relative aspect-[3/4] overflow-hidden rounded-[24px] bg-[#0A0A0A] ${base}`}>
      <Link href={`/dashboard/events/${eventId}`} className="absolute inset-0 z-0" aria-label={`Open ${event.name || 'event'}`}>
        {cover ? (
          <Image src={cover} alt={event.name || 'Event cover'} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
            <HugeiconsIcon icon={Calendar01Icon} className="text-zinc-600" size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
      </Link>
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute left-4 top-4 flex items-start gap-2">
          {isLive ? <span className="status-pill status-active animate-pulse">Live</span> : isPast ? <span className="glow-chip flex h-8 w-8 items-center justify-center rounded-full"><HugeiconsIcon icon={BookIcon} className="h-4 w-4 text-white/70" /></span> : <span className="status-pill glow-chip text-white">{startsIn(event.startDate, now)}</span>}
          {pinned ? <span className="rounded-full bg-white/[0.12] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">Pinned</span> : null}
        </div>
        <div className="pointer-events-auto absolute right-4 top-4" onClick={(clickEvent) => clickEvent.stopPropagation()}>
          <ActionMenu items={menuItems} label="Event actions" />
        </div>
        {isLive ? (
          <button
            type="button"
            onClick={(clickEvent) => {
              clickEvent.preventDefault();
              clickEvent.stopPropagation();
              onTogglePin(eventId);
            }}
            className="pointer-events-auto absolute bottom-[138px] left-5 rounded-full bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/75 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-white/[0.12] hover:text-white"
          >
            {pinned ? 'Unpin live' : 'Pin live'}
          </button>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className={`mb-3 text-[28px] font-[900] leading-none tracking-tighter ${isPast ? 'text-white/90' : 'text-white'}`}>{event.name || 'Untitled event'}</h3>
          <div className={`space-y-2 text-[13px] font-medium ${isPast ? 'text-white/50' : 'text-white/70'}`}>
            <div className="flex items-center"><HugeiconsIcon icon={ClockIcon} className="mr-2.5 h-4 w-4 opacity-50" /> {formatDate(event.startDate)}</div>
            <div className="flex items-center"><HugeiconsIcon icon={Location01Icon} className="mr-2.5 h-4 w-4 opacity-50" /> {event.location || event.venue || 'Venue TBD'}</div>
            {attendees ? <div className={`flex items-center ${isLive ? 'font-bold text-[#4ade80]' : ''}`}><HugeiconsIcon icon={UserGroupIcon} className="mr-2.5 h-4 w-4 opacity-80" /> {attendees}</div> : null}
            {supportCount > 0 ? <div className="flex items-center text-white/80"><HugeiconsIcon icon={HelpCircleIcon} className="mr-2.5 h-4 w-4 opacity-80" /> {supportCount} open support</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendedEventCard({ event, requestCount, onOpen }) {
  const cover = coverImage(event);
  return (
    <button type="button" onClick={() => onOpen(event)} className="group overflow-hidden rounded-[22px] bg-white/[0.035] text-left shadow-[0_0_0_1px_rgba(255,255,255,0.055)] transition-colors hover:bg-white/[0.06]">
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
        {cover ? <Image src={cover} alt={event.name || 'Event cover'} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center"><HugeiconsIcon icon={Ticket01Icon} className="text-zinc-600" size={34} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/75">{event.attendeeStatus || 'ticketed'}</span>
          {requestCount > 0 ? <span className="rounded-full bg-white/[0.14] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">{requestCount} request{requestCount === 1 ? '' : 's'}</span> : null}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white">{event.name || 'Untitled event'}</h3>
          <p className="mt-1 text-sm text-zinc-500">{event.location || event.venue || 'Venue TBD'}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-2"><HugeiconsIcon icon={Calendar01Icon} size={14} />{formatDate(event.startDate)}</span>
          <span className="inline-flex items-center gap-1 text-white/55">View flow <HugeiconsIcon icon={ArrowRight02Icon} size={14} /></span>
        </div>
      </div>
    </button>
  );
}

function SubmitHelpRequestModal({ open, event, onClose, onSubmit }) {
  const { user } = useAuth();
  const [type, setType] = useState('contact-organizer');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType('contact-organizer');
    setSubject('');
    setMessage('');
  }, [open]);

  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 8;

  return (
    <Modal open={open} onClose={onClose} title="Submit Help Request" description={`Send a request to the organizer for ${event?.name || 'this event'}.`} className="max-w-xl">
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
        <input value={subject} onChange={(inputEvent) => setSubject(inputEvent.target.value)} placeholder="What do you need help with?" className="min-h-[44px] w-full rounded-xl bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
        <label className="block text-xs font-bold uppercase tracking-widest text-white/45">Details</label>
        <textarea value={message} onChange={(inputEvent) => setMessage(inputEvent.target.value)} placeholder="Share ticket details, timing, and what outcome you need." rows={5} className="w-full resize-none rounded-xl bg-white/[0.04] px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white">Cancel</button>
          <button type="submit" disabled={!canSubmit || submitting} className="rounded-xl bg-white/[0.9] px-4 py-2.5 text-sm font-black text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45">{submitting ? 'Submitting...' : 'Submit request'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ParticipantEventModal({ event, requests, onClose, onSubmitHelp }) {
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    if (!event) setHelpOpen(false);
  }, [event]);
  if (!event) return null;

  return (
    <>
      <Modal open={!!event} onClose={onClose} title={event.name || 'Attended event'} description="Participant view for ticket status, event details, and help." className="max-w-2xl">
        <div className="space-y-5">
          <div className="rounded-2xl bg-white/[0.035] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.055)]">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Ticket</p><p className="mt-1 text-sm font-semibold text-white">{event.ticketId ? `#${String(event.ticketId).slice(-8)}` : 'Ticketed'}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Date</p><p className="mt-1 text-sm font-semibold text-white">{formatDate(event.startDate)}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest text-white/35">Odyssey XP</p><p className="mt-1 text-sm font-semibold text-white">{Number(event.xp || 0).toLocaleString()}</p></div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-zinc-400"><HugeiconsIcon icon={Location01Icon} size={16} className="mt-0.5 shrink-0 text-white/35" />{event.location || event.venue || 'Venue details will appear here when available.'}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setHelpOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.09] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/[0.13]"><HugeiconsIcon icon={HelpCircleIcon} size={17} />Submit Help Request</button>
            <Link href={`/events/${event.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white">Public event page <HugeiconsIcon icon={ArrowRight02Icon} size={16} /></Link>
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
      <SubmitHelpRequestModal open={helpOpen} event={event} onClose={() => setHelpOpen(false)} onSubmit={async (payload) => { await onSubmitHelp(payload); setHelpOpen(false); }} />
    </>
  );
}

function OrganizerSupportInbox({ requests, hostedEvents, selectedEventId, selectedStatus, onEventChange, onStatusChange, onStatusUpdate }) {
  return (
    <GlowCard className="overflow-hidden">
      <header className="border-b border-white/[0.06] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/35"><HugeiconsIcon icon={Shield01Icon} size={14} />Organizer Support Inbox</div>
            <h2 className="text-xl font-black tracking-tight text-white">Manage attendee help requests</h2>
            <p className="mt-1 text-sm text-zinc-500">Review participant refund, access, organizer contact, and safety requests.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={selectedEventId} onChange={(inputEvent) => onEventChange(inputEvent.target.value)} className="min-h-[42px] rounded-xl bg-white/[0.04] px-3 text-sm font-semibold text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
              <option value="all" className="bg-zinc-950 text-white">All hosted events</option>
              {hostedEvents.map((event) => <option key={event.id} value={event.id} className="bg-zinc-950 text-white">{event.name || 'Untitled event'}</option>)}
            </select>
            <select value={selectedStatus} onChange={(inputEvent) => onStatusChange(inputEvent.target.value)} className="min-h-[42px] rounded-xl bg-white/[0.04] px-3 text-sm font-semibold text-white outline-none shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
              <option value="all" className="bg-zinc-950 text-white">All statuses</option>
              {HELP_REQUEST_STATUSES.map((status) => <option key={status.value} value={status.value} className="bg-zinc-950 text-white">{status.label}</option>)}
            </select>
          </div>
        </div>
      </header>
      <div className="p-5 md:p-6">
        {requests.length ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl bg-white/[0.025] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/65">{TYPE_LABELS[request.type] || request.type}</span><span className="text-xs text-zinc-500">{formatDateTime(request.createdAt)}</span></div>
                    <h3 className="mt-2 text-base font-bold text-white">{request.subject}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{request.eventName} • {request.requesterName}{request.requesterEmail ? ` • ${request.requesterEmail}` : ''}</p>
                    {request.message ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{request.message}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    {HELP_REQUEST_STATUSES.map((status) => (
                      <button key={status.value} type="button" onClick={() => onStatusUpdate(request.id, status.value)} disabled={request.status === status.value} className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${request.status === status.value ? 'bg-white/[0.13] text-white' : 'bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/75'}`}>{status.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.025] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.045)]">
            <HugeiconsIcon icon={Message01Icon} className="mx-auto mb-3 text-zinc-600" size={34} />
            <p className="font-semibold text-zinc-300">No support requests match these filters.</p>
            <p className="mt-1 text-sm text-zinc-500">Participant help requests submitted from attended events will appear here.</p>
          </div>
        )}
      </div>
    </GlowCard>
  );
}

export default function EventsListPage() {
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
  const [hostedQuery, setHostedQuery] = useState('');
  const [attendedQuery, setAttendedQuery] = useState('');
  const [pinnedLiveIds, setPinnedLiveIds] = useState([]);
  const [selectedAttendedEvent, setSelectedAttendedEvent] = useState(null);
  const [myHelpRequests, setMyHelpRequests] = useState([]);
  const [organizerRequests, setOrganizerRequests] = useState([]);
  const [supportEventId, setSupportEventId] = useState('all');
  const [supportStatus, setSupportStatus] = useState('all');
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
    const [mine, organizer] = await Promise.all([
      helpRequestsService.listMyHelpRequests({ userId: user?.id }),
      helpRequestsService.listOrganizerHelpRequests({
        events: hostedEvents,
        eventId: supportEventId === 'all' ? undefined : supportEventId,
        status: supportStatus,
      }),
    ]);
    setMyHelpRequests(mine);
    setOrganizerRequests(organizer);
  }, [hostedEvents, supportEventId, supportStatus, user?.id]);

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

  const eventSections = useMemo(() => {
    const sections = { live: [], upcoming: [], past: [] };
    hostedEvents.forEach((event) => sections[classifyEvent(event, now)].push(event));
    const pinnedSet = new Set(pinnedLiveIds);
    sections.live.sort((a, b) => (pinnedSet.has(String(a.id)) ? 0 : 1) - (pinnedSet.has(String(b.id)) ? 0 : 1));
    return sections;
  }, [hostedEvents, now, pinnedLiveIds]);

  const filteredHostedSections = useMemo(() => {
    const filterSection = (items, section) => (hostedFilter === 'all' || hostedFilter === section ? items.filter((event) => matchesEvent(event, hostedQuery)) : []);
    return {
      live: filterSection(eventSections.live, 'live'),
      upcoming: filterSection(eventSections.upcoming, 'upcoming'),
      past: filterSection(eventSections.past, 'past'),
    };
  }, [eventSections, hostedFilter, hostedQuery]);

  const filteredAttendedEvents = useMemo(() => attendedEvents.filter((event) => {
    const section = classifyEvent(event, now);
    return (attendedFilter === 'all' || attendedFilter === section) && matchesEvent(event, attendedQuery);
  }), [attendedEvents, attendedFilter, attendedQuery, now]);

  const openRequestCountByEventId = useMemo(() => organizerRequests.reduce((acc, request) => {
    if (request.status !== 'resolved') acc[request.eventId] = (acc[request.eventId] || 0) + 1;
    return acc;
  }, {}), [organizerRequests]);
  const myRequestCountByEventId = useMemo(() => myHelpRequests.reduce((acc, request) => {
    acc[request.eventId] = (acc[request.eventId] || 0) + 1;
    return acc;
  }, {}), [myHelpRequests]);
  const selectedEventRequests = useMemo(() => selectedAttendedEvent ? myHelpRequests.filter((request) => request.eventId === String(selectedAttendedEvent.id)) : [], [myHelpRequests, selectedAttendedEvent]);
  const hostedVisibleCount = filteredHostedSections.live.length + filteredHostedSections.upcoming.length + filteredHostedSections.past.length;

  const submitHelpRequest = async (payload) => {
    await helpRequestsService.createHelpRequest(payload);
    await refreshHelpRequests();
    toast.success('Help request submitted.');
  };
  const updateHelpRequestStatus = async (requestId, status) => {
    await helpRequestsService.updateHelpRequestStatus(requestId, status);
    await refreshHelpRequests();
    toast.success(`Request marked ${STATUS_LABELS[status].toLowerCase()}.`);
  };
  const openSupport = (eventId) => {
    setSupportEventId(String(eventId));
    document.getElementById('organizer-support-inbox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div><h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">My Events</h1><p className="mt-1 text-sm text-zinc-500">Switch between events you host and events you attend.</p></div>
          <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-white/[0.12]"><HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.5} />Create event</button>
        </div>

        <div className="flex flex-col gap-4 rounded-[24px] bg-white/[0.025] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {[['hosted', 'Hosted Events', hostedEvents.length], ['attended', 'Attended Events', attendedEvents.length]].map(([id, label, count]) => (
              <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-2xl px-4 py-3 text-left transition-colors ${mode === id ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:bg-white/[0.05] hover:text-white/70'}`}><span className="block text-sm font-black tracking-tight">{label}</span><span className="mt-0.5 block text-xs text-current opacity-60">{count} total</span></button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-2 text-xs text-zinc-500"><HugeiconsIcon icon={Alert02Icon} size={14} />Help requests persist locally until the backend endpoint is wired.</div>
        </div>

        {mode === 'hosted' ? (
          <div className="space-y-8">
            <GlowCard className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center"><SearchBox value={hostedQuery} onChange={setHostedQuery} placeholder="Filter hosted events by name or venue" /><div className="flex flex-wrap gap-2">{[['all', 'All'], ['live', 'Live'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([id, label]) => <FilterButton key={id} active={hostedFilter === id} onClick={() => setHostedFilter(id)}>{label}</FilterButton>)}</div></div></GlowCard>
            {hostedEvents.length === 0 ? (
              <EmptyState icon={Calendar01Icon} title="No hosted events yet" body="Create an event on the web or in the PXI mobile app." action={<button type="button" onClick={() => setCreateOpen(true)} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-white/[0.12]"><HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.5} />Create event</button>} />
            ) : hostedVisibleCount === 0 ? (
              <EmptyState icon={Search01Icon} title="No hosted events match your filters" body="Try clearing the search or changing the event status filter." />
            ) : (
              <>
                {[
                  ['live', 'Live Now', filteredHostedSections.live],
                  ['upcoming', 'Upcoming', filteredHostedSections.upcoming],
                  ['past', 'Past / Scrapbook', filteredHostedSections.past],
                ].map(([section, label, items]) => items.length ? (
                  <section key={section} className="space-y-6">
                    <h2 className={`text-[13px] font-bold uppercase tracking-widest ${section === 'live' ? 'text-[#4ade80]' : 'text-white/40'}`}>{label}</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((event) => <HostedEventCard key={event.id} event={event} section={section} now={now} pinned={pinnedLiveIds.includes(String(event.id))} supportCount={openRequestCountByEventId[String(event.id)] || 0} onDelete={(id, name) => setDeleteTarget({ id, name })} onTogglePin={togglePinnedLiveEvent} onOpenSupport={openSupport} />)}
                    </div>
                  </section>
                ) : null)}
              </>
            )}
            <div id="organizer-support-inbox" className="scroll-mt-6"><OrganizerSupportInbox requests={organizerRequests} hostedEvents={hostedEvents} selectedEventId={supportEventId} selectedStatus={supportStatus} onEventChange={setSupportEventId} onStatusChange={setSupportStatus} onStatusUpdate={updateHelpRequestStatus} /></div>
          </div>
        ) : (
          <div className="space-y-8">
            <GlowCard className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center"><SearchBox value={attendedQuery} onChange={setAttendedQuery} placeholder="Filter attended events by name or venue" /><div className="flex flex-wrap gap-2">{[['all', 'All'], ['live', 'Live'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([id, label]) => <FilterButton key={id} active={attendedFilter === id} onClick={() => setAttendedFilter(id)}>{label}</FilterButton>)}</div></div></GlowCard>
            {attendedError ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">{attendedError.message || 'Failed to load attended events'}</div>
              : attendedLoading ? <GlowCard className="p-10 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent" /><p className="mt-4 text-sm text-zinc-500">Loading attended events...</p></GlowCard>
                : attendedEvents.length === 0 ? <EmptyState icon={Ticket01Icon} title="No attended events yet" body="Tickets from your PXI account will appear here, separate from organizer management." action={<button type="button" onClick={() => invalidateAttended()} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-white/[0.12]"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />Refresh tickets</button>} />
                  : filteredAttendedEvents.length === 0 ? <EmptyState icon={Search01Icon} title="No attended events match your filters" body="Try clearing the search or changing the event status filter." />
                    : <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredAttendedEvents.map((event) => <AttendedEventCard key={`${event.id}-${event.ticketId || 'ticket'}`} event={event} requestCount={myRequestCountByEventId[String(event.id)] || 0} onOpen={setSelectedAttendedEvent} />)}</div>}
          </div>
        )}
      </div>

      <CreateEventSlideOver open={createOpen} onClose={() => setCreateOpen(false)} />
      <ParticipantEventModal event={selectedAttendedEvent} requests={selectedEventRequests} onClose={() => setSelectedAttendedEvent(null)} onSubmitHelp={submitHelpRequest} />
    </>
  );
}