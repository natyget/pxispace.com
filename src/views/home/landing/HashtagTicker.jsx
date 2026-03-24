'use client';

import React from 'react';

const tagData = [
  { name: 'Weddings', desc: 'Capture vows, first dance, and candid moments.' },
  { name: 'Camping Trips', desc: 'Campfire stories and starlit memories.' },
  { name: 'Rooftop Parties', desc: 'Sunset cocktails and skyline DJs.' },
  { name: 'Birthdays', desc: 'Celebrate milestones with friends and surprises.' },
  { name: 'Concerts', desc: 'Live shows, lights, and unforgettable energy.' },
  { name: 'Hikes', desc: 'Trail photos and scenic vistas.' },
  { name: 'Festivals', desc: 'Multi-stage music and immersive installations.' },
  { name: 'Corporate Events', desc: 'Professional captures for marketing and recaps.' },
];

function TagItem({ tag }) {
  return (
    <a
      href={`#${tag.name.replace(/\s+/g, '')}`}
      className="group relative cursor-pointer inline-block"
    >
      <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 uppercase transition-colors group-hover:from-pxi-purple group-hover:to-white">
        #{tag.name}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-black/95 border border-white/30 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap">
        <p className="text-pxi-purple text-sm font-black mb-1">#{tag.name}</p>
        <p className="text-gray-300 text-xs">{tag.desc}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
      </div>
    </a>
  );
}

export default function HashtagTicker() {
  const row = (suffix) => (
    <div className="flex gap-12 shrink-0 items-center py-12">
      {tagData.map((tag, idx) => (
        <TagItem key={`${suffix}-${tag.name}-${idx}`} tag={tag} />
      ))}
    </div>
  );

  return (
    <section id="hashtags" className="py-12 bg-[#050505] border-t border-gray-900">
      <div className="relative overflow-hidden group/ticker">
        <div className="landing-hashtag-marquee flex w-max hover:[animation-play-state:paused]">
          {row('a')}
          {row('b')}
        </div>
      </div>
    </section>
  );
}
