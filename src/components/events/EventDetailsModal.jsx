'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  Clock01Icon,
  Location01Icon,
  MusicNote01Icon,
} from '@hugeicons/core-free-icons';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import Portal from '@/components/ui/Portal';
import { displayImageSrc } from '@/lib/mediaUrl';
import { spotifyEmbedSrc } from '@/lib/spotify';
import { musicService } from '@/services/music';

const RADIUS_PX = 20;
const GLASS_SURFACE = 'bg-[rgba(26,26,26,0.6)] backdrop-blur-xl';

const BADGE_TONE_CLASS = {
  purple: 'border-purple-500/50 bg-purple-500/20 text-purple-200',
  amber: 'border-amber-400/55 bg-amber-400/15 text-amber-200',
  green: 'border-green-400/45 bg-green-400/12 text-green-300',
  neutral: 'border-white/20 bg-white/5 text-white/60',
};

const PROVIDER_META = {
  SPOTIFY: { label: 'Spotify', bg: '#1DB954', text: '#000' },
  APPLE_MUSIC: { label: 'Apple Music', bg: '#fa2d48', text: '#fff' },
};

function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${BADGE_TONE_CLASS[tone] || BADGE_TONE_CLASS.neutral}`}
    >
      {children}
    </span>
  );
}

function SectionHeading({ children }) {
  return <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pxi-purple">{children}</h3>;
}

function MetaRow({ icon, primary, secondary }) {
  if (!primary) return null;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/5 px-3 py-2.5 text-left">
      <HugeiconsIcon icon={icon} size={16} className="shrink-0 text-white" aria-hidden />
      <span className="min-w-0">
        <p className="truncate text-[12px] font-bold leading-tight text-white">{primary}</p>
        {secondary ? (
          <p className="truncate text-[10px] font-semibold uppercase leading-tight tracking-wide text-white/45">
            {secondary}
          </p>
        ) : null}
      </span>
    </div>
  );
}

/** Playlist section — embeds a direct Spotify URL, or fetches the event's lineup
 * playlist by id (mirrors the album flow's music-match ingest). Renders nothing
 * when there's no playlist data to show at all. */
function PlaylistSection({ playlist }) {
  const eventId = playlist?.eventId || null;
  const [fetched, setFetched] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!eventId) return undefined;
    let alive = true;
    musicService
      .getEventPlaylist(eventId)
      .then((res) => {
        if (alive) setFetched(res?.playlist || null);
      })
      .catch(() => {
        if (alive) setFetched(null);
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
    const provider = fetched ? PROVIDER_META[fetched.provider] : null;
    return (
      <section className="space-y-2">
        <SectionHeading>Lineup playlist</SectionHeading>
        {fetched ? (
          <div className="space-y-2 rounded-2xl bg-white/[0.05] px-3 py-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide"
                style={{ backgroundColor: provider?.bg || '#666', color: provider?.text || '#fff' }}
              >
                {provider?.label || fetched.provider}
              </span>
              <span className="shrink-0 text-[10px] font-semibold text-white/45">{fetched.trackCount} tracks</span>
            </div>
            <p className="truncate text-sm font-bold text-white">{fetched.title}</p>
            {fetched.topGenres?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {fetched.topGenres.slice(0, 4).map((genre) => (
                  <span key={genre} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-zinc-300">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
            <a
              href={fetched.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-[11px] font-bold text-pxi-purple transition-colors hover:text-white"
            >
              Open playlist ↗
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.05] px-3 py-3 text-left">
            <HugeiconsIcon icon={MusicNote01Icon} size={18} className="shrink-0 text-zinc-500" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-400">No lineup playlist yet.</p>
              <p className="text-[10px] text-zinc-600">The host can add one from their dashboard.</p>
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

const PRIMARY_LINK_CLASS =
  'inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all duration-300 ease-out active:scale-95 neon-pill hover:scale-105';
const PRIMARY_DISABLED_CLASS =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm font-bold uppercase tracking-widest text-zinc-500';
const SECONDARY_CLASS =
  'flex w-full items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)]/15 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--pxi-orange)] transition hover:scale-105 hover:bg-[var(--pxi-orange)]/25';

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
      <Button variant="neon" className="w-full uppercase tracking-widest" onClick={onClick} icon={icon}>
        {label}
      </Button>
    );
  }

  if (href) {
    return href.startsWith('/') ? (
      <Link href={href} onClick={onClick} className={SECONDARY_CLASS}>
        {icon}
        {label}
      </Link>
    ) : (
      <a href={href} onClick={onClick} className={SECONDARY_CLASS}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={SECONDARY_CLASS}>
      {icon}
      {label}
    </button>
  );
}

/**
 * Shared event/album details surface — glass card (rgba(26,26,26,0.6) + blur, radius 20,
 * borderless), generalizing `EventPreviewModal`'s pattern. Sections (badges, host,
 * schedule/location, about, ticket tiers, lineup, playlist, participants) render only
 * when the caller supplies data for them.
 *
 * `presentation="modal"` — floating centered card with backdrop (desktop).
 * `presentation="sheet"` — full-screen sheet, drag-down (touch/pointer) to dismiss (mobile web).
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

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  const body = (
    <div className="space-y-5 p-6 text-white sm:p-8">
      {hasBadges ? (
        <div className="flex flex-wrap gap-2">
          {event.badges.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
        </div>
      ) : null}

      <h2 className="text-2xl font-black uppercase leading-tight tracking-tighter text-white">{event.title}</h2>

      {event.host ? (
        <div className="flex items-center gap-2">
          <UserAvatar user={{ avatarUrl: event.host.avatarUrl }} size={28} className="shrink-0" />
          <p className="text-[11px] text-white/60">
            Hosted by <span className="font-bold text-white">{event.host.name || event.host.username || 'Host'}</span>
          </p>
        </div>
      ) : null}

      {scheduleObj || locationObj ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <MetaRow icon={Clock01Icon} primary={scheduleObj?.primary} secondary={scheduleObj?.secondary} />
          <MetaRow icon={Location01Icon} primary={locationObj?.primary} secondary={locationObj?.secondary} />
        </div>
      ) : null}

      {event.description ? (
        <section className="space-y-2">
          <SectionHeading>About</SectionHeading>
          <p className="text-sm leading-relaxed text-zinc-400">{event.description}</p>
        </section>
      ) : null}

      {hasTicketTiers ? (
        <section className="space-y-2">
          <SectionHeading>Ticket tiers</SectionHeading>
          <ul className="space-y-2">
            {event.ticketTiers.map((tier) => (
              <li
                key={tier.id || tier.label}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-3 py-2 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">{tier.label}</p>
                  {tier.capacity != null ? (
                    <p className="mt-0.5 text-[9px] text-white/45">Capacity {tier.capacity}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-xs font-bold text-amber-200">{tier.priceLabel}</p>
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
                className="flex items-center gap-3 rounded-2xl bg-white/[0.05] px-3 py-2 text-left"
              >
                <UserAvatar user={{ avatarUrl: person.avatarUrl }} size={32} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">
                    {person.name?.trim() || `@${person.username || 'unknown'}`}
                  </p>
                  {person.name?.trim() && person.username ? (
                    <p className="truncate text-[10px] text-white/45">@{person.username}</p>
                  ) : null}
                </div>
                {person.role ? (
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-wide text-white/50">
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
                  className="relative size-9 overflow-hidden rounded-full ring-2 ring-[#141416]"
                  style={{ zIndex: 10 - i }}
                >
                  <UserAvatar user={{ avatarUrl: p.avatarUrl }} size={36} className="size-full" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/45">Be the first to join.</p>
          )}
        </section>
      ) : null}

      {primaryAction || secondaryAction ? (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <ActionButton action={primaryAction} variant="primary" />
          <ActionButton action={secondaryAction} variant="secondary" />
        </div>
      ) : null}
    </div>
  );

  const header = (
    <div className="relative h-48 shrink-0 sm:h-56">
      {coverSrc ? (
        <Image src={coverSrc} alt="" fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 36rem" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,20,20,0.95)] to-transparent" />
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Close details"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={20} />
      </button>
    </div>
  );

  if (presentation === 'sheet') {
    const overlay = (
      <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Event details">
        <motion.div className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} aria-hidden />
        <motion.div
          className={`absolute inset-0 flex flex-col overflow-hidden ${GLASS_SURFACE} bg-[#0c0c0c]`}
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden />
      {/* Desktop floating card — click-outside (backdrop) + Escape dismiss per design law's
          desktop minimum. No drag gesture here: the card's content scrolls at the page level
          (no independent inner scroll region), so a drag-to-dismiss layer would fight touch
          scrolling on tall content — that tradeoff is handled properly in the "sheet"
          presentation instead, which does have its own scroll region. */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Event details"
        className={`relative w-full max-w-xl overflow-hidden shadow-2xl ${GLASS_SURFACE}`}
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
