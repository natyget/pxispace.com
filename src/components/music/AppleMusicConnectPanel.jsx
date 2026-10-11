'use client';

// Connect Apple Music on a signed-in web page. Mounting this panel is the moment MusicKit loads, so it only appears
// after the visitor asked to connect; the disclosure is the first thing in it (App Store Guideline 4.5.2, and the
// same words as the app and the embed page, from src/lib/appleMusicConnect.js).

import React, { useCallback, useEffect, useState } from 'react';
import { APPLE_MUSIC_DISCLOSURE, connectAppleMusic, useMusicKit } from '@/lib/appleMusicConnect';
import { trackAppleMusicConnectStart, trackAppleMusicConnected } from '@/lib/analytics';

/**
 * @param {{ entryPoint: string, onConnected: (res: any) => void, onCancel: () => void }} props
 */
export default function AppleMusicConnectPanel({ entryPoint, onConnected, onCancel }) {
  const { state, error, authorize, retry } = useMusicKit();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    trackAppleMusicConnectStart({ entryPoint });
  }, [entryPoint]);

  const handleContinue = useCallback(async () => {
    setSaveError('');
    let token;
    try {
      token = await authorize();
    } catch {
      return; // the hook shows Apple's error
    }
    setSaving(true);
    try {
      const res = await connectAppleMusic(token);
      trackAppleMusicConnected({ entryPoint });
      onConnected(res);
    } catch (e) {
      setSaveError(
        e?.data?.hint || e?.message || 'Apple Music connected, but PXI could not read your library. Try again in a moment.',
      );
    } finally {
      setSaving(false);
    }
  }, [authorize, entryPoint, onConnected]);

  const busy = state === 'loading' || state === 'authorizing' || saving;

  return (
    <div className="mt-3 rounded-[1.25rem] bg-pxi-field px-4 py-4">
      <p className="text-sm font-semibold text-white">{APPLE_MUSIC_DISCLOSURE.title}</p>
      <div className="mt-2 space-y-2 text-xs leading-relaxed">
        <p className="text-zinc-300">{APPLE_MUSIC_DISCLOSURE.reads}</p>
        <p className="text-zinc-500">{APPLE_MUSIC_DISCLOSURE.promise}</p>
        <p className="text-zinc-500">{APPLE_MUSIC_DISCLOSURE.control}</p>
      </div>
      {state === 'error' ? (
        <p className="mt-3 text-xs text-red-400">
          {error}{' '}
          <button type="button" onClick={retry} className="font-bold text-white underline-offset-2 hover:underline">
            Try again
          </button>
        </p>
      ) : null}
      {saveError ? <p className="mt-3 text-xs text-red-400">{saveError}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={busy || state === 'error'}
          className="rounded-full bg-[#A523EF] px-5 py-2 text-xs font-bold tracking-[0.02em] text-white disabled:opacity-50"
        >
          {state === 'loading' ? 'Loading Apple Music' : state === 'authorizing' ? 'Waiting for Apple' : saving ? 'Saving' : 'Continue with Apple Music'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
