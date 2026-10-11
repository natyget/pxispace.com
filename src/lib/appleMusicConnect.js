'use client';

// Apple Music for Music Match, on the web: MusicKit JS authorises the visitor's Apple Music account and yields a
// Music-User-Token. The app reaches it through /apple-music-connect-embed (which hands the token back to the app);
// signed-in web pages post it to the API themselves.
//
// App Store Guideline 4.5.2 (and plain honesty) ask that access to Apple Music data is disclosed before it is
// requested, and that it is used for nothing but the feature. The disclosure lives here once, so every place that
// connects says the same thing. What the API reads is in PXIStudio-App musicSources.service.ts
// (fetchAppleMusicTasteProfile: library songs, recently played, heavy rotation).

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';

export const MUSICKIT_SRC = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';

/** The disclosure shown before any Apple Music authorisation, on the web and (in the same words) in the app. */
export const APPLE_MUSIC_DISCLOSURE = {
  title: 'Connect Apple Music',
  reads: 'PXI reads your Apple Music library songs, recently played and heavy rotation to match you with nights that fit your taste.',
  promise: 'It is only used for your matches. Never for ads, never shared with organizers or anyone else.',
  control: 'Nothing in your library changes. Disconnect any time in Settings and it is deleted.',
};

/** How long MusicKit may take to appear before the page says so instead of spinning. */
const LOAD_WATCHDOG_MS = 12000;

function injectMusicKit(onLoad, onError) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[src="${MUSICKIT_SRC}"]`)) return;
  const s = document.createElement('script');
  s.src = MUSICKIT_SRC;
  s.async = true;
  s.onload = onLoad;
  s.onerror = onError;
  document.body.appendChild(s);
}

/**
 * Loads and configures MusicKit with PXI's developer token. `state` is loading, ready, authorizing, done or error.
 * `authorize()` resolves to the Music-User-Token, or throws when the visitor cancels or Apple refuses.
 */
export function useMusicKit() {
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const configuredRef = useRef(false);

  const configure = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.MusicKit) return;
      if (configuredRef.current) {
        setState('ready');
        return;
      }
      const { developerToken } = await api.get('/api/music/apple/developer-token');
      await window.MusicKit.configure({ developerToken, app: { name: 'PXI', build: '1.0' } });
      configuredRef.current = true;
      setState('ready');
    } catch (e) {
      setError(e?.message || 'Apple Music is not available right now.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    // configure() sets state, so it runs a tick after the effect (as DashboardLayout defers its own), not inside it.
    if (window.MusicKit) queueMicrotask(() => void configure());
    // MusicKit's documented load signal, more reliable than a script onload inside an app's web view.
    const onKitLoaded = () => void configure();
    document.addEventListener('musickitloaded', onKitLoaded);
    injectMusicKit(
      () => void configure(),
      () => {
        setError('Could not load Apple Music.');
        setState('error');
      },
    );
    return () => document.removeEventListener('musickitloaded', onKitLoaded);
  }, [configure]);

  useEffect(() => {
    if (state !== 'loading') return undefined;
    const t = setTimeout(() => {
      setError('Apple Music took too long to load. Check your connection and try again.');
      setState('error');
    }, LOAD_WATCHDOG_MS);
    return () => clearTimeout(t);
  }, [state]);

  const retry = useCallback(() => {
    setError('');
    setState('loading');
    if (window.MusicKit) {
      void configure();
      return;
    }
    // A failed script tag is not retried by the browser: put a fresh one in.
    document.querySelector(`script[src="${MUSICKIT_SRC}"]`)?.remove();
    injectMusicKit(
      () => void configure(),
      () => {
        setError('Could not load Apple Music.');
        setState('error');
      },
    );
  }, [configure]);

  const authorize = useCallback(async () => {
    setState('authorizing');
    try {
      const token = await window.MusicKit.getInstance().authorize();
      if (!token) throw new Error('Authorization was cancelled.');
      setState('done');
      return token;
    } catch (e) {
      setError(e?.message || 'Apple Music authorization failed.');
      setState('error');
      throw e;
    }
  }, []);

  return { state, error, authorize, retry };
}

/** For signed-in web pages: hand the token to the API, which builds the taste profile. */
export async function connectAppleMusic(musicUserToken) {
  return api.post('/api/music/apple/connect', { musicUserToken });
}
