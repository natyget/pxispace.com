'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Link01Icon, Copy01Icon, CheckmarkBadge01Icon, Loading02Icon } from '@hugeicons/core-free-icons';
import { createUploadLink } from '@/services/uploadLink';
import { getSiteUrl } from '@/lib/siteUrl';

const MAX_UPLOAD_OPTIONS = [100, 200, 500, 1000];
const CAPACITY_OPTIONS = [0.1, 0.2, 0.5, 1.0];

const EXPIRE_OPTIONS = [
  { label: '2 hours', value: 2 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
];

function optionButtonClass(selected) {
  return `py-2 rounded-xl text-xs font-bold border transition-colors ${
    selected
      ? 'bg-pxi-purple border-pxi-purple text-white'
      : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
  }`;
}

export default function CreateUploadLinkModal({ albumId, eventId, onClose }) {
  const [maxUploads, setMaxUploads] = useState(100);
  const [capacityGb, setCapacityGb] = useState(0.1);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const maxMb = Math.round(capacityGb * 1000);
      const result = await createUploadLink({ albumId, eventId, maxUploads, maxMb, expiresInHours });
      setCreatedLink(`${getSiteUrl()}/upload/${result.token}`);
    } catch (err) {
      setError(err?.message || 'Failed to create upload link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy link:', createdLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Link01Icon} size={18} className="text-pxi-purple" />
            <h2 className="font-bold text-white text-sm uppercase tracking-widest">Photographer Upload Link</h2>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!createdLink ? (
            <>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate a shareable link that lets photographers upload directly to this event's album — no account required.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Max Images <span className="text-zinc-600 normal-case tracking-normal font-normal">(max number of photos)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MAX_UPLOAD_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMaxUploads(value)}
                      className={optionButtonClass(maxUploads === value)}
                    >
                      {value.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Capacity <span className="text-zinc-600 normal-case tracking-normal font-normal">(max total storage)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CAPACITY_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCapacityGb(value)}
                      className={optionButtonClass(capacityGb === value)}
                    >
                      {value.toFixed(1)} GB
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Link Expires In</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRE_OPTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExpiresInHours(value)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        expiresInHours === value
                          ? 'bg-pxi-purple border-pxi-purple text-white'
                          : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" /> : <HugeiconsIcon icon={Link01Icon} size={16} />}
                  {loading ? 'Creating…' : 'Create Link'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Share this link with your photographer(s). They can upload directly without logging in.
              </p>

              <div className="rounded-xl bg-zinc-800 border border-white/10 p-3 flex items-center gap-3">
                <p className="flex-1 text-xs text-white break-all font-mono leading-relaxed">{createdLink}</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copied ? <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-emerald-400" /> : <HugeiconsIcon icon={Copy01Icon} size={16} className="text-zinc-400" />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2.5 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2"
                >
                  {copied ? <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} /> : <HugeiconsIcon icon={Copy01Icon} size={16} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white transition-colors font-bold"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
