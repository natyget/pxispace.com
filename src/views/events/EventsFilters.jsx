'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Bookmark02Icon, Location01Icon, MusicNote01Icon } from '@hugeicons/core-free-icons';

const filterOptions = ['All', 'Free', 'Paid'];
const RADIUS_OPTIONS = [25, 50, 80, 160];

const EventsFilters = ({
  filter,
  setFilter,
  favoritesOnly,
  setFavoritesOnly,
  favoriteCount,
  nearMe,
  setNearMe,
  radiusKm,
  setRadiusKm,
  // Music match controls (optional — hidden when not provided)
  myGenres = [],
  genreFilter,
  toggleGenre,
  clearGenres,
  musicConnected = null,
  sortMode,
  setSortMode,
  isLoggedIn = false,
}) => {
  const [musicOpen, setMusicOpen] = useState(false);
  const musicRef = useRef(null);

  useEffect(() => {
    if (!musicOpen) return undefined;
    const onDown = (e) => {
      if (musicRef.current && !musicRef.current.contains(e.target)) setMusicOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [musicOpen]);

  const genresActive = genreFilter && genreFilter.size > 0;
  const musicActive = genresActive || sortMode === 'match';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-10">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth flex-1">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setFilter(opt)}
            className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 border ${
              filter === opt
                ? 'bg-pxi-purple text-white border-pxi-purple shadow-[0_0_30px_rgba(216,74,255,0.4)] scale-105'
                : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Music match: "for you" sort + top-genre filter */}
      {setSortMode ? (
        <div className="relative shrink-0" ref={musicRef}>
          <button
            type="button"
            onClick={() => setMusicOpen((v) => !v)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${
              musicActive
                ? 'bg-pxi-purple/20 text-pxi-purple border-pxi-purple/40'
                : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20'
            }`}
          >
            <HugeiconsIcon icon={MusicNote01Icon} size={16} />
            Music{genresActive ? ` (${genreFilter.size})` : ''}
          </button>
          {musicOpen ? (
            <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-4 space-y-4 shadow-2xl">
              {!isLoggedIn || musicConnected === false ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Connect Spotify or Apple Music to match events to your taste.
                  </p>
                  <Link
                    href={isLoggedIn ? '/dashboard/account' : '/login'}
                    className="inline-block text-xs font-black uppercase tracking-widest text-pxi-purple hover:text-white"
                  >
                    {isLoggedIn ? 'Connect your music →' : 'Log in →'}
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode(sortMode === 'match' ? 'vendor' : 'match');
                      setMusicOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-colors ${
                      sortMode === 'match'
                        ? 'border-pxi-purple bg-pxi-purple/10 text-white'
                        : 'border-white/10 text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    ★ For you — best music match first
                  </button>
                  {myGenres.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Your top genres
                        </p>
                        {genresActive ? (
                          <button
                            type="button"
                            onClick={clearGenres}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {myGenres.slice(0, 8).map((g) => {
                          const active = genreFilter?.has(g);
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleGenre?.(g)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                active
                                  ? 'bg-pxi-purple/20 text-pxi-purple border-pxi-purple/40'
                                  : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2">
                        Filters to events whose lineup playlist shares a genre.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setFavoritesOnly(!favoritesOnly)}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border shrink-0 transition-all ${
          favoritesOnly
            ? 'bg-pxi-purple/20 text-pxi-purple border-pxi-purple/40'
            : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20'
        }`}
      >
        <HugeiconsIcon icon={Bookmark02Icon} size={16} className={favoritesOnly ? 'fill-current' : ''} />
        Wishlist{favoriteCount > 0 ? ` (${favoriteCount})` : ''}
      </button>
      {setNearMe ? (
        <button
          type="button"
          onClick={() => setNearMe(!nearMe)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border shrink-0 transition-all ${
            nearMe
              ? 'bg-pxi-purple text-white border-pxi-purple shadow-[0_0_30px_rgba(216,74,255,0.4)]'
              : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20'
          }`}
        >
          <HugeiconsIcon icon={Location01Icon} size={16} className={nearMe ? 'fill-current' : ''} />
          Near me
        </button>
      ) : null}
      {nearMe && setRadiusKm ? (
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          aria-label="Search radius"
          className="bg-zinc-900/50 border border-white/5 rounded-full px-4 py-3 text-[11px] uppercase text-zinc-400 shrink-0 focus:outline-none focus:border-pxi-purple/50"
        >
          {RADIUS_OPTIONS.map((km) => (
            <option key={km} value={km}>
              {km} km
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
};

export default EventsFilters;
