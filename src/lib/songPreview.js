import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * An event's song preview (`topSong.previewUrl`, a ~30 s https mp3/m4a clip), the web twin of the
 * app's useDiscPreview: fades in on start, fades out and lets go of the clip on stop, when the tab
 * is hidden and when the component leaves.
 *
 * `start(url)` must be called from the click itself: browsers (iOS Safari above all) only let a
 * page make sound inside the tap that asked for it. A blocked play or a dead link stays silent —
 * the preview is garnish and never breaks the record.
 */

const FADE_IN_MS = 900;
const FADE_OUT_MS = 240;
const TARGET_VOLUME = 0.85;
const STEP_MS = 50;

/** Only plain https clips play; anything else is no song. */
export function previewSrc(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  return /^https:\/\//i.test(trimmed) ? trimmed : null;
}

function fadeOutAndRelease(clip) {
  clearInterval(clip.fadeIn);
  const { audio } = clip;
  const from = audio.volume;
  const started = Date.now();
  const timer = setInterval(() => {
    const t = Math.min(1, (Date.now() - started) / FADE_OUT_MS);
    audio.volume = Math.max(0, from * (1 - t));
    if (t >= 1) {
      clearInterval(timer);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }, STEP_MS);
}

export function useSongPreview() {
  const clipRef = useRef(null);
  const [playingSrc, setPlayingSrc] = useState(null);

  const stop = useCallback(() => {
    const clip = clipRef.current;
    if (!clip) return;
    clipRef.current = null;
    setPlayingSrc(null);
    fadeOutAndRelease(clip);
  }, []);

  const start = useCallback(
    (url) => {
      stop();
      const src = previewSrc(url);
      if (!src || typeof Audio === 'undefined') return false;
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
      const clip = { audio, fadeIn: null };
      clipRef.current = clip;
      setPlayingSrc(src);
      audio
        .play()
        .then(() => {
          const started = Date.now();
          clip.fadeIn = setInterval(() => {
            const t = Math.min(1, (Date.now() - started) / FADE_IN_MS);
            audio.volume = TARGET_VOLUME * t;
            if (t >= 1) clearInterval(clip.fadeIn);
          }, STEP_MS);
        })
        .catch(() => {
          if (clipRef.current !== clip) return;
          clipRef.current = null;
          setPlayingSrc(null);
        });
      return true;
    },
    [stop],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [stop]);

  return { start, stop, playingSrc };
}
