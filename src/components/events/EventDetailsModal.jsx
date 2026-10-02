'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  Link01Icon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import Portal from '@/components/ui/Portal';
import { displayImageSrc } from '@/lib/mediaUrl';
import { spotifyEmbedSrc } from '@/lib/spotify';
import { musicService } from '@/services/music';

// App look: a flat #1C1C1C sheet with 28px corners, a 24px cover, #2E2E2E inner cards.
const RADIUS_PX = 28;
const SHEET_SURFACE = 'bg-[#1c1c1c]';
const SMALL_CAPS = 'text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple';

const BADGE_TONE_CLASS = {
  purple: 'bg-pxi-purple/20 text-pxi-purple',
  amber: 'bg-amber-400/15 text-amber-300',
  green: 'bg-green-400/15 text-green-300',
  neutral: 'bg-white/10 text-white/60',
};

const PROVIDER_META = {
  SPOTIFY: { label: 'Spotify', bg: '#1DB954', text: '#000' },
  APPLE_MUSIC: { label: 'Apple Music', bg: '#fa2d48', text: '#fff' },
};

function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${BADGE_TONE_CLASS[tone] || BADGE_TONE_CLASS.neutral}`}
    >
      {children}
    </span>
  );
}

function SectionHeading({ children }) {
  return <h3 className={SMALL_CAPS}>{children}</h3>;
}

/** A purple small-caps label over a white value (the app's DATE / TIME pair). */
function LabeledValue({ label, value, note }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className={SMALL_CAPS}>{label}</p>
      <p className="mt-1.5 break-words text-[17px] font-black leading-snug text-white">{value}</p>
      {note ? <p className="mt-0.5 break-words text-[12px] font-medium text-[#9a9a9a]">{note}</p> : null}
    </div>
  );
}

/**
 * The callers send a schedule as { primary, secondary } (or one string). The album adapter's is a
 * weekday plus "OCT 12 · 9:00 PM – 2:00 AM": that becomes DATE "Saturday, OCT 12" and TIME
 * "9:00 PM – 2:00 AM". Anything that does not carry a time stays under DATE as a note.
 */
function toDateTime(schedule) {
  const primary = String(schedule?.primary || '').trim();
  const secondary = String(schedule?.secondary || '').trim();
  if (!primary) return { date: '', time: '', note: '' };
  if (!secondary) return { date: primary, time: '', note: '' };
  if (!/\d/.test(secondary)) return { date: primary, time: '', note: secondary };
  const parts = secondary.split(' · ');
  if (parts.length >= 2) return { date: `${primary}, ${parts[0]}`, time: parts.slice(1).join(' · '), note: '' };
  return { date: primary, time: secondary, note: '' };
}

/** Playlist section — multi-playlist lineup with per-row scores (mobile album parity). */
function PlaylistSection({ playlist }) {
  const eventId = playlist?.eventId || null;
  const [playlists, setPlaylists] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!eventId) return undefined;
    let alive = true;
    Promise.all([
      musicService.getLineupPlaylists(eventId).catch(() => ({ playlists: [], averageScore: null })),
      musicService.getEventMatch(eventId).catch(() => null),
    ])
      .then(([lineupRes, matchRes]) => {
        if (!alive) return;
        setPlaylists(Array.isArray(lineupRes?.playlists) ? lineupRes.playlists : []);
        setAverageScore(lineupRes?.averageScore ?? matchRes?.score ?? null);
        setMatchDetail(matchRes);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [eventId]);

  if (eventId) {
    if (!loaded) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading>Lineup playlists</SectionHeading>
          {averageScore != null && averageScore > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-pxi-purple">
              <HugeiconsIcon icon={MusicNote01Icon} size={12} />
              {averageScore}%
            </span>
          ) : null}
        </div>
        {playlists.length > 0 ? (
          <div className="space-y-2">
            {playlists.map((row) => {
              const provider = PROVIDER_META[row.provider];
              return (
                <div
                  key={row.id || row.sourceUrl}
                  className="flex items-center gap-3 rounded-2xl bg-[#2e2e2e] px-3 py-3 text-left"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide"
                        style={{ backgroundColor: provider?.bg || '#666', color: provider?.text || '#fff' }}
                      >
                        {provider?.label || row.provider}
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-white/45">
                        {row.trackCount} tracks
                      </span>
                    </div>
                    <p className="truncate text-sm font-bold text-white">
                      {row.ownerLabel ? `${row.ownerLabel} · ` : ''}
                      {row.title || 'Untitled playlist'}
                    </p>
                    {row.topGenres?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.topGenres.slice(0, 4).map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-[#9a9a9a]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <a
                      href={
                        row.shareToken
                          ? `/playlist/${row.shareToken}`
                          : row.sourceUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-[11px] font-bold text-pxi-purple transition-colors hover:text-white"
                    >
                      Open playlist ↗
                    </a>
                  </div>
                  {row.matchScore != null && row.matchScore > 0 ? (
                    <span className="shrink-0 text-sm font-black text-pxi-purple">{row.matchScore}%</span>
                  ) : null}
                </div>
              );
            })}
            {matchDetail?.matchedArtists?.length ? (
              <p className="text-xs leading-relaxed text-white/55">
                You listen to{' '}
                <span className="font-bold text-pxi-purple">
                  {matchDetail.matchedArtists.slice(0, 4).join(', ')}
                </span>
                {matchDetail.matchedArtists.length > 4
                  ? ` +${matchDetail.matchedArtists.length - 4} more`
                  : ''}
                — they&apos;re in this lineup
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-[#2e2e2e] px-3 py-3 text-left">
            <HugeiconsIcon icon={MusicNote01Icon} size={18} className="shrink-0 text-zinc-500" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-400">No lineup playlists yet.</p>
              <p className="text-[10px] text-zinc-600">The host can add them from mobile or their dashboard.</p>
            </div>
          </div>
        )}
      </section>
    );
  }

  const embed = playlist?.spotifyPlaylistUrl
    ? spotifyEmbedSrc(playlist.spotifyPlaylistUrl)
    : playlist?.spotifyTopTrackUrl
      ? spotifyEmbedSrc(playlist.spotifyTopTrackUrl)
      : null;
  if (!embed) return null;

  return (
    <section className="space-y-2">
      <SectionHeading>Event playlist</SectionHeading>
      <iframe
        title="Event playlist"
        src={embed}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-2xl"
      />
    </section>
  );
}

// Purple JOIN / GET TICKETS pill, and beside it the orange share pill (#FF5A1F at 15%).
const PRIMARY_LINK_CLASS =
  'inline-flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-pxi-purple px-6 text-[13px] font-black uppercase tracking-[0.08em] text-white transition active:scale-[0.98] hover:brightness-110';
const PRIMARY_DISABLED_CLASS =
  'inline-flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#2e2e2e] px-6 text-[13px] font-black uppercase tracking-[0.08em] text-[#9a9a9a]';
const SECONDARY_CLASS =
  'inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-pxi-orange/15 px-5 text-[12px] font-black uppercase tracking-[0.08em] text-pxi-orange transition hover:bg-pxi-orange/25 active:scale-[0.98]';

function ActionButton({ action, variant }) {
  if (!action) return null;
  const { label, href, onClick, icon, disabled } = action;

  if (variant === 'primary') {
    if (disabled || (!href && !onClick)) {
      return (
        <div className={PRIMARY_DISABLED_CLASS}>
          {icon}
          {label}
        </div>
      );
    }
    if (href) {
      return href.startsWith('/') ? (
        <Link href={href} onClick={onClick} className={PRIMARY_LINK_CLASS}>
          {icon}
          {label}
        </Link>
      ) : (
        <a href={href} onClick={onClick} className={PRIMARY_LINK_CLASS}>
          {icon}
          {label}
        </a>
      );
    }
    return (
      <Button variant="primary" className="h-[52px] min-w-0 flex-1" onClick={onClick} icon={icon}>
        {label}
      </Button>
    );
  }

  // The share pill always carries an orange link icon (the caller's own icon wins).
  const pillIcon = icon || <HugeiconsIcon icon={Link01Icon} size={16} />;

  if (href) {
    return href.startsWith('/') ? (
      <Link href={href} onClick={onClick} className={SECONDARY_CLASS}>
        {pillIcon}
        {label}
      </Link>
    ) : (
      <a href={href} onClick={onClick} className={SECONDARY_CLASS}>
        {pillIcon}
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={SECONDARY_CLASS}>
      {pillIcon}
      {label}
    </button>
  );
}

/**
 * Shared event/album details surface — the app's event view: a flat #1C1C1C sheet (28px
 * corners), EVENT DETAILS top-left with a close X, the name as a heavy caps title, a 24px cover,
 * the place, a DATE / TIME pair, the host with the description in a #2E2E2E bubble, then the
 * purple action pill and the orange share pill. Sections (badges, host, schedule/location,
 * ticket tiers, lineup, playlist, participants) render only when the caller supplies data.
 *
 * `presentation="modal"` — floating centered card with backdrop (desktop).
 * `presentation="sheet"` — full-screen sheet, drag-down (touch/pointer) to dismiss (mobile web).
 * `presentation="inline"` — fills its parent with its own scroll region, no portal/scrim/dismiss
 *   (the desktop album page's phone-sized right pane).
 */
export default function EventDetailsModal({
  open,
  onClose,
  presentation = 'modal',
  event,
  primaryAction,
  secondaryAction,
}) {
  const y = useMotionValue(0);
  const scrimOpacity = useTransform(y, [0, 420], [1, 0], { clamp: true });

  const isInline = presentation === 'inline';

  useEffect(() => {
    // Inline never owns the page — no scroll lock.
    if (!open || isInline) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, isInline]);

  useEffect(() => {
    if (!open || isInline) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, isInline]);

  useEffect(() => {
    if (open) y.set(0);
  }, [open, y]);

  const scheduleObj = !event?.schedule
    ? null
    : typeof event.schedule === 'string'
      ? { primary: event.schedule, secondary: '' }
      : event.schedule;

  const locationObj = !event?.location
    ? null
    : typeof event.location === 'string'
      ? { primary: event.location, secondary: '' }
      : event.location;

  const coverSrc = displayImageSrc(event?.image, null);

  if (!open || !event) return null;

  const dismiss = () => onClose?.();

  const handleDragEnd = (_e, info) => {
    if (info.offset.y > 100 || info.velocity.y > 700) {
      dismiss();
      return;
    }
    animate(y, 0, { type: 'spring', damping: 24, stiffness: 300 });
  };

  const hasTicketTiers = Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0;
  const hasLineup = Array.isArray(event.lineup) && event.lineup.length > 0;
  const hasParticipants = Array.isArray(event.participants) && event.participants.length > 0;
  const hasBadges = Array.isArray(event.badges) && event.badges.length > 0;
  const { date, time, note } = toDateTime(scheduleObj);
  const hostName = event.host ? event.host.name || event.host.username || 'Host' : '';

  const body = (
    <div className="space-y-6 px-6 pb-8 pt-1 text-white sm:px-8">
      {hasBadges ? (
        <div className="flex flex-wrap gap-2">
          {event.badges.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
        </div>
      ) : null}

      <h2 className="break-words text-[28px] font-black uppercase leading-[1.05] tracking-[-0.01em] text-white sm:text-[32px]">
        {event.title}
      </h2>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-[#2e2e2e]">
        {coverSrc ? (
          <Image src={coverSrc} alt="" fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 36rem" />
        ) : null}
      </div>

      {locationObj?.primary ? (
        <div className="min-w-0">
          <p className="break-words text-[22px] font-black uppercase leading-[1.1] tracking-[-0.01em] text-white">
            {locationObj.primary}
          </p>
          {locationObj.secondary ? (
            <p className="mt-1.5 break-words text-[13px] font-medium text-[#9a9a9a]">{locationObj.secondary}</p>
          ) : null}
        </div>
      ) : null}

      {date || time ? (
        <div className="grid grid-cols-2 gap-4">
          <LabeledValue label="Date" value={date} note={note} />
          <LabeledValue label="Time" value={time} />
        </div>
      ) : null}

      {event.host || event.description ? (
        <div className="flex items-start gap-3">
          {event.host ? <UserAvatar user={{ avatarUrl: event.host.avatarUrl }} size={44} className="shrink-0" /> : null}
          <div className="min-w-0 flex-1 rounded-[20px] bg-[#2e2e2e] px-4 py-3 text-left">
            {event.host ? (
              <p className={SMALL_CAPS}>
                Hosted by <span className="text-white">{hostName}</span>
              </p>
            ) : null}
            {event.description ? (
              <p className={`${event.host ? 'mt-1.5 ' : ''}break-words text-[14px] leading-relaxed text-white/90`}>
                {event.description}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {primaryAction || secondaryAction ? (
        <div className="flex items-stretch gap-3">
          <ActionButton action={primaryAction} variant="primary" />
          <ActionButton action={secondaryAction} variant="secondary" />
        </div>
      ) : null}

      {hasTicketTiers ? (
        <section className="space-y-2">
          <SectionHeading>Ticket tiers</SectionHeading>
          <ul className="space-y-2">
            {event.ticketTiers.map((tier) => (
              <li
                key={tier.id || tier.label}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#2e2e2e] px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{tier.label}</p>
                  {tier.capacity != null ? (
                    <p className="mt-0.5 text-[10px] text-[#9a9a9a]">Capacity {tier.capacity}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-black text-white">{tier.priceLabel}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasLineup ? (
        <section className="space-y-2">
          <SectionHeading>Line up</SectionHeading>
          <ul className="space-y-2">
            {event.lineup.map((person) => (
              <li
                key={person.id || person.userId}
                className="flex items-center gap-3 rounded-2xl bg-[#2e2e2e] px-3 py-2.5 text-left"
              >
                <UserAvatar user={{ avatarUrl: person.avatarUrl }} size={32} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">
                    {person.name?.trim() || `@${person.username || 'unknown'}`}
                  </p>
                  {person.name?.trim() && person.username ? (
                    <p className="truncate text-[10px] text-[#9a9a9a]">@{person.username}</p>
                  ) : null}
                </div>
                {person.role ? (
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-wide text-[#9a9a9a]">
                    {person.role}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PlaylistSection playlist={event.playlist} />

      {hasParticipants || event.memberCount != null ? (
        <section className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <SectionHeading>Who&apos;s going</SectionHeading>
            {event.memberCount != null ? (
              <span className="text-[10px] font-bold uppercase text-white">{event.memberCount} members</span>
            ) : null}
          </div>
          {hasParticipants ? (
            <div className="flex -space-x-3">
              {event.participants.slice(0, 8).map((p, i) => (
                <div
                  key={`${p.userId}-${i}`}
                  className="relative size-9 overflow-hidden rounded-full ring-2 ring-[#1c1c1c]"
                  style={{ zIndex: 10 - i }}
                >
                  <UserAvatar user={{ avatarUrl: p.avatarUrl }} size={36} className="size-full" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9a9a9a]">Be the first to join.</p>
          )}
        </section>
      ) : null}
    </div>
  );

  // App look: EVENT DETAILS small caps top-left, close X top-right. Sticky so the X stays in reach.
  const header = (
    <div className={`sticky top-0 z-10 flex items-center justify-between px-6 pb-3 pt-5 sm:px-8 sm:pt-6 ${SHEET_SURFACE}`}>
      <p className={SMALL_CAPS}>Event details</p>
      {!isInline ? (
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2e2e2e] text-white/80 transition-colors hover:text-white"
          aria-label="Close details"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>
      ) : (
        <span className="h-9" aria-hidden />
      )}
    </div>
  );

  // `presentation="inline"` — no portal, no scrim, no dismiss: fills its parent
  // (the desktop album page's right pane) with its own scroll region, wearing the
  // same flat sheet chrome as the floating desktop modal.
  if (isInline) {
    return (
      <div
        className={`flex h-full min-h-0 flex-col overflow-hidden ${SHEET_SURFACE}`}
        style={{ borderRadius: RADIUS_PX }}
      >
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {header}
          {body}
        </div>
      </div>
    );
  }

  if (presentation === 'sheet') {
    const overlay = (
      <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Event details">
        <motion.div className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} aria-hidden />
        <motion.div
          className={`absolute inset-0 flex flex-col overflow-hidden ${SHEET_SURFACE}`}
          style={{ y, borderTopLeftRadius: RADIUS_PX, borderTopRightRadius: RADIUS_PX }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 1000 }}
          dragElastic={{ top: 0, bottom: 1 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          <div className="mt-1.5 flex shrink-0 justify-center">
            <span className="h-1 w-9 rounded-full bg-white/25" aria-hidden />
          </div>
          {/* Independent scroll region — touch-action override + stopPropagation keep this
              scrollable by touch without the ancestor's drag-to-dismiss gesture hijacking it
              (same technique as the album focus overlay's comments panel). */}
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {header}
            {body}
          </div>
        </motion.div>
      </div>
    );
    return <Portal>{overlay}</Portal>;
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 pt-[8vh] md:p-8 md:pt-[10vh]"
      onClick={dismiss}
    >
      <div className="absolute inset-0 bg-black/80" aria-hidden />
      {/* Desktop floating card — click-outside (backdrop) + Escape dismiss per design law's
          desktop minimum. No drag gesture here: the card's content scrolls at the page level
          (no independent inner scroll region), so a drag-to-dismiss layer would fight touch
          scrolling on tall content — that tradeoff is handled properly in the "sheet"
          presentation instead, which does have its own scroll region. */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Event details"
        className={`relative w-full max-w-xl overflow-hidden ${SHEET_SURFACE}`}
        style={{ borderRadius: RADIUS_PX }}
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        {body}
      </motion.div>
    </div>
  );

  return <Portal>{overlay}</Portal>;
}
