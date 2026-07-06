'use client';

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MusicNote01Icon,
  SpotifyIcon,
  AppleMusicIcon,
  Loading02Icon,
  Link01Icon,
  Copy01Icon,
  CheckmarkBadge01Icon,
} from '@hugeicons/core-free-icons';
import { musicService } from '@/services/music';
import { getSiteUrl } from '@/lib/siteUrl';

const PROVIDER_META = {
  SPOTIFY: { label: 'Spotify', color: '#1DB954', icon: SpotifyIcon },
  APPLE_MUSIC: { label: 'Apple Music', color: '#fa2d48', icon: AppleMusicIcon },
};

function ProviderPill({ provider }) {
  const meta = PROVIDER_META[String(provider || '').toUpperCase()] || PROVIDER_META.SPOTIFY;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
      style={{ color: meta.color, backgroundColor: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}
    >
      <HugeiconsIcon icon={meta.icon} size={12} />
      {meta.label}
    </span>
  );
}

export default function LineupPlaylistCard({ eventId }) {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [linkInfo, setLinkInfo] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    musicService
      .getEventPlaylist(eventId)
      .then((res) => setPlaylist(res?.playlist || null))
      .catch(() => setPlaylist(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSave = async () => {
    if (!url.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await musicService.setEventPlaylist(eventId, url.trim());
      setPlaylist(res?.playlist || null);
      setUrl('');
    } catch (err) {
      setSaveError(err?.message || 'Failed to read playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLink = async () => {
    if (linkLoading) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await musicService.createPlaylistLink(eventId);
      setLinkInfo(res);
    } catch (err) {
      setLinkError(err?.message || 'Failed to create DJ link');
    } finally {
      setLinkLoading(false);
    }
  };

  const djUrl = linkInfo?.token ? `${getSiteUrl()}/dj/${linkInfo.token}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(djUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy link:', djUrl);
    }
  };

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 p-5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.035)]">
        <HugeiconsIcon icon={MusicNote01Icon} size={18} className="text-pxi-purple" />
        <h2 className="font-bold text-white uppercase tracking-widest text-sm">Lineup Playlist</h2>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" />
            Loading playlist…
          </div>
        ) : playlist ? (
          <div className="rounded-xl border border-white/10 bg-zinc-800/40 p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <ProviderPill provider={playlist.provider} />
              <span className="text-xs text-zinc-500">
                {playlist.trackCount} track{playlist.trackCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-sm font-bold text-white truncate">{playlist.title}</p>
            {Array.isArray(playlist.topGenres) && playlist.topGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {playlist.topGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 leading-relaxed">
            No playlist yet — paste a Spotify or Apple Music playlist/album link below.
          </p>
        )}

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-pxi-purple uppercase tracking-widest">
            Spotify or Apple Music URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 px-3 py-2.5 text-sm focus:border-pxi-purple/50 focus:outline-none"
              placeholder="https://open.spotify.com/playlist/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !url.trim()}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pxi-purple text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" /> : null}
              {saving ? 'Reading playlist…' : 'Save playlist'}
            </button>
          </div>
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        </div>

        <div className="pt-3 border-t border-white/5 space-y-3">
          {!linkInfo ? (
            <button
              type="button"
              onClick={handleCreateLink}
              disabled={linkLoading}
              className="pill-ghost inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {linkLoading ? (
                <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={Link01Icon} size={14} />
              )}
              {linkLoading ? 'Creating…' : 'Send to your DJ'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Share this link — your DJ can paste their set without an account.
              </p>
              <div className="rounded-xl bg-zinc-800 border border-white/10 p-3 flex items-center gap-3">
                <p className="flex-1 text-xs text-white break-all font-mono leading-relaxed">{djUrl}</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copied ? (
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-emerald-400" />
                  ) : (
                    <HugeiconsIcon icon={Copy01Icon} size={16} className="text-zinc-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-600">Valid for 30 days · up to 5 submissions</p>
            </div>
          )}
          {linkError && <p className="text-xs text-red-400">{linkError}</p>}
        </div>
      </div>
    </div>
  );
}
