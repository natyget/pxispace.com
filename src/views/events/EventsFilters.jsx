'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { FavouriteIcon, Location01Icon } from '@hugeicons/core-free-icons';

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
}) => {
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
      <button
        type="button"
        onClick={() => setFavoritesOnly(!favoritesOnly)}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border shrink-0 transition-all ${
          favoritesOnly
            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
            : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20'
        }`}
      >
        <HugeiconsIcon icon={FavouriteIcon} size={16} className={favoritesOnly ? 'fill-current' : ''} />
        Favorites{favoriteCount > 0 ? ` (${favoriteCount})` : ''}
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
