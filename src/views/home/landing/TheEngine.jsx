'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, HelpCircleIcon, ZapIcon } from '@hugeicons/core-free-icons';

const FEATURES = [
  {
    icon: Calendar01Icon,
    iconColor: 'text-white',
    title: 'Frictionless White-Label Event Ticketing',
    body: 'Abandon the friction and bloated interfaces of legacy ticketing monopolies. PXI provides a frictionless, white-label event ticketing infrastructure designed specifically for the modern promoter. Capture high-intent audiences instantly with seamless, web-based sign-ups that bypass app store hurdles and immediately build pre-event hype within dedicated chat threads. From the moment an event transitions from dormant announcements to the crucial grace period of the afterparty, you maintain absolute control over the entire lifecycle. Your brand remains uncompromised, and your revenue is optimized with complete transparency through integrated Stripe Destination Charges.',
  },
  {
    icon: ChartBar01Icon,
    iconColor: 'text-pxi-purple',
    title: 'Real-Time Predictive Analytics & Spatial Intelligence',
    body: 'Operate with unparalleled precision. The PXI dashboard transforms raw crowd data into actionable event promoter analytics. Through our proprietary Command Center, monitor the exact trajectory of your hype index, track the precise conversion of your attendance funnel from the initial ticket sold to the verified time-in-event, and visualize crowd spatial behavior in real time. We replace operational guesswork with empirical data intelligence. Maximize your event ROI, execute flawless promoter link attribution, and anticipate the exact needs of your room before the first baseline even drops.',
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

export default function TheEngine() {
  return (
    <section
      id="engine"
      className="py-24 md:py-36 bg-gradient-to-b from-[#050505] to-[#1a0b2e] relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pxi-purple/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-4 py-2 bg-pxi-purple/10 rounded-full text-pxi-purple font-black text-[10px] tracking-[0.2em] uppercase border border-pxi-purple/20">
            FOR ORGANIZERS & PROMOTERS
          </span>
        </motion.div>

        {/* H2 */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="text-4xl md:text-6xl lg:text-7xl font-black text-center mb-6 leading-[0.9] uppercase tracking-tighter"
        >
          Command the Night:{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pxi-purple to-pink-400">
            The Organizer Command Center
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-zinc-500 text-base md:text-lg font-medium max-w-2xl mx-auto text-center mb-16 md:mb-24"
        >
          The infrastructure that powers your empire. Total visibility. Total control. Zero guesswork.
        </motion.p>

        {/* Feature blocks */}
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
              <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
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

        {/* Stat row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 md:mt-16"
        >
          {[
            { label: 'Avg. Conversion Lift', value: '+34%', accent: true },
            { label: 'Revenue Transparency', value: '100%', accent: false },
            { label: 'Setup Time', value: '<2 min', accent: true },
          ].map((stat) => (
            <div
              key={stat.label}
              className="neo-glass-panel p-5 md:p-6 text-center"
            >
              <div className={`text-2xl md:text-3xl font-black mb-1 ${stat.accent ? 'text-pxi-purple' : 'text-white'}`}>
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12 md:mt-16"
        >
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest pxi-home-purple hover:scale-105 active:scale-95 transition-transform"
            data-cursor-hover
          >
            <HugeiconsIcon icon={ZapIcon} className="w-4 h-4" />
            Deploy Your Command Center
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
