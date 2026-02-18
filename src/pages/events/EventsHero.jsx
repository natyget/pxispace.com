import React from "react";
import { Search, Filter } from "lucide-react";

const EventsHero = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-16">

      <div className="flex-1 lg:max-w-[60%]">
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
          Public <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple via-pink-400 to-white">
            Events
          </span>
        </h1>

        <p className="text-zinc-500 text-xl md:text-2xl font-medium max-w-xl leading-relaxed">
          Find your next obsession. Join exclusive gatherings, music festivals,
          and community hangouts powered by PXI.
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col items-stretch lg:items-end gap-6">
        <div className="relative group w-full lg:max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pxi-purple transition-colors" size={22} />
          <input
            type="text"
            placeholder="Search events, cities, genres..."
            className="w-full bg-zinc-900/40 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-lg text-white focus:outline-none focus:border-pxi-purple/50 focus:bg-zinc-900 transition-all backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-4 self-stretch lg:self-auto">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 glass rounded-2xl text-sm font-black uppercase tracking-widest border-white/10 hover:bg-white/5 transition-colors">
            <Filter size={20} />
            <span>Sort By Vibe</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default EventsHero;
