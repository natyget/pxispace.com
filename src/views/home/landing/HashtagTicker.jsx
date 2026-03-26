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
  { name: 'Corporate Events', desc: 'Professional event highlights and recaps.' },
];

function TagItem({ tag }) {
  return (
    <a
      href={`#${tag.name.replace(/\s+/g, '')}`}
      className="group relative cursor-pointer inline-block"
    >
      <span className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 uppercase transition-colors group-hover:from-pxi-purple group-hover:to-white">
        #{tag.name}
      </span>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-4 py-3 bg-black/95 border border-white/30 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50 w-max max-w-[270px] text-center">
        <p className="text-pxi-purple text-sm font-black mb-1">#{tag.name}</p>
        <p className="text-gray-300 text-xs leading-relaxed">{tag.desc}</p>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900" />
      </div>
    </a>
  );
}

export default function HashtagTicker() {
  return (
    <section id="hashtags" className="py-16 bg-[#050505] border-t border-gray-900">
      <div className="relative overflow-visible">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-12 gap-y-10 px-6">
          {tagData.map((tag) => (
            <TagItem key={tag.name} tag={tag} />
          ))}
        </div>
      </div>
    </section>
  );
}
