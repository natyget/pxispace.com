'use client';

import { useState, useCallback, useRef } from 'react';
import { Loader2, ImagePlus } from 'lucide-react';
import { requestPresignedUpload } from '../../services/media';
import { createFeedItem } from '../../services/feed';

const MAX_FILES = 40;
const CONCURRENCY = 2;

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
      setProgress({ done: 0, total: files.length, label: 'Starting…' });

      let completed = 0;
      const errors = [];
      const queue = [...files];

      const work = async (file) => {
        const kind = sniffMediaType(file);
        const contentType =
          file.type ||
          (kind === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
        const safeName = (file.name || `upload_${Date.now()}`).replace(/[^\w.-]+/g, '_');
        setProgress((p) => ({ ...p, label: safeName }));

        const { uploadUrl, publicUrl } = await requestPresignedUpload({
          filename: safeName,
          contentType,
          albumId,
        });
        await putToPresigned(uploadUrl, file, contentType);

        const dims = kind === 'IMAGE' ? await loadImageDimensions(file) : {};
        const capturedAt = new Date(file.lastModified || Date.now()).toISOString();

        await createFeedItem({
          r2Url: publicUrl,
          type: kind,
          context: 'ALBUM',
          linkedAlbumId: albumId,
          linkedEventId: eventId,
          capturedAt,
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
      if (errors.length) {
        setLastError(errors.slice(0, 5).join(' · ') + (errors.length > 5 ? ` … +${errors.length - 5} more` : ''));
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
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center gap-2">
        <ImagePlus size={18} className="text-pxi-purple" />
        <h2 className="font-bold text-white uppercase tracking-widest text-sm">Gallery · Mass upload</h2>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Add many photos or videos to the <strong className="text-zinc-300">album gallery</strong> (the same grid
          guests see — not the side thread). For large batches, keep this tab open until the progress bar completes.
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
          {busy ? 'Uploading…' : 'Choose files'}
        </button>
        {busy && progress.total > 0 && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-pxi-purple transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400">
              {progress.done}/{progress.total} · {pct}% · {progress.label}
            </p>
          </div>
        )}
        {lastOk && <p className="text-xs text-emerald-400/90">{lastOk}</p>}
        {lastError && <p className="text-xs text-red-400/90">{lastError}</p>}
      </div>
    </section>
  );
}
