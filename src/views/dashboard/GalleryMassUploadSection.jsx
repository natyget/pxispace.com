'use client';

import { useState, useCallback, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, ImageAdd02Icon } from '@hugeicons/core-free-icons';
import { requestPresignedUpload } from '../../services/media';
import { createFeedItem } from '../../services/feed';
import { trackScrapbookUpload } from '../../lib/analytics';

const MAX_FILES = 40;
const CONCURRENCY = 2;

/** Gallery standard (match mobile cover / OG): portrait 3:4, landscape 4:3 */
const GALLERY_PORTRAIT = { w: 1200, h: 1600 };
const GALLERY_LANDSCAPE = { w: 1600, h: 1200 };
const JPEG_QUALITY = 0.88;

function sniffMediaType(file) {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('video/')) return 'VIDEO';
  return 'IMAGE';
}

function loadImageDimensions(file) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

function galleryJpgFilename(originalName) {
  const raw = (originalName || 'photo').replace(/[^\w.-]+/g, '_');
  const noExt = raw.replace(/\.[^.]+$/i, '');
  return `${noExt || 'photo'}_gallery.jpg`;
}

/**
 * Decode image (EXIF-aware when supported), cover-crop to fixed frame, export JPEG.
 * Portrait or square (width <= height): 1200x1600. Landscape (width > height): 1600x1200.
 * @returns {{ file: File; width: number; height: number }}
 */
async function resizeImageForGalleryUpload(file) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Resize requires browser');
  }

  let releaseBitmap = null;
  let iw = 0;
  let ih = 0;
  /** @type {(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) => void} */
  let draw = null;

  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bmp.width > 0 && bmp.height > 0) {
        iw = bmp.width;
        ih = bmp.height;
        draw = (ctx, dx, dy, dw, dh) => ctx.drawImage(bmp, dx, dy, dw, dh);
        releaseBitmap = () => {
          try {
            bmp.close();
          } catch {
            /* ignore */
          }
        };
      }
    } catch {
      /* fall through to Image() */
    }
  }

  if (!draw) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Could not decode image'));
        el.src = url;
      });
      iw = img.naturalWidth || img.width;
      ih = img.naturalHeight || img.height;
      draw = (ctx, dx, dy, dw, dh) => ctx.drawImage(img, dx, dy, dw, dh);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!iw || !ih || !draw) {
    releaseBitmap?.();
    throw new Error('Invalid image dimensions');
  }

  const landscape = iw > ih;
  const outW = landscape ? GALLERY_LANDSCAPE.w : GALLERY_PORTRAIT.w;
  const outH = landscape ? GALLERY_LANDSCAPE.h : GALLERY_PORTRAIT.h;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    releaseBitmap?.();
    throw new Error('Canvas not supported');
  }

  try {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outW, outH);
    const scale = Math.max(outW / iw, outH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (outW - dw) / 2;
    const dy = (outH - dh) / 2;
    draw(ctx, dx, dy, dw, dh);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('JPEG export failed'))),
        'image/jpeg',
        JPEG_QUALITY
      );
    });

    const outFile = new File([blob], galleryJpgFilename(file.name), {
      type: 'image/jpeg',
      lastModified: file.lastModified || Date.now(),
    });
    return { file: outFile, width: outW, height: outH };
  } finally {
    releaseBitmap?.();
  }
}

/**
 * Capture a JPEG poster from a video file (first second) for notification / grid thumbnails.
 * @returns {Promise<{ file: File; width: number; height: number }>}
 */
function captureVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Video thumbnail requires browser'));
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadeddata = () => {
      const seekTo = Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(1, video.duration * 0.1)
        : 0;
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          cleanup();
          reject(new Error('Invalid video dimensions'));
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error('JPEG export failed'));
              return;
            }
            const base = (file.name || 'video').replace(/\.[^.]+$/i, '') || 'video';
            const thumbFile = new File([blob], `${base}_thumb.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({ file: thumbFile, width: w, height: h });
          },
          'image/jpeg',
          0.85,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Could not decode video'));
    };

    video.src = url;
  });
}

async function putToPresigned(uploadUrl, file, contentType) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType || 'application/octet-stream' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`R2 upload failed (${res.status})${text ? `: ${text.slice(0, 120)}` : ''}`);
  }
}

/**
 * Upload many files to the event album gallery (Mongo `messages` gallery, not chat-only thread).
 */
export default function GalleryMassUploadSection({ albumId, eventId, disabled }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [lastError, setLastError] = useState(null);
  const [lastOk, setLastOk] = useState(null);

  const runQueue = useCallback(
    async (files) => {
      if (!albumId || !eventId || files.length === 0) return;
      setBusy(true);
      setLastError(null);
      setLastOk(null);
      setProgress({ done: 0, total: files.length, label: 'Starting...' });

      let completed = 0;
      const errors = [];
      const queue = [...files];

      const work = async (file) => {
        const kind = sniffMediaType(file);
        let uploadBody = file;
        let contentType =
          file.type ||
          (kind === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
        let safeName = (file.name || `upload_${Date.now()}`).replace(/[^\w.-]+/g, '_');
        let dims = {};

        let thumbnailUrl;

        if (kind === 'IMAGE') {
          try {
            const resized = await resizeImageForGalleryUpload(file);
            uploadBody = resized.file;
            contentType = 'image/jpeg';
            safeName = resized.file.name.replace(/[^\w.-]+/g, '_');
            dims = { width: resized.width, height: resized.height };
          } catch {
            dims = await loadImageDimensions(file);
          }
        } else {
          try {
            const thumb = await captureVideoThumbnail(file);
            dims = { width: thumb.width, height: thumb.height };
            const thumbName = thumb.file.name.replace(/[^\w.-]+/g, '_');
            const thumbPresign = await requestPresignedUpload({
              filename: thumbName,
              contentType: 'image/jpeg',
              albumId,
            });
            await putToPresigned(thumbPresign.uploadUrl, thumb.file, 'image/jpeg');
            thumbnailUrl = thumbPresign.publicUrl;
          } catch {
            /* poster optional; notification may lack thumb until re-upload */
          }
        }

        setProgress((p) => ({ ...p, label: safeName }));

        const { uploadUrl, publicUrl } = await requestPresignedUpload({
          filename: safeName,
          contentType,
          albumId,
        });
        await putToPresigned(uploadUrl, uploadBody, contentType);

        const capturedAt = new Date(file.lastModified || Date.now()).toISOString();

        await createFeedItem({
          r2Url: publicUrl,
          type: kind,
          context: 'ALBUM',
          linkedAlbumId: albumId,
          linkedEventId: eventId,
          capturedAt,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
          ...(typeof dims.width === 'number' && dims.width > 0 ? { width: dims.width } : {}),
          ...(typeof dims.height === 'number' && dims.height > 0 ? { height: dims.height } : {}),
        });

        completed += 1;
        setProgress({ done: completed, total: files.length, label: safeName });
      };

      async function worker() {
        for (;;) {
          const f = queue.shift();
          if (!f) return;
          try {
            await work(f);
          } catch (e) {
            errors.push(`${f.name}: ${e?.message || 'failed'}`);
          }
        }
      }

      const n = Math.min(CONCURRENCY, files.length);
      await Promise.all(Array.from({ length: n }, () => worker()));

      setBusy(false);
      setProgress({ done: completed, total: files.length, label: '' });
      // Report what reached the album, not what was picked — a partly failed
      // batch still uploaded `completed` items.
      if (completed > 0) trackScrapbookUpload({ eventId, mediaCount: completed });
      if (errors.length) {
      setLastError(errors.slice(0, 5).join(' / ') + (errors.length > 5 ? ` ... +${errors.length - 5} more` : ''));
      } else {
        setLastOk(`Uploaded ${files.length} file${files.length === 1 ? '' : 's'} to the album gallery.`);
      }
    },
    [albumId, eventId]
  );

  const onPick = (e) => {
    const raw = Array.from(e.target.files || []);
    e.target.value = '';
    if (!raw.length) return;
    const files = raw.slice(0, MAX_FILES);
    if (raw.length > MAX_FILES) {
      setLastError(`Only the first ${MAX_FILES} files were queued (limit per batch).`);
    }
    void runQueue(files);
  };

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-2xl bg-white/[0.035]">
      <div className="flex items-center gap-2 px-5 pb-2 pt-5">
        <HugeiconsIcon icon={ImageAdd02Icon} size={18} className="text-white opacity-70" />
        <h2 className="font-bold text-white tracking-[0.02em] text-sm">Gallery / Mass upload</h2>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Add many photos or videos to the <strong className="text-zinc-300">album gallery</strong> (the same grid
          guests see, not the side thread. Photos are normalized to{' '}
          <strong className="text-zinc-300">1200x1600</strong> (portrait or square) or{' '}
          <strong className="text-zinc-300">1600x1200</strong> (landscape), center-cropped and saved as JPEG, before
          upload. For large batches, keep this tab open until the progress bar completes.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          disabled={disabled || busy}
          onChange={onPick}
        />
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold tracking-[0.02em] text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <HugeiconsIcon icon={Loading02Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={ImageAdd02Icon} size={18} />}
          {busy ? 'Uploading...' : 'Choose files'}
        </button>
        {busy && progress.total > 0 && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400">
              {progress.done}/{progress.total} / {pct}% / {progress.label}
            </p>
          </div>
        )}
        {lastOk && <p className="text-xs text-emerald-400/90">{lastOk}</p>}
        {lastError && <p className="text-xs text-red-400/90">{lastError}</p>}
      </div>
    </section>
  );
}
