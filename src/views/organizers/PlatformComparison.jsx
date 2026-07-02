'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import SectionShell from '@/components/marketing/SectionShell';

const COMPETITORS = ['SWSH', 'Partiful', 'Luma', 'Posh VIP', 'DICE', 'Eventbrite', 'Lapse'];

const ROWS = [
  //                                 SWSH   Partiful Luma   Posh   DICE   EB     Lapse
  { feature: 'Invites / RSVP', checks: [false, true, true, false, false, true, false] },
  { feature: 'Paid Ticketing', checks: [false, false, true, true, true, true, false] },
  { feature: 'White-Label Branding', checks: [false, false, false, false, false, false, false] },
  { feature: 'Event Discovery', checks: [false, false, true, true, true, true, false] },
  { feature: 'Shared Photo Gallery', checks: [true, false, false, false, false, false, false] },
  { feature: 'Live Event Camera', checks: [false, false, false, false, false, false, true] },
  { feature: 'Event Chat Thread', checks: [false, true, false, false, false, false, false] },
  { feature: 'Reactions & Comments', checks: [false, true, false, false, false, false, true] },
  { feature: 'Auto Scrapbook', checks: [true, false, false, false, false, false, false] },
  { feature: 'Social Feed', checks: [false, false, false, false, false, false, true] },
  { feature: 'Passport / Stamps', checks: [false, false, false, false, false, false, false] },
  { feature: 'Promoter Attribution', checks: [false, false, false, true, false, true, false] },
  { feature: 'Real-Time Analytics', checks: [false, false, true, true, false, true, false] },
  { feature: 'QR Door Scan', checks: [false, false, true, true, true, true, false] },
  { feature: 'Stripe Direct Payouts', checks: [false, false, false, false, false, false, false] },
  { feature: 'Signed, Forgery-Proof Tickets', checks: [false, false, false, false, false, false, false] },
];

const Check = () => (
  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className="inline-block text-emerald-400" />
);
const Dash = () => <span className="inline-block text-zinc-700">—</span>;

export default function PlatformComparison() {
  return (
    <SectionShell eyebrow="The whole stack">
      <h2 className="display-2 mt-6 max-w-3xl">One platform. The whole stack.</h2>
      <p className="body-lead mt-6 max-w-2xl">
        Stop juggling seven tools. PXI replaces your entire event stack — from the first invite to
        the last scrapbook.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="mt-12 w-full overflow-x-auto"
      >
        <table className="w-full min-w-[780px] border-collapse overflow-hidden rounded-2xl border border-white/[0.06]">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 md:px-5 md:text-xs">
                Feature
              </th>
              {COMPETITORS.map((name) => (
                <th key={name} className="whitespace-nowrap px-2 py-4 text-center text-[9px] font-medium text-zinc-500 md:px-3 md:text-[11px]">
                  {name}
                </th>
              ))}
              <th className="border-l border-pxi-purple/20 bg-pxi-purple/[0.08] px-3 py-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-pxi-purple md:px-5 md:text-xs">
                PXI
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {ROWS.map((row, i) => (
              <tr key={row.feature} className={`${i < ROWS.length - 1 ? 'border-b border-white/[0.04]' : ''} transition-colors hover:bg-white/[0.02]`}>
                <td className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium text-white/80 md:px-5 md:text-sm">
                  {row.feature}
                </td>
                {row.checks.map((has, j) => (
                  <td key={j} className="px-2 py-3 text-center md:px-3">
                    {has ? <Check /> : <Dash />}
                  </td>
                ))}
                <td className="border-l border-pxi-purple/20 bg-pxi-purple/[0.08] px-3 py-3 text-center md:px-5">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={22}
                    className="inline-block text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </SectionShell>
  );
}
