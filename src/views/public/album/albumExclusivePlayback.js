'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** @type {string | null} */
let activePlaybackKey = null;
/** @type {Set<(key: string | null) => void>} */
const listeners = new Set();
/** Set when user taps a thread card to open focus — allows one unmuted play attempt. */
let pendingUserActivation = false;

export function albumPlaybackKey(scope, mediaId) {
  if (!mediaId) return null;
  return `${scope}:${mediaId}`;
}

export function markAlbumVideoUserActivation() {
  pendingUserActivation = true;
}

export function consumeAlbumVideoUserActivation() {
  const pending = pendingUserActivation;
  pendingUserActivation = false;
  return pending;
}

export function claimAlbumPlayback(key) {
  if (!key || activePlaybackKey === key) return;
  activePlaybackKey = key;
  listeners.forEach((fn) => fn(activePlaybackKey));
}

export function releaseAlbumPlayback(key) {
  if (activePlaybackKey !== key) return;
  activePlaybackKey = null;
  listeners.forEach((fn) => fn(null));
}

function subscribeAlbumPlayback(listener) {
  listeners.add(listener);
  listener(activePlaybackKey);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Play with user mute preference; fall back to muted when autoplay policy blocks audio.
 * @returns {Promise<boolean>} whether video ended up muted
 */
export async function syncVideoElementPlayback(video, wantMuted, onForcedMute) {
  if (!video) return wantMuted;

  const tryOnce = async (muted) => {
    video.muted = muted;
    await video.play();
  };

  const userActivated = consumeAlbumVideoUserActivation();
  const preferUnmuted = userActivated || !wantMuted;

  if (preferUnmuted) {
    try {
      await tryOnce(false);
      return false;
    } catch {
      try {
        await tryOnce(true);
        onForcedMute?.();
        return true;
      } catch {
        return true;
      }
    }
  }

  try {
    await tryOnce(true);
    if (!wantMuted) onForcedMute?.();
    return true;
  } catch {
    return wantMuted;
  }
}

export function pauseVideoElement(video) {
  if (!video) return;
  try {
    video.pause();
  } catch {
    /* ignore */
  }
}

/** Stable ref + state so effects re-run when the <video> node mounts or changes. */
export function useVideoElementRef() {
  const videoRef = useRef(null);
  const [videoEl, setVideoEl] = useState(null);

  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    setVideoEl(node);
  }, []);

  return { videoRef, videoEl, setVideoRef };
}

/**
 * Mirrors mobile `useAlbumExclusiveVideoPlayback` — one thread/focus clip at a time.
 */
export function useAlbumExclusiveVideoPlayback(playbackKey, shouldPlay, videoEl, getMuted, onForcedMute) {
  const shouldPlayRef = useRef(shouldPlay);
  const getMutedRef = useRef(getMuted);
  const onForcedMuteRef = useRef(onForcedMute);
  shouldPlayRef.current = shouldPlay;
  getMutedRef.current = getMuted;
  onForcedMuteRef.current = onForcedMute;

  useEffect(() => {
    if (!videoEl || !playbackKey) {
      pauseVideoElement(videoEl);
      return undefined;
    }

    const sync = () => {
      if (shouldPlayRef.current) {
        claimAlbumPlayback(playbackKey);
        void syncVideoElementPlayback(
          videoEl,
          getMutedRef.current?.() ?? false,
          () => onForcedMuteRef.current?.(),
        );
      } else {
        releaseAlbumPlayback(playbackKey);
        pauseVideoElement(videoEl);
      }
    };

    sync();

    const onCanPlay = () => {
      if (shouldPlayRef.current && activePlaybackKey === playbackKey) {
        void syncVideoElementPlayback(
          videoEl,
          getMutedRef.current?.() ?? false,
          () => onForcedMuteRef.current?.(),
        );
      }
    };

    videoEl.addEventListener('canplay', onCanPlay);
    videoEl.addEventListener('loadeddata', onCanPlay);

    return () => {
      videoEl.removeEventListener('canplay', onCanPlay);
      videoEl.removeEventListener('loadeddata', onCanPlay);
      releaseAlbumPlayback(playbackKey);
      pauseVideoElement(videoEl);
    };
  }, [playbackKey, shouldPlay, videoEl]);

  useEffect(() => {
    if (!videoEl || !playbackKey) return undefined;

    return subscribeAlbumPlayback((activeKey) => {
      if (activeKey !== playbackKey) {
        pauseVideoElement(videoEl);
        return;
      }
      if (shouldPlayRef.current) {
        void syncVideoElementPlayback(
          videoEl,
          getMutedRef.current?.() ?? false,
          () => onForcedMuteRef.current?.(),
        );
      }
    });
  }, [playbackKey, videoEl]);
}
