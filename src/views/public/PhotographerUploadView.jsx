'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageAdd02Icon, Loading02Icon, CheckmarkCircle02Icon, CancelCircleIcon, Camera01Icon } from '@hugeicons/core-free-icons';
import { getUploadLink, presignUploadLink, confirmUploadLink } from '@/services/uploadLink';
import { trackScrapbookUpload } from '@/lib/analytics';

const MAX_FILES = 100;
const CONCURRENCY = 2;
const GALLERY_PORTRAIT = { w: 1200, h: 1600 };
const GALLERY_LANDSCAPE = { w: 1600, h: 1200 };
const JPEG_QUALITY = 0.88;

function sniffType(file) {
  return (file.type || '').toLowerCase().startsWith('video/') ? 'VIDEO' : 'IMAGE';
}

async function resizeForGallery(file) {
  let iw = 0, ih = 0, draw = null, release = null;

  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bmp.width > 0 && bmp.height > 0) {
        iw = bmp.width; ih = bmp.height;
        draw = (ctx, dx, dy, dw, dh) => ctx.drawImage(bmp, dx, dy, dw, dh);
        release = () => { try { bmp.close(); } catch {} };
      }
    } catch {}
  }

  if (!draw) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('decode failed'));
        el.src = url;
      });
      iw = img.naturalWidth || img.width;
      ih = img.naturalHeight || img.height;
      draw = (ctx, dx, dy, dw, dh) => ctx.drawImage(img, dx, dy, dw, dh);
    } finally { URL.revokeObjectURL(url); }
  }

  if (!iw || !ih) { release?.(); throw new Error('Invalid image'); }

  const landscape = iw > ih;
  const outW = landscape ? GALLERY_LANDSCAPE.w : GALLERY_PORTRAIT.w;
  const outH = landscape ? GALLERY_LANDSCAPE.h : GALLERY_PORTRAIT.h;
  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) { release?.(); throw new Error('No canvas'); }

  try {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, outW, outH);
    const scale = Math.max(outW / iw, outH / ih);
    draw(ctx, (outW - iw * scale) / 2, (outH - ih * scale) / 2, iw * scale, ih * scale);
    const blob = await new Promise((res, rej) =>
      canvas.toBlob((b) => b ? res(b) : rej(new Error('export failed')), 'image/jpeg', JPEG_QUALITY)
    );
    const name = (file.name || 'photo').replace(/[^\w.-]+/g, '_').replace(/\.[^.]+$/i, '') + '_gallery.jpg';
    return { file: new File([blob], name, { type: 'image/jpeg' }), width: outW, height: outH };
  } finally { release?.(); }
}

async function putToR2(uploadUrl, file, contentType) {
  const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export default function PhotographerUploadView({ token }) {
  const [linkInfo, setLinkInfo] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    getUploadLink(token)
      .then(setLinkInfo)
      .catch((err) => setLinkError(err?.message || 'This upload link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const runQueue = useCallback(async (files) => {
    if (!files.length) return;
    setBusy(true);
    setUploadError(null);
    setResult(null);
    setProgress({ done: 0, total: files.length, label: 'Starting…' });

    let completed = 0;
    const errors = [];
    const queue = [...files];
    const work = async (file) => {
      const type = sniffType(file);
      let uploadFile = file;
      let contentType = file.type || (type === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
      let safeName = (file.name || `photo_${Date.now()}`).replace(/[^\w.-]+/g, '_');
      let width, height;

      if (type === 'IMAGE') {
        try {
          const resized = await resizeForGallery(file);
          uploadFile = resized.file;
          contentType = 'image/jpeg';
          safeName = resized.file.name;
          width = resized.width;
          height = resized.height;
        } catch {}
      }

      setProgress((p) => ({ ...p, label: safeName }));

      const { uploadUrl, publicUrl } = await presignUploadLink(token, { filename: safeName, contentType });
      await putToR2(uploadUrl, uploadFile, contentType);

      const capturedAt = new Date(file.lastModified || Date.now()).toISOString();
      await confirmUploadLink(token, {
        r2Url: publicUrl, type,
        width, height, capturedAt,
        fileSizeBytes: uploadFile.size,
      });

      completed += 1;
      setProgress({ done: completed, total: files.length, label: safeName });
    };

    async function worker() {
      for (;;) {
        const f = queue.shift();
        if (!f) return;
        try { await work(f); }
        catch (e) { errors.push(`${f.name}: ${e?.message || 'failed'}`); }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()));

    setBusy(false);
    // Report what actually landed in the album, not what was picked.
    if (completed > 0) {
      trackScrapbookUpload({
        eventId: linkInfo?.eventId,
        eventTitle: linkInfo?.eventName,
        mediaCount: completed,
      });
    }
    if (errors.length) {
      setUploadError(errors.slice(0, 5).join(' · ') + (errors.length > 5 ? ` +${errors.length - 5} more` : ''));
    } else {
      setResult(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded successfully!`);
    }
  }, [token, linkInfo?.eventId, linkInfo?.eventName]);

  const onPick = (e) => {
    const raw = Array.from(e.target.files || []);
    e.target.value = '';
    if (!raw.length) return;
    void runQueue(raw.slice(0, MAX_FILES));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <HugeiconsIcon icon={Loading02Icon} className="animate-spin text-pxi-purple" size={32} />
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <HugeiconsIcon icon={CancelCircleIcon} size={48} className="text-red-400 mx-auto" />
          <h1 className="text-white text-xl font-black">Link Unavailable</h1>
          <p className="text-zinc-400 text-sm">{linkError}</p>
        </div>
      </div>
    );
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Event cover + name */}
        <div className="text-center space-y-3">
          {linkInfo.eventCover ? (
            <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-white/10">
              <Image src={linkInfo.eventCover} alt={linkInfo.eventName} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
              <HugeiconsIcon icon={Camera01Icon} size={32} className="text-zinc-600" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Photographer Upload</p>
            <h1 className="text-2xl font-black text-white tracking-tight">{linkInfo.eventName}</h1>
          </div>
        </div>

        {/* Upload card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <p className="text-xs text-zinc-500">
              Upload your photos directly to this event's album. Up to{' '}
              <span className="text-white font-bold">{linkInfo.remainingImages}</span> images and{' '}
              <span className="text-white font-bold">{Math.round(linkInfo.remainingMb)} MB</span> remaining on this link.
            </p>
          </div>
          <div className="p-5 space-y-4">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              disabled={busy}
              onChange={onPick}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {busy ? <HugeiconsIcon icon={Loading02Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={ImageAdd02Icon} size={18} />}
              {busy ? 'Uploading…' : 'Choose Photos'}
            </button>

            {busy && progress.total > 0 && (
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-pxi-purple transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-zinc-400 text-center">
                  {progress.done}/{progress.total} · {pct}%
                </p>
              </div>
            )}

            {result && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                {result}
              </div>
            )}
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
          </div>
        </div>

        <p className="text-center text-zinc-700 text-[11px]">Powered by PXI</p>
      </div>
    </div>
  );
}
