'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function buildCaption({ eventName, dateLabel, venueName, eventUrl }) {
    return [
        `${eventName} — straight from the crowd 📸`,
        [dateLabel, venueName].filter(Boolean).join(' · '),
        '',
        eventUrl ? `Relive it / get in next time: ${eventUrl}` : null,
        '',
        '#PXI #shotonpxi #nightlife',
    ].filter((line) => line !== null).join('\n');
}

/**
 * Simple by design: grab the actual crowd content and go post it. Select
 * moments → mass-download the originals + copy a caption; the polished
 * Instagram share (frames, stories) lives in the mobile app — the event link
 * opens straight into it.
 */
export default function MarketingKitModal({ open, onClose, moments = [], event }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState('');

    useEffect(() => {
        if (open) {
            setSelectedIds(moments.map((m) => m.mediaId)); // default: everything
            setError('');
            setCopied('');
            setProgress(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const dateLabel = useMemo(() => {
        if (!event?.startDate) return '';
        const date = new Date(event.startDate);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [event?.startDate]);

    const eventUrl = typeof window !== 'undefined' && event?.id ? `${window.location.origin}/events/${event.id}` : '';
    const selected = moments.filter((m) => selectedIds.includes(m.mediaId));

    const toggle = (mediaId) => {
        setSelectedIds((current) => (
            current.includes(mediaId) ? current.filter((id) => id !== mediaId) : [...current, mediaId]
        ));
    };

    const downloadAll = async () => {
        setDownloading(true);
        setError('');
        setProgress(0);
        const slug = (event?.name || 'pxi-event').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
        let failed = 0;
        for (let index = 0; index < selected.length; index++) {
            const moment = selected[index];
            const url = moment.r2Url || moment.thumbnailUrl;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
                downloadBlob(blob, `${slug}-moment-${index + 1}.${ext}`);
            } catch {
                // Media host blocked the cross-origin read — open it instead so nothing is lost.
                window.open(url, '_blank', 'noopener');
                failed += 1;
            }
            setProgress(index + 1);
            // Small gap so the browser doesn't swallow rapid download triggers.
            await new Promise((resolve) => setTimeout(resolve, 350));
        }
        if (failed > 0) {
            setError(`${failed} file${failed === 1 ? '' : 's'} opened in a tab instead of downloading (media host CORS) — save them from there.`);
        }
        setDownloading(false);
    };

    const copy = async (label, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(''), 2000);
        } catch {
            setError('Could not copy — your browser blocked clipboard access.');
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Use this content"
            description="Download the crowd's best shots and post them — the full Instagram share flow (frames, stories) is in the PXI app."
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">
                        {selectedIds.length} of {moments.length} selected
                    </p>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(selectedIds.length === moments.length ? [] : moments.map((m) => m.mediaId))}
                        className="text-[11px] font-semibold text-zinc-400 transition hover:text-white"
                    >
                        {selectedIds.length === moments.length ? 'Clear all' : 'Select all'}
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {moments.map((moment) => {
                        const isSelected = selectedIds.includes(moment.mediaId);
                        return (
                            <button
                                key={moment.mediaId}
                                type="button"
                                onClick={() => toggle(moment.mediaId)}
                                aria-pressed={isSelected}
                                className={`relative aspect-[3/4] overflow-hidden rounded-xl transition ${
                                    isSelected ? 'ring-2 ring-[#d84aff]' : 'opacity-60 hover:opacity-100'
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={moment.thumbnailUrl || moment.r2Url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                {isSelected ? (
                                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d84aff] text-[9px] font-bold text-white">✓</span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                {error ? <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">{error}</p> : null}

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={downloadAll}
                        disabled={downloading || !selected.length}
                        className="pill-solid px-5 py-2.5 text-sm disabled:opacity-40"
                    >
                        {downloading ? `Downloading ${progress}/${selected.length}...` : `Download ${selected.length} photo${selected.length === 1 ? '' : 's'}`}
                    </button>
                    <button
                        type="button"
                        onClick={() => copy('caption', buildCaption({ eventName: event?.name || '', dateLabel, venueName: event?.venueName || '', eventUrl }))}
                        className="pill-ghost px-4 py-2.5 text-sm font-bold"
                    >
                        {copied === 'caption' ? 'Copied ✓' : 'Copy caption'}
                    </button>
                    {eventUrl ? (
                        <a
                            href={eventUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="pill-ghost px-4 py-2.5 text-sm font-bold"
                        >
                            Open in PXI app →
                        </a>
                    ) : null}
                </div>
                <p className="text-[11px] leading-4 text-zinc-600">
                    On your phone, the event link opens the PXI app — the album&apos;s Share to Instagram flow does the framed stories there.
                </p>
            </div>
        </Modal>
    );
}
