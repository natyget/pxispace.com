'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeftIcon, ArrowUpRightIcon, Loading02Icon, ScanIcon, SmartPhone01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { eventsService } from '@/services/events';
import { api } from '@/services/api';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import { PxiSpinner } from '@/components/loading/PxiLoading';
import AppOpenBanner from '@/components/links/AppOpenBanner';
import UserAvatar from '@/components/ui/UserAvatar';
import { PxiPassportCard } from '@/components/passport/PxiPassportCard';
import { usePassportAttendedEvents } from '@/hooks/usePassportAttendedEvents';
import { displayImageSrc } from '@/lib/mediaUrl';
import { singleEventMapEmbedSrc } from '@/lib/eventMapEmbed';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildEventJsonLd } from '@/lib/seo/schemas';
import { getSiteUrl } from '@/lib/siteUrl';

const NAVBAR_TOP = 'top-[var(--public-navbar-height)]';
/** Mobile: edge-to-edge under navbar; desktop: offset below fixed header */
const DESKTOP_NAVBAR_OFFSET = 'pt-0 md:pt-[var(--public-navbar-height)]';
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

function formatPrice(usd, currency = 'USD') {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
}

function parseTicketTiers(event) {
  if (!event || event.ticketType !== 'PAID') return [];
  const raw = event.ticketTiersJson;
  if (Array.isArray(raw) && raw.length) {
    const rows = raw.filter((t) => t && t.id && typeof t.priceUsd === 'number' && t.priceUsd > 0);
    if (rows.length) {
      return rows.map((t) => ({
        id: t.id,
        label: t.label || t.name || 'Ticket',
        priceUsd: t.priceUsd,
      }));
    }
  }
  const base = Number(event.ticketPrice);
  if (base > 0) return [{ id: null, label: 'General admission', priceUsd: base }];
  return [];
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

function EventHostPassport({ user }) {
  const attendedEvents = usePassportAttendedEvents(user?.id, 'public');

  return (
    <div className="mx-auto w-full max-w-[min(95vw,361px)]">
      <PxiPassportCard user={user} attendedEvents={attendedEvents} />
    </div>
  );
}

export default function EventDetailClient({ eventIdOverride, initialEvent, presentation = 'page' }) {
  const params = useParams();
  const id = eventIdOverride || params?.id;
  const router = useRouter();
  const isPane = presentation === 'pane';

  const [apiEvent, setApiEvent] = useState(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);
  const [guestlistOpen, setGuestlistOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [hostProfile, setHostProfile] = useState(null);
  const [hostProfileLoading, setHostProfileLoading] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setApiEvent(initialEvent);
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    const hostId = apiEvent?.host?.id;
    if (!hostId) {
      setHostProfile(null);
      setHostProfileLoading(false);
      return;
    }
    setHostProfileLoading(true);
    api
      .get(`/api/users/public-profile/${encodeURIComponent(hostId)}`)
      .then((data) => setHostProfile(data?.user ?? null))
      .catch(() => setHostProfile(null))
      .finally(() => setHostProfileLoading(false));
  }, [apiEvent?.host?.id]);

  const heroImage = useMemo(() => displayImageSrc(apiEvent?.coverImage, null), [apiEvent]);
  const hostPassportUser = useMemo(() => {
    if (!apiEvent?.host) return null;
    if (hostProfile?.isPassportIssued) {
      return {
        ...apiEvent.host,
        ...hostProfile,
        avatarUrl: hostProfile.avatarUrl ?? apiEvent.host.avatarUrl,
      };
    }
    return null;
  }, [apiEvent?.host, hostProfile]);
  const hasHost = !!(apiEvent?.host && (apiEvent.host.name || apiEvent.host.username));
  const organizerName = hasHost ? (apiEvent.host.name || apiEvent.host.username) : '';
  const hostPxiHandle = apiEvent?.host?.username
    ? String(apiEvent.host.username).replace(/^@/, '')
    : null;
  const eventTitle = apiEvent?.name || 'Event';
  const rawLocation = typeof apiEvent?.location === 'string' ? apiEvent.location.trim() : '';
  const locationLabel = rawLocation || SECTION_EMPTY;
  const goingCount = apiEvent?._count?.tickets ?? 0;
  const hostEventsCreated = apiEvent?.hostStats?.eventsCreated ?? 0;
  const hostMembersJoinedAcrossEvents = apiEvent?.hostStats?.membersJoinedAcrossEvents ?? 0;

  const guestlistAvatars = useMemo(() => deriveGuestlistAvatars(apiEvent), [apiEvent]);
  const lineup = useMemo(() => deriveLineup(apiEvent), [apiEvent]);
  const ticketTiers = useMemo(() => parseTicketTiers(apiEvent), [apiEvent]);

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
        return {
          key: p?.userId || `${label}-${i}`,
          label,
          kind: 'user',
          avatarUrl: p?.avatarUrl ?? null,
        };
      });
    }
    return guestlistAvatars.slice(0, 5).map((src, i) => ({
      key: `fallback-${src}-${i}`,
      label: '',
      kind: 'media',
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
      <div className={`flex items-center justify-center bg-[#0a0a0a] text-zinc-300 ${isPane ? 'absolute inset-0' : `min-h-screen ${DESKTOP_NAVBAR_OFFSET}`}`}>
        <PxiSpinner size="md" />
      </div>
    );
  }

  if (!apiEvent) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center text-white ${isPane ? 'absolute inset-0' : `min-h-[60vh] ${DESKTOP_NAVBAR_OFFSET}`}`}>
        <p className="text-lg font-semibold">Event not found</p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          This link may be invalid or the event was removed.
        </p>
        <Link href="/events" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
          Browse events
        </Link>
      </div>
    );
  }

  const isPublicEvent = apiEvent.visibility !== 'PRIVATE';

  return (
    <div className={`bg-[#0a0a0a] font-sans text-white antialiased ${isPane ? 'absolute inset-0 overflow-y-auto no-scrollbar' : `min-h-screen ${DESKTOP_NAVBAR_OFFSET}`}`}>
      {isPublicEvent && !isPane ? <JsonLd data={buildEventJsonLd(apiEvent, getSiteUrl())} /> : null}
      
      {!isPane ? (
        <div className="fixed left-4 z-50 top-20 md:top-24 md:left-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-full border-0 bg-black/45 hover:bg-black/65 backdrop-blur-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-all shadow-lg"
          >
            <HugeiconsIcon icon={ArrowLeftIcon} className="size-3.5" />
            event
          </Link>
        </div>
      ) : null}

      <div className="relative min-h-full">
        <div className={`${isPane ? 'absolute' : 'fixed'} inset-0 top-0 z-0 h-full w-full overflow-hidden bg-[#0a0a0a]`}>
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
          <main className={`mx-auto flex w-full max-w-5xl flex-col px-3 pb-40 sm:px-6 ${isPane ? 'mt-4' : 'md:mt-4 md:grid md:pb-32 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 md:pt-16 2xl:max-w-6xl 2xl:gap-12'}`}>
            <div className={isPane ? "flex flex-col" : "order-1 flex flex-col md:order-2 md:w-[330px] lg:w-[375px] 2xl:w-[400px]"}>
              <div className={`relative top-0 mx-auto h-auto w-full ${isPane ? '' : 'md:sticky md:top-28 md:max-w-[400px]'}`}>
                <div className={`relative -mx-3 w-[calc(100%+1.5rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] ${isPane ? '' : 'md:mx-0 md:w-full'}`}>
                  <div className={`relative w-full overflow-hidden bg-zinc-900 ${isPane ? 'aspect-square' : 'aspect-[3/4] md:rounded-lg'}`}>
                    {heroImage ? (
                      <Image
                        alt={`${eventTitle} flyer`}
                        fill
                        unoptimized
                        sizes={isPane ? '100vw' : '(max-width: 768px) 100vw, 400px'}
                        className="object-cover transition-opacity duration-300"
                        src={heroImage}
                      />
                    ) : null}
                    {isPane && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
                    )}
                  </div>
                </div>

                {!isPane && (
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
                )}
              </div>
            </div>

            <div className={`mb-0 flex flex-col gap-4 border-white/15 pt-4 ${isPane ? 'relative z-20 -mt-32 border-0' : 'mt-2 border-t order-2 md:order-1 md:mt-2 md:pt-0'}`}>
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold tracking-tight text-white">Organizer</h2>
                {hasHost ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="mt-0.5 flex min-w-0 flex-1 flex-row items-start gap-3">
                      <UserAvatar
                        user={{ avatarUrl: apiEvent?.host?.avatarUrl }}
                        size={40}
                        alt={organizerName}
                        className="shrink-0 border border-white/20"
                      />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-pxi-purple">PXI Passport</p>
                        <p className="text-base font-medium tracking-tight text-white">{organizerName}</p>
                        {hostPxiHandle ? (
                          <p className="truncate text-xs text-zinc-400">@{hostPxiHandle}</p>
                        ) : null}
                      </div>
                    </div>
                    {albumId ? (
                      <Link
                        href={`/album/${albumId}`}
                        className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--pxi-orange)]/15 px-3.5 text-xs font-black uppercase tracking-widest text-[var(--pxi-orange)] transition hover:bg-[var(--pxi-orange)]/25"
                      >
                        Open album
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <h1 className={`text-balance font-semibold tracking-tight text-white ${isPane ? 'text-4xl' : 'text-4xl md:text-5xl xl:text-6xl'}`}>
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
                        className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)]/15 px-3 text-xs font-medium text-[var(--pxi-orange)] transition hover:bg-[var(--pxi-orange)]/25"
                        onClick={() => setGuestlistOpen(true)}
                      >
                        <span className="hidden sm:inline">View guestlist</span>
                        <span className="sm:hidden">Guestlist</span>
                        <HugeiconsIcon icon={ScanIcon} className="size-4 text-[var(--pxi-orange)]" aria-hidden />
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
                            className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[11px] font-bold uppercase text-zinc-300"
                            style={{ zIndex: previewGuestTiles.length - i }}
                            title={tile.label || undefined}
                          >
                            {tile.kind === 'user' ? (
                              <UserAvatar user={{ avatarUrl: tile.avatarUrl }} size={32} className="size-full" />
                            ) : tile.src ? (
                              <Image src={tile.src} alt="" className="size-full object-cover" width={32} height={32} unoptimized />
                            ) : (
                              <UserAvatar size={32} className="size-full" />
                            )}
                          </span>
                        ))}
                        {previewExtraCount > 0 ? (
                          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/5 text-[11px] font-semibold text-zinc-200">
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
                      className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)]/15 px-3 text-xs font-medium text-[var(--pxi-orange)] transition hover:bg-[var(--pxi-orange)]/25"
                      onClick={() => setGuestlistOpen(true)}
                    >
                      <span className="hidden sm:inline">View guestlist</span>
                      <span className="sm:hidden">Guestlist</span>
                      <HugeiconsIcon icon={ScanIcon} className="size-4 text-[var(--pxi-orange)]" aria-hidden />
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

              {ticketTiers.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <SectionDivider />
                  <h2 className="text-base font-semibold tracking-tight text-white">Ticket tiers</h2>
                  <div className="space-y-2">
                    {ticketTiers.map((tier) => (
                      <div
                        key={tier.id || tier.label}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <span className="text-sm font-medium text-zinc-100">{tier.label}</span>
                        <span className="text-sm font-bold text-white">
                          {formatPrice(tier.priceUsd, apiEvent.currency || 'USD')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-8">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Lineup</h2>
                {lineup.length > 0 ? (
                  <div className="relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-6">
                      {lineup.map((item) => (
                        <div key={item.key} className="flex flex-col">
                          <div className="flex flex-col gap-2">
                            <div className="group relative aspect-square w-full overflow-hidden rounded-sm">
                              {item.href ? (
                                <a target="_blank" className="relative block h-full w-full" href={item.href} rel="noopener noreferrer">
                                  <UserAvatar src={item.image} size={400} rounded="md" className="!h-full !w-full transition-all duration-200 ease-in-out" alt={item.alt} />
                                  <div className="absolute inset-0 bg-black/0 transition-all duration-200 ease-in-out group-hover:bg-black/20" />
                                </a>
                              ) : (
                                <UserAvatar src={item.image} size={400} rounded="md" className="!h-full !w-full" alt={item.alt} />
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {item.href ? (
                                <a target="_blank" className="group inline-flex items-center gap-1 text-white" href={item.href} rel="noopener noreferrer">
                                  <span className="relative text-lg font-medium tracking-tight after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all group-hover:after:w-full">{item.name}</span>
                                  <HugeiconsIcon icon={ArrowUpRightIcon} className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
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
                  <div className="flex flex-col gap-6">
                    {hostProfileLoading ? (
                      <p className="text-sm text-zinc-500">Loading passport…</p>
                    ) : hostPassportUser ? (
                      <EventHostPassport user={hostPassportUser} />
                    ) : (
                      <p className="text-sm text-zinc-500">
                        {hostProfile?.isPrivateAccount
                          ? 'This host’s passport is private.'
                          : 'This host has not published their PXI Passport on the web yet.'}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-white/[0.03] px-5 py-4 text-sm text-white/85">
                      <span>
                        {hostEventsCreated} {hostEventsCreated === 1 ? 'event' : 'events'} created
                      </span>
                      <span className="hidden h-4 w-px bg-zinc-600 sm:block" aria-hidden />
                      <span>
                        {hostMembersJoinedAcrossEvents}{' '}
                        {hostMembersJoinedAcrossEvents === 1 ? 'community member' : 'community members'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">{SECTION_EMPTY}</p>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <SectionDivider />
                <h2 className="text-base font-semibold tracking-tight text-white">Get the app</h2>
                <div className="flex flex-col items-center gap-4 rounded-xl bg-white/[0.03] px-6 py-8">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <HugeiconsIcon icon={SmartPhone01Icon} className="size-8 text-zinc-400" aria-hidden />
                    <h3 className={`text-center font-semibold text-white ${isPane ? 'text-xl' : 'text-xl md:text-2xl'}`}>More features in the app</h3>
                  </div>
                  <AppStoreCtaPair className="max-w-md mx-auto" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Primary CTA — sits above the dismissible app banner (banner = z-40, this = z-50). */}
      <div className={`pointer-events-none ${isPane ? 'sticky' : 'fixed'} inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]`}>
        <button
          type="button"
          onClick={() => router.push(`/events/${apiEvent.id}/checkout`)}
          className="pointer-events-auto pxi-orange-pill inline-flex h-[3.375rem] w-[min(25.5rem,calc(100%-1.5rem))] shrink-0 items-center justify-center rounded-full px-8 text-sm font-semibold uppercase tracking-wide text-white shadow-md shadow-black/40 transition hover:opacity-90"
        >
          Join event
        </button>
      </div>

      {guestlistOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setGuestlistOpen(false)}
          />
          <div className="relative z-10 w-[92vw] max-w-3xl rounded-2xl bg-[#0a0a0a] p-5 shadow-xl">
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
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-4">
              {!albumId ? (
                <div className="py-10 text-center text-zinc-500">{SECTION_NONE}</div>
              ) : participantsLoading ? (
                <div className="flex items-center justify-center py-10 text-zinc-400">
                  <PxiSpinner size="sm" />
                </div>
              ) : participantsLoaded && participants.length === 0 ? (
                <div className="py-10 text-center text-zinc-500">{SECTION_EMPTY}</div>
              ) : (
                <div className={`grid gap-4 ${isPane ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'}`}>
                  {(participantsLoaded ? participants : []).map((p, idx) => {
                    const label = String(
                      p?.name || p?.username || p?.userId || `Member ${idx + 1}`
                    ).replace(/^@/, '');
                    return (
                      <div key={p?.userId || p?.id || `${label}-${idx}`} className="flex flex-col items-center gap-1.5 min-w-0">
                        <span
                          className="relative inline-flex size-12 shrink-0 overflow-hidden rounded-full"
                          title={label}
                        >
                          <UserAvatar user={{ avatarUrl: p?.avatarUrl }} size={48} alt={label} className="size-full" />
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

      {/* Dismissible banner sits below the Join Event CTA (4.75rem ≈ button + spacing) so it never obscures it. */}
      {!isPane ? (
        <AppOpenBanner
          deepLinkUrl={albumId ? `pxi://album/${albumId}` : `pxi://event/${apiEvent.id}`}
          title="Already have PXI?"
          subtitle="Tap to open this event in the app"
          bottomOffset="4.75rem"
          storageKey={`pxi_app_banner_event_${apiEvent.id}_dismissed`}
        />
      ) : null}
    </div>
  );
}
