'use client';

import React from 'react';
import { FaApple } from 'react-icons/fa';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { SANAA_COVER } from '@/components/marketing/SanaaTicketShowcase';

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
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[2rem] border border-white/8 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
        <img src={SANAA_COVER} alt="" className="absolute inset-x-0 top-0 h-28 w-full object-cover opacity-45 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-zinc-950/85 to-zinc-950" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">1 · Web checkout</p>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/70">
            Browser
          </span>
        </div>
        <div className="relative z-10 mt-16">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f2688c]">Groove n&rsquo; find Love</p>
          <h3 className="mt-2 text-3xl font-black text-white">$25.00</h3>
          <p className="mt-1 text-xs font-semibold text-zinc-500">Feb 13 · Revere, MA</p>
        </div>

        <div className="relative z-10 mt-5 space-y-2.5">
          {TIERS.map((t) => (
            <div
              key={t.label}
              className={`flex items-center justify-between gap-3 rounded-xl p-3.5 ${
                t.selected ? 'bg-[#f2688c]/18 text-white ring-1 ring-[#f2688c]/35' : 'bg-white/[0.04] text-white/80'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    t.selected ? 'border-[#f2688c] bg-[#f2688c]/20' : 'border-white/30'
                  }`}
                >
                  {t.selected ? <span className="h-2 w-2 rounded-full bg-[#f2688c]" /> : null}
                </span>
                <span className="text-sm font-bold text-white">{t.label}</span>
              </span>
              <span className="text-sm font-black text-amber-200">{t.price}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-auto space-y-2.5 pt-4">
          <span className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-black py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg">
            <FaApple className="h-4 w-4" />
            Pay
          </span>
          <span className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.16)]">
            Pay with card <ArrowRight className="h-3.5 w-3.5" />
          </span>
          <p className="text-center text-[10px] text-zinc-600">No app store. No account dance. A browser is enough.</p>
        </div>
      </div>

      {/* Beat 2 — confirmation prompts the thread */}
      <div className="flex min-h-[420px] flex-col rounded-[2rem] border border-white/8 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">2 · Straight into the thread</p>
          <MessageCircle className="h-4 w-4 text-[#f2688c]" />
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-300" />
          <div className="space-y-1">
            <p className="text-lg font-black uppercase tracking-widest text-white">You&rsquo;re in!</p>
            <p className="text-sm text-zinc-400">Your ticket is saved. The album thread is already open.</p>
          </div>
          <span className="inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-xs font-black uppercase tracking-widest text-black">
            Open event thread
          </span>
        </div>

        <div className="mt-4 flex-1 space-y-3 rounded-2xl bg-black/35 p-4">
          <div className="mb-2 flex items-center gap-3 border-b border-white/8 pb-3">
            <img src={SANAA_COVER} alt="" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-black text-white">Groove n&rsquo; find Love</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Live thread</p>
            </div>
          </div>
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
          <span className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f2688c] py-3.5 text-xs font-black uppercase tracking-widest text-[#2b0714] shadow-[0_0_18px_rgba(242,104,140,0.45)]">
            Join the room <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
