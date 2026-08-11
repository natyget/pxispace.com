'use client';

// Spotify OAuth redirect target. The public client id / redirect URI live in env;
// the client secret stays server-side on the API.
// Spotify redirects here with ?code&state; we forward them to the backend, which
// exchanges the code (server-side secret) and builds the taste profile for the
// user who initiated the flow (mobile app or web).

import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { restoreAttributionAfterRedirect, trackSpotifyConnected } from '@/lib/analytics';

const env = globalThis.process?.env || {};
const SPOTIFY_CLIENT_ID = env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || '';

// Layout effects flush before the passive effect that fires this route's
// page_view, so the restored campaign fields and `ignore_referrer` are already
// set when the first hit goes out. useEffect on the server render only.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function SpotifyCallbackInner() {
  const params = useSearchParams();
  const code = params.get('code');
  const state = params.get('state');
  const hasOAuthParams = Boolean(code && state);
  const [status, setStatus] = useState(hasOAuthParams ? 'working' : 'error'); // working | done | error
  const [platform, setPlatform] = useState('web');
  const [topGenres, setTopGenres] = useState([]);
  const ranRef = useRef(false);
  const restoredRef = useRef(false);

  // Undo the OAuth round-trip's damage to attribution: replay the stashed
  // utm_* campaign and set ignore_referrer so the bounce back off
  // accounts.spotify.com cannot open a new session attributed to Spotify.
  useIsomorphicLayoutEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    restoreAttributionAfterRedirect();
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    if (!hasOAuthParams) return;
    ranRef.current = true;
    const payload = { code, state };
    if (SPOTIFY_CLIENT_ID) payload.clientId = SPOTIFY_CLIENT_ID;
    if (SPOTIFY_REDIRECT_URI) payload.redirectUri = SPOTIFY_REDIRECT_URI;

    api
      .post('/api/music/spotify/callback', payload)
      .then((res) => {
        const isMobile = res?.platform === 'mobile';
        setPlatform(isMobile ? 'mobile' : 'web');
        setTopGenres(Array.isArray(res?.topGenres) ? res.topGenres : []);
        setStatus('done');
        // This page also terminates the MOBILE connect flow; the app fires its
        // own spotify_connected, so counting that visit here would double it.
        if (!isMobile) trackSpotifyConnected({ entryPoint: 'account_settings' });
      })
      .catch(() => setStatus('error'));
  }, [code, hasOAuthParams, state]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.02] p-10 backdrop-blur-xl">
        {status === 'working' ? (
          <>
            <h1 className="text-xl font-black uppercase tracking-[0.18em]">
              Connecting <span className="text-[#1DB954]">Spotify</span>…
            </h1>
            <p className="mt-4 text-sm text-zinc-400">Reading your taste profile — one moment.</p>
          </>
        ) : null}

        {status === 'done' ? (
          <>
            <h1 className="text-xl font-black uppercase tracking-[0.18em]">
              Spotify <span className="text-pxi-purple">connected</span>
            </h1>
            {topGenres.length > 0 ? (
              <p className="mt-4 text-sm text-zinc-400">
                Your sound: <span className="text-white">{topGenres.slice(0, 3).join(' · ')}</span>
              </p>
            ) : null}
            <p className="mt-3 text-sm text-zinc-400">
              Discovery will now rank events by how well the lineup matches your taste.
            </p>
            {platform === 'mobile' ? (
              <p className="mt-6 text-sm font-semibold text-white">
                You can close this page and return to the PXI app.
              </p>
            ) : (
              <Link
                href="/events"
                className="mt-6 inline-flex rounded-full bg-pxi-purple px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white"
              >
                Discover events
              </Link>
            )}
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <h1 className="text-xl font-black uppercase tracking-[0.18em] text-white">
              Connection failed
            </h1>
            <p className="mt-4 text-sm text-zinc-400">
              The Spotify link expired or was already used. Head back and try connecting again.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex rounded-full border border-white/10 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-zinc-300 hover:text-white"
            >
              Back to events
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense fallback={null}>
      <SpotifyCallbackInner />
    </Suspense>
  );
}
