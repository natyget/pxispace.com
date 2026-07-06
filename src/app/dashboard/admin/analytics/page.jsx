'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPlatformAnalytics } from '@/services/admin';
import { useAuth } from '@/contexts/AuthContext';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';

// Series colors validated for the dark surface (CVD-safe pair, ≥3:1 contrast).
const BLUE = '#3987e5';
const AQUA = '#199e70';

const RANGES = [
    { days: 7, label: '7d' },
    { days: 30, label: '30d' },
    { days: 90, label: '90d' },
];

function formatUsd(cents) {
    const v = Number(cents || 0) / 100;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(2)}`;
}

function dayKey(d) {
    return new Date(d).toISOString().slice(0, 10);
}

function shortDate(key) {
    const d = new Date(`${key}T00:00:00Z`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Fill the [now-days, now] range so every day has a point even with no rows. */
function fillDays(days, rows, pick) {
    const byKey = new Map((rows || []).map((r) => [dayKey(r.day), r]));
    const out = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const key = dayKey(d);
        out.push({ key, value: pick(byKey.get(key)) });
    }
    return out;
}

function StatTile({ label, value, hint }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
            <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase">{label}</p>
            <p className="text-[26px] font-black text-white tabular-nums mt-1.5 leading-none">{value}</p>
            {hint ? <p className="text-[12px] text-white/45 mt-1.5">{hint}</p> : null}
        </div>
    );
}

/**
 * Minimal daily bar chart: thin rounded bars anchored to the baseline,
 * 2px gaps, recessive grid, per-bar hover tooltip.
 */
function DailyBars({ title, data, color, format = (v) => String(v) }) {
    const [hover, setHover] = useState(null);
    const W = 640;
    const H = 160;
    const PAD = { top: 14, right: 8, bottom: 22, left: 8 };
    const max = Math.max(1, ...data.map((d) => d.value));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = innerW / data.length;
    const barW = Math.max(2, step - 2);

    const gridYs = [0.5, 1].map((f) => PAD.top + innerH * (1 - f));

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
            <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-[13px] font-bold text-white/80">{title}</h2>
                <span className="text-[12px] text-white/45 tabular-nums">
                    {hover != null
                        ? `${shortDate(data[hover].key)} — ${format(data[hover].value)}`
                        : `peak ${format(max)}`}
                </span>
            </div>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto block"
                role="img"
                aria-label={title}
                onMouseLeave={() => setHover(null)}
            >
                {gridYs.map((y) => (
                    <line key={y} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                ))}
                <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                {data.map((d, i) => {
                    const h = Math.round((d.value / max) * innerH);
                    const x = PAD.left + i * step + (step - barW) / 2;
                    const y = PAD.top + innerH - h;
                    return (
                        <g key={d.key}>
                            {/* hit target wider than the mark */}
                            <rect
                                x={PAD.left + i * step}
                                y={PAD.top}
                                width={step}
                                height={innerH}
                                fill="transparent"
                                onMouseEnter={() => setHover(i)}
                            />
                            {d.value > 0 && (
                                <rect
                                    x={x}
                                    y={y}
                                    width={barW}
                                    height={Math.max(2, h)}
                                    rx={Math.min(3, barW / 2)}
                                    fill={color}
                                    opacity={hover === null || hover === i ? 1 : 0.45}
                                    pointerEvents="none"
                                />
                            )}
                        </g>
                    );
                })}
                <text x={PAD.left} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10">{shortDate(data[0]?.key)}</text>
                <text x={W - PAD.right} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">{shortDate(data[data.length - 1]?.key)}</text>
            </svg>
        </div>
    );
}

/** Two-line revenue chart (gross vs PXI take) with crosshair hover + legend. */
function RevenueLines({ data }) {
    const [hover, setHover] = useState(null);
    const W = 640;
    const H = 190;
    const PAD = { top: 16, right: 8, bottom: 22, left: 8 };
    const max = Math.max(100, ...data.map((d) => d.gross));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v) => PAD.top + innerH * (1 - v / max);

    const path = (pick) => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(pick(d)).toFixed(1)}`).join(' ');

    const onMove = (e) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const i = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
        setHover(Math.max(0, Math.min(data.length - 1, i)));
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                <h2 className="text-[13px] font-bold text-white/80">Revenue per day</h2>
                <div className="flex items-center gap-4 text-[12px] text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-[2px] rounded" style={{ background: BLUE }} /> Gross
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-[2px] rounded" style={{ background: AQUA }} /> PXI take
                    </span>
                    {hover != null && (
                        <span className="tabular-nums text-white/80">
                            {shortDate(data[hover].key)} — gross {formatUsd(data[hover].gross)} · take {formatUsd(data[hover].take)}
                        </span>
                    )}
                </div>
            </div>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto block"
                role="img"
                aria-label="Daily gross revenue and PXI take"
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
            >
                {[0.5, 1].map((f) => (
                    <line key={f} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                ))}
                <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <path d={path((d) => d.gross)} fill="none" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" />
                <path d={path((d) => d.take)} fill="none" stroke={AQUA} strokeWidth="2" strokeLinejoin="round" />
                {hover != null && (
                    <g pointerEvents="none">
                        <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                        <circle cx={x(hover)} cy={y(data[hover].gross)} r="4" fill={BLUE} stroke="#18181b" strokeWidth="2" />
                        <circle cx={x(hover)} cy={y(data[hover].take)} r="4" fill={AQUA} stroke="#18181b" strokeWidth="2" />
                    </g>
                )}
                <text x={PAD.left} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10">{shortDate(data[0]?.key)}</text>
                <text x={W - PAD.right} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">{shortDate(data[data.length - 1]?.key)}</text>
            </svg>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const { user } = useAuth();
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isLiveAdmin = user?.accountTier === 'ADMIN';

    const load = useCallback(async () => {
        if (!isLiveAdmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetchPlatformAnalytics(days);
            setData(res);
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin, days]);

    useEffect(() => {
        load();
    }, [load]);

    const signups = useMemo(
        () => (data ? fillDays(data.days, data.series.signups, (r) => r?.count ?? 0) : []),
        [data]
    );
    const tickets = useMemo(
        () => (data ? fillDays(data.days, data.series.tickets, (r) => r?.count ?? 0) : []),
        [data]
    );
    const revenue = useMemo(
        () =>
            data
                ? fillDays(data.days, data.series.revenue, (r) => ({
                      gross: r?.grossCents ?? 0,
                      take: r?.pxiCents ?? 0,
                  })).map((d) => ({ key: d.key, gross: d.value.gross, take: d.value.take }))
                : [],
        [data]
    );

    return (
        <div className="max-w-6xl space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white mb-2">Platform analytics</h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Growth, ticketing, and revenue across all of PXI. PXI take = service fee + platform flat fee.
                    </p>
                </div>
                <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />
            </div>

            <div className="flex gap-2">
                {RANGES.map((r) => (
                    <button
                        key={r.days}
                        type="button"
                        onClick={() => setDays(r.days)}
                        className={`rounded-full px-4 py-1.5 text-[12px] font-semibold border transition-colors ${
                            days === r.days
                                ? 'bg-white text-black border-white'
                                : 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {!isLiveAdmin && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-12 text-center text-white/50 text-sm">
                    Live platform analytics requires a backend ADMIN account.
                </div>
            )}
            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}
            {isLiveAdmin && loading && (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-12 text-center text-white/45 text-sm">Loading…</div>
            )}

            {isLiveAdmin && !loading && data && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile label="Total users" value={data.totals.users.toLocaleString()} />
                        <StatTile label="Tickets issued" value={data.totals.tickets.toLocaleString()} hint={`${data.totals.events.toLocaleString()} events`} />
                        <StatTile
                            label="Lifetime gross"
                            value={formatUsd(data.totals.lifetimeGrossCents)}
                            hint={`${data.totals.lifetimePayments.toLocaleString()} payments`}
                        />
                        <StatTile
                            label="Lifetime PXI take"
                            value={formatUsd(data.totals.lifetimePxiCents)}
                            hint={`${data.totals.openSupportTickets} open tickets · ${data.totals.pendingReports} pending reports`}
                        />
                    </div>

                    <RevenueLines data={revenue} />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <DailyBars title="Signups per day" data={signups} color={BLUE} />
                        <DailyBars title="Event tickets issued per day" data={tickets} color={AQUA} />
                    </div>
                </>
            )}
        </div>
    );
}
