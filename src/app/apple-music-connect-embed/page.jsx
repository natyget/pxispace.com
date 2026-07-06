'use client';

// Chrome-free Apple Music authorization page loaded inside the PXI mobile app's
// WebView. Loads MusicKit JS, authorizes with the user's Apple Music account and
// hands the resulting Music-User-Token back to the native app via postMessage.
// The app then calls POST /api/music/apple/connect with its own auth token.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { api } from '@/services/api';

export default function AppleMusicConnectEmbedPage() {
  const [state, setState] = useState('loading'); // loading | ready | authorizing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const musicKitReadyRef = useRef(false);

  const postToApp = useCallback((payload) => {
    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
    } catch {
      /* not inside the app WebView */
    }
  }, []);

  const configure = useCallback(async () => {
    try {
      if (!window.MusicKit) return;
      if (musicKitReadyRef.current) return;
      const { developerToken } = await api.get('/api/music/apple/developer-token');
      await window.MusicKit.configure({
        developerToken,
        app: { name: 'PXI', build: '1.0' },
      });
      musicKitReadyRef.current = true;
      setState('ready');
    } catch (e) {
      setErrorMsg(e?.message || 'Apple Music is not available right now.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    // Script may already be cached/loaded before the effect runs
    if (window.MusicKit) void configure();
  }, [configure]);

  const handleConnect = useCallback(async () => {
    setState('authorizing');
    try {
      const music = window.MusicKit.getInstance();
      const musicUserToken = await music.authorize();
      if (!musicUserToken) throw new Error('Authorization was cancelled.');
      setState('done');
      postToApp({ type: 'PXI_APPLE_MUSIC_TOKEN', musicUserToken });
    } catch (e) {
      setErrorMsg(e?.message || 'Apple Music authorization failed.');
      setState('error');
    }
  }, [postToApp]);

  const handleCancel = useCallback(() => {
    postToApp({ type: 'PXI_APPLE_MUSIC_CANCELLED' });
  }, [postToApp]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
      <Script
        src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"
        strategy="afterInteractive"
        onLoad={() => void configure()}
        onError={() => {
          setErrorMsg('Could not load Apple Music.');
          setState('error');
        }}
      />
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-black uppercase tracking-[0.18em]">
          Connect <span className="text-[#fa2d48]">Apple Music</span>
        </h1>

        {state === 'loading' ? (
          <p className="mt-4 text-sm text-zinc-400">Loading Apple Music…</p>
        ) : null}

        {state === 'ready' || state === 'authorizing' ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Sign in with your Apple Music account so PXI can read your library and match
              events to your taste. We never change anything in your library.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={state === 'authorizing'}
              className="mt-6 w-full rounded-full bg-[#fa2d48] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {state === 'authorizing' ? 'Waiting for Apple…' : 'Sign in with Apple Music'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Not now
            </button>
          </>
        ) : null}

        {state === 'done' ? (
          <p className="mt-4 text-sm text-zinc-400">Connected — finishing up in the app…</p>
        ) : null}

        {state === 'error' ? (
          <>
            <p className="mt-4 text-sm text-red-400">{errorMsg}</p>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-6 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Back to the app
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
