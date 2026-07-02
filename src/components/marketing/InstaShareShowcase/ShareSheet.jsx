'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Download, Instagram } from 'lucide-react';
import PostCard from './PostCard';

/**
 * Web rebuild of the app's "Ready to Post" share sheet chrome. Decorative:
 * the buttons are non-interactive (aria-hidden), the whole thing demonstrates
 * the one-tap flow. The Instagram-gradient pill is exempt from the palette
 * rule because it is Instagram's own brand mark.
 *
 * @param {{src, title, location}[]} photos
 * @param {number} index — active photo
 */
export default function ShareSheet({ photos = [], index = 0 }) {
  const photo = photos[index] ?? photos[0];
  if (!photo) return null;

  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-[2rem] bg-[#0b0b0b] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-4" aria-hidden>
        <span className="flex items-center gap-1 text-sm font-medium text-white/70">
          <ChevronLeft className="h-4 w-4" />
          Back
        </span>
        <span className="text-sm font-semibold text-white">Ready to Post</span>
        <Download className="h-4 w-4 text-white/70" />
      </div>

      {/* media band */}
      <div className="relative px-5">
        <div className="relative overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={photo.src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <PostCard photo={photo} total={photos.length} index={index} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-col gap-3 px-5 pb-6 pt-5" aria-hidden>
        <span
          className="flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#f9ce34,#ee2a7b,#6228d7)' }}
        >
          <Instagram className="h-5 w-5" />
          Share on Insta
        </span>
        <span className="flex items-center justify-center rounded-full bg-white py-3.5 text-sm font-bold uppercase tracking-wide text-black">
          Back to Album
        </span>
      </div>
    </div>
  );
}
