'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, LockIcon } from '@hugeicons/core-free-icons';
import { albumsService } from '@/services/albums';
import PublicAlbumBottomBar from '@/views/public/PublicAlbumBottomBar';
import PublicAlbumMasonryGrid from './PublicAlbumMasonryGrid';
import PublicAlbumScrapbookPost from './PublicAlbumScrapbookPost';
import PublicAlbumThreadMessage from './PublicAlbumThreadMessage';
import PublicAlbumThreadJoinEvent from './PublicAlbumThreadJoinEvent';
import PublicAlbumLightbox from './PublicAlbumLightbox';
import PublicAlbumThreadFocusOverlay from './PublicAlbumThreadFocusOverlay';
import {
  buildPublicAlbumTimeline,
  mergeOlderPublicThreadPage,
  timelineRowKey,
} from './buildPublicAlbumTimeline';
import PublicAlbumDetailsPanel from './PublicAlbumDetailsPanel';
import PublicAlbumParticipants from './PublicAlbumParticipants';
import IphonePane from './IphonePane';
import { mediaDisplayUrl } from './albumMediaLayout';
import {
  IPHONE_VIEWPORT_WIDTH,
  PUBLIC_ALBUM_THREAD_LIST_HEIGHT,
  PUBLIC_ALBUM_THREAD_LIST_HORIZONTAL_INSET,
  THREAD_MEDIA_TILT_DEG,
  THREAD_PAGE_HORIZONTAL_GUTTER,
} from './albumLayoutConstants';
import { useThreadPaneWidth } from './useThreadPaneWidth';
import { useAlbumThreadScroll } from './useAlbumThreadScroll';

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
  const [threadHasMore, setThreadHasMore] = useState(false);
  const [loadingMoreThread, setLoadingMoreThread] = useState(false);
  const threadShellRef = useRef(null);
  const threadListRef = useRef(null);

  const setThreadScrollEl = useCallback((el) => {
    threadListRef.current = el;
  }, []);
  const threadPaneWidth = useThreadPaneWidth(threadShellRef);
  const participants = album?.previewParticipants || [];
  const threadTimeline = useMemo(
    () => buildPublicAlbumTimeline(threadMedia, threadMessages, participants),
    [threadMedia, threadMessages, participants],
  );
  const threadScrollActive = tab === 'thread' && !contentLoading;
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

  const markLoadingOlderRef = useRef(null);
  const { handleThreadScroll, markLoadingOlder } = useAlbumThreadScroll({
    scrollRef: threadListRef,
    listRef: threadListRef,
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
  const lightboxItems = tab === 'gallery' ? galleryMedia : threadMedia;

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openThreadFocus = (mediaIndex) => {
    setThreadFocusIndex(mediaIndex);
    setThreadFocusOpen(true);
  };

  useEffect(() => {
    if (tab !== 'thread') setThreadFocusOpen(false);
  }, [tab]);

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
          className="album-thread-shell w-full"
          style={{ maxWidth: IPHONE_VIEWPORT_WIDTH }}
        >
        <div className="album-thread-chrome w-full shrink-0 bg-black">
          <div
            className="flex h-14 items-center justify-center"
            style={{ paddingLeft: THREAD_PAGE_HORIZONTAL_GUTTER, paddingRight: THREAD_PAGE_HORIZONTAL_GUTTER }}
          >
            <h1 className="truncate text-center text-xl font-black uppercase tracking-[0.24em] text-white">
              {albumTitle}
            </h1>
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

        <div
          ref={setThreadScrollEl}
          className={`album-thread-list no-scrollbar relative box-border flex flex-col overflow-x-hidden ${
            tab === 'gallery' ? 'overflow-hidden' : 'overflow-y-auto pb-5 pt-5'
          }`}
          style={{
            height: PUBLIC_ALBUM_THREAD_LIST_HEIGHT,
            maxHeight: PUBLIC_ALBUM_THREAD_LIST_HEIGHT,
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
              <div className="album-gallery-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                <PublicAlbumMasonryGrid items={galleryMedia} onPressItem={openLightbox} />
              </div>
              <PublicAlbumParticipants participants={participants} pinned />
            </div>
          ) : (
            <>
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
                  const currentMediaIndex = mediaIndex;
                  mediaIndex += 1;
                  const mediaTilt =
                    currentMediaIndex % 2 === 0 ? -THREAD_MEDIA_TILT_DEG : THREAD_MEDIA_TILT_DEG;
                  return (
                    <PublicAlbumScrapbookPost
                      key={key}
                      item={row.data}
                      rotation={mediaTilt}
                      paneWidth={threadPaneWidth}
                      onPress={() => openThreadFocus(currentMediaIndex)}
                    />
                  );
                });
              })()}
            </>
          )}
        </div>
        </div>

      </div>

      {/* Right: album details — full width of the right 50% */}
      <div className="album-details-pane">
        <div className="album-pane-scroll min-h-0 flex-1">
          <PublicAlbumDetailsPanel album={album} albumId={albumId} />
        </div>
      </div>

      {lightboxOpen && tab === 'gallery' ? (
        <PublicAlbumLightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
      {threadFocusOpen && tab === 'thread' ? (
        <PublicAlbumThreadFocusOverlay
          items={threadMedia}
          index={threadFocusIndex}
          albumId={albumId}
          onClose={() => setThreadFocusOpen(false)}
          onIndexChange={setThreadFocusIndex}
        />
      ) : null}
    </div>
  );
}
