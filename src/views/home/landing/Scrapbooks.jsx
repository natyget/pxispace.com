'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Users, MapPin, Calendar } from 'lucide-react';

const EVENTS = [
  {
    id: 1,
    name: 'Afrobeats & Amapiano Night',
    photos: 89,
    attendees: 156,
    location: 'Brooklyn, NY',
    date: 'OCT 12',
  },
  {
    id: 2,
    name: 'NYE Midnight Masquerade',
    photos: 127,
    attendees: 84,
    location: 'Manhattan, NY',
    date: 'DEC 31',
  },
  {
    id: 3,
    name: 'Beach Bonfire Kickback',
    photos: 43,
    attendees: 12,
    location: 'Malibu, CA',
    date: 'AUG 05',
  },
  {
    id: 4,
    name: 'Lumina Underground',
    photos: 156,
    attendees: 142,
    location: 'DTLA',
    date: 'NOV 20',
  },
  {
    id: 5,
    name: 'Rooftop Cinema',
    photos: 65,
    attendees: 40,
    location: 'Brooklyn, NY',
    date: 'SEP 14',
  },
];

export default function Scrapbooks() {
  return (
    <section id="events" className="bg-black py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1000px] bg-[var(--color-pxi-purple)]/5 blur-[150px] pointer-events-none -z-10 opacity-60" />
      <motion.div
        className="text-center px-6 md:px-10 mb-12 md:mb-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-xs font-black uppercase tracking-widest text-[var(--color-pxi-purple)] mb-4">
          FEATURED EVENTS
        </div>
        <h2 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[0.9] tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-white">
          The best nights.
        </h2>
        <p className="font-display italic text-white/90 text-xl md:text-2xl max-w-xl mx-auto">
          Archived forever.
        </p>
      </motion.div>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {EVENTS.map((event, index) => {
          const aspectClass =
            index % 3 === 0 ? 'aspect-square' : index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-[3/4]';
          return (
            <motion.div
              key={event.id}
              className={`group relative w-full ${aspectClass} rounded-3xl overflow-hidden transition-all duration-700 ease-out hover:scale-[1.02] bg-neutral-900 border border-white/10 hover:border-[var(--color-pxi-purple)]/30 shadow-2xl`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              data-cursor-photo
            >
              <img
                src={`https://picsum.photos/seed/event${event.id}/800/1000`}
                alt={event.name}
                className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md border border-white/10 text-white/90 text-xs uppercase rounded-full px-4 py-1.5 font-bold tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--color-pxi-purple)]" />
                {event.date}
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end">
                <h3 className="text-white font-display font-bold text-3xl md:text-4xl leading-tight mb-4">
                  {event.name}
                </h3>
                <div className="flex flex-wrap items-center gap-5 text-sm md:text-base text-gray-200 font-medium">
                  <span className="flex items-center gap-2">
                    <Camera size={16} className="text-[var(--color-pxi-pink)]" /> {event.photos}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-[var(--color-pxi-purple)]" />{' '}
                    {event.attendees}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-white/60" /> {event.location}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
