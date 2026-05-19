'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageAdd02Icon, Loading02Icon, CheckmarkCircle02Icon, CancelCircleIcon, Camera01Icon } from '@hugeicons/core-free-icons';
import { getUploadLink, presignUploadLink, confirmUploadLink } from '@/services/uploadLink';

const MAX_BATCH_FILES = 100;
const CONCURRENCY = 2;

function formatMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
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

  const [pendingFiles, setPendingFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const inputRef = useRef(null);

  const pendingBytes = pendingFiles.reduce((sum, f) => sum + f.size, 0);
  const pendingMb = Number(formatMb(pendingBytes));

  const refreshLinkInfo = useCallback(async () => {
    try {
      const updated = await getUploadLink(token);
      setLinkInfo(updated);
      return updated;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    getUploadLink(token)
      .then(setLinkInfo)
      .catch((err) => setLinkError(err?.message || 'This upload link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const applyRemaining = useCallback((remainingImages, remainingMb) => {
    setLinkInfo((prev) =>
      prev
        ? { ...prev, remainingImages, remainingMb }
        : prev,
    );
  }, []);

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
      const confirmed = await confirmUploadLink(token, {
        r2Url: publicUrl, type,
        width, height, capturedAt,
        fileSizeBytes: uploadFile.size,
      });

      if (typeof confirmed?.remainingImages === 'number' && typeof confirmed?.remainingMb === 'number') {
        applyRemaining(confirmed.remainingImages, confirmed.remainingMb);
      }

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

    if (completed > 0) {
      await refreshLinkInfo();
    }

    if (errors.length) {
      const uploaded = completed;
      const msg = errors.slice(0, 5).join(' · ') + (errors.length > 5 ? ` +${errors.length - 5} more` : '');
      setUploadError(
        uploaded > 0
          ? `${uploaded} of ${files.length} uploaded. ${msg}`
          : msg,
      );
      if (uploaded > 0) {
        setResult(`${uploaded} photo${uploaded === 1 ? '' : 's'} uploaded.`);
        setPendingFiles([]);
      }
    } else {
      setResult(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded successfully!`);
      setPendingFiles([]);
    }
  }, [token, applyRemaining, refreshLinkInfo]);

  const onPick = (e) => {
    const raw = Array.from(e.target.files || []);
    e.target.value = '';
    if (!raw.length) return;

    if (raw.length > MAX_BATCH_FILES) {
      setUploadError(`You can select at most ${MAX_BATCH_FILES} photos per upload. You chose ${raw.length}.`);
      return;
    }

    setUploadError(null);
    setResult(null);
    setPendingFiles(raw);
  };

  const handleUpload = () => {
    if (!pendingFiles.length || busy || !linkInfo) return;

    if (pendingFiles.length > MAX_BATCH_FILES) {
      setUploadError(`You can upload at most ${MAX_BATCH_FILES} photos at a time.`);
      return;
    }

    if (pendingFiles.length > linkInfo.remainingImages) {
      setUploadError(
        `This link only has ${linkInfo.remainingImages} image slot${linkInfo.remainingImages === 1 ? '' : 's'} left, but you selected ${pendingFiles.length}.`,
      );
      return;
    }

    if (pendingMb > linkInfo.remainingMb) {
      setUploadError(
        `Selected files are ~${pendingMb} MB, but only ${Math.round(linkInfo.remainingMb)} MB remain on this link.`,
      );
      return;
    }

    void runQueue(pendingFiles);
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
              Upload your photos directly to this event&apos;s album. Up to{' '}
              <span className="text-white font-bold">{linkInfo.remainingImages}</span> images and{' '}
              <span className="text-white font-bold">{Math.round(linkInfo.remainingMb)} MB</span> remaining on this link.
              Choose up to <span className="text-white font-bold">{MAX_BATCH_FILES}</span> photos per upload.
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-zinc-800 text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:border-white/20 transition-colors"
            >
              <HugeiconsIcon icon={ImageAdd02Icon} size={18} />
              {pendingFiles.length ? 'Change Selection' : 'Choose Photos'}
            </button>

            {pendingFiles.length > 0 && !busy && (
              <div className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-3 space-y-1">
                <p className="text-xs text-zinc-400">
                  <span className="text-white font-bold">{pendingFiles.length}</span>
                  {' '}photo{pendingFiles.length === 1 ? '' : 's'} selected
                </p>
                <p className="text-xs text-zinc-400">
                  Estimated size: <span className="text-white font-bold">~{pendingMb} MB</span>
                </p>
              </div>
            )}

            {pendingFiles.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {busy ? <HugeiconsIcon icon={Loading02Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={ImageAdd02Icon} size={18} />}
                {busy ? 'Uploading…' : `Upload ${pendingFiles.length} Photo${pendingFiles.length === 1 ? '' : 's'}`}
              </button>
            )}

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
