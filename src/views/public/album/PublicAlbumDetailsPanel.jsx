'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon, Location01Icon, Share01Icon } from '@hugeicons/core-free-icons';
import UserAvatar from '@/components/ui/UserAvatar';
import { displayImageSrc } from '@/lib/mediaUrl';
import { getSiteUrl } from '@/lib/siteUrl';
import { albumShareLead, shareMessageWithUrl } from '@/lib/shareCopy';
import { formatAlbumSchedule } from './publicAlbumDate';
import { formatTicketPrice, parseEventTicketTiers } from '@/lib/ticketTiers';

function eventRequiresPaidTicket(event) {
  if (!event || String(event.ticketType ?? '').toUpperCase() !== 'PAID') return false;
  if (parseEventTicketTiers(event).length > 0) return true;
  return Number(event.ticketPrice ?? 0) > 0;
}

function displayTitle(album) {
  const eventName = album?.event?.name?.trim();
  if (eventName) return eventName;
  const raw = String(album?.name ?? '').trim();
  if (!raw) return 'Album';
  return raw.replace(/\s+Album$/i, '').trim() || raw;
}

function formatLocation(event) {
  const raw = String(event?.location ?? '').trim();
  if (raw) {
    const split = raw.split(/\n|,|•/).map((s) => s.trim()).filter(Boolean);
    if (split.length >= 2) return { primary: split[0], secondary: split.slice(1).join(' · ') };
    return { primary: raw, secondary: '' };
  }
  const lat = event?.latitude != null ? Number(event.latitude) : NaN;
  const lng = event?.longitude != null ? Number(event.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { primary: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, secondary: 'Coordinates (no address set)' };
  }
  return { primary: 'Location TBD', secondary: '' };
}

function InfoMetaCard({ icon, primary, secondary }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex min-w-0 items-center gap-2">
        <HugeiconsIcon icon={icon} size={18} className="shrink-0 text-white" aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-white">{primary}</p>
      </div>
      {secondary ? (
        <p className="w-full text-[11px] font-bold uppercase leading-relaxed tracking-wide text-white/45">
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

export default function PublicAlbumDetailsPanel({ album, albumId, layout = 'column' }) {
  const isSheet = layout === 'sheet';
  const [shareHint, setShareHint] = useState(null);
  const title = useMemo(() => displayTitle(album), [album]);
  const isPublic = album?.event?.visibility === 'PUBLIC';
  const isPaidEvent = eventRequiresPaidTicket(album?.event);
  const coverSrc = displayImageSrc(album?.event?.coverImage || album?.coverImage, null);
  const host = album?.host;
  const schedule = useMemo(() => formatAlbumSchedule(album?.event), [album?.event]);
  const location = useMemo(() => formatLocation(album?.event), [album?.event]);
  const ticketTiers = useMemo(() => parseEventTicketTiers(album?.event), [album?.event]);
  const ticketLabel = useMemo(() => {
    if (!isPaidEvent) return null;
    const tier = ticketTiers[0];
    if (tier) return formatTicketPrice(tier.priceUsd, album?.event?.currency);
    return formatTicketPrice(album?.event?.ticketPrice, album?.event?.currency) || 'PAID';
  }, [isPaidEvent, ticketTiers, album?.event?.ticketPrice, album?.event?.currency]);
  const lineup = album?.featuredPeople || album?.lineup || [];
  const participants = album?.previewParticipants || [];
  const memberCount = album?.memberCount ?? participants.length;
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;
  const publicAlbumUrl = albumId ? `${getSiteUrl()}/album/${albumId}` : null;

  const handleCopyPublicLink = async () => {
    if (!publicAlbumUrl) return;
    const message = shareMessageWithUrl(albumShareLead(title), publicAlbumUrl);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: albumShareLead(title), url: publicAlbumUrl });
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
        window.prompt('Copy album link:', message);
      }
    }
  };

  return (
    <aside className="flex min-h-0 flex-col bg-[#050505] text-white">
      {shareHint ? (
        <p className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-bold text-white shadow-lg lg:bottom-6">
          {shareHint}
        </p>
      ) : null}
      <div className="min-h-0 flex-1">
        {/* Cover */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-900 sm:aspect-[16/10]">
          {coverSrc ? (
            <Image src={coverSrc} alt={title} fill unoptimized className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
          )}
          {publicAlbumUrl ? (
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition-colors hover:bg-black/65"
                aria-label="Copy public album link"
              >
                <HugeiconsIcon icon={Share01Icon} size={18} />
              </button>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/50" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pt-16">
            <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6">
          {/* Badges + host */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                  isPublic
                    ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
                    : 'border-white/20 bg-white/5 text-white/60'
                }`}
              >
                {isPublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                  isPaidEvent
                    ? 'border-amber-400/55 bg-amber-400/15 text-amber-200'
                    : 'border-green-400/45 bg-green-400/12 text-green-300'
                }`}
              >
                {isPaidEvent ? 'PAID' : 'FREE'}
              </span>
            </div>
            {host ? (
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={{ avatarUrl: host?.avatarUrl }}
                  size={44}
                  className="shrink-0 border border-white/15"
                />
                <p className="text-sm text-white/60">
                  Hosted by <span className="font-bold text-white">{host.name || host.username || 'Host'}</span>
                </p>
              </div>
            ) : null}
          </div>

          {/* Schedule + location — icon inline with primary; secondary spans full width (mobile AlbumDetailsModal) */}
          <div className="flex flex-row gap-3">
            <InfoMetaCard icon={Clock01Icon} primary={schedule.primary} secondary={schedule.secondary} />
            <InfoMetaCard icon={Location01Icon} primary={location.primary} secondary={location.secondary} />
          </div>

          {/* About */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pxi-purple">About</h3>
            <p className="text-sm font-light leading-relaxed text-white/80">
              {album?.event?.description?.trim() || 'No description provided.'}
            </p>
          </section>

          {ticketTiers.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pxi-purple">Ticket tiers</h3>
              <ul className="space-y-2">
                {ticketTiers.map((tier) => (
                  <li
                    key={tier.id || tier.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{tier.label}</p>
                      {tier.capacity != null ? (
                        <p className="mt-0.5 text-[11px] text-white/45">Capacity {tier.capacity}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-bold text-amber-200">
                      {formatTicketPrice(tier.priceUsd, album?.event?.currency || 'USD')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Line up */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pxi-purple">Line up</h3>
            <p className="text-xs leading-relaxed text-white/40">
              People highlighted for this event. They confirm by accepting an invite — separate from album staff.
            </p>
            {lineup.length > 0 ? (
              <ul className="space-y-2">
                {lineup.map((person) => (
                    <li
                      key={person.id || person.userId}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                    >
                      <UserAvatar
                        user={{ avatarUrl: person.avatarUrl }}
                        size={40}
                        className="shrink-0 border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {person.name?.trim() || `@${person.username || 'unknown'}`}
                        </p>
                        {person.name?.trim() && person.username ? (
                          <p className="truncate text-xs text-white/45">@{person.username}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-white/50">
                        {person.role || 'Line up'}
                      </span>
                    </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-white/45">No one on the line up yet.</p>
            )}
          </section>

          {/* Who's going */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pxi-purple">Who&apos;s going</h3>
              <span className="text-xs font-bold uppercase text-white">{memberCount} members</span>
            </div>
            {participants.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {participants.slice(0, 6).map((p, i) => (
                      <div
                        key={`${p.userId}-${i}`}
                        className="relative size-12 overflow-hidden rounded-full border-[3px] border-[#050505]"
                        style={{ zIndex: 10 - i }}
                      >
                        <UserAvatar user={{ avatarUrl: p.avatarUrl }} size={48} className="size-full" />
                      </div>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-white/45">view</p>
              </div>
            ) : (
              <p className="text-sm text-white/45">Be the first to join in the app.</p>
            )}
          </section>
        </div>
      </div>

      {/* Sheet: sticky in modal. Mobile page: fixed to viewport. Desktop: sticky in column.
          Primary CTA always says "Join Event" and routes to the web checkout flow when an
          event exists (handles EULA + free ticket / paid Stripe session). Private albums
          with no event fall back to a deep link into the app. */}
      <div
        className={
          isSheet
            ? 'sticky bottom-0 z-10 shrink-0 border-t border-white/10 bg-[#050505] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4'
            : 'shrink-0 border-t border-white/10 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 lg:sticky lg:bottom-0 lg:z-10'
        }
      >
        <div className="mx-auto flex w-full max-w-lg flex-row items-stretch gap-3 lg:max-w-none">
          {album?.event?.id ? (
            <Link
              href={`/events/${album.event.id}/checkout`}
              className="flex min-w-0 flex-1 items-center justify-center rounded-xl bg-white px-2 py-4 text-center text-[11px] font-black uppercase leading-tight tracking-[0.1em] text-black shadow-lg transition hover:bg-zinc-200 sm:text-sm sm:tracking-[0.15em]"
            >
              {ticketLabel ? `Join Event · ${ticketLabel}` : 'Join Event'}
            </Link>
          ) : openInAppUrl ? (
            <a
              href={openInAppUrl}
              className="flex min-w-0 flex-1 items-center justify-center rounded-xl bg-white px-2 py-4 text-center text-[11px] font-black uppercase leading-tight tracking-[0.1em] text-black shadow-lg transition hover:bg-zinc-200 sm:text-sm sm:tracking-[0.15em]"
            >
              Open album in app
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

