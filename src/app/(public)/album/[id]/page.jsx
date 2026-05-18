'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, ListViewIcon, GridViewIcon, LockIcon } from '@hugeicons/core-free-icons';
import { albumsService } from '@/services/albums';
import { displayImageSrc } from '@/lib/mediaUrl';
import PublicAlbumBottomBar from '@/views/public/PublicAlbumBottomBar';

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function PublicAlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState('gallery');

  const loadMedia = useCallback(async (albumId) => {
    setMediaLoading(true);
    try {
      const data = await albumsService.getAlbumMedia(albumId, 60, 0);
      setMedia(Array.isArray(data?.media) ? data.media : []);
    } catch {
      setMedia([]);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setDenied(false);
    albumsService
      .getAlbum(id)
      .then((data) => {
        const a = data?.album || data || null;
        setAlbum(a);
        const tier = a?.shareAccess?.tier;
        if (tier === 'DENIED') {
          setDenied(true);
        } else {
          void loadMedia(id);
        }
      })
      .catch((err) => {
        if (err?.status === 403) setDenied(true);
        else setAlbum(null);
      })
      .finally(() => setLoading(false));
  }, [id, loadMedia]);

  const coverImage = displayImageSrc(album?.event?.coverImage || album?.coverImage, null);
  const eventTitle = album?.event?.name?.trim() || album?.target?.replace(/\s+Album$/i, '').trim() || album?.name || 'Album';
  const eventDate = formatDate(album?.event?.startDate);
  const location = album?.event?.location?.trim() || null;
  const eventId = album?.event?.id || null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <HugeiconsIcon icon={Loading02Icon} className="size-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!album || denied) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center bg-[#0a0a0a] px-4 pb-40 pt-28 text-center text-white md:pt-32">
        <HugeiconsIcon icon={LockIcon} className="mb-4 size-8 text-zinc-500" />
        <p className="text-lg font-semibold">{!album ? 'Album not found' : 'Private album'}</p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
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
        <PublicAlbumBottomBar albumId={id} />
      </div>
    );
  }

  const imageItems = media.filter((m) => m.mediaKind !== 'VIDEO' || m.r2Url || m.imageUrl);

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] pb-36 pt-6 text-white">
      {/* Hero */}
      <div className="relative mx-auto max-w-2xl px-4">
        {coverImage ? (
          <div className="relative mb-6 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={coverImage}
              alt={eventTitle}
              fill
              unoptimized
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow md:text-3xl">
                {eventTitle}
              </h1>
              {(eventDate || location) ? (
                <p className="mt-1 text-sm text-zinc-300">
                  {[eventDate, location].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{eventTitle}</h1>
            {(eventDate || location) ? (
              <p className="mt-1 text-sm text-zinc-400">{[eventDate, location].filter(Boolean).join(' · ')}</p>
            ) : null}
          </div>
        )}

        {/* Tab toggle */}
        <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setTab('thread')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold uppercase tracking-wide transition ${
              tab === 'thread'
                ? 'bg-pxi-purple text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HugeiconsIcon icon={ListViewIcon} className="size-3.5" />
            Thread
          </button>
          <button
            type="button"
            onClick={() => setTab('gallery')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold uppercase tracking-wide transition ${
              tab === 'gallery'
                ? 'bg-pxi-purple text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HugeiconsIcon icon={GridViewIcon} className="size-3.5" />
            Gallery
          </button>
        </div>

        {/* Content */}
        {mediaLoading ? (
          <div className="flex items-center justify-center py-16">
            <HugeiconsIcon icon={Loading02Icon} className="size-6 animate-spin text-zinc-500" />
          </div>
        ) : imageItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">No photos yet. Open the app to see more.</p>
        ) : tab === 'gallery' ? (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
            {imageItems.map((item, idx) => {
              const src = displayImageSrc(item.r2Url || item.imageUrl, null);
              if (!src) return null;
              return (
                <div key={item.id || idx} className="relative aspect-square overflow-hidden rounded-md bg-zinc-900">
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Thread view — chronological list */
          <div className="flex flex-col gap-4">
            {imageItems.map((item, idx) => {
              const src = displayImageSrc(item.r2Url || item.imageUrl, null);
              if (!src) return null;
              const author = item.author?.name || item.author?.username || null;
              const posted = item.createdAt ? formatDate(item.createdAt) : null;
              return (
                <div key={item.id || idx} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="relative aspect-[4/3] w-full bg-zinc-900">
                    <Image src={src} alt="" fill unoptimized className="object-cover" loading="lazy" />
                  </div>
                  {(author || posted) ? (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      {author ? <p className="text-sm font-medium text-zinc-200">{author}</p> : <span />}
                      {posted ? <p className="text-xs text-zinc-500">{posted}</p> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PublicAlbumBottomBar albumId={id} />
    </div>
  );
}
