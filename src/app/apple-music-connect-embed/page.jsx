'use client';

// Chrome-free Apple Music authorisation page loaded by the PXI app (restored 2026-10-06: the founder brought Apple
// Music back for Music Match and dropped Spotify, whose development mode allows only a handful of users).
// MusicKit JS authorises the visitor's Apple Music account and the Music-User-Token goes back to the app, which then
// calls POST /api/music/apple/connect with its own session. Two return channels:
//   - ?redirect=1: a redirect to the fixed pxi://apple-music-connect, used with the app's system auth session
//     (ASWebAuthenticationSession), where iCloud passkeys and password autofill work;
//   - otherwise: postMessage to the app's WebView (the fallback).
// The disclosure comes first (App Store Guideline 4.5.2); its words live in src/lib/appleMusicConnect.js.

import React, { useCallback } from 'react';
import { APPLE_MUSIC_DISCLOSURE, useMusicKit } from '@/lib/appleMusicConnect';

// A fixed literal: never redirect to a caller-supplied URL.
const APP_REDIRECT_TARGET = 'pxi://apple-music-connect';

function isRedirectMode() {
  try {
    return new URLSearchParams(window.location.search).get('redirect') === '1';
  } catch {
    return false;
  }
}

function returnToApp(payload) {
  if (isRedirectMode()) {
    const params =
      payload?.type === 'PXI_APPLE_MUSIC_TOKEN' ? `?musicUserToken=${encodeURIComponent(payload.musicUserToken)}` : '?cancelled=1';
    window.location.replace(`${APP_REDIRECT_TARGET}${params}`);
    return;
  }
  try {
    window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
  } catch {
    /* not inside the app's web view */
  }
}

export default function AppleMusicConnectEmbedPage() {
  const { state, error, authorize, retry } = useMusicKit();

  const handleConnect = useCallback(async () => {
    try {
      const musicUserToken = await authorize();
      returnToApp({ type: 'PXI_APPLE_MUSIC_TOKEN', musicUserToken });
    } catch {
      /* the hook shows the error */
    }
  }, [authorize]);

  const handleCancel = useCallback(() => returnToApp({ type: 'PXI_APPLE_MUSIC_CANCELLED' }), []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black normal-case tracking-tight">{APPLE_MUSIC_DISCLOSURE.title}</h1>

        {state === 'loading' ? <p className="mt-4 text-sm text-zinc-400">Loading Apple Music</p> : null}

        {state === 'ready' || state === 'authorizing' ? (
          <>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed">
              <p className="text-white">{APPLE_MUSIC_DISCLOSURE.reads}</p>
              <p className="text-zinc-400">{APPLE_MUSIC_DISCLOSURE.promise}</p>
              <p className="text-zinc-400">{APPLE_MUSIC_DISCLOSURE.control}</p>
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={state === 'authorizing'}
              className="mt-8 w-full rounded-full bg-[#A523EF] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {state === 'authorizing' ? 'Waiting for Apple' : 'Connect Apple Music'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 w-full py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Not now
            </button>
          </>
        ) : null}

        {state === 'done' ? <p className="mt-4 text-sm text-zinc-400">Connected. Finishing up in the app.</p> : null}

        {state === 'error' ? (
          <>
            <p className="mt-4 text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-8 w-full rounded-full bg-[#A523EF] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 w-full py-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Back to the app
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
