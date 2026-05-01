'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  UserPlus,
  Users,
  Settings,
  Share2,
  ImagePlus,
  Clock,
  MapPin,
  Smartphone,
  ScanLine,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import { useEventManage } from './EventManageContext';
import {
  coverImageUrl,
  lineupRoleDisplay,
  scheduleDisplay,
  locationDisplay,
  hostFromEvent,
  publicEventPageUrl,
} from './eventDetailHelpers';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

export default function EventDetailsPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants, featuredPeople } = useEventManage();
  const [shareHint, setShareHint] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [event?.id, participants.length]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, '');
      if (!h) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(h);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const myAlbumRole = participants.find((p) => p.userId === user?.id)?.role;
  const isEventCreator = Boolean(user?.id && event?.createdBy && event.createdBy === user.id);
  const canGalleryMassUpload =
    isEventCreator || myAlbumRole === 'OWNER' || myAlbumRole === 'ADMIN';
  const canUseMemberActions =
    isEventCreator || (myAlbumRole && String(myAlbumRole).toUpperCase() !== 'GUEST');
  const canManageLikeMobile =
    isEventCreator || myAlbumRole === 'OWNER' || myAlbumRole === 'ADMIN';
  const isAlbumOwner = myAlbumRole === 'OWNER';

  const cover = coverImageUrl(event);
  const sched = scheduleDisplay(event);
  const loc = locationDisplay(event);
  const host = hostFromEvent(event);
  const isPublic = event.visibility === 'PUBLIC';
  const showPaidBadge = String(event.ticketType || '').toUpperCase() === 'PAID';
  const memberCount =
    typeof event._count?.members === 'number' ? event._count.members : participants.length;

  const previewAvatars = participants
    .map((p) => p.avatarUrl)
    .filter(Boolean)
    .slice(0, 8);

  const lineupHint =
    'People highlighted for this event. They confirm by accepting an invite — separate from album staff.';

  const inviteHref = `/dashboard/events/${eventId}/invite`;
  const uploadHref = `/dashboard/events/${eventId}/upload`;

  const handleShareEvent = async () => {
    const url = publicEventPageUrl(String(eventId));
    const title = event?.name || 'Event';
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Join "${title}" on PXI`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint('Link copied');
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareHint('Link copied');
        setTimeout(() => setShareHint(null), 2500);
      } catch {
        window.prompt('Copy event link:', url);
      }
    }
  };

  return (
    <div className="space-y-6">
      {shareHint && (
        <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-800 px-4 py-2 text-xs font-bold text-white shadow-lg border border-white/10">
          {shareHint}
        </p>
      )}

      <div id="event-details" className="scroll-mt-6 rounded-2xl overflow-hidden border border-white/10 bg-[#050505]">
        <div className="relative aspect-[4/5] md:aspect-[16/11] bg-zinc-900">
          {cover ? (
            <Image src={cover} alt="" fill unoptimized className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
              <Users size={48} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-[#050505]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] to-transparent" />

          <div className="absolute left-3 top-3 z-10">
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-2 text-white border border-white/15 hover:bg-black/65"
              aria-label="Back to my events"
            >
              <ChevronLeft size={20} />
            </Link>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 pt-24">
            <p className="text-[1.65rem] font-black text-white tracking-tight leading-none drop-shadow-md">
              {event.name?.trim() || 'Untitled event'}
            </p>
          </div>
        </div>

        <div className="px-5 pt-6 pb-8 space-y-6 bg-[#050505]">
          {user?.id && canUseMemberActions ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={inviteHref}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
              >
                <UserPlus size={16} className="text-pxi-purple" />
                Invite
              </Link>
              <button
                type="button"
                onClick={handleShareEvent}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
              >
                <Share2 size={16} className="text-pxi-purple" />
                Share
              </button>
              {canGalleryMassUpload ? (
                <Link
                  href={uploadHref}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                >
                  <ImagePlus size={16} className="text-pxi-purple" />
                  Upload
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                  isPublic
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/10 text-zinc-200 border-white/15'
                }`}
              >
                {isPublic ? 'Public event' : 'Private album'}
              </span>
              {showPaidBadge ? (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-200 border border-amber-500/35">
                  Paid event
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {host?.avatarUrl ? (
                <Image
                  src={host.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-full object-cover border border-white/15"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-700 border border-white/10 shrink-0" />
              )}
              <p className="text-sm text-zinc-300">
                Hosted by{' '}
                <span className="font-semibold text-white">{host?.name || 'Unknown host'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 min-h-[6.5rem]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-white" />
                </div>
                <span className="text-[13px] font-bold text-white tracking-tight leading-tight line-clamp-2">
                  {sched.primary}
                </span>
              </div>
              {sched.secondary ? (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 leading-relaxed">
                  {sched.secondary}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 min-h-[6.5rem]">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0 self-start mt-0.5">
                  <MapPin size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white leading-snug break-words">
                    {loc.primary}
                  </p>
                  {loc.secondary ? (
                    <p className="mt-1 text-[11px] text-zinc-500 leading-snug">{loc.secondary}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
              About
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {event.description?.trim() || 'No description provided.'}
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
              Line up
            </h2>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{lineupHint}</p>
            {featuredPeople.length === 0 ? (
              <p className="text-sm text-zinc-500">No one on the line up yet.</p>
            ) : (
              <ul className="space-y-2">
                {featuredPeople.map((person) => (
                  <li
                    key={person.id || person.userId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {person.avatarUrl ? (
                        <Image
                          src={person.avatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="rounded-full object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                          {(person.name || person.username || '?')[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate font-medium">
                          {person.name?.trim() || `@${person.username || 'unknown'}`}
                        </p>
                        {person.name?.trim() ? (
                          <p className="text-xs text-zinc-500 truncate">@{person.username || 'unknown'}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pxi-purple shrink-0">
                      {lineupRoleDisplay(person.role)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {albumId ? (
            <section id="event-going-preview" className="scroll-mt-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  Who&apos;s going
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {memberCount} members
                </span>
              </div>
              <Link
                href={`/dashboard/events/${eventId}/members`}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center -space-x-2">
                  {previewAvatars.length === 0 ? (
                    <span className="text-sm text-zinc-500">No members yet.</span>
                  ) : (
                    previewAvatars.map((uri, i) => (
                      <div
                        key={`${uri}-${i}`}
                        className="relative w-10 h-10 rounded-full border-2 border-[#050505] overflow-hidden bg-zinc-800"
                        style={{ zIndex: 10 - i }}
                      >
                        <Image src={uri} alt="" fill unoptimized className="object-cover" />
                      </div>
                    ))
                  )}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-pxi-purple shrink-0">
                  View members
                </span>
              </Link>
            </section>
          ) : null}

          {canManageLikeMobile ? (
            <section className="rounded-xl border border-pxi-purple/25 bg-gradient-to-br from-[#13061f] to-black/80 p-4 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pxi-purple">
                Manage event
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This dashboard mirrors the organizer view from the{' '}
                <strong className="text-zinc-200">Album details</strong> sheet in the mobile app. Scan tickets, edit full
                event fields, or delete an event using the app.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <ScanLine size={16} className="text-pxi-purple shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Scan tickets</strong> — staff check-in (mobile).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Pencil size={16} className="text-pxi-purple shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Edit details</strong> — name, cover, pricing, schedules (mobile).
                  </span>
                </li>
                {isAlbumOwner ? (
                  <li className="flex items-start gap-2">
                    <Trash2 size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-red-300">Delete event</strong> — album owner only (mobile).
                    </span>
                  </li>
                ) : (
                  <li className="text-[11px] text-zinc-500 pl-8">
                    Delete event is limited to album owner in the app.
                  </li>
                )}
              </ul>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Link
                  href={PXI_APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pxi-purple text-white text-[11px] font-bold uppercase tracking-widest hover:brightness-110"
                >
                  <Smartphone size={16} />
                  Open mobile app
                </Link>
                <Link
                  href={publicEventPageUrl(String(eventId))}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
                >
                  Public guest page (different layout) ↗
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {albumId ? (
        <section
          id="event-members"
          className="scroll-mt-6 rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <Users size={18} className="text-pxi-purple" />
            <h2 className="font-bold text-white uppercase tracking-widest text-sm">Members</h2>
          </div>
          <div className="p-5 max-h-72 overflow-auto">
            {participants.length === 0 ? (
              <p className="text-sm text-zinc-500">No album members yet.</p>
            ) : (
              <ul className="space-y-2">
                {participants.map((p) => {
                  const handle = String(p.username || '')
                    .replace(/^@/, '')
                    .trim();
                  return (
                    <li
                      key={p.userId}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-zinc-900/30 px-3 py-2 text-sm"
                    >
                      <span className="text-white truncate">
                        {handle ? `@${handle}` : p.userId}
                        {p.name && <span className="text-zinc-500 font-normal"> · {p.name}</span>}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 shrink-0">{p.role || '—'}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      <section id="event-settings" className="scroll-mt-6 rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Settings size={18} className="text-pxi-purple" />
          <h2 className="font-bold text-white uppercase tracking-widest text-sm">Settings</h2>
        </div>
        <div className="p-5 space-y-3 text-sm text-zinc-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <p className="text-xs text-zinc-500 max-w-xl">
              Update name, dates, cover, ticketing, and more—same scope as mobile <strong className="text-zinc-300">Edit details</strong>.
            </p>
            <Link
              href={`/dashboard/events/${eventId}/edit`}
              className="shrink-0 px-4 py-2 rounded-xl bg-pxi-purple text-white text-xs font-bold uppercase tracking-widest hover:brightness-110"
            >
              Edit event
            </Link>
          </div>
          <p>
            <span className="text-zinc-500">Visibility</span>
            <span className="mx-2">·</span>
            {event.visibility === 'PUBLIC' ? 'Public' : 'Private'}
          </p>
          <p>
            <span className="text-zinc-500">Starts</span>
            <span className="mx-2">·</span>
            {formatDate(event.startDate)}
            {event.endDate ? (
              <>
                {' '}
                <span className="text-zinc-500">→ Ends</span> {formatDate(event.endDate)}
              </>
            ) : null}
          </p>
          <p>
            <span className="text-zinc-500">Location</span>
            <span className="mx-2">·</span>
            {event.location || event.venue || '—'}
          </p>
        </div>
      </section>
    </div>
  );
}
