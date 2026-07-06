'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MusicNote01Icon,
  Loading02Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { musicService } from '@/services/music';

export default function DjPlaylistSubmitView({ token }) {
  const [linkInfo, setLinkInfo] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    musicService
      .getPlaylistLinkInfo(token)
      .then(setLinkInfo)
      .catch((err) => {
        if (err?.status === 410) setExpired(true);
        setLinkError(err?.message || 'This link is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await musicService.submitPlaylistLink(token, url.trim());
      setResult(res?.playlist || null);
      setUrl('');
    } catch (err) {
      if (err?.status === 410) {
        setExpired(true);
        setLinkError(err?.message || 'This link has expired or been fully used.');
      } else {
        setSubmitError(err?.message || 'Failed to read playlist');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <HugeiconsIcon icon={Loading02Icon} className="animate-spin text-pxi-purple" size={32} />
      </div>
    );
  }

  if (linkError || !linkInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <HugeiconsIcon icon={CancelCircleIcon} size={48} className="text-red-400 mx-auto" />
          <h1 className="text-white text-xl font-black">{expired ? 'Link Expired' : 'Link Unavailable'}</h1>
          <p className="text-zinc-400 text-sm">
            {linkError || 'This DJ playlist link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

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
              <HugeiconsIcon icon={MusicNote01Icon} size={32} className="text-zinc-600" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">DJ Submission</p>
            <h1 className="text-2xl font-black text-white tracking-tight">{linkInfo.eventName}</h1>
          </div>
        </div>

        {/* Submit card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-lg font-black text-white mb-1">Drop your set</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Paste your Spotify or Apple Music playlist link so guests can preview the lineup's vibe.
            </p>
            {linkInfo.currentPlaylist && !result && (
              <p className="mt-3 text-xs text-zinc-400">
                Current playlist:{' '}
                <span className="text-white font-bold">{linkInfo.currentPlaylist.title}</span>{' '}
                ({linkInfo.currentPlaylist.trackCount} tracks)
              </p>
            )}
          </div>

          <div className="p-5 space-y-4">
            {result ? (
              <div className="text-center space-y-3 py-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={44} className="text-emerald-400 mx-auto" />
                <p className="text-white font-black text-lg">
                  Playlist locked in 🎧
                  <br />
                  {result.title} — {result.trackCount} track{result.trackCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-zinc-500">
                  Changed your mind? Paste another link below to replace it.
                </p>
              </div>
            ) : null}

            <input
              type="url"
              placeholder="Paste your Spotify or Apple Music playlist link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 px-4 py-3 text-sm focus:border-pxi-purple/50 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !url.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(168,85,247,0.35)]"
            >
              {submitting ? <HugeiconsIcon icon={Loading02Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={MusicNote01Icon} size={18} />}
              {submitting ? 'Reading playlist…' : result ? 'Submit another' : 'Submit playlist'}
            </button>

            {submitError && <p className="text-xs text-red-400">{submitError}</p>}
          </div>
        </div>

        <p className="text-center text-zinc-700 text-[11px]">Powered by PXI</p>
      </div>
    </div>
  );
}
