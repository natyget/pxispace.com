'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';

const SORT_OPTIONS = [
  { value: 'vendor', label: 'Vendor rank' },
  { value: 'date', label: 'Soonest' },
  { value: 'tickets', label: 'Most tickets' },
  { value: 'distance', label: 'Nearest' },
  { value: 'match', label: 'Best match' },
];

const EventsHero = ({ searchQuery, setSearchQuery, sortMode, setSortMode }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-8">
      <div className="flex-1 lg:max-w-[60%]">
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
          Public <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple via-pink-400 to-white">
            Events
          </span>
        </h1>

        <p className="text-zinc-500 text-xl md:text-2xl font-medium max-w-xl leading-relaxed">
          Live data from PXI — ranked by host activity, ticket sales, and album energy. Sort and filter like Discovery on
          mobile.
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col items-stretch lg:items-end gap-6">
        <div className="relative group w-full lg:max-w-md">
          <HugeiconsIcon icon={Search01Icon}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pxi-purple transition-colors"
            size={22}
          />
          <input
            type="search"
            placeholder="Search events, cities…"
            className="w-full bg-zinc-900/40 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-lg text-white focus:outline-none focus:border-pxi-purple/50 focus:bg-zinc-900 transition-all backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-md lg:justify-end">
          <label className="sr-only" htmlFor="pxi-discover-sort">
            Sort events
          </label>
          <select
            id="pxi-discover-sort"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="w-full sm:w-auto min-w-[200px] bg-zinc-900/80 border border-white/10 rounded-2xl py-4 px-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-pxi-purple/50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default EventsHero;
