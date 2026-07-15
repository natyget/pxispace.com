'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, LockIcon, MoreHorizontalCircle02Icon } from '@hugeicons/core-free-icons';
import { albumsService } from '@/services/albums';
import { faceService } from '@/services/face';
import { useAuth } from '@/contexts/AuthContext';
import PublicAlbumBottomBar from '@/views/public/PublicAlbumBottomBar';
import PublicAlbumMasonryGrid from './PublicAlbumMasonryGrid';
import PublicAlbumThreadMediaCard from './PublicAlbumThreadMediaCard';
import PublicAlbumThreadMediaCarousel from './PublicAlbumThreadMediaCarousel';
import PublicAlbumThreadMessage from './PublicAlbumThreadMessage';
import PublicAlbumThreadJoinEvent from './PublicAlbumThreadJoinEvent';
import PublicAlbumThreadFocusOverlay from './PublicAlbumThreadFocusOverlay';
import {
  buildPublicAlbumTimeline,
  mergeOlderPublicThreadPage,
  timelineRowKey,
} from './buildPublicAlbumTimeline';
import EventDetailsModal from '@/components/events/EventDetailsModal';
import EventDetailClient from '@/views/events/EventDetailClient';
import { buildAlbumEventDetails } from './albumEventDetailsAdapter';
import PublicAlbumJoinEventButton from './PublicAlbumJoinEventButton';
import IphonePane from './IphonePane';
import FindMyselfModal from './FindMyselfModal';
import { mediaDisplayUrl } from './albumMediaLayout';
import {
  PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET,
  THREAD_MEDIA_TILT_DEG,
  THREAD_PAGE_HORIZONTAL_GUTTER,
} from './albumLayoutConstants';
import { useThreadPaneWidth } from './useThreadPaneWidth';
import { useAlbumThreadScroll } from './useAlbumThreadScroll';
import { publicAlbumMediaId, useAlbumThreadActiveVideo } from './useAlbumThreadActiveVideo';
import { syncStableMediaRotations } from './stableMediaRotations';
import { markAlbumVideoUserActivation } from './albumExclusivePlayback';

function normalizeMediaList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((m) => Boolean(mediaDisplayUrl(m)));
}

export default function PublicAlbumClient({ albumId, initialAlbum = null, initialDenied = false }) {
  const [album, setAlbum] = useState(initialAlbum);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [threadMedia, setThreadMedia] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadTimelineOffset, setThreadTimelineOffset] = useState(0);
  const [loading, setLoading] = useState(!initialAlbum && !initialDenied);
  const [contentLoading, setContentLoading] = useState(false);
  const [denied, setDenied] = useState(initialDenied);
  const [tab, setTab] = useState('thread');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [threadFocusOpen, setThreadFocusOpen] = useState(false);
  const [threadFocusIndex, setThreadFocusIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [threadHasMore, setThreadHasMore] = useState(false);
  const [loadingMoreThread, setLoadingMoreThread] = useState(false);
  const [findMyselfOpen, setFindMyselfOpen] = useState(false);
  const [myMatchIds, setMyMatchIds] = useState(null); // Set<string> after a scan
  const [onlyMyShots, setOnlyMyShots] = useState(false);
  const { isAuthenticated, authReady, faceEnrolled } = useAuth();
  const myMatchesLoadedForRef = useRef(null);
  const threadShellRef = useRef(null);
  const threadListRef = useRef(null);
  const threadEndRef = useRef(null);
  const threadTopRef = useRef(null);
  const mediaRotationByIdRef = useRef(new Map());
  const lastViewableThreadVideoIdRef = useRef(null);
  const [pinnedThreadVideoId, setPinnedThreadVideoId] = useState(null);

  const setThreadScrollEl = useCallback((el) => {
    threadListRef.current = el;
  }, []);
  const threadPaneWidth = useThreadPaneWidth(threadShellRef);
  const participants = album?.previewParticipants || [];
  const threadTimeline = useMemo(
    () => buildPublicAlbumTimeline(threadMedia, threadMessages, participants),
    [threadMedia, threadMessages, participants],
  );
  const mediaRotationById = useMemo(
    () => syncStableMediaRotations(threadTimeline, mediaRotationByIdRef.current),
    [threadTimeline],
  );
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;
  const albumDetails = useMemo(() => buildAlbumEventDetails(album, albumId), [album, albumId]);
  const threadScrollActive = tab === 'thread' && !contentLoading;
  const activeThreadVideoId = useAlbumThreadActiveVideo({
    scrollRef: threadListRef,
    active: threadScrollActive,
    enabled: !threadFocusOpen,
  });
  const effectiveThreadVideoId = threadFocusOpen
    ? null
    : (pinnedThreadVideoId ?? activeThreadVideoId);

  useEffect(() => {
    if (activeThreadVideoId && !threadFocusOpen) {
      lastViewableThreadVideoIdRef.current = activeThreadVideoId;
      if (pinnedThreadVideoId && pinnedThreadVideoId === activeThreadVideoId) {
        setPinnedThreadVideoId(null);
      }
    }
  }, [activeThreadVideoId, threadFocusOpen, pinnedThreadVideoId]);
  const loadOlderThread = useCallback(async () => {
    if (!albumId || loadingMoreThread || !threadHasMore) return;
    setLoadingMoreThread(true);
    try {
      const res = await albumsService.getPublicAlbumThread(albumId, 40, threadTimelineOffset);
      const merged = mergeOlderPublicThreadPage(threadMessages, threadMedia, {
        messages: Array.isArray(res?.messages) ? res.messages : [],
        mediaItems: normalizeMediaList(res?.mediaItems),
      });
      setThreadMessages(merged.messages);
      setThreadMedia(merged.mediaItems);
      const pag = res?.pagination;
      setThreadTimelineOffset((pag?.offset ?? threadTimelineOffset) + (pag?.count ?? 0));
      setThreadHasMore(Boolean(res?.pagination?.hasMore));
    } finally {
      setLoadingMoreThread(false);
    }
  }, [
    albumId,
    loadingMoreThread,
    threadHasMore,
    threadTimelineOffset,
    threadMessages,
    threadMedia,
  ]);

  const { handleThreadScroll } = useAlbumThreadScroll({
    scrollRef: threadListRef,
    listRef: threadListRef,
    topRef: threadTopRef,
    albumId,
    active: threadScrollActive,
    threadItemCount: threadTimeline.length,
    contentLoading,
    loadingMoreThread,
    hasMoreOlder: threadHasMore,
    onLoadOlder: loadOlderThread,
  });

  const loadContent = useCallback(async (id) => {
    setContentLoading(true);
    try {
      const [mediaRes, threadRes] = await Promise.all([
        albumsService.getPublicAlbumMedia(id, 80, 0),
        albumsService.getPublicAlbumThread(id, 40, 0),
      ]);
      setGalleryMedia(normalizeMediaList(mediaRes?.items));
      setThreadMedia(normalizeMediaList(threadRes?.mediaItems));
      setThreadMessages(Array.isArray(threadRes?.messages) ? threadRes.messages : []);
      const pag = threadRes?.pagination;
      setThreadTimelineOffset((pag?.offset ?? 0) + (pag?.count ?? 0));
      setThreadHasMore(Boolean(threadRes?.pagination?.hasMore));
    } catch {
      setGalleryMedia([]);
      setThreadMedia([]);
      setThreadMessages([]);
      setThreadTimelineOffset(0);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    mediaRotationByIdRef.current = new Map();
  }, [albumId]);

  useEffect(() => {
    if (!albumId) {
      setLoading(false);
      return;
    }
    if (initialAlbum || initialDenied) {
      if (initialAlbum && !initialDenied) void loadContent(albumId);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDenied(false);
    albumsService
      .getPublicAlbum(albumId)
      .then((data) => {
        const a = data?.album || null;
        setAlbum(a);
        if (!a || a.shareAccess?.tier === 'DENIED') {
          setDenied(true);
        } else {
          void loadContent(albumId);
        }
      })
      .catch((err) => {
        if (err?.status === 403) setDenied(true);
        else setAlbum(null);
      })
      .finally(() => setLoading(false));
  }, [albumId, initialAlbum, initialDenied, loadContent]);

  const albumTitle = useMemo(() => {
    const raw =
      album?.event?.name?.trim() ||
      album?.name?.replace(/\s+Album$/i, '').trim() ||
      album?.name ||
      'Album';
    return raw.toUpperCase();
  }, [album]);

  const eventId = album?.event?.id || null;
  const openLightbox = (index) => {
    markAlbumVideoUserActivation();
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openThreadFocus = (mediaIndex) => {
    const item = threadMedia[mediaIndex];
    const mediaId = publicAlbumMediaId(item);
    if (String(item?.type || '').toUpperCase() === 'VIDEO' && mediaId) {
      lastViewableThreadVideoIdRef.current = mediaId;
    } else if (activeThreadVideoId) {
      lastViewableThreadVideoIdRef.current = activeThreadVideoId;
    }
    markAlbumVideoUserActivation();
    setThreadFocusIndex(mediaIndex);
    setThreadFocusOpen(true);
  };

  const closeThreadFocus = () => {
    setThreadFocusOpen(false);
    const resumeId = lastViewableThreadVideoIdRef.current;
    if (resumeId) setPinnedThreadVideoId(resumeId);
  };

  useEffect(() => {
    if (tab !== 'thread') setThreadFocusOpen(false);
    if (tab !== 'gallery') setLightboxOpen(false);
  }, [tab]);

  // Face scan prompt: offer "find yourself" once per album per session, as soon as
  // the gallery has content to match against — but NEVER re-prompt a signed-in user
  // who already enrolled (their tags load server-side instead).
  useEffect(() => {
    if (!albumId || !album || denied || contentLoading || galleryMedia.length === 0) return;
    if (!authReady) return;

    if (isAuthenticated) {
      // Enrollment status unknown (still loading / errored) — skip rather than nag.
      if (faceEnrolled !== false) {
        if (faceEnrolled === true && myMatchesLoadedForRef.current !== albumId) {
          // Enrolled: hydrate "My shots" from the server-side face tags, no scan needed.
          myMatchesLoadedForRef.current = albumId;
          faceService
            .myAlbumMatches(albumId)
            .then((res) => {
              const ids = Array.isArray(res?.mediaIds) ? res.mediaIds : [];
              if (ids.length > 0) setMyMatchIds(new Set(ids.map(String)));
            })
            .catch(() => {});
        }
        return;
      }
    }

    let prompted = false;
    try {
      const key = `pxi_findme_prompted_${albumId}`;
      prompted = window.sessionStorage.getItem(key) === '1';
      if (!prompted) window.sessionStorage.setItem(key, '1');
    } catch {
      /* sessionStorage unavailable — still show once for this mount */
    }
    if (!prompted) setFindMyselfOpen(true);
  }, [albumId, album, denied, contentLoading, galleryMedia.length, authReady, isAuthenticated, faceEnrolled]);

  const handleFaceMatches = useCallback((mediaIds) => {
    setMyMatchIds(new Set(mediaIds.map(String)));
    setOnlyMyShots(mediaIds.length > 0);
    if (mediaIds.length > 0) setTab('gallery');
  }, []);

  const visibleGalleryMedia = useMemo(() => {
    if (!onlyMyShots || !myMatchIds) return galleryMedia;
    return galleryMedia.filter((m) => myMatchIds.has(String(publicAlbumMediaId(m) || '')));
  }, [galleryMedia, onlyMyShots, myMatchIds]);

  if (loading) {
    return (
      <div className="public-album-page flex min-h-[100dvh] items-center justify-center">
        <IphonePane className="items-center justify-center">
          <HugeiconsIcon icon={Loading02Icon} className="size-6 animate-spin text-zinc-400" />
        </IphonePane>
      </div>
    );
  }

  if (!album || denied) {
    return (
      <div className="public-album-page flex min-h-[100dvh] items-center justify-center px-4">
        <IphonePane className="items-center justify-center px-4 text-center text-white">
          <HugeiconsIcon icon={LockIcon} className="mb-4 size-8 text-zinc-500" />
          <p className="text-lg font-semibold">{!album ? 'Album not found' : 'Private album'}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {!album
              ? 'This link may be invalid or the album was removed.'
              : 'This album is private. Open the PXI app to request access.'}
          </p>
          {eventId ? (
            <Link href={`/events/${eventId}`} className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
              View event page
            </Link>
          ) : (
            <Link href="/" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
              Back to PXI
            </Link>
          )}
          <div className="mt-8 w-full">
            <PublicAlbumBottomBar albumId={albumId} embedded />
          </div>
        </IphonePane>
      </div>
    );
  }

  const threadHasContent =
    threadMedia.length > 0 ||
    threadMessages.some((m) => m.messageType !== 'system');
  const isEmpty =
    !contentLoading &&
    (tab === 'gallery' ? galleryMedia.length === 0 : !threadHasContent);

  return (
    <div className="public-album-page min-h-0 flex-1 lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      {/* Left: thread + gallery — iPhone viewport (centered in the left 50% on desktop) */}
      <div className="public-album-left-slot flex flex-col items-center">
        <div
          ref={threadShellRef}
          className="album-thread-shell flex w-full flex-col max-lg:min-h-0 max-lg:flex-1 max-lg:border-0 max-lg:rounded-none max-lg:outline-none max-lg:ring-0 max-lg:shadow-none"
        >
        <div className="album-thread-chrome relative z-[5] w-full shrink-0 bg-black max-lg:border-b max-lg:border-white/5">
          <div
            className="relative flex h-14 items-center justify-center lg:hidden"
            style={{ paddingLeft: THREAD_PAGE_HORIZONTAL_GUTTER, paddingRight: THREAD_PAGE_HORIZONTAL_GUTTER }}
          >
            <h1 className="truncate px-10 text-center text-xl font-black uppercase tracking-[0.24em] text-white">
              {albumTitle}
            </h1>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Album details"
            >
              <HugeiconsIcon icon={MoreHorizontalCircle02Icon} size={26} />
            </button>
          </div>
          <div
            className="pb-4 pt-4"
            style={{ paddingLeft: THREAD_PAGE_HORIZONTAL_GUTTER, paddingRight: THREAD_PAGE_HORIZONTAL_GUTTER }}
          >
            <div className="flex w-full rounded-full border border-white/5 bg-[#1c1c1c] p-1.5">
              {['thread', 'gallery'].map((v) => {
                const label = v === 'thread' ? 'THREAD' : 'GALLERY';
                const active = tab === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTab(v)}
                    className={`relative flex-1 rounded-full py-3 text-[11px] font-black uppercase tracking-[0.24em] transition ${
                      active ? 'text-white' : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {active ? (
                      <span
                        className="absolute inset-0 rounded-full bg-[#d946ef] shadow-[0_0_15px_rgba(217,70,239,0.8)]"
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-[1]">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="album-thread-body flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          ref={setThreadScrollEl}
          className={`album-thread-list no-scrollbar relative box-border flex min-h-0 flex-col overflow-x-hidden max-lg:flex-1 max-lg:min-h-0 ${
            tab === 'gallery' ? 'overflow-hidden' : 'overflow-y-auto pb-5 pt-5'
          }`}
          style={{
            paddingLeft: PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET,
            paddingRight: PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET,
          }}
          onScroll={tab === 'thread' ? handleThreadScroll : undefined}
        >
          {tab === 'thread' && loadingMoreThread ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
              aria-live="polite"
              aria-busy="true"
            >
              <HugeiconsIcon icon={Loading02Icon} className="size-5 animate-spin text-[#B8B8B8]" />
            </div>
          ) : null}
          {contentLoading ? (
            <div className="flex items-center justify-center py-20">
              <HugeiconsIcon icon={Loading02Icon} className="size-6 animate-spin text-zinc-500" />
            </div>
          ) : isEmpty ? (
            <p className="py-16 text-center text-sm text-zinc-500">No photos yet. Open the app to see more.</p>
          ) : tab === 'gallery' ? (
            <div className="album-gallery-layout flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center gap-2 pb-3">
                {myMatchIds ? (
                  <button
                    type="button"
                    onClick={() => setOnlyMyShots((v) => !v)}
                    className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                      onlyMyShots
                        ? 'border-pxi-purple bg-pxi-purple/20 text-white shadow-[0_0_20px_rgba(216,74,255,0.3)]'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'
                    }`}
                  >
                    My shots ({myMatchIds.size})
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFindMyselfOpen(true)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:border-pxi-purple/50 hover:text-white"
                >
                  {myMatchIds ? 'Rescan' : 'Find my shots'}
                </button>
              </div>
              <div className="album-gallery-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                {onlyMyShots && myMatchIds && visibleGalleryMedia.length === 0 ? (
                  <p className="py-16 text-center text-sm text-zinc-500">
                    No matches in this album yet — new uploads are matched as they land.
                  </p>
                ) : (
                  <PublicAlbumMasonryGrid items={visibleGalleryMedia} onPressItem={openLightbox} />
                )}
              </div>
            </div>
          ) : (
            <>
              <div ref={threadTopRef} className="h-px w-full shrink-0" aria-hidden />
              {(() => {
                let mediaIndex = 0;
                return threadTimeline.map((row, idx) => {
                  const key = timelineRowKey(row, idx);
                  if (row.type === 'EVENT') {
                    return <PublicAlbumThreadJoinEvent key={key} text={row.data.text} />;
                  }
                  if (row.type === 'CHAT') {
                    const chatTilt = idx % 2 === 0 ? -0 : 0;
                    return (
                      <PublicAlbumThreadMessage
                        key={key}
                        message={row.data}
                        rotation={chatTilt}
                      />
                    );
                  }
                  if (row.type === 'MEDIA_GROUP') {
                    // Same-member media burst → one carousel card (progress dots,
                    // reactions/focus target the active slide).
                    const groupStartIndex = mediaIndex;
                    mediaIndex += row.data.items.length;
                    const firstId = publicAlbumMediaId(row.data.items[0]);
                    const groupTilt = mediaRotationById.get(firstId) ?? THREAD_MEDIA_TILT_DEG;
                    return (
                      <PublicAlbumThreadMediaCarousel
                        key={key}
                        items={row.data.items}
                        rotation={groupTilt}
                        paneWidth={threadPaneWidth}
                        openInAppUrl={openInAppUrl}
                        activeVideoId={effectiveThreadVideoId}
                        onPressSlide={(offset) => openThreadFocus(groupStartIndex + offset)}
                      />
                    );
                  }
                  const currentMediaIndex = mediaIndex;
                  mediaIndex += 1;
                  const mediaId = publicAlbumMediaId(row.data);
                  const mediaTilt = mediaRotationById.get(mediaId) ?? THREAD_MEDIA_TILT_DEG;
                  return (
                    <PublicAlbumThreadMediaCard
                      key={key}
                      item={row.data}
                      rotation={mediaTilt}
                      paneWidth={threadPaneWidth}
                      openInAppUrl={openInAppUrl}
                      isPlaybackActive={
                        String(row.data.type || '').toUpperCase() === 'VIDEO' &&
                        Boolean(mediaId) &&
                        effectiveThreadVideoId === mediaId
                      }
                      onPress={() => openThreadFocus(currentMediaIndex)}
                    />
                  );
                });
              })()}
              <div ref={threadEndRef} className="h-px w-full shrink-0" aria-hidden />
            </>
          )}
        </div>
        {/* Mobile-only join CTA in the spot the read-only chatbar used to live —
            on the public album page the user can't compose, so this surfaces the
            primary action (route to /events/[id]/checkout for full EULA + ticket flow). */}
        <PublicAlbumJoinEventButton album={album} albumId={albumId} className="lg:hidden" />
        </div>
        </div>

      </div>

      {/* Right: album details — desktop only; mobile uses three-dot sheet. Renders the
         full EventDetailClient layout constrained to the pane. */}
      <div className="album-details-pane relative bg-[#0a0a0a]">
        {album?.event?.id || album?.eventId ? (
          <EventDetailClient
            eventIdOverride={album?.event?.id || album?.eventId}
            initialEvent={album?.event}
            presentation="pane"
          />
        ) : (
          <div className="album-details-shell items-center justify-center p-6">
            <div className="flex h-full max-h-[860px] w-full max-w-[480px] flex-col overflow-hidden">
              <EventDetailsModal
                open
                presentation="inline"
                event={albumDetails.event}
                primaryAction={albumDetails.primaryAction}
                secondaryAction={albumDetails.secondaryAction}
              />
            </div>
          </div>
        )}
      </div>

      <EventDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        presentation="sheet"
        event={albumDetails.event}
        primaryAction={albumDetails.primaryAction}
        secondaryAction={albumDetails.secondaryAction}
      />

      {lightboxOpen && tab === 'gallery' ? (
        <PublicAlbumThreadFocusOverlay
          items={visibleGalleryMedia}
          index={lightboxIndex}
          albumId={albumId}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}

      <FindMyselfModal
        open={findMyselfOpen}
        onClose={() => setFindMyselfOpen(false)}
        albumId={albumId}
        onMatches={handleFaceMatches}
      />
      {threadFocusOpen && tab === 'thread' ? (
        <PublicAlbumThreadFocusOverlay
          items={threadMedia}
          index={threadFocusIndex}
          albumId={albumId}
          onClose={closeThreadFocus}
          onIndexChange={setThreadFocusIndex}
        />
      ) : null}
    </div>
  );
}
