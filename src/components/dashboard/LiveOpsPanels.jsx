'use client';

import { useMemo } from 'react';

/**
 * The live control room's panels (Live Operations). They draw from props alone, so the dashboard page feeds them real
 * scans and the marketing mockups feed them sample ones.
 */

function cx(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function StateChip({ state, muted = false }) {
    if (state === 'Accepted') {
        return (
            <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]', muted ? 'bg-pxi-field text-zinc-500' : 'bg-emerald-500/10 text-emerald-300')}>
                Accepted
            </span>
        );
    }

    if (state === 'Flagged') {
        return (
            <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]', muted ? 'bg-pxi-field text-zinc-500' : 'bg-red-500/10 text-red-300')}>
                Flagged
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-pxi-field px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-zinc-400">
            {state}
        </span>
    );
}

export function GlassPanel({ children, className = '', muted = false }) {
    return (
        <section className={cx('glass-panel rounded-[1.25rem] p-5', muted && 'grayscale opacity-65', className)}>
            {children}
        </section>
    );
}

export function OpsMetric({ label, value, hint }) {
    return (
        <div className="rounded-2xl bg-pxi-field px-4 py-4">
            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
            {hint ? <p className="mt-1 text-xs font-semibold text-zinc-500">{hint}</p> : null}
        </div>
    );
}

export function CapacityIndicator({ isLive, capacity, scanned, sold }) {
    const hasCapacity = typeof capacity === 'number' && capacity > 0;
    const denominator = hasCapacity ? capacity : sold || 0;
    const capacityPercent = denominator > 0 ? Math.round(((scanned || 0) / denominator) * 100) : 0;

    return (
        <GlassPanel muted={!isLive}>
            <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Capacity</p>
            <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-3xl font-bold text-white">
                    {(scanned || 0).toLocaleString()}
                    <span className="text-base text-zinc-500"> / {hasCapacity ? capacity.toLocaleString() : `${(sold || 0).toLocaleString()} sold`}</span>
                </p>
                <p className="text-sm font-bold text-zinc-400">{capacityPercent}% {hasCapacity ? 'full' : 'scanned'}</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                    className={cx('h-full rounded-full transition-all', isLive ? 'bg-emerald-300' : 'bg-zinc-600')}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                />
            </div>
            {!isLive ? <p className="mt-3 text-xs font-semibold text-zinc-500">Goes live during active events.</p> : null}
        </GlassPanel>
    );
}

/** Per-minute entry velocity over the last hour, from real TicketScanEvent buckets. */
export function EntryVelocityPanel({ isLive, velocity }) {
    const bars = useMemo(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        const counts = new Map((velocity || []).map((bucket) => [bucket.minute, bucket.count]));
        const series = [];
        for (let i = 59; i >= 0; i--) {
            const minute = new Date(now.getTime() - i * 60000).toISOString();
            series.push(counts.get(minute) || 0);
        }
        return series;
    }, [velocity]);
    const max = Math.max(1, ...bars);
    const lastFive = bars.slice(-5).reduce((sum, n) => sum + n, 0);

    return (
        <GlassPanel muted={!isLive}>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Entry velocity</p>
                    <p className="mt-2 text-3xl font-bold text-white">
                        {lastFive}
                        <span className="text-base text-zinc-500"> entries / 5 min</span>
                    </p>
                </div>
                <p className="text-xs font-semibold text-zinc-500">Last hour, per minute</p>
            </div>
            <div className="mt-4 flex h-14 items-end gap-[2px]">
                {bars.map((count, index) => (
                    <div
                        key={index}
                        className={cx('flex-1 rounded-t-sm', isLive ? 'bg-emerald-300/70' : 'bg-zinc-600/60')}
                        style={{ height: `${Math.max(4, Math.round((count / max) * 100))}%`, opacity: count === 0 ? 0.18 : 1 }}
                    />
                ))}
            </div>
            {!isLive ? <p className="mt-3 text-xs font-semibold text-zinc-500">Goes live during active events.</p> : null}
        </GlassPanel>
    );
}

export function RecentScansSection({ isLive, scans, onIncident }) {
    return (
        <GlassPanel muted={!isLive}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Recent Scans</h2>
                    <p className="mt-1 text-sm text-zinc-500">{isLive ? 'Latest tickets scanned in, across every gate.' : 'Goes live during active events.'}</p>
                </div>
            </div>
            <div className="mt-4 space-y-2">
                {scans.map((scan) => (
                    <div key={scan.id} className="grid gap-3 rounded-2xl bg-pxi-field px-4 py-3 md:grid-cols-[1.2fr_0.9fr_0.7fr_auto] md:items-center">
                        <div>
                            <p className="text-sm font-bold text-white">{scan.name}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{scan.ticket}</p>
                        </div>
                        <p className="text-sm font-semibold text-zinc-300">{scan.gate}</p>
                        <div className="flex items-center gap-3">
                            <StateChip state={scan.state} muted={!isLive} />
                            <span className="text-xs text-zinc-500">{scan.at}</span>
                        </div>
                        <button
                            type="button"
                            disabled={!isLive || !scan.gateId}
                            title={scan.gateId ? 'Log an incident for this scan on its gate' : 'Assign this scan’s gate on the board to log incidents'}
                            onClick={() => onIncident(scan)}
                            className={cx(
                                'rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] transition',
                                isLive && scan.gateId ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'cursor-not-allowed bg-pxi-field text-zinc-500'
                            )}
                        >
                            Incident Report
                        </button>
                    </div>
                ))}
                {!scans.length ? (
                    <div className="rounded-2xl bg-pxi-field px-4 py-4 text-sm text-zinc-500">
                        {isLive ? 'No tickets scanned yet.' : 'Goes live during active events.'}
                    </div>
                ) : null}
            </div>
        </GlassPanel>
    );
}

export function GateCard({ gate, isLive, menuOpen, onOpen, onEdit, onTogglePause, onToggleMenu, onDelete }) {
    const issueScans = gate.scans.filter((scan) => scan.state === 'Flagged' || scan.state === 'Manual Check');

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={() => onOpen(gate.id)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onOpen(gate.id);
            }}
            className={cx(
                'glass-panel relative min-h-[260px] cursor-pointer rounded-[1.25rem] p-5 transition hover:bg-white/[0.07]',
                !isLive && 'grayscale opacity-65'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={cx('h-3 w-3 rounded-full', gate.paused ? 'bg-amber-300' : issueScans.length ? 'bg-red-400' : 'bg-emerald-300')} />
                        <h3 className="text-xl font-bold text-white">{gate.name}</h3>
                    </div>
                    <p className="mt-1 text-xs font-bold tracking-[0.02em] text-zinc-500">
                        {isLive ? `${gate.scans.length} scan${gate.scans.length === 1 ? '' : 's'} recent` : 'Goes live during active events'}
                    </p>
                </div>
                <div className="relative">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleMenu(gate.id);
                        }}
                        className="pill-ghost px-3 py-1 text-sm font-bold"
                        aria-label={`${gate.name} options`}
                    >
                        ...
                    </button>
                    {menuOpen ? (
                        <div
                            className="glass-panel absolute right-0 top-9 z-20 w-44 rounded-xl p-2"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(gate)}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-300 hover:bg-white/10"
                            >
                                Edit gate
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(gate.id)}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-red-200 hover:bg-red-500/10"
                            >
                                Delete gate
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <button
                type="button"
                disabled={!isLive}
                onClick={(event) => {
                    event.stopPropagation();
                    onTogglePause(gate);
                }}
                className={cx(
                    'mt-5 rounded-full px-4 py-2 text-xs font-bold tracking-[0.02em] transition',
                    !isLive
                        ? 'cursor-not-allowed bg-pxi-field text-zinc-500'
                        : gate.paused
                            ? 'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-200 hover:bg-red-500/20'
                )}
            >
                {gate.paused ? 'Resume Scan' : 'Halt Scan'}
            </button>

            <div className="mt-5 max-h-32 space-y-2 overflow-y-auto pr-1">
                {gate.scans.map((scan) => (
                    <div key={`${gate.id}-${scan.id}`} className="rounded-xl glass-field px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-white">{scan.ticket}</p>
                            <StateChip state={scan.state} muted={!isLive} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{scan.name} / {scan.at}</p>
                    </div>
                ))}
                {!gate.scans.length ? (
                    <div className="rounded-xl bg-pxi-field px-3 py-4 text-sm text-zinc-500">
                        No scans yet.
                    </div>
                ) : null}
            </div>

            <p className="mt-4 text-xs font-semibold text-zinc-500">
                {issueScans.length ? `${issueScans.length} issue${issueScans.length > 1 ? 's' : ''} flagged` : 'No active issues'}
            </p>
            {gate.assignedPeople?.length ? (
                <p className="mt-2 text-[11px] font-medium tracking-[0.02em] text-white/35">
                    {gate.assignedPeople.length} assigned
                </p>
            ) : null}
        </article>
    );
}
