'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

const FEATURES = [
  {
    icon: Camera01Icon,
    iconColor: 'text-white',
    title: 'Instant Capture, Zero Friction',
    body: "The moment matters. The documentation of that moment should never distract from the experience itself. PXI features a live, tactile native camera engineered to capture the raw, unfiltered energy of the night. Photos and authentic reactions bypass the isolation of the personal camera roll, streaming instantly into the event\u2019s collective shared thread. It is a real-time visual pulse of the room\u2014a dynamic shared event photo gallery where every attendee contributes to the overarching narrative.",
  },
  {
    icon: SparklesIcon,
    iconColor: 'text-pxi-purple',
    title: 'Wilson-Scored Engagement Graph',
    body: 'Elevate the moments that resonate with the crowd. Our proprietary engagement graph tracks reactions and micro-interactions dynamically, applying advanced Wilson scoring algorithms to automatically bubble the most iconic and engaging memories to the surface. It is a living, breathing ecosystem where the absolute best content earns its place at the top, driven purely by the collective energy and consensus of the room.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9], delay: i * 0.15 },
  }),
};

export default function TheExperience() {
  return (
    <section
      id="experience"
      className="py-24 md:py-36 bg-gradient-to-b from-[#1a0b2e] to-[#050505] relative overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-pxi-purple/8 rounded-full blur-[200px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-4 py-2 bg-pink-500/10 rounded-full text-pink-400 font-black text-[10px] tracking-[0.2em] uppercase border border-pink-500/20">
            FOR ATTENDEES
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="text-4xl md:text-6xl lg:text-7xl font-black text-center mb-6 leading-[0.9] uppercase tracking-tighter"
        >
          Tactile Reality:{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pxi-purple">
            The Live Shared Event Gallery
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-zinc-500 text-base md:text-lg font-medium max-w-2xl mx-auto text-center mb-16 md:mb-24"
        >
          Every attendee is a creator. Every photo streams into the collective thread in real time.
        </motion.p>

        <div className="space-y-12 md:space-y-16">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="neo-glass-panel p-8 md:p-12"
            >
              <div className={`flex flex-col md:flex-row items-start gap-6 md:gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5">
                  <HugeiconsIcon icon={feature.icon} className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black mb-4 uppercase tracking-tight leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 font-medium leading-relaxed text-sm md:text-base">
                    {feature.body}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live thread indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-12 md:mt-16 neo-glass-panel p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="flex -space-x-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-pxi-purple/60 to-pink-500/60 flex items-center justify-center text-[10px] font-black text-white"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-bold text-white mb-1">Live Thread Active</p>
            <p className="text-xs text-zinc-500">89 photos streaming · 156 attendees contributing</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 md:mt-16 flex justify-center"
        >
          <AppStoreCtaPair dataCursorHover />
        </motion.div>
      </div>
    </section>
  );
}
