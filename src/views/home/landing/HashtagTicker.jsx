'use client';

import React, { useEffect, useRef, useState } from 'react';

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
    <span className="relative inline-flex shrink-0 select-none group">
      <span className="whitespace-nowrap text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 transition-colors group-hover:from-pxi-purple group-hover:to-white md:text-5xl cursor-default">
        #{tag.name}
      </span>
      {/* Simple CSS tooltip — no portal, no layout thrashing */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-3 w-max max-w-[240px] rounded-lg border border-white/20 bg-black/95 px-4 py-3 text-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
        <span className="block mb-1 text-sm font-black text-pxi-purple">#{tag.name}</span>
        <span className="block text-xs leading-relaxed text-gray-300">{tag.desc}</span>
      </span>
    </span>
  );
}

export default function HashtagTicker() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  /* Only animate when in viewport */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="hashtags" ref={sectionRef} className="border-t border-gray-900 bg-black py-16">
      <div className="relative w-full overflow-hidden flex whitespace-nowrap bg-black">
        {/* Gradient Edges */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
        {/* Pure CSS marquee — zero JS per-frame cost */}
        <div
          className={`flex flex-nowrap items-center gap-x-10 ${
            isVisible ? 'animate-marquee-slow' : ''
          }`}
          style={{ animationPlayState: isVisible ? 'running' : 'paused' }}
        >
          {/* Duplicate the set for seamless loop */}
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="flex shrink-0 flex-nowrap items-center gap-x-10"
            >
              {tagData.map((tag) => (
                <TagItem key={`${tag.name}-${copyIndex}`} tag={tag} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
