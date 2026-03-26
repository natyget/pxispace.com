'use client';

import React, { useEffect, useState } from 'react';
import { Camera, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const albums = [
  {
    title: 'Afrobeats & Amapiano',
    date: 'FEB 10',
    photos: 89,
    members: 156,
    img: 'https://plus.unsplash.com/premium_photo-1708589337397-ad21d307bb9c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'afrobeats',
  },
  {
    title: 'NYE Masquerade',
    date: 'JAN 01',
    photos: 127,
    members: 84,
    img: 'https://images.unsplash.com/photo-1592943450127-37342a006c34?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'nye',
  },
  {
    title: 'Beach Bonfire',
    date: 'AUG 15',
    photos: 43,
    members: 12,
    img: 'https://images.unsplash.com/photo-1596326270763-87f26e0f9225?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'beach',
  },
  {
    title: 'Rooftop Cinema',
    date: 'SEP 22',
    photos: 65,
    members: 40,
    img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'rooftop',
  },
  {
    title: 'Garden Gala',
    date: 'MAY 08',
    photos: 156,
    members: 95,
    img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seed: 'garden',
  },
];

const TAB_COPY = {
  events: 'Browse what’s live and coming up — your scrapbook fills in automatically after you attend.',
  scrapbook:
    'Every event becomes a living album: photos, reactions, and stamps in one scrollable story.',
  vault: 'Private saves and full-res keepsakes — only for you and the crew who were there.',
};

function buildGallery(seed, count = 20) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${seed}-${i}`,
    url: `https://picsum.photos/seed/${encodeURIComponent(seed)}-${i}/600/600`,
  }));
}

export default function BestMomentsVault() {
  const [tab, setTab] = useState('scrapbook');
  const [openAlbum, setOpenAlbum] = useState(null);

  useEffect(() => {
    if (openAlbum) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [openAlbum]);

  useEffect(() => {
    if (!openAlbum) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenAlbum(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAlbum]);

  return (
    <section id="scrapbooks" className="py-24 md:py-32 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            Best <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-500">
              moments.
            </span>
          </h2>

          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-xl mx-auto mb-6">
            PXI automatically organizes your event history into beautiful, interactive scrapbooks.
            Memories shouldn&apos;t live in a folder.
          </p>
          <p className="text-zinc-400 text-sm md:text-base font-medium max-w-lg mx-auto mb-10 min-h-[3rem]">
            {TAB_COPY[tab]}
          </p>

          <div className="flex justify-center">
            <div className="bg-zinc-900/50 p-1.5 rounded-full border border-white/5 backdrop-blur-md flex items-center gap-0.5">
              {(['events', 'scrapbook', 'vault']).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-4 md:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                    tab === key
                      ? 'pxi-home-purple'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {key === 'scrapbook' ? 'Scrapbook' : key === 'events' ? 'Events' : 'Vault'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {albums.map((album, idx) => (
            <button
              type="button"
              key={album.title}
              onClick={() => setOpenAlbum(album)}
              className={`relative group overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/5 text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-pxi-purple ${
                idx === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              <img
                src={album.img}
                alt={album.title}
                className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 min-h-[280px] md:min-h-[300px]"
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
                    <Camera size={14} />
                    <span className="text-xs font-bold">{album.photos}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    <span className="text-xs font-bold">{album.members}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest text-white/80 border border-white/10 bg-black/40 backdrop-blur-md">
                {album.date}
              </div>
            </button>
          ))}
        </div>
      </div>

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
                  <X className="w-5 h-5 text-white" />
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
