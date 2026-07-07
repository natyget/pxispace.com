'use client';

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote01Icon } from '@hugeicons/core-free-icons';
import { musicService } from '@/services/music';

const PROVIDER_META = {
  SPOTIFY: { label: 'Spotify', bg: '#1DB954', text: '#000' },
  APPLE_MUSIC: { label: 'Apple Music', bg: '#fa2d48', text: '#fff' },
};

/**
 * Lineup playlist section — shared by PublicAlbumDetailsPanel (desktop) and
 * PublicAlbumDetailsSheet (mobile three-dot sheet, which just renders the panel).
 */
export default function AlbumPlaylistSection({ eventId }) {
  const [playlist, setPlaylist] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      if (!eventId) {
        setPlaylist(null);
        setLoaded(true);
        return;
      }
      setLoaded(false);
      musicService
        .getEventPlaylist(eventId)
        .then((res) => {
          if (alive) setPlaylist(res?.playlist || null);
        })
        .catch(() => {
          if (alive) setPlaylist(null);
        })
        .finally(() => {
          if (alive) setLoaded(true);
        });
    }, 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [eventId]);

  if (!eventId || !loaded) return null;

  const provider = playlist ? PROVIDER_META[playlist.provider] : null;

  return (
    <section className="space-y-2 w-full max-w-sm text-center">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-pxi-purple">Lineup playlist</h3>
      {playlist ? (
        <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide"
              style={{ backgroundColor: provider?.bg || '#666', color: provider?.text || '#fff' }}
            >
              {provider?.label || playlist.provider}
            </span>
            <span className="shrink-0 text-[10px] font-semibold text-white/45">{playlist.trackCount} tracks</span>
          </div>
          <p className="truncate text-sm font-bold text-white">{playlist.title}</p>
          {playlist.topGenres?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {playlist.topGenres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold text-zinc-400"
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
            className="inline-flex text-[11px] font-bold text-pxi-purple transition-colors hover:text-white"
          >
            Open playlist ↗
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left">
          <HugeiconsIcon icon={MusicNote01Icon} size={18} className="shrink-0 text-zinc-500" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-500">No lineup playlist yet.</p>
            <p className="text-[10px] text-zinc-600">The host can add one from their dashboard.</p>
          </div>
        </div>
      )}
    </section>
  );
}
