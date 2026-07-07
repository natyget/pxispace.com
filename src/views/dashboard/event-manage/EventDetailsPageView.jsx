'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import UserAvatar from '@/components/ui/UserAvatar';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserGroupIcon, Share01Icon, ClockIcon, Location01Icon, PencilIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManage } from './EventManageContext';
import {
  coverImageUrl,
  lineupRoleDisplay,
  scheduleDisplay,
  locationDisplay,
  hostFromEvent,
  publicEventPageUrl,
} from './eventDetailHelpers';
import { eventShareLead, shareMessageWithUrl } from '@/lib/shareCopy';
import { formatTicketPrice, parseEventTicketTiers } from '@/lib/ticketTiers';

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
  const isAlbumOwner = myAlbumRole === 'OWNER';

  const cover = coverImageUrl(event);
  const sched = scheduleDisplay(event);
  const loc = locationDisplay(event);
  const host = hostFromEvent(event);
  const isPublic = event.visibility === 'PUBLIC';
  const showPaidBadge = String(event.ticketType || '').toUpperCase() === 'PAID';
  const ticketTiers = useMemo(() => parseEventTicketTiers(event), [event]);
  const memberCount =
    typeof event._count?.members === 'number' ? event._count.members : participants.length;

  const previewAvatars = participants
    .map((p) => p.avatarUrl)
    .filter(Boolean)
    .slice(0, 8);

  const lineupHint =
    'People highlighted for this event. They confirm by accepting an invite — separate from album staff.';

  const handleShareEvent = async () => {
    const url = publicEventPageUrl(String(eventId));
    const title = event?.name || 'Event';
    const text = eventShareLead(title);
    const message = shareMessageWithUrl(text, url);
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(message);
      setShareHint('Link copied');
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      try {
        await navigator.clipboard.writeText(message);
        setShareHint('Link copied');
        setTimeout(() => setShareHint(null), 2500);
      } catch {
        window.prompt('Copy event link:', message);
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

      <div id="event-details" className="glass-panel scroll-mt-6 overflow-hidden rounded-2xl">
        <div className="relative aspect-[4/5] md:aspect-[16/11] bg-zinc-900">
          {cover ? (
            <Image src={cover} alt="" fill unoptimized className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
              <HugeiconsIcon icon={UserGroupIcon} size={48} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-[#050505]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] to-transparent" />

          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <Link
              href={`/dashboard/events/${eventId}/edit`}
              className="pill-ghost inline-flex h-10 w-10 items-center justify-center"
              aria-label="Edit event"
            >
              <HugeiconsIcon icon={PencilIcon} size={19} />
            </Link>
            <button
              type="button"
              onClick={handleShareEvent}
              className="pill-ghost inline-flex h-10 w-10 items-center justify-center"
              aria-label="Share event"
            >
              <HugeiconsIcon icon={Share01Icon} size={18} />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 pt-24">
            <p className="text-[1.65rem] font-black text-white tracking-tight leading-none drop-shadow-md">
              {event.name?.trim() || 'Untitled event'}
            </p>
          </div>
        </div>

        <div className="space-y-6 px-5 pb-8 pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  isPublic
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-white/10 text-zinc-200'
                }`}
              >
                {isPublic ? 'Public event' : 'Private album'}
              </span>
              {showPaidBadge ? (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-200">
                  Paid event
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                user={{ avatarUrl: host?.avatarUrl }}
                size={40}
                className="shrink-0"
              />
              <p className="text-sm text-zinc-300">
                Hosted by{' '}
                <span className="font-semibold text-white">{host?.name || 'Unknown host'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-field min-h-[6.5rem] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={ClockIcon} size={14} className="text-white" />
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
            <div className="glass-field min-h-[6.5rem] rounded-2xl p-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0 self-start mt-0.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} className="text-white" />
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

          {ticketTiers.length > 0 ? (
            <section>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
                Ticket tiers
              </h2>
              <ul className="space-y-2">
                {ticketTiers.map((tier) => (
                  <li
                    key={tier.id || tier.label}
                    className="glass-field flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{tier.label}</p>
                      {tier.capacity != null ? (
                        <p className="mt-0.5 text-xs text-zinc-500">Capacity {tier.capacity}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-amber-200">
                      {formatTicketPrice(tier.priceUsd, event.currency || 'USD')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

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
                    className="glass-field flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        user={{ avatarUrl: person.avatarUrl }}
                        size={40}
                        className="shrink-0"
                      />
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
                className="glass-field flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-white/[0.08]"
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

        </div>
      </div>

    </div>
  );
}
