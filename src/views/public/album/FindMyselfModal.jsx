'use client';

// "Find yourself" — guest face scan for public web albums (pxi-face-v2).
// One selfie frame is sent for a single in-memory match query server-side; the
// image is never stored and the gallery is filtered client-side.
// Nothing biometric is persisted for guests.

import React, { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Loading02Icon } from '@hugeicons/core-free-icons';
import FaceScanCapture from '@/components/face/FaceScanCapture';
import { faceService } from '@/services/face';
import { warmupFaceEngine } from '@/lib/face/faceEmbedding';

export default function FindMyselfModal({ open, onClose, albumId, onMatches }) {
  const [step, setStep] = useState('intro'); // intro | scan | matching | done | error
  const [matchCount, setMatchCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);

  useEffect(() => {
    if (open) {
      setStep('intro');
      setMatchCount(0);
      setProcessingCount(0);
      warmupFaceEngine();
    }
  }, [open]);

  if (!open) return null;

  const handleFrames = async (images) => {
    setStep('matching');
    try {
      const res = await faceService.matchAlbum(albumId, images[0]);
      const mediaIds = Array.isArray(res?.mediaIds) ? res.mediaIds : [];
      setMatchCount(mediaIds.length);
      // Photos the server hasn't face-scanned yet (it starts processing them now).
      setProcessingCount(Number(res?.processing) || 0);
      onMatches(mediaIds);
      setStep('done');
    } catch {
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      {/* max-h + scroll: the guided viewfinder is tall, and on short laptops the
          Capture button used to sit below the fold with no way to reach it. */}
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0b0b0e]/95 p-8 shadow-[0_0_60px_rgba(216,74,255,0.15)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>

        {step === 'intro' ? (
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">
              Find <span className="text-pxi-purple">yourself</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Scan your face to instantly filter this gallery to the photos you're in.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              The scan runs entirely in your browser — your selfie is destroyed instantly and never
              uploaded. A one-time numeric vector finds your shots and is never saved.
            </p>
            <button
              type="button"
              onClick={() => setStep('scan')}
              className="mt-6 w-full rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(216,74,255,0.4)]"
            >
              Start scan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Just browsing
            </button>
          </div>
        ) : null}

        {/* No heading here: the capture component owns the prompt above its own
            viewfinder (same as the app), so a second title just pushed the oval
            off-screen and said the opposite thing on the turn poses. */}
        {step === 'scan' ? (
          <FaceScanCapture onFrames={handleFrames} onCancel={onClose} poseCount={1} />
        ) : null}

        {step === 'matching' ? (
          <div className="flex flex-col items-center py-10 text-center">
            <HugeiconsIcon icon={Loading02Icon} className="size-8 animate-spin text-pxi-purple" />
            <p className="mt-4 text-sm text-zinc-400">Searching the gallery…</p>
          </div>
        ) : null}

        {step === 'done' ? (
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">
              {matchCount > 0 ? (
                <>
                  You're in <span className="text-pxi-purple">{matchCount}</span>{' '}
                  {matchCount === 1 ? 'photo' : 'photos'}
                </>
              ) : (
                'No matches yet'
              )}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {matchCount > 0
                ? 'The gallery is now filtered to your shots. Toggle "My shots" any time to see everything.'
                : processingCount > 0
                  ? `${processingCount} ${processingCount === 1 ? 'photo is' : 'photos are'} still being scanned for faces — try again in a few minutes.`
                  : "We couldn't spot you in this album yet. New uploads are matched as they land — check back soon."}
            </p>
            {matchCount > 0 && processingCount > 0 ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {processingCount} more {processingCount === 1 ? 'photo is' : 'photos are'} still being
                scanned — rescan in a few minutes to catch them.
              </p>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white"
            >
              {matchCount > 0 ? 'See my shots' : 'Back to gallery'}
            </button>
          </div>
        ) : null}

        {step === 'error' ? (
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">Scan failed</h2>
            <p className="mt-4 text-sm text-zinc-400">
              Something went wrong while matching. Give it another try in a moment.
            </p>
            <button
              type="button"
              onClick={() => setStep('scan')}
              className="mt-6 w-full rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
