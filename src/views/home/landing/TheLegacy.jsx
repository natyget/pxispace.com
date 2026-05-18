'use client';

import React, { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, UserGroupIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { motion, AnimatePresence } from 'framer-motion';

const albums = [
  {
    title: 'Afrobeats & Amapiano',
    date: 'FEB 10',
    photos: 89,
    members: 156,
    img: 'https://plus.unsplash.com/premium_photo-1708589337397-ad21d307bb9c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'afrobeats',
    stampTier: 'Platinum',
    xp: 420,
  },
  {
    title: 'NYE Masquerade',
    date: 'JAN 01',
    photos: 127,
    members: 84,
    img: 'https://images.unsplash.com/photo-1592943450127-37342a006c34?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'nye',
    stampTier: 'Gold',
    xp: 310,
  },
  {
    title: 'Beach Bonfire',
    date: 'AUG 15',
    photos: 43,
    members: 12,
    img: 'https://images.unsplash.com/photo-1596326270763-87f26e0f9225?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'beach',
    stampTier: 'Silver',
    xp: 180,
  },
  {
    title: 'Rooftop Cinema',
    date: 'SEP 22',
    photos: 65,
    members: 40,
    img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'rooftop',
    stampTier: 'Gold',
    xp: 275,
  },
  {
    title: 'Garden Gala',
    date: 'MAY 08',
    photos: 156,
    members: 95,
    img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'garden',
    stampTier: 'Bronze',
    xp: 90,
  },
];

/* Tier colors — subtle, dark-mode native tints instead of heavy gradients */
const TIER_ACCENT = {
  Platinum: 'text-violet-300',
  Gold: 'text-amber-400',
  Silver: 'text-zinc-400',
  Bronze: 'text-orange-400',
};

const TIER_BORDER = {
  Platinum: 'border-violet-400/30',
  Gold: 'border-amber-400/30',
  Silver: 'border-zinc-500/30',
  Bronze: 'border-orange-400/30',
};

function buildGallery(seed, count = 20) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${seed}-${i}`,
    url: `https://picsum.photos/seed/${encodeURIComponent(seed)}-${i}/600/600`,
  }));
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9], delay: i * 0.12 },
  }),
};

export default function TheLegacy() {
  const [openAlbum, setOpenAlbum] = useState(null);

  useEffect(() => {
    if (openAlbum) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [openAlbum]);

  useEffect(() => {
    if (!openAlbum) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpenAlbum(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAlbum]);

  return (
    <section id="legacy" className="py-24 md:py-32 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6"
          >
            Your best{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-500">
              nights.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 text-base md:text-lg font-medium max-w-xl mx-auto mb-10"
          >
            Every event becomes a living scrapbook — photos, reactions, chats, and moments locked in forever. Tap into any night and relive it exactly as it happened.
          </motion.p>
        </div>

        {/* Album grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {albums.map((album, idx) => (
            <motion.button
              type="button"
              key={album.title}
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              onClick={() => setOpenAlbum(album)}
              className={`relative group overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/5 text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-pxi-purple ${
                idx === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              <img
                src={album.img}
                alt={`${album.title} event scrapbook with ${album.photos} photos from ${album.members} attendees`}
                className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 min-h-[280px] md:min-h-[300px]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <p className="text-[10px] font-black uppercase tracking-widest text-pxi-purple/90 mb-1">
                  Open scrapbook
                </p>
                <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight mb-2 leading-none">
                  {album.title}
                </h3>
                <div className="flex items-center gap-4 text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Camera01Icon} size={14} />
                    <span className="text-xs font-bold">{album.photos}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserGroupIcon} size={14} />
                    <span className="text-xs font-bold">{album.members}</span>
                  </div>
                </div>
              </div>
              {/* Stamp tier — minimal editorial style, not a colorful pill */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${TIER_ACCENT[album.stampTier]}`}>
                  {album.stampTier}
                </span>
              </div>
              <div className="absolute top-4 left-4 md:top-6 md:left-6 px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black tracking-widest text-white/60 bg-black/60 backdrop-blur-sm border border-white/10">
                {album.date}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Passport — your event life, wrapped */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-20 md:mt-28"
        >
          <div className="text-center mb-10 md:mb-14">
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">
              Your event life,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
                wrapped.
              </span>
            </h3>
            <p className="text-zinc-500 text-sm md:text-base font-medium max-w-xl mx-auto">
              Every event you attend earns a stamp on your passport. Watch your Odyssey score level up as your social calendar grows. It&apos;s the gamification of your event life — every show, every party, every rooftop, every festival. All of it, earned.
            </p>
          </div>

          {/* Tier progression — horizontal bar, not AI card grid */}
          <div className="max-w-2xl mx-auto">
            {[
              { tier: 'Bronze', range: '1 – 5 events', xp: '100 XP', pct: 20 },
              { tier: 'Silver', range: '6 – 15 events', xp: '350 XP', pct: 40 },
              { tier: 'Gold', range: '16 – 30 events', xp: '800 XP', pct: 70 },
              { tier: 'Platinum', range: '31+ events', xp: '1500+ XP', pct: 100 },
            ].map((item, i) => (
              <motion.div
                key={item.tier}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`flex items-center gap-4 md:gap-6 py-4 ${i < 3 ? 'border-b border-white/[0.06]' : ''}`}
              >
                <span className={`text-xs md:text-sm font-black uppercase tracking-widest w-20 md:w-24 shrink-0 ${TIER_ACCENT[item.tier]}`}>
                  {item.tier}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-pxi-purple to-pink-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: [0.2, 0.65, 0.3, 0.9] }}
                    />
                  </div>
                </div>
                <span className="text-[10px] md:text-xs text-zinc-600 font-bold tracking-wider w-20 md:w-28 text-right shrink-0">
                  {item.range}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Lightbox modal */}
      <AnimatePresence mode="wait">
        {openAlbum && (
          <motion.div
            key={openAlbum.seed}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenAlbum(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="scrapbook-modal-title"
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-2xl flex flex-col"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10 shrink-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-pxi-purple mb-1">
                    Scrapbook
                  </p>
                  <h2 id="scrapbook-modal-title" className="text-xl md:text-2xl font-black text-white">
                    {openAlbum.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenAlbum(null)}
                  className="rounded-full p-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {buildGallery(openAlbum.seed).map((g) => (
                  <div
                    key={g.id}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-zinc-900 group"
                  >
                    <img
                      src={g.url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
