'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Play,
  Scan,
  Smartphone,
  X,
} from 'lucide-react';
import { eventsService } from '@/services/events';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import { displayImageSrc } from '@/lib/mediaUrl';
import { singleEventMapEmbedSrc } from '@/lib/eventMapEmbed';

const ACCENT = '#c44d54';
const SECTION_EMPTY = 'Empty yet';
const SECTION_NONE = 'None';

function formatEventDate(date) {
  if (!date) return 'Date TBA';
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Date TBA';
  }
}

function formatEventTime(date) {
  if (!date) return 'Time TBA';
  try {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return 'Time TBA';
  }
}

function deriveGuestlistAvatars(apiEvent) {
  const featured = Array.isArray(apiEvent?.featuredPeople) ? apiEvent.featuredPeople : [];
  const scrap = Array.isArray(apiEvent?.scrapbookThumbnails) ? apiEvent.scrapbookThumbnails : [];
  const fromFeatured = featured
    .map((fp) => displayImageSrc(fp?.user?.avatarUrl, null))
    .filter(Boolean);
  const fromScrap = scrap.map((s) => displayImageSrc(s, null)).filter(Boolean);
  return [...fromFeatured, ...fromScrap].slice(0, 3);
}

function deriveLineup(apiEvent) {
  const featured = Array.isArray(apiEvent?.featuredPeople) ? apiEvent.featuredPeople : [];
  return featured
    .map((fp) => {
      const user = fp?.user;
      if (!user) return null;
      const username = user.username ? String(user.username).replace(/^@/, '') : null;
      return {
        key: fp.id || fp.userId || user.id || user.username || user.name,
        name: user.name || user.username || 'Performer',
        href: username ? `https://instagram.com/${encodeURIComponent(username)}` : null,
        image: displayImageSrc(user.avatarUrl, null),
        alt: `${user.name || user.username || 'Performer'} profile image`,
      };
    })
    .filter(Boolean);
}

function SectionDivider() {
  return <div className="h-px w-full bg-white/15" />;
}

/** Public display — mirrors dashboard passport number shape (host user id). */
function formatHostPassportNo(userId) {
  if (!userId) return null;
  const raw = String(userId).replace(/-/g, '').toUpperCase();
  if (raw.length < 4) return null;
  return `P${raw.slice(0, 7)}XI`;
}

/** Age from ISO birthdate; null if missing or invalid. */
function ageFromBirthdate(birthdate) {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return String(age);
}

function formatMrzIssuedDate(d = new Date()) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day}${months[d.getUTCMonth()]}${String(d.getUTCFullYear()).slice(-2)}`;
}

function mrzToken(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 18);
}

function padMrzSegment(prefix, len = 44) {
  const p = String(prefix);
  if (p.length >= len) return p.slice(0, len);
  return `${p}${'<'.repeat(len - p.length)}`;
}

/** Machine-readable zone style footer from host + passport number (decorative). */
function buildHostMrzLines(host, passportNo) {
  const name = host?.name || host?.username || 'HOST';
  const parts = String(name).trim().split(/\s+/);
  const first = mrzToken(parts[0] || 'X');
  const last = parts.length > 1 ? mrzToken(parts.slice(1).join('')) : first;
  const cityOrUser = mrzToken(host?.city || host?.username || 'X');
  const line1 = padMrzSegment(`PXI<${last}<<${first}<${cityOrUser}<`);
  const issued = formatMrzIssuedDate();
  const pp = mrzToken((passportNo || 'PXXXXXXXI').replace(/[^A-Z0-9]/g, ''));
  const line2 = padMrzSegment(`ISSUED${issued}<${pp}<PXISPACE<`);
  return { line1, line2 };
}

export default function EventsNewEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const hostPassportChipFilterId = useId().replace(/:/g, '');
  const [apiEvent, setApiEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestlistOpen, setGuestlistOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setApiEvent(null);
      return;
    }
    setLoading(true);
    setApiEvent(null);
    eventsService
      .getEvent(id)
      .then((data) => setApiEvent(data?.event || data || null))
      .catch(() => setApiEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const heroImage = useMemo(() => displayImageSrc(apiEvent?.coverImage, null), [apiEvent]);
  const hasHost = !!(apiEvent?.host && (apiEvent.host.name || apiEvent.host.username));
  const organizerName = hasHost ? (apiEvent.host.name || apiEvent.host.username) : '';
  const organizerAvatar = displayImageSrc(apiEvent?.host?.avatarUrl, null);
  const hostPxiHandle = apiEvent?.host?.username
    ? String(apiEvent.host.username).replace(/^@/, '')
    : null;
  const hostPassportNo = formatHostPassportNo(apiEvent?.host?.id);
  const hostAge = ageFromBirthdate(apiEvent?.host?.birthdate);
  const hostInstaLabel = apiEvent?.host?.instagramHandle
    ? `@${String(apiEvent.host.instagramHandle).replace(/^@/, '')}`
    : hostPxiHandle
      ? `@${hostPxiHandle}`
      : '—';
  const hostMrz = useMemo(
    () => (apiEvent?.host ? buildHostMrzLines(apiEvent.host, hostPassportNo) : { line1: '', line2: '' }),
    [apiEvent?.host, hostPassportNo]
  );

  const eventTitle = apiEvent?.name || 'Event';
  const rawLocation = typeof apiEvent?.location === 'string' ? apiEvent.location.trim() : '';
  const locationLabel = rawLocation || SECTION_EMPTY;
  const goingCount = apiEvent?._count?.tickets ?? 0;
  const hostEventsCreated = apiEvent?.hostStats?.eventsCreated ?? 0;
  const hostMembersJoinedAcrossEvents = apiEvent?.hostStats?.membersJoinedAcrossEvents ?? 0;

  const guestlistAvatars = useMemo(() => deriveGuestlistAvatars(apiEvent), [apiEvent]);
  const lineup = useMemo(() => deriveLineup(apiEvent), [apiEvent]);

  const mapSrc = singleEventMapEmbedSrc(apiEvent?.latitude, apiEvent?.longitude);
  const hasMap = !!mapSrc;
  const hasDescription = !!(apiEvent?.description && String(apiEvent.description).trim());
  const aboutParagraphs = hasDescription ? String(apiEvent.description).split(/\n{2,}/) : [];
  const scheduleMissing = !apiEvent?.startDate;
  const scheduleLabel = scheduleMissing ? SECTION_EMPTY : `${formatEventDate(apiEvent.startDate)} at ${formatEventTime(apiEvent.startDate)}`;

  const albumId = apiEvent?.albumId || apiEvent?.albums?.[0]?.id || null;

  useEffect(() => {
    setParticipants([]);
    setParticipantsLoaded(false);
    setParticipantsLoading(false);
  }, [id]);

  // Guest list = primary album members (backend adds AlbumMember when a ticket is issued).
  useEffect(() => {
    if (!id || loading) return;
    if (!apiEvent || String(apiEvent.id) !== String(id)) return;

    const aid = apiEvent.albumId || apiEvent.albums?.[0]?.id || null;
    if (!aid) {
      setParticipants([]);
      setParticipantsLoaded(true);
      return;
    }

    setParticipantsLoading(true);
    eventsService
      .getAlbumParticipants(aid)
      .then((res) => setParticipants(res.participants || []))
      .catch(() => setParticipants([]))
      .finally(() => {
        setParticipantsLoading(false);
        setParticipantsLoaded(true);
      });
  }, [id, loading, apiEvent?.id, apiEvent?.albumId]);

  // Close modal on Escape.
  useEffect(() => {
    if (!guestlistOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setGuestlistOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guestlistOpen]);

  const previewGuestTiles = useMemo(() => {
    if (participantsLoaded && participants.length) {
      return participants.slice(0, 5).map((p, i) => {
        const label = (p?.name || p?.username || p?.userId || `Guest ${i + 1}`).replace(/^@/, '');
        const src = displayImageSrc(p?.avatarUrl, null);
        return { key: p?.userId || `${label}-${i}`, label, src };
      });
    }
    return guestlistAvatars.slice(0, 5).map((src, i) => ({
      key: `fallback-${src}-${i}`,
      label: '',
      src,
    }));
  }, [participantsLoaded, participants, guestlistAvatars]);

  const guestListCount = participantsLoaded ? participants.length : goingCount;

  const guestlistEmpty =
    participantsLoaded &&
    participants.length === 0 &&
    guestlistAvatars.length === 0 &&
    goingCount === 0;

  const previewExtraCount = participantsLoaded ? Math.max(0, participants.length - 5) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] pt-24 text-zinc-300 md:pt-28">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!apiEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] pt-24 text-zinc-400 md:pt-28">
        Event not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 font-sans text-white antialiased md:pt-28">
      <div className="fixed left-3 top-24 z-50 md:top-28">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-md hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Events
        </Link>
      </div>

      <div className="relative">
        <div className="fixed inset-0 top-0 z-0 h-screen w-screen overflow-hidden bg-[#0a0a0a]">
          <div
            className="absolute inset-0 w-full opacity-100 transition-opacity duration-500 ease-in-out"
            style={{
              height: '33.33%',
              ...(heroImage
                ? {
                    backgroundImage: `url("${heroImage}")`,
                    backgroundPosition: '100% 5%',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}),
              maskImage: 'linear-gradient(to bottom, #0a0a0a, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, #0a0a0a, transparent)',
            }}
          />
          <div className="absolute inset-0 backdrop-blur-md" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 to-[#0a0a0a]/90" />
        </div>

        <div className="relative z-10">
          <main className="mx-auto mt-2 flex min-h-screen w-full max-w-5xl flex-col justify-around px-3 pb-20 sm:px-6 md:mt-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 md:pb-24 2xl:max-w-6xl 2xl:gap-12">
            <div className="order-1 flex flex-col md:order-2 md:w-[330px] lg:w-[375px] 2xl:w-[400px]">
              <div className="relative top-0 mx-auto h-auto w-full max-w-[400px] md:sticky md:top-28">
                <div className="relative px-6 pb-6 md:px-0 md:pb-0">
                  <div className="relative w-full" style={{ paddingBottom: '125%' }}>
                    <div className="absolute inset-0 overflow-hidden rounded-xl bg-zinc-900">
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                        {heroImage ? (
                          <Image
                            alt={`${eventTitle} flyer`}
                            width={512}
                            height={640}
                            unoptimized
                            className="h-full max-h-full w-full max-w-full object-cover transition-opacity duration-300"
                            src={heroImage}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 flex justify-end md:bottom-0 md:left-0 md:right-0">
                    <button
                      type="button"
                      className="m-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white shadow backdrop-blur-md transition hover:bg-black/70"
                      aria-label="Play"
                    >
                      <Play className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 hidden w-full flex-col items-center text-center md:flex">
                  <div className="space-y-6">
                    <h3 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      {eventTitle}
                    </h3>
                    <div className="flex flex-col items-center">
                      <p className="text-base font-medium leading-6 text-zinc-200">{locationLabel}</p>
                      <p className="text-base font-medium leading-6 text-zinc-200">{scheduleLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-2 mb-0 mt-4 flex flex-col gap-4 border-t border-white/15 pt-2 md:order-1 md:mt-2 md:pt-0">
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold tracking-tight text-white">Organizer</h2>
                {hasHost ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="mt-0.5 flex min-w-0 flex-1 flex-row items-start gap-2">
                      <span className="relative mt-0.5 flex size-5 shrink-0 overflow-hidden rounded-sm border border-white/20 bg-zinc-800">
                        {organizerAvatar ? (
                          <Image className="size-full object-cover" alt="" src={organizerAvatar} width={20} height={20} unoptimized />
                        ) : (
                          <span className="flex size-full items-center justify-center text-[9px] font-semibold text-zinc-400" aria-hidden>
                            {(organizerName || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-pxi-purple">PXI Passport</p>
                        <p className="text-base font-medium tracking-tight text-white">{organizerName}</p>
                        {hostPxiHandle ? (
                          <p className="truncate text-xs text-zinc-400">@{hostPxiHandle}</p>
                        ) : null}
                      </div>
                    </div>
                    <IosDownloadLink
                      href={PXI_APP_STORE_URL}
                      className="shrink-0 text-xs font-semibold text-pxi-purple hover:text-white"
                    >
                      App
                    </IosDownloadLink>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl xl:text-6xl">
                    {eventTitle}
                  </h1>
                  <p className="text-base font-medium leading-6 text-zinc-200">{locationLabel}</p>
                  <p className="text-base font-medium leading-6 text-zinc-200">{scheduleLabel}</p>
                </div>
              </div>

              <div className="group/guestlist flex w-full flex-col gap-3 pb-2 pt-2">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Guest list</h2>
                {guestlistEmpty ? (
                  <div className="flex flex-row items-start justify-between gap-3">
                    <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                    {albumId ? (
                      <button
                        type="button"
                        className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                        onClick={() => setGuestlistOpen(true)}
                      >
                        <span className="hidden sm:inline">View guestlist</span>
                        <span className="sm:hidden">Guestlist</span>
                        <Scan className="size-4" style={{ color: ACCENT }} aria-hidden />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-row items-center gap-3">
                      <div className="flex shrink-0 -space-x-2">
                        {previewGuestTiles.map((tile, i) => (
                          <span
                            key={tile.key}
                            className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#0a0a0a] bg-zinc-800 text-[11px] font-bold uppercase text-zinc-300 ring-1 ring-white/10"
                            style={{ zIndex: previewGuestTiles.length - i }}
                            title={tile.label || undefined}
                          >
                            {tile.src ? (
                              <Image src={tile.src} alt="" className="size-full object-cover" width={32} height={32} unoptimized />
                            ) : (
                              (tile.label || '?').replace(/^@/, '').charAt(0) || '?'
                            )}
                          </span>
                        ))}
                        {previewExtraCount > 0 ? (
                          <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white/5 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
                            +{previewExtraCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium leading-5 text-zinc-200">
                        <span className="text-white">{guestListCount}</span> on the guest list
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                      onClick={() => setGuestlistOpen(true)}
                    >
                      <span className="hidden sm:inline">View guestlist</span>
                      <span className="sm:hidden">Guestlist</span>
                      <Scan className="size-4" style={{ color: ACCENT }} aria-hidden />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">About this event</h2>
                <div className="relative overflow-hidden">
                  {hasDescription ? (
                    <section className="max-w-none text-base leading-relaxed text-white/80 [&_p]:mt-0 [&_p+p]:mt-4 [&_strong]:text-white" style={{ height: 'auto', maskImage: 'none' }}>
                      {aboutParagraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </section>
                  ) : (
                    <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Lineup</h2>
                {lineup.length > 0 ? (
                  <div className="relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-6">
                      {lineup.map((item) => (
                        <div key={item.key} className="flex flex-col">
                          <div className="flex flex-col gap-2">
                            <div className="group relative aspect-square w-full overflow-hidden rounded-sm bg-zinc-800">
                              {item.href ? (
                                <a target="_blank" className="relative block h-full w-full" href={item.href} rel="noopener noreferrer">
                                  {item.image ? (
                                    <Image alt={item.alt} width={400} height={400} unoptimized className="h-full w-full object-cover transition-all duration-200 ease-in-out" src={item.image} />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-zinc-500">{(item.name || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 transition-all duration-200 ease-in-out group-hover:bg-black/20" />
                                </a>
                              ) : item.image ? (
                                <Image alt={item.alt} width={400} height={400} unoptimized className="h-full w-full object-cover" src={item.image} />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-zinc-500">{(item.name || '?').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {item.href ? (
                                <a target="_blank" className="group inline-flex items-center gap-1 text-white" href={item.href} rel="noopener noreferrer">
                                  <span className="relative text-lg font-medium tracking-tight after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all group-hover:after:w-full">{item.name}</span>
                                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                                </a>
                              ) : (
                                <span className="text-lg font-medium tracking-tight text-white">{item.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Location</h2>
                {hasMap ? (
                  <div className="h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
                    <iframe title={`Event location - ${eventTitle}`} src={mapSrc} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                ) : null}
                {rawLocation ? (
                  <p className="text-sm text-zinc-400">{rawLocation}</p>
                ) : !hasMap ? (
                  <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Hosted by</h2>
                {hasHost ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-black/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                    {/* Outer padding: passport face stays a fixed size; frame grows with padding only. */}
                    <div className="flex justify-center px-5 py-6 sm:px-10 sm:py-8">
                      <div className="w-full max-w-[380px] shrink-0 overflow-hidden rounded-lg border border-white/15 bg-gradient-to-b from-white/[0.06] to-black/35 px-3 py-3 sm:px-4 sm:py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 pr-1">
                          <h2 className="text-[14px] font-bold uppercase tracking-[0.16em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                            PXI PASSPORT
                          </h2>
                          <div className="mt-1 h-[6px] border-t-[6px] border-white" />
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[9px] uppercase text-white/70">PXI Passport No.</p>
                          {hostPassportNo ? (
                            <p className="text-[11px] uppercase text-white/90">{hostPassportNo}</p>
                          ) : (
                            <p className="text-[11px] uppercase text-white/50">—</p>
                          )}
                        </div>
                      </div>

                      {/* Col 3 = Diplomat / Insta / bio; LEVEL shares this column (x). Row uses items-center so y matches PASSPORT line. */}
                      <div className="mt-1.5 grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2.5 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3">
                        <div className="col-span-2 flex min-w-0 items-center gap-1">
                          <svg
                            width="41"
                            height="34"
                            viewBox="0 0 41 34"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[22px] w-[38px] shrink-0 sm:h-[24px] sm:w-[40px]"
                            aria-hidden
                          >
                            <g filter={`url(#${hostPassportChipFilterId})`}>
                              <path d="M12 11H29V21H12V11Z" fill="#BB17E8" />
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M20.5 13C21.9864 13 23.2194 14.0812 23.4575 15.5H29V16.5H23.4575C23.2194 17.9188 21.9864 19 20.5 19C19.0136 19 17.7806 17.9188 17.5425 16.5H12V15.5H17.5425C17.7806 14.0812 19.0136 13 20.5 13ZM20.5 14C19.3954 14 18.5 14.8954 18.5 16C18.5 17.1046 19.3954 18 20.5 18C21.6046 18 22.5 17.1046 22.5 16C22.5 14.8954 21.6046 14 20.5 14Z"
                                fill="#0C0C0C"
                              />
                            </g>
                            <defs>
                              <filter
                                id={hostPassportChipFilterId}
                                x="0"
                                y="0"
                                width="41"
                                height="34"
                                filterUnits="userSpaceOnUse"
                                colorInterpolationFilters="sRGB"
                              >
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feColorMatrix
                                  in="SourceAlpha"
                                  type="matrix"
                                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                  result="hardAlpha"
                                />
                                <feOffset dy="1" />
                                <feGaussianBlur stdDeviation="6" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix
                                  type="matrix"
                                  values="0 0 0 0 0.733333 0 0 0 0 0.0901961 0 0 0 0 0.909804 0 0 0 1 0"
                                />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_vector" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_vector" result="shape" />
                              </filter>
                            </defs>
                          </svg>
                          <span className="whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.03em] text-white sm:text-[8px]">
                            PASSPORT • PASS • PASAPORTE
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-col items-start justify-center">
                          <p className="text-[9px] font-semibold uppercase leading-none text-white/80">LEVEL Wanderer</p>
                          <div className="mt-1 h-1 w-[72px] overflow-hidden rounded-full bg-[rgba(176,38,255,0.22)] sm:w-[80px]">
                            <div className="h-full w-[8%] rounded-full bg-pxi-purple" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-2.5 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3">
                        <div className="relative h-[118px] w-full max-w-[88px] overflow-hidden rounded-[6px] shadow-[0_1px_24px_2px_rgba(255,255,255,0.3)] sm:h-[128px] sm:max-w-[100px]">
                          {organizerAvatar ? (
                            <Image
                              src={organizerAvatar}
                              alt={organizerName}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="112px"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center bg-zinc-800 text-2xl font-semibold text-zinc-500"
                              aria-hidden
                            >
                              {(organizerName || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex min-h-0 min-w-0 flex-col gap-1.5 pl-1 pr-1 sm:pl-2 sm:pr-2">
                          <div>
                            <p className="text-[9px] font-medium uppercase text-white/70">Full name</p>
                            <p className="text-[11px] font-semibold uppercase leading-snug text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:text-[12px]">
                              {String(organizerName).toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-medium uppercase text-white/70">username</p>
                            <p className="truncate text-[11px] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:text-[12px]">
                              {hostPxiHandle || '—'}
                            </p>
                          </div>
                          <p className="text-[11px] text-white/90 sm:text-[12px]">
                            Age {hostAge ?? '—'}
                          </p>
                          <div>
                            <p className="text-[9px] font-medium uppercase text-white/70">City</p>
                            <p className="line-clamp-2 text-[11px] text-white/90 sm:text-[12px]">
                              {apiEvent.host.city?.trim() || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex min-h-0 min-w-0 flex-col gap-2">
                          <div className="shrink-0">
                            <div className="flex items-end">
                              <span className="text-[28px] font-extrabold leading-[30px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] sm:text-[36px] sm:leading-9">
                                D
                              </span>
                              <span className="mb-0.5 ml-0.5 text-[11px] font-semibold capitalize text-white sm:text-[13px]">
                                iplomat
                              </span>
                            </div>
                          </div>
                          <p className="truncate text-[11px] text-white/90 sm:text-[12px]" title={hostInstaLabel}>
                            Insta {hostInstaLabel}
                          </p>
                          <div className="min-h-0 flex-1">
                            <p className="text-[9px] font-medium uppercase text-white/70">Bio</p>
                            <p className="line-clamp-3 text-[11px] leading-snug text-white/90 sm:text-[12px]">
                              {apiEvent.host.bio?.trim() || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 h-[2px] w-full bg-white/40 sm:mt-3" />
                      <div className="pt-1.5 font-mono text-[10px] uppercase leading-4 tracking-[0.12em] text-white/70 sm:pt-2 sm:text-[11px]">
                        <p className="truncate">{hostMrz.line1}</p>
                        <p className="truncate">{hostMrz.line2}</p>
                      </div>
                    </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-t border-white/10 px-5 py-5">
                      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/85">
                        <span>
                          {hostEventsCreated} {hostEventsCreated === 1 ? 'event' : 'events'} created
                        </span>
                        <span className="hidden h-4 w-px bg-zinc-600 sm:block" aria-hidden />
                        <span>
                          {hostMembersJoinedAcrossEvents}{' '}
                          {hostMembersJoinedAcrossEvents === 1 ? 'member' : 'members'} joined
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                )}
              </div>

              <div className="flex flex-col gap-6 pb-16">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Get the app</h2>
                <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-8">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Smartphone className="size-8 text-zinc-400" aria-hidden />
                    <h3 className="text-center text-xl font-semibold text-white md:text-2xl">More features in the app</h3>
                  </div>
                  <AppStoreCtaPair className="max-w-md mx-auto" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => router.push(`/events/${apiEvent.id}/checkout`)}
          className="pointer-events-auto inline-flex h-[3.375rem] min-w-[25.5rem] shrink-0 items-center justify-center rounded-full px-8 text-sm font-semibold uppercase tracking-wide text-white shadow-md shadow-black/40 transition hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          Continue to checkout
        </button>
      </div>

      {guestlistOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setGuestlistOpen(false)}
          />
          <div className="relative z-10 w-[92vw] max-w-3xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">Guestlist</h2>
                <p className="text-sm text-zinc-400">
                  {participantsLoaded ? `${participants.length} members` : 'Loading members...'}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                aria-label="Close guestlist"
                onClick={() => setGuestlistOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-4">
              {!albumId ? (
                <div className="py-10 text-center text-zinc-500">{SECTION_NONE}</div>
              ) : participantsLoading ? (
                <div className="flex items-center justify-center py-10 text-zinc-400">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : participantsLoaded && participants.length === 0 ? (
                <div className="py-10 text-center text-zinc-500">{SECTION_EMPTY}</div>
              ) : (
                <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
                  {(participantsLoaded ? participants : []).map((p, idx) => {
                    const label = String(
                      p?.name || p?.username || p?.userId || `Member ${idx + 1}`
                    ).replace(/^@/, '');
                    const src = displayImageSrc(p?.avatarUrl, null);
                    const initial = (label || '?').charAt(0).toUpperCase();
                    return (
                      <div key={p?.userId || p?.id || `${label}-${idx}`} className="flex flex-col items-center gap-1.5 min-w-0">
                        <span
                          className="relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#0a0a0a] bg-zinc-800 text-sm font-bold text-zinc-200 ring-1 ring-white/10"
                          title={label}
                        >
                          {src ? (
                            <Image src={src} alt={label} className="size-full object-cover" width={48} height={48} unoptimized />
                          ) : (
                            initial
                          )}
                        </span>
                        {label ? (
                          <span className="max-w-full truncate text-center text-[10px] font-medium text-zinc-500" title={label}>
                            {p?.username ? `@${String(p.username).replace(/^@/, '')}` : label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
