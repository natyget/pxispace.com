'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Navigation03Icon } from '@hugeicons/core-free-icons';
import UserAvatar from '@/components/ui/UserAvatar';
import Portal from '@/components/ui/Portal';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { PxiPassportCard } from '@/components/passport/PxiPassportCard';
import { usePassportAttendedEvents } from '@/hooks/usePassportAttendedEvents';
import { api } from '@/services/api';
import { displayImageSrc } from '@/lib/mediaUrl';
import { organizerHref } from '@/lib/organizerPage';
import { singleEventMapEmbedSrc } from '@/lib/eventMapEmbed';
import {
  ActionEl,
  MusicSection,
  ShareButton,
  TicketTiers,
} from '@/components/events/EventDetailsModal';
import { readTopSong, toCapsLine, toPlace, toWhen } from '@/components/events/eventFormat';

/*
 * The event's desktop details: the left column of the album and event pages at 1024px and up. The cover,
 * the name, the day and place, then the sections the old desktop event page carried (about, tickets,
 * line-up, music, guest list, map, host passport, the app). It reads the same `event` shape the app's
 * event view (EventDetailsModal) does, so the album page and the event page feed it from one adapter.
 * The column scrolls; the album (or the ticket panel) stays put beside it.
 */

const PURPLE = '#A523EF';
const CARD = '#1C1C1C';
const DISPLAY_FONT = '"Stack Sans Notch", Inter, sans-serif';
const LABEL = 'text-[11px] font-extrabold uppercase leading-[13px] tracking-[0.12em] text-white/55';

function Section({ label, children, ...rest }) {
  return (
    <section className="border-t border-white/10 pt-7" {...rest}>
      <p className={LABEL}>{label}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HostPassport({ user }) {
  const attendedEvents = usePassportAttendedEvents(user?.id, 'public');
  return (
    <div className="w-full max-w-[361px]">
      <PxiPassportCard user={user} attendedEvents={attendedEvents} />
    </div>
  );
}

function GuestListModal({ open, onClose, participants, count }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Guest list">
        <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden />
        <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[28px] p-6" style={{ background: CARD }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-extrabold text-white">
              {count} {count === 1 ? 'member' : 'members'}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close guest list"
              className="inline-flex size-10 items-center justify-center rounded-full bg-[#2A2A2C] text-white transition hover:bg-[#333]"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>
          <ul className="no-scrollbar mt-5 grid grid-cols-4 gap-x-3 gap-y-5 overflow-y-auto sm:grid-cols-6">
            {participants.map((p, i) => {
              const label = String(p?.name || p?.username || '').replace(/^@/, '');
              return (
                <li key={p?.userId || p?.id || `${label}-${i}`} className="flex min-w-0 flex-col items-center gap-1.5">
                  <UserAvatar user={{ avatarUrl: p?.avatarUrl }} size={52} alt={label} className="size-[52px]" />
                  {label ? <span className="max-w-full truncate text-[11px] font-semibold text-white/55">{label}</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Portal>
  );
}

/** The details column. `showActions` puts Join / Get ticket and share under the name (the ticket panel carries them when there is no album). */
export default function EventDesktopDetails({ event, primaryAction, secondaryAction, hostStats, showActions = true }) {
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [hostProfile, setHostProfile] = useState(null);
  const hostId = event?.host?.id || null;

  useEffect(() => {
    if (!hostId) return undefined;
    let alive = true;
    api
      .get(`/api/users/public-profile/${encodeURIComponent(hostId)}`)
      .then((data) => alive && setHostProfile(data?.user ?? null))
      .catch(() => alive && setHostProfile(null));
    return () => {
      alive = false;
      setHostProfile(null);
    };
  }, [hostId]);

  const cover = displayImageSrc(event?.image, null);
  const when = useMemo(() => toWhen(event), [event]);
  const place = useMemo(() => toPlace(event), [event]);
  const caps = toCapsLine(event);
  const host = event?.host || null;
  const hostName = host ? host.name || host.username || '' : '';
  const hostHref = organizerHref(host);
  const about = String(event?.description || '').trim();
  const tiers = Array.isArray(event?.ticketTiers) ? event.ticketTiers : [];
  const lineup = Array.isArray(event?.lineup) ? event.lineup : [];
  const participants = Array.isArray(event?.participants) ? event.participants : [];
  const memberCount = event?.memberCount != null ? event.memberCount : participants.length;
  const mapSrc = place?.latitude != null ? singleEventMapEmbedSrc(place.latitude, place.longitude) : null;
  const passportUser =
    host && hostProfile?.isPassportIssued
      ? { ...host, ...hostProfile, avatarUrl: hostProfile.avatarUrl ?? host.avatarUrl }
      : null;
  const mainActionable = primaryAction && !primaryAction.disabled && (primaryAction.href || primaryAction.onClick);
  const mapsQuery =
    place?.latitude != null ? `${place.latitude},${place.longitude}` : encodeURIComponent(place?.address || place?.venue || '');

  if (!event) return null;

  return (
    <article className="mx-auto w-full max-w-[760px] px-8 pb-16 pt-10 text-white xl:px-10" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <header className="flex items-start gap-8">
        <div className="relative aspect-[3/4] w-[min(42%,300px)] shrink-0 overflow-hidden rounded-[28px] bg-[#2A2A2C]">
          {cover ? <Image src={cover} alt={`${event.title || 'Event'} cover`} fill priority unoptimized sizes="300px" className="object-cover" /> : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {caps ? <p className={LABEL}>{caps}</p> : null}
          <h1
            className="mt-2 text-balance break-words text-[40px] leading-[1.02] text-white xl:text-[48px]"
            style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '-0.015em' }}
          >
            {event.title || 'Event'}
          </h1>
          {when.date || when.time ? (
            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              {when.date ? (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.09em]" style={{ color: PURPLE }}>Date</p>
                  <p className="mt-1 text-[22px] font-bold uppercase leading-[1.1] text-white" style={{ fontFamily: DISPLAY_FONT }} suppressHydrationWarning>
                    {when.date}
                  </p>
                  {when.note ? <p className="mt-1 text-[12px] font-bold uppercase text-white/55">{when.note}</p> : null}
                </div>
              ) : null}
              {when.time ? (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.09em]" style={{ color: PURPLE }}>Time</p>
                  <p className="mt-1 text-[22px] font-bold uppercase leading-[1.1] text-white" style={{ fontFamily: DISPLAY_FONT }} suppressHydrationWarning>
                    {when.time}
                  </p>
                  {when.until ? <p className="mt-1 text-[12px] font-bold uppercase text-white/55" suppressHydrationWarning>{when.until}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {place ? (
            <div className="mt-6">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.09em]" style={{ color: PURPLE }}>Place</p>
              <p className="mt-1 text-[22px] font-bold leading-[1.1] text-white" style={{ fontFamily: DISPLAY_FONT }}>{place.venue}</p>
              {place.addressLine && place.addressLine !== place.venue ? (
                <p className="mt-1 text-[14px] font-medium leading-[19px] text-white/55">{place.addressLine}</p>
              ) : null}
            </div>
          ) : null}
          {hostName ? (
            <div className="mt-6 flex items-center gap-3">
              {hostHref ? (
                <Link href={hostHref} tabIndex={-1} aria-hidden="true" className="shrink-0 rounded-full">
                  <UserAvatar user={{ avatarUrl: host?.avatarUrl }} size={44} className="shrink-0" />
                </Link>
              ) : (
                <UserAvatar user={{ avatarUrl: host?.avatarUrl }} size={44} className="shrink-0" />
              )}
              <div className="min-w-0">
                <p className={LABEL}>Hosted by</p>
                {hostHref ? (
                  <Link href={hostHref} className="block truncate text-[15px] font-extrabold text-white hover:underline">{hostName}</Link>
                ) : (
                  <p className="truncate text-[15px] font-extrabold text-white">{hostName}</p>
                )}
              </div>
            </div>
          ) : null}
          {showActions && primaryAction ? (
            <div className="mt-8 flex items-center gap-3">
              <ActionEl
                action={primaryAction}
                className={`inline-flex h-12 min-w-[160px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-[16px] font-extrabold text-white transition-transform ${
                  mainActionable ? 'bg-[#A523EF] hover:opacity-90 active:scale-[0.97]' : 'bg-[#A523EF] opacity-40'
                }`}
              >
                {primaryAction.label}
              </ActionEl>
              {secondaryAction ? (
                <ActionEl
                  action={secondaryAction}
                  className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[#572077] px-6 text-[15px] font-black uppercase tracking-[0.3px] text-[#A523EF] transition-transform active:scale-[0.97]"
                >
                  {secondaryAction.label}
                </ActionEl>
              ) : null}
              <ShareButton title={event.title} url={event.shareUrl} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-12 flex flex-col gap-9">
        {about ? (
          <Section label="About">
            <div className="text-[16px] leading-[26px] text-white/80">
              {about.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="whitespace-pre-line [&+p]:mt-4">{para}</p>
              ))}
            </div>
          </Section>
        ) : null}

        {tiers.length > 0 ? (
          <div className="border-t border-white/10 [&>section]:mt-0 [&>section]:px-0 [&>section]:pt-7 [&>section>p]:text-white/55">
            <TicketTiers tiers={tiers} />
          </div>
        ) : null}

        {lineup.length > 0 ? (
          <Section label="Line up" aria-label="Line up">
            <ul className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4">
              {lineup.map((person) => {
                const name = person.name?.trim() || `@${person.username || 'unknown'}`;
                return (
                  <li key={person.id || person.userId || name} className="flex min-w-0 flex-col items-center text-center">
                    <UserAvatar user={{ avatarUrl: person.avatarUrl }} size={96} className="shrink-0" />
                    <p className="mt-3 w-full truncate text-[16px] font-extrabold leading-[1.15] text-white">{name}</p>
                    {person.role ? <p className={`mt-1 w-full truncate ${LABEL}`}>{person.role}</p> : null}
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}

        {event.playlist?.eventId || event.topSong ? (
          <div className="-mx-[29px] -my-[26px]">
            <MusicSection playlist={event.playlist} cover={cover} topSong={readTopSong(event)} />
          </div>
        ) : null}

        <Section label="Guest list">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {participants.length > 0 ? (
                <div className="flex shrink-0 -space-x-2">
                  {participants.slice(0, 5).map((p, i) => (
                    <span key={`${p?.userId || p?.username || 'm'}-${i}`} className="inline-flex size-9 overflow-hidden rounded-full ring-2 ring-black" style={{ zIndex: 5 - i }}>
                      <UserAvatar user={{ avatarUrl: p?.avatarUrl }} size={36} className="size-full" />
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="text-[15px] font-medium text-white/80">
                <span className="font-extrabold text-white">{memberCount}</span> {memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>
            {participants.length > 0 ? (
              <button
                type="button"
                onClick={() => setGuestsOpen(true)}
                className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#2A2A2C] px-4 text-[13px] font-extrabold text-white transition hover:bg-[#333]"
              >
                View all
              </button>
            ) : null}
          </div>
        </Section>

        {place?.hasMap ? (
          <Section label="Location">
            {mapSrc ? (
              <div className="h-[320px] overflow-hidden rounded-[28px] bg-[#151519]">
                <iframe title={`Map of ${place.venue}`} src={mapSrc} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="min-w-0 text-[14px] font-medium leading-[19px] text-white/80">{place.addressLine || place.address || place.venue}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-black uppercase tracking-[0.09em] text-black"
              >
                <HugeiconsIcon icon={Navigation03Icon} size={14} />
                Open in maps
              </a>
            </div>
          </Section>
        ) : null}

        {hostName ? (
          <Section label="Hosted by">
            <div className="flex flex-col gap-5">
              {passportUser ? <HostPassport user={passportUser} /> : null}
              {hostStats && (hostStats.eventsCreated > 0 || hostStats.membersJoinedAcrossEvents > 0) ? (
                <div className="flex gap-10">
                  <div>
                    <p className="text-[28px] font-bold leading-none text-white" style={{ fontFamily: DISPLAY_FONT }}>{hostStats.eventsCreated ?? 0}</p>
                    <p className={`mt-1.5 ${LABEL}`}>{hostStats.eventsCreated === 1 ? 'Event' : 'Events'}</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-bold leading-none text-white" style={{ fontFamily: DISPLAY_FONT }}>{hostStats.membersJoinedAcrossEvents ?? 0}</p>
                    <p className={`mt-1.5 ${LABEL}`}>Members</p>
                  </div>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        <Section label="Get the app">
          <AppStoreCtaPair className="!mx-0 !justify-start" />
        </Section>
      </div>

      <GuestListModal open={guestsOpen} onClose={() => setGuestsOpen(false)} participants={participants} count={memberCount} />
    </article>
  );
}

/**
 * The right column of an event page that has no album: the ticket. Name, day, place, the tiers, and the
 * one action, on a stub with a tear line.
 */
export function EventTicketPanel({ event, primaryAction, secondaryAction }) {
  const when = toWhen(event);
  const place = toPlace(event);
  const tiers = Array.isArray(event?.ticketTiers) ? event.ticketTiers : [];
  const mainActionable = primaryAction && !primaryAction.disabled && (primaryAction.href || primaryAction.onClick);
  if (!event) return null;
  return (
    <div className="flex h-full items-start justify-center overflow-y-auto p-8 pt-10 no-scrollbar">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[28px]" style={{ background: CARD }}>
        <div className="px-6 pb-6 pt-7">
          <p className="text-balance break-words text-[30px] leading-[1.05] text-white" style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '-0.015em' }}>
            {event.title || 'Event'}
          </p>
          {when.date || when.time ? (
            <p className="mt-4 text-[15px] font-extrabold uppercase text-white" suppressHydrationWarning>
              {when.date}
              {when.date && when.time ? <br /> : null}
              {when.time}
              {when.until ? <span className="block text-[12px] font-bold text-white/55">{when.until}</span> : null}
            </p>
          ) : null}
          {place ? <p className="mt-3 text-[14px] font-medium leading-[19px] text-white/55">{place.venue}</p> : null}
          {tiers.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-2">
              {tiers.map((tier) => (
                <li key={tier.id || tier.label} className="flex items-center justify-between gap-3 rounded-[16px] bg-[#2A2A2C] px-4 py-3">
                  <span className="min-w-0 truncate text-[15px] font-extrabold text-white">{tier.label}</span>
                  <span className="shrink-0 text-[16px] font-black text-[#FF5A1F]">{tier.priceLabel}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="border-t-2 border-dashed border-white/15 px-6 pb-6 pt-5">
          <div className="flex items-center gap-3">
            {primaryAction ? (
              <ActionEl
                action={primaryAction}
                className={`inline-flex h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-[#A523EF] px-6 text-[16px] font-extrabold text-white transition-transform ${
                  mainActionable ? 'hover:opacity-90 active:scale-[0.97]' : 'opacity-40'
                }`}
              >
                {primaryAction.label}
              </ActionEl>
            ) : null}
            <ShareButton title={event.title} url={event.shareUrl} />
          </div>
          {secondaryAction ? (
            <ActionEl
              action={secondaryAction}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#572077] text-[14px] font-black uppercase tracking-[0.3px] text-[#A523EF]"
            >
              {secondaryAction.label}
            </ActionEl>
          ) : null}
        </div>
      </div>
    </div>
  );
}
