'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MusicNote01Icon,
  Loading02Icon,
  CancelCircleIcon,
  Calendar03Icon,
  Location01Icon,
} from '@hugeicons/core-free-icons';
import { musicService } from '@/services/music';

function formatEventDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function LineupPlaylistView({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    musicService
      .getLineupPlaylistLanding(token)
      .then(setData)
      .catch((err) => setError(err?.message || 'This playlist link is invalid.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <HugeiconsIcon icon={Loading02Icon} className="animate-spin text-pxi-purple" size={32} />
      </div>
    );
  }

  if (error || !data?.playlist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <HugeiconsIcon icon={CancelCircleIcon} size={48} className="text-red-400 mx-auto" />
          <h1 className="text-white text-xl font-black">Playlist Unavailable</h1>
          <p className="text-zinc-400 text-sm">{error || 'This playlist link is invalid.'}</p>
        </div>
      </div>
    );
  }

  const { playlist, event } = data;
  const dateLabel = formatEventDate(event?.startDate);
  const providerLabel = playlist.provider === 'SPOTIFY' ? 'Spotify' : 'Apple Music';

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto px-6 py-12 space-y-8">
        {/* Event context */}
        {event ? (
          <div className="flex items-center gap-4">
            {event.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.coverImage}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <HugeiconsIcon icon={MusicNote01Icon} size={22} className="text-white/40" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-black text-lg leading-tight truncate">{event.name}</p>
              <div className="flex items-center gap-3 mt-1 text-zinc-400 text-xs">
                {dateLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} size={13} />
                    {dateLabel}
                  </span>
                ) : null}
                {event.venueName || event.location ? (
                  <span className="inline-flex items-center gap-1 truncate">
                    <HugeiconsIcon icon={Location01Icon} size={13} />
                    <span className="truncate">{event.venueName || event.location}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Playlist card */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
              {playlist.ownerLabel ? `${playlist.ownerLabel} · Playlist` : 'Lineup Playlist'}
            </p>
            <h1 className="text-white text-2xl font-black mt-1 leading-tight">
              {playlist.title || 'Untitled playlist'}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {providerLabel} · {playlist.trackCount} track{playlist.trackCount === 1 ? '' : 's'}
            </p>
          </div>

          {playlist.topGenres?.length ? (
            <div className="flex flex-wrap gap-2">
              {playlist.topGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full bg-white/5 text-zinc-300 text-xs font-semibold"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          <a
            href={playlist.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3.5 rounded-full bg-white text-black font-black text-sm"
          >
            Open in {providerLabel}
          </a>

          {event?.isPublic && event?.id ? (
            <Link
              href={`/events/${event.id}`}
              className="block w-full text-center py-3.5 rounded-full bg-white/10 text-white font-bold text-sm"
            >
              View event on PXI
            </Link>
          ) : null}
        </div>

        {/* Tracks */}
        {playlist.tracks?.length ? (
          <div className="space-y-1">
            <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase mb-3">
              Tracks
            </p>
            <div className="space-y-3">
              {playlist.tracks.map((track, i) => (
                <div key={`${track.name}-${i}`} className="flex items-baseline gap-3 min-w-0">
                  <span className="text-zinc-600 text-xs font-bold w-5 shrink-0 text-right">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{track.name}</p>
                    {track.artists?.length ? (
                      <p className="text-zinc-500 text-xs truncate">{track.artists.join(', ')}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-center text-zinc-600 text-[10px] font-black tracking-[0.25em] uppercase pt-4">
          PXI Lineup
        </p>
      </div>
    </div>
  );
}
