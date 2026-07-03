'use client';

import React from 'react';
import { FaApple } from 'react-icons/fa';

/**
 * Two-beat demo of the purchase flow: the web checkout card, then the
 * confirmation that pushes the buyer straight into the event thread on the
 * app. Class recipes are replicated from EventCheckout.jsx (tier radios,
 * Apple Pay pill, "You're in!" success card) — that view pulls in auth and
 * navigation, so it can't be imported directly. Decorative only.
 */
const TIERS = [
  { label: 'General Admission', price: '$25.00', selected: true },
  { label: 'VIP Table (Group of 6)', price: '$300.00', selected: false },
];

export default function CheckoutThreadMock() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-stretch">
      {/* Beat 1 — web checkout, no app required */}
      <div className="flex flex-col rounded-[2rem] border border-white/5 bg-zinc-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">1 · Web checkout</p>
        <h3 className="mt-3 text-2xl font-black text-white">$25.00</h3>

        <div className="mt-4 space-y-2.5">
          {TIERS.map((t) => (
            <div
              key={t.label}
              className={`flex items-center justify-between gap-3 rounded-xl p-3.5 ${
                t.selected ? 'bg-[#d946ef]/20 text-white' : 'bg-white/[0.03] text-white/80'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    t.selected ? 'border-[#d946ef] bg-[#d946ef]/20' : 'border-white/30'
                  }`}
                >
                  {t.selected ? <span className="h-2 w-2 rounded-full bg-[#d946ef]" /> : null}
                </span>
                <span className="text-sm font-bold text-white">{t.label}</span>
              </span>
              <span className="text-sm font-black text-amber-200">{t.price}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-2.5 pt-4">
          <span className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-black py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg">
            <FaApple className="h-4 w-4" />
            Pay
          </span>
          <span className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#d946ef] to-[#c026d3] py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]">
            Pay with card
          </span>
          <p className="text-center text-[10px] text-zinc-600">No app store. No account dance. A browser is enough.</p>
        </div>
      </div>

      {/* Beat 2 — confirmation prompts the thread */}
      <div className="flex flex-col rounded-[2rem] border border-white/5 bg-zinc-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">2 · Straight into the thread</p>

        <div className="mt-4 space-y-4 rounded-2xl bg-white/[0.03] p-5 text-center">
          <div className="space-y-1">
            <p className="text-lg font-black uppercase tracking-widest text-white">You&rsquo;re in!</p>
            <p className="text-sm text-zinc-400">Your spot is confirmed.</p>
          </div>
          <span className="inline-flex w-full items-center justify-center rounded-full bg-white/10 py-3 text-xs font-black uppercase tracking-widest text-white">
            Open in PXI app
          </span>
        </div>

        <div className="mt-4 flex-1 space-y-2 rounded-2xl bg-white/[0.03] p-4">
          <div className="flex items-center gap-2.5">
            <img src="/landing/album/thread/profiles/trina.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            <p className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-300">
              who else is pulling up early?? 👀
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <img src="/landing/album/thread/profiles/kevin.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            <p className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-300">
              doors at 6, we're there 🔥
            </p>
          </div>
          <p className="pt-1 text-center text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            The room forms before the doors do
          </p>
        </div>

        <div className="mt-auto pt-4">
          <span className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--pxi-orange)] py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_var(--pxi-orange)]">
            Open Thread
          </span>
        </div>
      </div>
    </div>
  );
}
