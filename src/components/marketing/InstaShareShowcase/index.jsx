'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ShareSheet from './ShareSheet';
import PostCard from './PostCard';

const EASE = [0.16, 1, 0.3, 1];

/**
 * "Your night, ready to post." A live DOM rebuild of the app's share sheet
 * cycling four framed post cards. The four standalone cards under the copy
 * mirror the four dashes in the sheet. Works for event promo and trip albums.
 */
const GALLERY = '/landing/album/gallery/afrodisiac';

const PHOTOS = [
  {
    src: '/landing/assets/media__1782966906228.jpg',
    title: 'WINE NIGHT 02',
    location: 'Boston',
    overlays: [
      { text: 'Looking gorgeous ladies! 🥂', className: 'left-[2%] top-[75%]' },
      { text: '❤️ x15', className: 'right-[4%] top-[20%]' },
      { text: 'The lighting here is a vibe ✨', className: 'right-[2%] top-[60%]' },
    ],
  },
  {
    src: '/landing/assets/media__1782966910657.jpg',
    title: 'CAMCORDER VIBES',
    location: 'Brooklyn',
    overlays: [
      { text: 'Catching all the angles 📹', className: 'left-[2%] top-[18%]' },
      { text: '🔥 x32', className: 'right-[4%] top-[20%]' },
      { text: 'Upload it on this thread! 🎬', className: 'right-[2%] top-[65%]' },
    ],
  },
  {
    src: '/landing/assets/media__1782966914746.jpg',
    title: 'DJ SET 05',
    location: 'New York',
    overlays: [
      { text: 'Set was crazy tonight 🎧', className: 'left-[2%] top-[10%]' },
      { text: '🙌 x24', className: 'right-[4%] top-[18%]' },
      { text: 'Drop the track ID please 👀', className: 'right-[2%] top-[70%]' },
    ],
  },
  {
    src: '/landing/assets/media__1782966919272.jpg',
    title: 'PARTY 11',
    location: 'Montréal',
    overlays: [
      { text: 'The energy is unmatched! 💃🏽', className: 'left-[2%] top-[12%]' },
      { text: '✨ x18', className: 'right-[4%] top-[25%]' },
      { text: 'Such a good time ❤️', className: 'left-[2%] top-[65%]' },
    ],
  },
];

export default function InstaShareShowcase({ compact = false }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), 3800);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return (
      <div className="flex justify-center">
        <ShareSheet photos={PHOTOS} index={index} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
      {/* copy + four framed cards, matching the four dashes in the sheet */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-80px' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <h2 className="display-2">Your night, ready to post.</h2>
        <p className="body-lead mt-6 max-w-md">
          One tap turns any scrapbook scrapbook shot into a framed postcard.
        </p>
        <ul className="mt-4 max-w-md space-y-2.5 text-sm leading-relaxed text-zinc-400">
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span>No screenshots, no cropping.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-pxi-orange shadow-[0_0_8px_rgba(255,90,31,0.8)]" />
            <span>Captioned and located — the where and when baked in.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-pxi-purple shadow-[0_0_8px_rgba(240,31,255,0.8)]" />
            <span>Authentic reactions and comments pinned right on, showing the real moment.</span>
          </li>
        </ul>

        {/* "Printed": each postcard pops in stamped-down, staggered left to
            right — small, definite, matching the "framed postcard" copy. */}
        <div className="mt-10 grid grid-cols-4 gap-3">
          {PHOTOS.map((p, i) => (
            <motion.button
              key={p.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Preview ${p.title}`}
              initial={{ opacity: 0, scale: 0.5, rotate: (i % 2 === 0 ? -1 : 1) * 6 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: false, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.09, ease: EASE }}
              className={`overflow-hidden rounded-xl transition-all duration-500 ${
                i === index
                  ? 'opacity-100 shadow-[0_0_18px_rgba(240,31,255,0.25)]'
                  : 'opacity-55 hover:opacity-80'
              }`}
            >
              <PostCard photo={p} mini />
            </motion.button>
          ))}
        </div>

        <Link
          href="/features/instagram-event-sharing"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          See how it works <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* The sheet: slides up from below like a real share sheet being
          presented, rather than fading in place. */}
      <motion.div
        initial={{ opacity: 0, y: 90 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-80px' }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        className="flex justify-center"
      >
        <ShareSheet photos={PHOTOS} index={index} />
      </motion.div>
    </div>
  );
}
