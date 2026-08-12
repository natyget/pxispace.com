'use client';

// Tapping one of YOUR matched shots on the public web album deliberately does
// NOT open the focus viewer. The full-size photo, reactions and download live
// in the app — the web gallery's job here is to prove the match happened and
// hand the user over. Opening a lightbox instead lets them consume the payoff
// on a surface where they can't do anything with it.

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { PXI_IOS_DOWNLOAD_HREF } from '@/lib/appStoreLinks';

export default function MyShotsCtaModal({ open, onClose, albumId, matchCount = 0 }) {
  if (!open) return null;
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0b0e]/95 p-8 text-center shadow-[0_0_60px_rgba(216,74,255,0.15)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>

        <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">
          {matchCount > 0 ? (
            <>
              <span className="text-pxi-purple">{matchCount}</span>{' '}
              {matchCount === 1 ? 'shot' : 'shots'} of you
            </>
          ) : (
            <>Your <span className="text-pxi-purple">shots</span></>
          )}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Open PXI to see them full size, react, and save them to your camera roll.
        </p>

        {openInAppUrl ? (
          <a
            href={openInAppUrl}
            className="mt-6 block w-full rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(216,74,255,0.4)]"
          >
            Open in PXI
          </a>
        ) : null}
        <a
          href={PXI_IOS_DOWNLOAD_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xs font-semibold uppercase tracking-widest text-zinc-500 transition hover:text-white"
        >
          Get the app
        </a>
      </div>
    </div>
  );
}
