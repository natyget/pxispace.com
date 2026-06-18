'use client';

import { useEffect, useState } from 'react';
import { displayImageSrc } from '@/lib/mediaUrl';
import { mediaFullUrl } from './albumMediaLayout';

/** @type {Map<string, number>} */
const durationCache = new Map();

export function resolveVideoDurationSecFromItem(item) {
  const candidates = [
    item?.durationSeconds,
    item?.metadata?.durationSeconds,
    item?.metadata?.duration,
  ];
  for (const value of candidates) {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const sec = raw > 10_000 ? Math.floor(raw / 1000) : Math.floor(raw);
    if (sec > 0) return sec;
  }
  return null;
}

export function useGalleryVideoDuration(item, enabled) {
  const videoUrl = enabled ? displayImageSrc(mediaFullUrl(item), null) : null;

  const [durationSec, setDurationSec] = useState(() => {
    if (!enabled) return null;
    const fromItem = resolveVideoDurationSecFromItem(item);
    if (fromItem) return fromItem;
    return videoUrl ? (durationCache.get(videoUrl) ?? null) : null;
  });

  useEffect(() => {
    if (!enabled) {
      setDurationSec(null);
      return undefined;
    }

    const fromItem = resolveVideoDurationSecFromItem(item);
    if (fromItem) {
      setDurationSec(fromItem);
      return undefined;
    }

    if (!videoUrl) {
      setDurationSec(null);
      return undefined;
    }

    const cached = durationCache.get(videoUrl);
    if (cached) {
      setDurationSec(cached);
      return undefined;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let useCrossOrigin = true;

    const applySrc = () => {
      if (useCrossOrigin) video.crossOrigin = 'anonymous';
      else video.removeAttribute('crossOrigin');
      video.src = videoUrl;
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('error', onError);
      video.removeAttribute('src');
      video.load();
    };

    const onMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const sec = Math.max(1, Math.round(video.duration));
        durationCache.set(videoUrl, sec);
        setDurationSec(sec);
      }
      cleanup();
    };

    const onError = () => {
      if (useCrossOrigin) {
        useCrossOrigin = false;
        applySrc();
        return;
      }
      cleanup();
    };

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('error', onError);
    applySrc();

    return cleanup;
  }, [enabled, item, videoUrl]);

  return durationSec;
}
