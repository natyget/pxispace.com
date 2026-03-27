'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Globe,
  Instagram,
  Loader2,
  Play,
  Scan,
  Smartphone,
  X,
} from 'lucide-react';
import { eventsService } from '@/services/events';
import { PXI_APP_STORE_URL, PXI_PLAY_STORE_URL } from '@/lib/appStoreLinks';
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

export default function EventsNewEventPage() {
  const { id } = useParams();
  const router = useRouter();
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
  const organizerHref = apiEvent?.host?.username
    ? `https://instagram.com/${encodeURIComponent(String(apiEvent.host.username).replace(/^@/, ''))}`
    : '#';

  const eventTitle = apiEvent?.name || 'Event';
  const rawLocation = typeof apiEvent?.location === 'string' ? apiEvent.location.trim() : '';
  const locationLabel = rawLocation || SECTION_EMPTY;
  const goingCount = apiEvent?._count?.tickets ?? 0;

  const guestlistAvatars = useMemo(() => deriveGuestlistAvatars(apiEvent), [apiEvent]);
  const lineup = useMemo(() => deriveLineup(apiEvent), [apiEvent]);

  const mapSrc = singleEventMapEmbedSrc(apiEvent?.latitude, apiEvent?.longitude);
  const hasMap = !!mapSrc;
  const hasDescription = !!(apiEvent?.description && String(apiEvent.description).trim());
  const aboutParagraphs = hasDescription ? String(apiEvent.description).split(/\n{2,}/) : [];
  const scheduleMissing = !apiEvent?.startDate;
  const scheduleLabel = scheduleMissing ? SECTION_EMPTY : `${formatEventDate(apiEvent.startDate)} at ${formatEventTime(apiEvent.startDate)}`;

  const albumId = apiEvent?.albumId || apiEvent?.albums?.[0]?.id || null;

  // Load attendee list for both the preview (people going) and the guestlist modal.
  useEffect(() => {
    if (!albumId) return;
    if (participantsLoaded || participantsLoading) return;
    setParticipantsLoading(true);
    eventsService
      .getAlbumParticipants(albumId)
      .then((res) => setParticipants(res.participants || []))
      .catch(() => setParticipants([]))
      .finally(() => {
        setParticipantsLoading(false);
        setParticipantsLoaded(true);
      });
  }, [albumId, participantsLoaded, participantsLoading]);

  // Close modal on Escape.
  useEffect(() => {
    if (!guestlistOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setGuestlistOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guestlistOpen]);

  const previewMembers = participantsLoaded
    ? participants
    : [];

  const previewAvatarSources = useMemo(() => {
    if (participantsLoaded && previewMembers.length) {
      return previewMembers
        .map((p) => displayImageSrc(p?.avatarUrl, null))
        .filter(Boolean)
        .slice(0, 5);
    }
    return guestlistAvatars.slice(0, 5);
  }, [participantsLoaded, previewMembers, guestlistAvatars]);

  const guestlistEmpty = goingCount === 0 && previewAvatarSources.length === 0;

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
                    <a
                      className="mt-0.5 flex flex-row items-start justify-start gap-2 p-0 hover:underline"
                      href={organizerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="relative mt-0.5 flex size-5 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                        {organizerAvatar ? (
                          <Image className="size-full object-cover" alt="" src={organizerAvatar} width={20} height={20} unoptimized />
                        ) : (
                          <span className="flex size-full items-center justify-center text-[9px] font-semibold text-zinc-400" aria-hidden>
                            {(organizerName || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="text-base font-medium tracking-tight text-white">{organizerName}</span>
                    </a>
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
                        {previewAvatarSources.map((src, i) => (
                          <span
                            key={`${src}-${i}`}
                            className="relative inline-flex size-8 overflow-hidden rounded-full border-2 border-[#0a0a0a] ring-1 ring-white/10"
                            style={{ zIndex: previewAvatarSources.length - i }}
                          >
                            <Image src={src} alt="" className="size-full object-cover" width={32} height={32} unoptimized />
                          </span>
                        ))}
                        {previewExtraCount > 0 ? (
                          <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white/5 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
                            +{previewExtraCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium leading-5 text-zinc-200">
                        <span className="text-white">{goingCount}</span> people going
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
                  <div className="rounded-xl bg-white/5 p-4 backdrop-blur-xl">
                    <div className="flex justify-between gap-4">
                      <span className="inline-flex min-w-0 flex-1 flex-wrap items-center text-sm leading-5 font-normal text-zinc-100">{organizerName}</span>
                      {organizerHref !== '#' ? (
                        <a className="flex shrink-0 items-center gap-1 text-sm text-white/60 hover:underline" href={organizerHref} target="_blank" rel="noopener noreferrer">
                          Profile
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </a>
                      ) : null}
                    </div>

                    <div className="mb-6 mt-10 flex flex-col items-center">
                      {organizerAvatar ? (
                        <Image alt={organizerName} width={200} height={200} unoptimized className="h-52 w-52 rounded-full object-cover opacity-100 transition-opacity duration-300" src={organizerAvatar} />
                      ) : (
                        <div className="flex h-52 w-52 items-center justify-center rounded-full bg-zinc-800 text-3xl font-semibold text-zinc-500" aria-hidden>
                          {(organizerName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="mb-4 flex flex-col items-center gap-4">
                      <p className="text-center font-medium text-white/80">{organizerName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white/80">{apiEvent?._count?.events ?? 0} events</p>
                        <div className="h-4 w-px bg-zinc-500" />
                        <p className="text-sm text-white/80">{goingCount} attendees</p>
                      </div>
                      <div className="my-2 text-white/80">
                        <div className="flex gap-2">
                          {apiEvent?.host?.instagramHandle ? (
                            <a target="_blank" rel="noopener noreferrer" href={`https://instagram.com/${encodeURIComponent(String(apiEvent.host.instagramHandle).replace(/^@/, ''))}`} className="text-white/80 transition hover:text-white" aria-label={`${organizerName} on Instagram`}>
                              <Instagram className="h-4 w-4" strokeWidth={2} />
                            </a>
                          ) : null}
                          {apiEvent?.websiteUrl ? (
                            <a target="_blank" rel="noopener noreferrer" href={apiEvent.websiteUrl} className="text-white/80 transition hover:text-white" aria-label={`${organizerName} website`}>
                              <Globe className="h-4 w-4" strokeWidth={2} />
                            </a>
                          ) : null}
                        </div>
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
                  <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                    <a href={PXI_APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10 sm:flex-initial">
                      <Smartphone className="size-4" />
                      App Store
                    </a>
                    <a href={PXI_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10 sm:flex-initial">
                      <Smartphone className="size-4" />
                      Google Play
                    </a>
                  </div>
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
                    const src = displayImageSrc(p?.avatarUrl, null);
                    if (!src) return null;
                    const label =
                      p?.username || p?.name || p?.userId || `Member ${idx + 1}`;
                    return (
                      <div key={p?.userId || p?.id || label} className="flex flex-col items-center gap-2">
                        <span
                          className="relative inline-flex size-12 overflow-hidden rounded-full border-2 border-[#0a0a0a] ring-1 ring-white/10"
                          title={label}
                        >
                          <Image src={src} alt={label} className="size-full object-cover" width={48} height={48} unoptimized />
                        </span>
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
