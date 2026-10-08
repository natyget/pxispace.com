'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, LinkForwardIcon, Navigation03Icon, PauseIcon, PlayIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import UserAvatar from '@/components/ui/UserAvatar';
import { organizerHref } from '@/lib/organizerPage';
import Portal from '@/components/ui/Portal';
import { displayImageSrc } from '@/lib/mediaUrl';
import { spotifyEmbedSrc } from '@/lib/spotify';
import { musicService } from '@/services/music';
import { previewSrc, useSongPreview } from '@/lib/songPreview';

/*
 * The app's event view (pxi-mobile-app/src/components/event), on the web: a flat #1C1C1C sheet with
 * 28px top corners; EVENT DETAILS + X; the name and the place in heavy purple display type; a tall
 * rounded cover; DATE / TIME; a dim-purple OPEN ALBUM pill with the orange share button; the host
 * with the description in a #2F2F2F speech bubble; members; music, line-up and the map card when the
 * data has them; and a sticky Deny | Join footer. No gradients, glows, blur or hairline borders.
 */
const RADIUS_PX = 28;
const SHEET = '#1C1C1C';
const PURPLE = '#A523EF';
const DISPLAY_FONT = '"Stack Sans Notch", Inter, sans-serif';
const BODY_FONT = 'Inter, system-ui, -apple-system, sans-serif';
const DISPLAY_SHADOW = '0 3px 6px rgba(0,0,0,0.45)';
const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';

/** Small grey caps: PUBLIC / PRIVATE, the labels of the line-up and the map. */
const CAPS_GREY = 'text-[11px] font-extrabold uppercase leading-[13px] tracking-[0.12em] text-white/55';

const PROVIDER_LABEL = { SPOTIFY: 'Spotify', APPLE_MUSIC: 'Apple Music' };

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// (The project's no-unused-vars does not see `<motion.div>` as a use of `motion`; a capitalised alias it does.)
const MotionDiv = motion.div;

/* ───────────────────────────── formatting (the app's eventFormat.ts) ───────────────────────────── */

const LOCALE = 'en-US';
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** DATE: "SAT, OCT 4"; the year joins it only when it is not this year. */
function formatDateShort(start) {
  const sameYear = start.getFullYear() === new Date().getFullYear();
  return start
    .toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
    .toUpperCase();
}

/** TIME: "9:00 PM", then "UNTIL 2:00 AM" (the date joins it when it ends a day or more later). */
function formatTimeParts(start, end) {
  const time = (d) => d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  const first = time(start);
  if (!end || end.getTime() <= start.getTime()) return { start: first, until: '' };
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((day(end) - day(start)) / DAY_MS);
  const sameNight = dayDiff === 0 || (dayDiff === 1 && end.getTime() - start.getTime() < DAY_MS);
  const until = sameNight
    ? time(end)
    : end.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  return { start: first, until: `UNTIL ${until}` };
}

/**
 * The callers send either ISO `startDate` / `endDate` (formatted here the app's way) or an older
 * `schedule` of { primary, secondary }: the album adapter's is a weekday plus "OCT 12, 9:00 PM –
 * 2:00 AM", which becomes DATE "SATURDAY, OCT 12" and TIME "9:00 PM – 2:00 AM". Anything without a
 * time stays under DATE as a note.
 */
function toWhen(event) {
  const start = parseDate(event?.startDate);
  if (start) {
    const parts = formatTimeParts(start, parseDate(event?.endDate));
    return { date: formatDateShort(start), time: parts.start, until: parts.until, note: '' };
  }
  const s = event?.schedule;
  const primary = String((typeof s === 'string' ? s : s?.primary) || '').trim();
  const secondary = String((typeof s === 'string' ? '' : s?.secondary) || '').trim();
  if (!primary) return { date: '', time: '', until: '', note: '' };
  if (!secondary) return { date: primary.toUpperCase(), time: '', until: '', note: '' };
  if (!/\d/.test(secondary)) return { date: primary.toUpperCase(), time: '', until: '', note: secondary };
  // The first comma ends the date; older callers used a middle dot there.
  const parts = secondary.split(/\s*(?:,|\u00b7)\s*/); // allow-dot
  if (parts.length >= 2) {
    return { date: `${primary}, ${parts[0]}`.toUpperCase(), time: parts.slice(1).join(', '), until: '', note: '' };
  }
  return { date: primary.toUpperCase(), time: secondary, until: '', note: '' };
}

const COORDINATE = /^-?\d{1,3}(\.\d+)?$/;
const NO_PLACE = /^location tb[ad]$/i;

/**
 * The place: the venue's own name is the big purple title (the first segment only), the rest of the
 * address is printed once, on the map card. Callers send a string ("venue, street, city") or
 * { primary, secondary, address?, latitude?, longitude? }.
 */
function toPlace(event) {
  const loc = event?.location;
  if (!loc) return null;
  const isObj = typeof loc === 'object';
  const raw = String((isObj ? loc.primary : loc) || '').trim();
  if (!raw) return null;
  const parts = raw.split(/\n|,|\u2022/).map((p) => p.trim()).filter(Boolean); // allow-dot: older callers separate with a bullet
  const secondary = isObj ? String(loc.secondary || '').trim().replace(/\s*\u00b7\s*/g, ', ') : ''; // allow-dot
  const isPin = parts.length === 2 && parts.every((p) => COORDINATE.test(p));
  const none = NO_PLACE.test(raw);
  const num = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  // Coordinates: the caller's, else the ones a dropped pin prints as its name.
  const latitude = num(event?.latitude ?? loc?.latitude ?? (isPin ? parts[0] : null));
  const longitude = num(event?.longitude ?? loc?.longitude ?? (isPin ? parts[1] : null));
  const hasCoords = latitude != null && longitude != null;
  // What Maps searches for.
  const address = none || isPin ? '' : String((isObj && loc.address) || '').trim() || [raw, secondary].filter(Boolean).join(', ');
  return {
    // The title is the first segment only; a dropped pin with no name says what it is.
    venue: none ? 'Location TBD' : isPin ? 'Pinned location' : isObj ? raw : parts[0] || raw,
    address,
    // What the map card prints: the address without the venue in front.
    addressLine: isPin ? raw : secondary || (isObj ? '' : parts.slice(1).join(', ')) || address,
    latitude: hasCoords ? latitude : null,
    longitude: hasCoords ? longitude : null,
    hasMap: !none && (!!address || hasCoords),
  };
}

/** PUBLIC / PRIVATE first, then any other badge the caller sent (PAID, FINALIZED...), as one quiet line. */
function toCapsLine(event) {
  const labels = (Array.isArray(event?.badges) ? event.badges : []).map((b) => String(b?.label || '').trim()).filter(Boolean);
  const isVis = (l) => /^(public|private)$/i.test(l);
  const vis = String(event?.visibility || '').trim() || labels.find(isVis) || '';
  return [vis, ...labels.filter((l) => !isVis(l))]
    .filter(Boolean)
    .map((s) => s.toUpperCase())
    .join(', ');
}

/* ───────────────────────────── pieces ───────────────────────────── */

/**
 * Heavy display type that fits its box and is never cut: the largest size (between `min` and `max`)
 * at which the text wraps to at most `maxLines` lines with no word wider than the box. If even the
 * smallest size does not fit, a long word breaks across lines instead of being truncated.
 * (The app's FitTitle, measured in the browser with the real font.)
 */
function FitTitle({ text, as = 'p', maxFontSize, minFontSize, maxLines, lineHeight, letterSpacingEm = -0.01 }) {
  const Tag = as;
  const ref = useRef(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const avail = el.clientWidth;
    if (avail <= 0) return;
    el.style.overflowWrap = 'normal';
    let chosen = minFontSize;
    for (let s = maxFontSize; s >= minFontSize; s -= 1) {
      el.style.fontSize = `${s}px`;
      const lines = Math.round(el.scrollHeight / (s * lineHeight));
      if (el.scrollWidth <= avail + 1 && lines <= maxLines) {
        chosen = s;
        break;
      }
    }
    el.style.fontSize = `${chosen}px`;
    el.style.overflowWrap = 'anywhere';
  }, [maxFontSize, minFontSize, maxLines, lineHeight]);

  useIsoLayoutEffect(() => {
    fit();
  }, [fit, text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let width = el.clientWidth;
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        fit();
      }
    });
    ro?.observe(el);
    // Measured again once the display face has loaded (the fallback face is a different width).
    let alive = true;
    document.fonts?.load?.(`700 ${maxFontSize}px "Stack Sans Notch"`).then(() => alive && fit()).catch(() => {});
    document.fonts?.ready?.then(() => alive && fit());
    return () => {
      alive = false;
      ro?.disconnect();
    };
  }, [fit, maxFontSize]);

  return (
    <Tag
      ref={ref}
      className="m-0 text-center uppercase"
      style={{
        color: PURPLE,
        fontFamily: DISPLAY_FONT,
        fontWeight: 700,
        fontSize: maxFontSize,
        lineHeight,
        letterSpacing: `${letterSpacingEm}em`,
        textShadow: DISPLAY_SHADOW,
        textWrap: 'balance',
        overflowWrap: 'anywhere',
      }}
    >
      {text}
    </Tag>
  );
}

/**
 * A one-line pill label that shrinks (down to 75%) instead of being cut or wrapping — the app's
 * `adjustsFontSizeToFit` — so "Get ticket $10.00" fits a half-width pill on a 320px phone.
 */
function FitLabel({ children, max = 17 }) {
  const ref = useRef(null);
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientWidth <= 0) return;
    let size = max;
    el.style.whiteSpace = '';
    el.style.lineHeight = '';
    el.style.fontSize = `${size}px`;
    while (size > max * 0.75 && el.scrollWidth > el.clientWidth) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
    // Still too wide at 75% (a long price on a 320px phone): two short lines, never a cut-off price.
    if (el.scrollWidth > el.clientWidth) {
      el.style.whiteSpace = 'normal';
      el.style.lineHeight = '1.1';
    }
  }, [max]);

  useIsoLayoutEffect(() => {
    fit();
  }, [fit, children]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <span ref={ref} className="block min-w-0 overflow-hidden whitespace-nowrap text-center" style={{ fontSize: max }}>
      {children}
    </span>
  );
}

/** One of the DATE / TIME columns: a purple small-caps label over a white heavy value. */
function WhenColumn({ label, value, quiet, size }) {
  return (
    <div className="flex min-w-0 shrink flex-col items-center text-center">
      <p className="text-[11px] font-extrabold uppercase leading-[13px] tracking-[0.09em]" style={{ color: PURPLE }}>
        {label}
      </p>
      <p
        className="max-w-full break-words uppercase text-white"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: `${Math.round(size * 1.1)}px`,
          letterSpacing: '-0.4px',
          marginTop: Math.round((7 - 0.22 * 11 - 0.18 * size) * 2) / 2 - size * 0.1375,
        }}
        suppressHydrationWarning
      >
        {value}
      </p>
      {quiet ? (
        <p
          className="text-[11.5px] font-bold uppercase leading-[14px] tracking-[0.05em] text-white/55"
          style={{ marginTop: 2 + size * 0.1375 }}
          suppressHydrationWarning
        >
          {quiet}
        </p>
      ) : null}
    </div>
  );
}

/** What a pill is made of: the caller's label (and optional icon) on a button, a link or a status. */
function ActionEl({ action, className, style, children }) {
  const { href, onClick, disabled } = action;
  if (disabled || (!href && !onClick)) {
    return (
      <div className={className} style={style} aria-disabled="true">
        {children}
      </div>
    );
  }
  if (href) {
    return href.startsWith('/') ? (
      <Link href={href} onClick={onClick} className={className} style={style}>
        {children}
      </Link>
    ) : (
      <a href={href} onClick={onClick} className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );
}

const OPEN_ALBUM_CLASS =
  'inline-flex h-[37px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#572077] px-4 text-[15.5px] font-black uppercase tracking-[0.3px] text-[#A523EF] transition-transform active:scale-[0.97]';
const ROUND_SHARE_CLASS =
  'inline-flex size-[37px] shrink-0 items-center justify-center rounded-full bg-[rgba(255,90,31,0.15)] text-[#FF5A1F] transition-transform active:scale-[0.94]';

/** Share the event: the phone's share sheet on touch devices, a copied link everywhere else. */
function ShareButton({ title, url }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async () => {
    const target = new URL(url || window.location.href, window.location.href).toString();
    const touch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: title || undefined, url: target });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', target);
    }
  };

  return (
    <>
      <button type="button" onClick={share} className={ROUND_SHARE_CLASS} aria-label="Share">
        <HugeiconsIcon icon={copied ? Tick02Icon : LinkForwardIcon} size={17} />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </>
  );
}

/**
 * The host's avatar, their ABOUT bubble (the event description) and HOSTED BY under the avatar. The avatar and the
 * name lead to the host's organizer page (/u/<username>, else /u/<id>); a host with neither is not a link.
 */
function HostBubble({ host, hostName, about }) {
  const href = organizerHref(host);
  const text = String(about || '').trim();
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useIsoLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <section className="mt-[46px] px-5" aria-label="Host">
      <div className="flex items-end pl-[22px]">
        {href ? (
          // The name below is the link the keyboard and a screen reader reach; the picture is the same link for a tap.
          <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0 rounded-full">
            <UserAvatar user={{ avatarUrl: host?.avatarUrl }} size={94} className="block shrink-0" />
          </Link>
        ) : (
          <UserAvatar user={{ avatarUrl: host?.avatarUrl }} size={94} className="shrink-0" />
        )}
        <div className="relative mb-1.5 ml-[22px] min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute bottom-0 -left-[31px]"
            width="32"
            height="22"
            viewBox="0 0 32 22"
            aria-hidden="true"
          >
            <path d="M32 0C32 9 20 19 0 22L32 22Z" fill="#2F2F2F" />
          </svg>
          <div className="flex min-h-[88px] flex-col gap-1.5 rounded-[22px] rounded-bl-none bg-[#2F2F2F] px-4 pb-3.5 pt-3">
            <p className="text-[11px] font-extrabold leading-[13px] tracking-[0.11em] text-white/40">ABOUT</p>
            {text ? (
              <p
                ref={textRef}
                className="whitespace-pre-line break-words text-[15px] font-medium leading-[21px] text-white/90"
                style={expanded ? undefined : { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {text}
              </p>
            ) : (
              <p className="text-[15px] font-medium leading-[21px] text-white/45">No description yet.</p>
            )}
            {text && (clamped || expanded) ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-0.5 self-start text-[11px] font-black uppercase tracking-[0.1em]"
                style={{ color: PURPLE }}
                aria-label={expanded ? 'Show less' : 'Read more'}
              >
                {expanded ? 'Less' : 'More'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {hostName ? (
        <div className="mt-[15px] pl-[15px]">
          {href ? (
            // The invisible `before` box widens the tap target past the two lines of text without moving anything.
            <Link
              href={href}
              className="relative flex w-fit max-w-full flex-col gap-0.5 rounded-sm outline-offset-4 transition-opacity before:absolute before:-inset-x-3 before:-inset-y-2.5 before:content-[''] hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-white active:opacity-70"
            >
              <span className="text-[12.5px] font-extrabold uppercase leading-[15px] tracking-[0.02em] text-white">Hosted by {hostName}</span>
              {host?.username ? <span className="text-[12px] font-semibold leading-[14px] text-white/55">@{host.username}</span> : null}
            </Link>
          ) : (
            <div className="flex flex-col gap-0.5">
              <p className="text-[12.5px] font-extrabold uppercase leading-[15px] tracking-[0.02em] text-white">Hosted by {hostName}</p>
              {host?.username ? <p className="text-[12px] font-semibold leading-[14px] text-white/55">@{host.username}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

/** "<N> MEMBERS", a row of round avatars (the last one "+N" past five), and the WHO'S GOING caption. */
function MembersBlock({ count, participants }) {
  const overflowing = count > 5;
  const shown = participants.slice(0, overflowing ? 4 : 5);
  const extra = overflowing ? count - shown.length : 0;
  return (
    <section className="mt-[30px] px-5" aria-label="Who's going">
      <p className="pl-[15px] text-[12.5px] font-extrabold uppercase leading-[15px] tracking-[0.02em] text-white">
        {count} {count === 1 ? 'member' : 'members'}
      </p>
      {shown.length > 0 ? (
        <div className="mt-3.5 flex justify-center gap-2.5">
          {shown.map((p, i) => (
            <div key={`${p.userId || p.username || 'm'}-${i}`} className="aspect-square min-w-0 flex-[0_1_51px]">
              <UserAvatar user={{ avatarUrl: p.avatarUrl }} size={51} className="size-full!" />
            </div>
          ))}
          {extra > 0 ? (
            <div className="flex aspect-square min-w-0 flex-[0_1_51px] items-center justify-center rounded-full bg-[#2A2A2C] text-[13px] font-extrabold text-white">
              +{extra}
            </div>
          ) : null}
        </div>
      ) : count === 0 ? (
        <p className="mt-4 text-center text-[13px] font-semibold text-white/55">Be the first to join.</p>
      ) : null}
      <p
        className="mt-[18px] text-center text-[20px] text-white"
        style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '-0.2px' }}
      >
        WHO’S GOING
      </p>
    </section>
  );
}

/**
 * A flat spinning record: grooves and the label turn, the disc stays put (reduced motion: it sits still).
 * With `onToggle` it is the song's play button: a flat 55% black circle on the label shows play or pause.
 */
function Vinyl({ size = 152, artwork, playing = false, onToggle }) {
  const label = Math.round(size * 0.37);
  const hole = Math.max(5, Math.round(size * 0.04));
  const rings = [0.96, 0.89, 0.82, 0.75, 0.68, 0.61, 0.54];
  const Wrapper = onToggle ? 'button' : 'div';
  const wrapperProps = onToggle
    ? { type: 'button', onClick: onToggle, 'aria-pressed': playing, 'aria-label': playing ? 'Pause the song' : 'Play the song' }
    : { 'aria-hidden': true };
  return (
    <Wrapper className="relative shrink-0 rounded-full" style={{ width: size, height: size }} {...wrapperProps}>
      <div className="absolute inset-0 animate-[spin_9s_linear_infinite] overflow-hidden rounded-full bg-[#0A0A0C] motion-reduce:animate-none">
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          {rings.map((r, i) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={50 * r}
              fill="none"
              stroke={i % 2 === 0 ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0.035)'}
              strokeWidth="0.4"
            />
          ))}
          <circle cx="50" cy="50" r="49.2" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />
        </svg>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[1.5px] border-black/50"
          style={{ width: label, height: label, backgroundColor: PURPLE }}
        >
          {artwork ? <Image src={artwork} alt="" fill loading="eager" unoptimized sizes={`${label}px`} className="object-cover" /> : null}
          <span
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/55"
            style={{ top: label * 0.1, width: label * 0.12, height: label * 0.12 }}
          />
        </div>
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0A0A0C]"
          style={{ width: hole, height: hole }}
        />
      </div>
      {onToggle ? (
        <span className="absolute left-1/2 top-1/2 flex size-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white">
          <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={17} strokeWidth={2.2} />
        </span>
      ) : null}
    </Wrapper>
  );
}

/** The event's top song ({ title, artist, artworkUrl }); `topSongArtworkUrl`, the art the host uploaded, wins over the song's own. */
function readTopSong(event) {
  const raw = event?.topSong;
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  const artist = typeof raw.artist === 'string' ? raw.artist.trim() : '';
  const hostArt = typeof event?.topSongArtworkUrl === 'string' ? event.topSongArtworkUrl.trim() : '';
  const artwork = hostArt || (typeof raw.artworkUrl === 'string' ? raw.artworkUrl.trim() : '');
  return { title, artist, artwork: artwork ? displayImageSrc(artwork, null) : null, previewUrl: previewSrc(raw.previewUrl) };
}

/**
 * Music block (the app's MusicBlock): the record beside the top song and its artist — or the
 * match / provider line when there is no song — and the purple playlist links, each with its sleeve.
 */
function MusicSection({ playlist, cover, topSong }) {
  const eventId = playlist?.eventId || null;
  const [playlists, setPlaylists] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [loaded, setLoaded] = useState(false);
  // The record plays the song's ~30 s preview from a tap (the app pops it on Discover); it stops on close.
  const preview = useSongPreview();
  const songSrc = topSong?.previewUrl || null;
  const songPlaying = Boolean(songSrc) && preview.playingSrc === songSrc;

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

  if (eventId || topSong) {
    // The block hides when the event has no song and no playlists (the app's `music: null`).
    if (!topSong && (!loaded || playlists.length === 0)) return null;
    const hasMatch = averageScore != null && averageScore > 0;
    const primary = topSong
      ? topSong.title
      : hasMatch
        ? `${averageScore}% match`
        : playlists.length > 1
          ? 'Playlists'
          : 'Playlist';
    const secondary = topSong
      ? topSong.artist
      : hasMatch
        ? 'with your taste'
        : Array.from(new Set(playlists.map((p) => PROVIDER_LABEL[p.provider] || 'Playlist'))).join(', ');
    const visible = playlists.slice(0, 4);
    const hidden = playlists.length - visible.length;
    const matched = matchDetail?.matchedArtists || [];
    return (
      <section className="mt-[26px] px-[29px]" aria-label="Music">
        <div className="flex items-center gap-3.5">
          <Vinyl
            size={152}
            artwork={topSong?.artwork || cover}
            playing={songPlaying}
            onToggle={songSrc ? () => (songPlaying ? preview.stop() : preview.start(songSrc)) : undefined}
          />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
            <p className="line-clamp-2 text-[20px] font-extrabold leading-[1.15] tracking-[-0.2px] text-white">{primary}</p>
            {secondary ? <p className="line-clamp-2 text-[13px] font-bold text-white">{secondary}</p> : null}
            {visible.length > 0 || hidden > 0 ? (
              <ul className="mt-3 flex w-full flex-col items-center gap-[3px]">
                {visible.map((row) => {
                  const sleeve = row.coverUrl ? displayImageSrc(row.coverUrl, null) : null;
                  return (
                    <li key={row.id || row.sourceUrl} className="flex max-w-full min-w-0 items-center justify-center gap-1.5">
                      {sleeve ? <Image src={sleeve} alt="" width={18} height={18} unoptimized className="size-[18px] shrink-0 rounded-[4px] bg-[#2E2E2E] object-cover" /> : null}
                      <a
                        href={row.shareToken ? `/playlist/${row.shareToken}` : row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 truncate text-[15px] font-black leading-[18px] transition-colors hover:text-white"
                        style={{ color: PURPLE }}
                      >
                        {row.title || 'Untitled playlist'}
                      </a>
                    </li>
                  );
                })}
                {hidden > 0 ? <li className="mt-0.5 text-[12px] font-bold text-white/55">+{hidden} more</li> : null}
              </ul>
            ) : null}
          </div>
        </div>
        {matched.length > 0 ? (
          <p className="mt-2.5 px-1.5 text-center text-[12px] leading-[17px] text-white/55">
            You listen to <span className="font-bold" style={{ color: PURPLE }}>{matched.slice(0, 4).join(', ')}</span>
            {matched.length > 4 ? ` +${matched.length - 4} more` : ''} — they’re in this lineup
          </p>
        ) : null}
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
    <section className="mt-[26px] px-5" aria-label="Event playlist">
      <iframe
        title="Event playlist"
        src={embed}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-[22px]"
      />
    </section>
  );
}

/** Line-up circles with names: two per row, an odd last one centred (the app's LineupGrid). */
function LineupGrid({ people }) {
  return (
    <section className="mt-[34px] px-5" aria-label="Line up">
      <ul className="flex flex-wrap justify-center gap-y-[17px]">
        {people.map((person) => {
          const name = person.name?.trim() || `@${person.username || 'unknown'}`;
          return (
            <li key={person.id || person.userId || name} className="flex w-1/2 min-w-0 flex-col items-center px-1.5 text-center">
              <UserAvatar user={{ avatarUrl: person.avatarUrl }} size={94} className="shrink-0" />
              <div className="mt-3.5 w-full font-extrabold leading-[1.15] tracking-[-0.2px] text-white">
                <FitLabel max={20}>{name}</FitLabel>
              </div>
              {person.role ? <p className={`mt-1 max-w-full truncate ${CAPS_GREY}`}>{person.role}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Small deterministic hash so each address draws its own street pattern (the app's DrawnMap). */
function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const MAP_W = 330;
const MAP_H = 220;

/** Flat stand-in for map tiles: dark blocks, a street grid and a river, drawn per address. */
function DrawnMap({ seedText }) {
  const rand = seeded(hashSeed(seedText || 'pxi'));
  const roads = [];
  for (let i = 0; i < 6; i += 1) {
    const y = 20 + rand() * (MAP_H - 40);
    roads.push({ x1: -10, y1: y + (rand() - 0.5) * 30, x2: MAP_W + 10, y2: y + (rand() - 0.5) * 30, w: 1 + rand() * 2.2 });
  }
  for (let i = 0; i < 7; i += 1) {
    const x = 16 + rand() * (MAP_W - 32);
    roads.push({ x1: x + (rand() - 0.5) * 30, y1: -10, x2: x + (rand() - 0.5) * 30, y2: MAP_H + 10, w: 1 + rand() * 2.2 });
  }
  const blocks = Array.from({ length: 5 }, () => ({
    x: rand() * (MAP_W - 60),
    y: rand() * (MAP_H - 50),
    w: 40 + rand() * 70,
    h: 24 + rand() * 40,
  }));
  const riverY = 40 + rand() * 120;
  const river = `M -10 ${riverY} C ${MAP_W * 0.3} ${riverY - 44}, ${MAP_W * 0.6} ${riverY + 52}, ${MAP_W + 10} ${riverY - 12}`;
  return (
    <svg className="absolute inset-0 size-full" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={MAP_W} height={MAP_H} fill="#151519" />
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill="rgba(165,35,239,0.07)" />
      ))}
      <path d={river} stroke="rgba(120,90,255,0.16)" strokeWidth="14" fill="none" strokeLinecap="round" />
      {roads.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="rgba(255,255,255,0.09)" strokeWidth={r.w} />
      ))}
    </svg>
  );
}

/** The map card: a real dark map when the event has coordinates (the same Geoapify key the site uses), else a drawn one. */
function MapCard({ place }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { latitude, longitude } = place;
  const hasCoords = latitude != null && longitude != null;
  const mapUri =
    hasCoords && GEOAPIFY_KEY && !imageFailed
      ? `https://maps.geoapify.com/v1/staticmap?style=dark-matter&width=${MAP_W}&height=${MAP_H}&scaleFactor=2&center=lonlat:${longitude},${latitude}&zoom=15&apiKey=${GEOAPIFY_KEY}`
      : null;
  const query = hasCoords ? `${latitude},${longitude}` : encodeURIComponent(place.address || place.venue || '');
  const printed = place.addressLine || place.address || 'Location TBD';
  return (
    <section className="mt-[26px] flex justify-center px-5" aria-label="Map">
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Map. ${place.address || place.venue || 'Event location'}. Opens in Maps.`}
        className="relative block w-[85%] overflow-hidden rounded-[30px] bg-[#151519]"
        style={{ height: MAP_H }}
      >
        {mapUri ? (
          <Image src={mapUri} alt="" fill unoptimized sizes="330px" className="object-cover" onError={() => setImageFailed(true)} />
        ) : (
          <DrawnMap seedText={`${place.address || ''}${place.venue || ''}`} />
        )}
        <span
          className="absolute left-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white"
          style={{ top: (MAP_H - 34) / 2, backgroundColor: PURPLE }}
          aria-hidden="true"
        >
          <span className="size-1.5 rounded-full bg-white" />
        </span>
        <span className="absolute inset-x-0 bottom-0 flex items-end gap-2.5 bg-[#0A0A0C]/90 pb-3.5 pl-4 pr-3.5 pt-3">
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="text-[10.5px] font-extrabold uppercase leading-none tracking-[0.13em] text-white/55">Map view</span>
            <span className="line-clamp-3 text-[13px] font-bold leading-[17px] text-white">{printed}</span>
          </span>
          <span className="inline-flex h-[30px] shrink-0 items-center gap-[5px] rounded-full bg-white px-[11px] text-[10px] font-black uppercase tracking-[0.09em] text-black">
            <HugeiconsIcon icon={Navigation03Icon} size={13} />
            Open in maps
          </span>
        </span>
      </a>
    </section>
  );
}

/** The ticket tiers, as the app's join sheet draws them: raised #2A2A2C rows, the label and capacity left, the price in PXI orange. */
function TicketTiers({ tiers }) {
  return (
    <section className="mt-[34px] px-5" aria-label="Ticket tiers">
      <p className="text-[12px] font-extrabold uppercase leading-[14px] tracking-[0.4px] text-white">Ticket tier</p>
      <ul className="mt-2.5 flex flex-col gap-2.5">
        {tiers.map((tier) => (
          <li key={tier.id || tier.label} className="flex items-center gap-3 rounded-[20px] bg-[#2A2A2C] px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="line-clamp-2 text-[16px] font-extrabold text-white">{tier.label}</p>
              {tier.capacity != null ? <p className="text-[12px] font-semibold text-white/55">Capacity {tier.capacity}</p> : null}
            </div>
            <p className="shrink-0 text-[18px] font-black text-[#FF5A1F]">{tier.priceLabel}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────────────────────── the sheet ───────────────────────────── */

/**
 * Shared event/album details surface — the app's event view (see the note at the top).
 * Sections (host, members, tiers, music, line-up, map) render only when the caller supplies data.
 *
 * `presentation="modal"` — a centred phone-width column on a black backdrop (desktop).
 * `presentation="sheet"` — full-width sheet, drag-down (touch/pointer) to dismiss (mobile web).
 * `presentation="inline"` — fills its parent with its own scroll region, no portal/scrim/dismiss
 *   (the desktop album page's phone-sized right pane).
 * `presentation="page"` — the event's own page (/events/:id): a centred phone-width column under
 *   the site's navbar on desktop, full width on phones; the page scrolls (no inner scroll region),
 *   the footer sticks to the bottom of the screen, and there is no dismiss or scrim.
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
  const isPage = presentation === 'page';

  useEffect(() => {
    // Inline and page never own the page — no scroll lock.
    if (!open || isInline || isPage) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, isInline, isPage]);

  useEffect(() => {
    if (!open || isInline || isPage) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, isInline, isPage]);

  useEffect(() => {
    if (open) y.set(0);
  }, [open, y]);

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
  const participants = Array.isArray(event.participants) ? event.participants : [];
  const when = toWhen(event);
  const place = toPlace(event);
  const capsLine = toCapsLine(event);
  const hostName = event.host ? event.host.name || event.host.username || 'Host' : '';
  const memberCount = event.memberCount != null ? event.memberCount : participants.length;
  const topSong = readTopSong(event);
  const whenSize = when.date.length > 12 ? 20 : 24;

  const canDismiss = !isInline && !isPage;
  // OPEN ALBUM: the caller's own link (events list), else — on the album page itself — the way back to it.
  const openAlbum = secondaryAction || (canDismiss ? { label: 'Open album', onClick: dismiss } : null);
  const mainActionable = primaryAction && !primaryAction.disabled && (primaryAction.href || primaryAction.onClick);

  const header = (
    <div className="flex min-h-[56px] shrink-0 items-center justify-between px-5 pb-1.5 pt-[22px]">
      <p className="text-[12.5px] font-extrabold uppercase tracking-[0.3px] text-white">Event details</p>
      {canDismiss ? (
        <button
          type="button"
          onClick={dismiss}
          className="relative inline-flex size-7 items-center justify-center text-white before:absolute before:-inset-3 before:content-['']"
          aria-label="Close details"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={22} />
        </button>
      ) : (
        <span className="h-7" aria-hidden />
      )}
    </div>
  );

  const body = (
    <div className="pb-10 text-white">
      <div className="px-5 pt-1">
        <FitTitle
          as="h2"
          text={event.title || 'Event'}
          maxFontSize={34}
          minFontSize={20}
          maxLines={2}
          lineHeight={1.06}
          letterSpacingEm={-0.01}
        />
        {capsLine ? <p className={`mt-2.5 text-center ${CAPS_GREY}`}>{capsLine}</p> : null}
      </div>

      <div className="relative mx-5 mt-4 aspect-[352/397] overflow-hidden rounded-[40px] bg-[#2A2A2C]" role="img" aria-label="Album cover">
        {coverSrc ? <Image src={coverSrc} alt="" fill loading="eager" unoptimized className="object-cover" sizes="(max-width: 430px) 100vw, 430px" /> : null}
      </div>

      {place ? (
        <div className="mt-6 px-5">
          <FitTitle text={place.venue} maxFontSize={52} minFontSize={24} maxLines={3} lineHeight={0.82} letterSpacingEm={-0.015} />
        </div>
      ) : null}

      {when.date || when.time ? (
        <div className="mx-auto mt-[27px] flex max-w-full items-start justify-center gap-10 px-5">
          {when.date ? <WhenColumn label="Date" value={when.date} quiet={when.note} size={whenSize} /> : null}
          {when.time ? <WhenColumn label="Time" value={when.time} quiet={when.until} size={whenSize} /> : null}
        </div>
      ) : null}

      <div
        className="mx-auto mt-7 flex items-center justify-center gap-[11px]"
        style={{ width: openAlbum ? 'min(calc(100% - 40px), 295px)' : 'fit-content' }}
      >
        {openAlbum ? (
          <ActionEl action={openAlbum} className={OPEN_ALBUM_CLASS}>
            {openAlbum.icon}
            {openAlbum.label}
          </ActionEl>
        ) : null}
        <ShareButton title={event.title} url={event.shareUrl} />
      </div>

      <HostBubble host={event.host} hostName={hostName} about={event.description} />

      <MembersBlock count={memberCount} participants={participants} />

      {hasTicketTiers ? <TicketTiers tiers={event.ticketTiers} /> : null}

      <MusicSection playlist={event.playlist} cover={coverSrc} topSong={topSong} />

      {hasLineup ? <LineupGrid people={event.lineup} /> : null}

      {place?.hasMap ? <MapCard place={place} /> : null}
    </div>
  );

  // Deny | Join, flat pills on the sheet: Deny closes the sheet, the main action is the caller's.
  const footer = primaryAction ? (
    <div
      className={`flex shrink-0 gap-3.5 px-[18px] pt-3${isPage ? ' sticky bottom-0 z-10' : ''}`}
      style={{ background: SHEET, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 14px) + 10px)' }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {canDismiss && mainActionable ? (
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-full bg-[#4A4A4A] px-4 font-extrabold text-white transition-transform active:scale-[0.97]"
        >
          <FitLabel>Deny</FitLabel>
        </button>
      ) : null}
      <ActionEl
        action={primaryAction}
        className={`inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#A523EF] px-4 font-extrabold text-white transition-transform ${
          mainActionable ? 'active:scale-[0.97]' : 'opacity-40'
        }`}
      >
        {primaryAction.icon}
        <FitLabel>{primaryAction.label}</FitLabel>
      </ActionEl>
    </div>
  ) : null;

  const content = isPage ? (
    <>
      {header}
      <div className="flex-1">{body}</div>
      {footer}
    </>
  ) : (
    <>
      {header}
      <div
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {body}
      </div>
      {footer}
    </>
  );

  const sheetStyle = { background: SHEET, fontFamily: BODY_FONT, borderTopLeftRadius: RADIUS_PX, borderTopRightRadius: RADIUS_PX };

  // `presentation="inline"` — no portal, no scrim, no dismiss: fills its parent
  // (the desktop album page's right pane) with its own scroll region, wearing the
  // same flat sheet chrome as the floating desktop modal.
  if (isInline) {
    return (
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden"
        style={{ background: SHEET, fontFamily: BODY_FONT, borderRadius: RADIUS_PX }}
      >
        {content}
      </div>
    );
  }

  // `presentation="page"` — the route's own content: the document scrolls, the column is centred.
  if (isPage) {
    return (
      <div className="min-h-screen bg-black pt-[var(--public-navbar-height)] md:pt-[calc(var(--public-navbar-height)+12px)]">
        <div
          className="mx-auto flex min-h-[calc(100vh-var(--public-navbar-height))] w-full max-w-[430px] flex-col md:min-h-[calc(100vh-var(--public-navbar-height)-12px)]"
          style={sheetStyle}
        >
          {content}
        </div>
      </div>
    );
  }

  if (presentation === 'sheet') {
    const overlay = (
      <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Event details">
        <MotionDiv className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} aria-hidden />
        <MotionDiv
          className="absolute inset-x-0 bottom-0 top-3 flex flex-col overflow-hidden"
          style={{ ...sheetStyle, y }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 1000 }}
          dragElastic={{ top: 0, bottom: 1 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {content}
        </MotionDiv>
      </div>
    );
    return <Portal>{overlay}</Portal>;
  }

  // Desktop: a phone-width column, full height, on a black backdrop. Click-outside (backdrop) and
  // Escape dismiss. The sheet owns its scroll region, so the page behind never moves.
  const overlay = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/90" aria-hidden />
      <MotionDiv
        role="dialog"
        aria-modal="true"
        aria-label="Event details"
        className="relative flex h-[calc(100%-1.5rem)] w-full max-w-[430px] flex-col overflow-hidden"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </MotionDiv>
    </div>
  );

  return <Portal>{overlay}</Portal>;
}
