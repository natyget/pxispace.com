'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon, LocationShare01Icon, Share01Icon } from '@hugeicons/core-free-icons';
import { displayImageSrc } from '@/lib/mediaUrl';
import { getSiteUrl } from '@/lib/siteUrl';
import { albumShareLead, shareMessageWithUrl } from '@/lib/shareCopy';
import { formatAlbumSchedule } from './publicAlbumDate';

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

function formatTicketPrice(event) {
  const type = String(event?.ticketType ?? '').toUpperCase();
  if (type !== 'PAID') return null;
  const price = Number(event?.ticketPrice ?? 0);
  if (!Number.isFinite(price) || price <= 0) return 'PAID';
  const sym = event?.currency === 'EUR' ? '€' : '$';
  return `${sym}${price.toFixed(2)}`;
}

export default function PublicAlbumDetailsPanel({ album, albumId, layout = 'column' }) {
  const isSheet = layout === 'sheet';
  const [shareHint, setShareHint] = useState(null);
  const title = useMemo(() => displayTitle(album), [album]);
  const isPublic = album?.event?.visibility === 'PUBLIC';
  const coverSrc = displayImageSrc(album?.event?.coverImage || album?.coverImage, null);
  const host = album?.host;
  const hostAvatar = displayImageSrc(host?.avatarUrl, null);
  const schedule = useMemo(() => formatAlbumSchedule(album?.event), [album?.event]);
  const location = useMemo(() => formatLocation(album?.event), [album?.event]);
  const ticketLabel = formatTicketPrice(album?.event);
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
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                  isPublic ? 'bg-white text-black' : 'border border-white/20 bg-white/5 text-white/80'
                }`}
              >
                {isPublic ? 'Public event' : 'Private album'}
              </span>
              {ticketLabel ? (
                <span className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
                  Paid event
                </span>
              ) : null}
            </div>
            {host ? (
              <div className="flex items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-zinc-800">
                  {hostAvatar ? (
                    <Image src={hostAvatar} alt="" width={44} height={44} unoptimized className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-zinc-500">?</div>
                  )}
                </div>
                <p className="text-sm text-white/60">
                  Hosted by <span className="font-bold text-white">{host.name || host.username || 'Host'}</span>
                </p>
              </div>
            ) : null}
          </div>

          {/* Schedule + location */}
          <div className="flex flex-row gap-3">
            <div className="flex min-w-0 flex-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/10">
                <HugeiconsIcon icon={Clock01Icon} className="size-3 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{schedule.primary}</p>
                {schedule.secondary ? (
                  <p className="mt-1 text-[11px] font-bold uppercase leading-relaxed tracking-wide text-white/45">
                    {schedule.secondary}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/10">
                <HugeiconsIcon icon={LocationShare01Icon} className="size-3 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{location.primary}</p>
                {location.secondary ? (
                  <p className="mt-1 text-[11px] font-bold uppercase leading-relaxed tracking-wide text-white/45">
                    {location.secondary}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* About */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">About</h3>
            <p className="text-sm font-light leading-relaxed text-white/80">
              {album?.event?.description?.trim() || 'No description provided.'}
            </p>
          </section>

          {/* Line up */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Line up</h3>
            <p className="text-xs leading-relaxed text-white/40">
              People highlighted for this event. They confirm by accepting an invite — separate from album staff.
            </p>
            {lineup.length > 0 ? (
              <ul className="space-y-2">
                {lineup.map((person) => {
                  const avatar = displayImageSrc(person.avatarUrl, null);
                  return (
                    <li
                      key={person.id || person.userId}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                    >
                      {avatar ? (
                        <Image src={avatar} alt="" width={40} height={40} unoptimized className="size-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-sm font-bold text-white/70">
                          {(person.name || person.username || '?')[0]?.toUpperCase()}
                        </div>
                      )}
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
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm italic text-white/45">No one on the line up yet.</p>
            )}
          </section>

          {/* Who's going */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Who&apos;s going</h3>
              <span className="text-xs font-bold text-white">{memberCount} members</span>
            </div>
            {participants.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {participants.slice(0, 6).map((p, i) => {
                    const avatar = displayImageSrc(p.avatarUrl, null);
                    return (
                      <div
                        key={`${p.userId}-${i}`}
                        className="relative size-12 overflow-hidden rounded-full border-[3px] border-[#050505] bg-zinc-800"
                        style={{ zIndex: 10 - i }}
                      >
                        {avatar ? (
                          <Image src={avatar} alt="" width={48} height={48} unoptimized className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-zinc-500">?</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm font-bold text-[#d946ef]">Join in the app to see everyone</p>
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

