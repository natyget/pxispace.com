import React from "react";

const filterOptions = ["All", "Music", "Social", "Tech", "Art", "Gaming"];

const EventsFilters = ({ filter, setFilter }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-10 no-scrollbar scroll-smooth">
      {filterOptions.map((opt) => (
        <button
          key={opt}
          onClick={() => setFilter(opt)}
          className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 border ${
            filter === opt
              ? "bg-pxi-purple text-white border-pxi-purple shadow-[0_0_30px_rgba(216,74,255,0.4)] scale-105"
              : "bg-zinc-900/50 text-zinc-500 border-white/5 hover:text-white hover:border-white/20"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export default EventsFilters;
