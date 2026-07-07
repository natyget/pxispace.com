'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPlatformAnalytics } from '@/services/admin';
import { useAuth } from '@/contexts/AuthContext';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import { adminErrorMessage } from '@/components/admin/adminFormat';

const CHART_PRIMARY = '#ffffff';
const CHART_ACCENT = '#a1a1aa';

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

function formatInteger(value) {
    return Number(value || 0).toLocaleString();
}

function sumValues(rows = [], key = 'value') {
    return rows.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0);
}

function activeDays(rows = [], key = 'value') {
    return rows.filter((row) => Number(row?.[key]) > 0).length;
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
        <div className="rounded-2xl bg-white/[0.04] p-5 backdrop-blur-md">
            <p className="text-[10px] font-black tracking-widest text-white/40 uppercase">{label}</p>
            <p className="mt-3 text-[28px] font-black leading-none tracking-normal text-white tabular-nums">{value}</p>
            {hint ? <p className="mt-2 text-[12px] font-semibold leading-5 text-white/45">{hint}</p> : null}
        </div>
    );
}

function AdminAnalyticsHero({ days, setDays, isLiveAdmin, loading, signups, tickets, revenue }) {
    const rangeGross = sumValues(revenue, 'gross');
    const rangeTake = sumValues(revenue, 'take');
    const rangeSignups = sumValues(signups);
    const rangeTickets = sumValues(tickets);
    const metrics = [
        { label: 'Range gross', value: formatUsd(rangeGross), detail: `${days}-day window` },
        { label: 'PXI take', value: formatUsd(rangeTake), detail: 'Platform fee capture' },
        { label: 'New users', value: formatInteger(rangeSignups), detail: `${activeDays(signups)} active signup days` },
        { label: 'Tickets issued', value: formatInteger(rangeTickets), detail: `${activeDays(tickets)} active ticket days` },
    ];

    return (
        <section className="relative overflow-hidden rounded-[2rem] bg-black px-5 py-7 shadow-[0_24px_90px_rgba(0,0,0,0.45)] md:px-8 md:py-8">
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">PXI Admin</span>
                        <span className="text-zinc-700">/</span>
                        <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />
                    </div>
                    <h1 className="max-w-xl text-4xl font-black leading-[0.92] tracking-normal text-white normal-case md:text-6xl">
                        Platform analytics
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base">
                        Growth, ticketing, revenue, and PXI take across the whole platform.
                    </p>
                    <div className="dashboard-segmented-toggle mt-5 w-full sm:w-auto" role="tablist" aria-label="Analytics range">
                        {RANGES.map((range) => (
                            <button
                                key={range.days}
                                type="button"
                                onClick={() => setDays(range.days)}
                                className="dashboard-segmented-toggle__item flex-1 sm:flex-none"
                                data-active={days === range.days}
                                aria-pressed={days === range.days}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 xl:w-[520px]">
                    {metrics.map((metric) => (
                        <StatTile
                            key={metric.label}
                            label={metric.label}
                            value={loading ? '...' : metric.value}
                            hint={metric.detail}
                        />
                    ))}
                </div>
            </div>
        </section>
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
    const total = sumValues(data);
    const daysWithActivity = activeDays(data);

    return (
        <div className="glass-panel overflow-hidden rounded-[1.75rem] p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Daily flow</p>
                    <h2 className="mt-2 text-lg font-black tracking-normal text-white">{title}</h2>
                    <p className="mt-1 text-xs font-semibold text-white/40">
                        {daysWithActivity} active days · {format(total)} total
                    </p>
                </div>
                <span className="w-fit rounded-full bg-white/[0.065] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white/55 tabular-nums">
                    {hover != null
                        ? `${shortDate(data[hover].key)} · ${format(data[hover].value)}`
                        : `Peak ${format(max)}`}
                </span>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="block h-auto w-full"
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
    const grossTotal = sumValues(data, 'gross');
    const takeTotal = sumValues(data, 'take');
    const takeRate = grossTotal > 0 ? `${Math.round((takeTotal / grossTotal) * 1000) / 10}%` : '0%';

    const onMove = (e) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const i = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
        setHover(Math.max(0, Math.min(data.length - 1, i)));
    };

    return (
        <div className="glass-panel overflow-hidden rounded-[1.75rem] p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Money movement</p>
                    <h2 className="mt-2 text-xl font-black tracking-normal text-white">Revenue per day</h2>
                    <p className="mt-1 text-sm leading-6 text-white/45">
                        Gross sales compared with captured PXI take.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-left">
                    <div className="rounded-2xl bg-white/[0.045] px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Gross</p>
                        <p className="mt-1 text-sm font-black text-white">{formatUsd(grossTotal)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.045] px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Take</p>
                        <p className="mt-1 text-sm font-black text-white">{formatUsd(takeTotal)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.045] px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Rate</p>
                        <p className="mt-1 text-sm font-black text-white">{takeRate}</p>
                    </div>
                </div>
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/60">
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: CHART_PRIMARY }} /> Gross
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: CHART_ACCENT }} /> PXI take
                    </span>
                </div>
                {hover != null ? (
                    <span className="rounded-full bg-white/[0.065] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white/70 tabular-nums">
                        {shortDate(data[hover].key)} · gross {formatUsd(data[hover].gross)} · take {formatUsd(data[hover].take)}
                    </span>
                ) : null}
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="block h-auto w-full"
                    role="img"
                    aria-label="Daily gross revenue and PXI take"
                    onMouseMove={onMove}
                    onMouseLeave={() => setHover(null)}
                >
                    {[0.5, 1].map((f) => (
                        <line key={f} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                    ))}
                    <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <path d={path((d) => d.gross)} fill="none" stroke={CHART_PRIMARY} strokeWidth="2.4" strokeLinejoin="round" />
                    <path d={path((d) => d.take)} fill="none" stroke={CHART_ACCENT} strokeWidth="2.4" strokeLinejoin="round" />
                    {hover != null && (
                        <g pointerEvents="none">
                            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                            <circle cx={x(hover)} cy={y(data[hover].gross)} r="4" fill={CHART_PRIMARY} stroke="#18181b" strokeWidth="2" />
                            <circle cx={x(hover)} cy={y(data[hover].take)} r="4" fill={CHART_ACCENT} stroke="#18181b" strokeWidth="2" />
                        </g>
                    )}
                    <text x={PAD.left} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10">{shortDate(data[0]?.key)}</text>
                    <text x={W - PAD.right} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">{shortDate(data[data.length - 1]?.key)}</text>
                </svg>
            </div>
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
            setError(adminErrorMessage(err, 'Failed to load analytics'));
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin, days]);

    useEffect(() => {
        const timer = setTimeout(() => load(), 0);
        return () => clearTimeout(timer);
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
        <div className="max-w-7xl space-y-6 md:space-y-8">
            <AdminAnalyticsHero
                days={days}
                setDays={setDays}
                isLiveAdmin={isLiveAdmin}
                loading={loading}
                signups={signups}
                tickets={tickets}
                revenue={revenue}
            />

            {!isLiveAdmin && (
                <div className="rounded-2xl bg-white/[0.04] px-6 py-12 text-center text-sm text-white/50">
                    Live platform analytics requires a backend ADMIN account.
                </div>
            )}
            {error && (
                <div className="rounded-2xl bg-red-500/5 px-6 py-4 text-sm text-red-300">{error}</div>
            )}
            {isLiveAdmin && loading && (
                <div className="rounded-2xl bg-white/[0.04] px-6 py-12 text-center text-sm text-white/45">Loading...</div>
            )}

            {isLiveAdmin && !loading && data && (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Lifetime totals">
                        <StatTile label="Total users" value={formatInteger(data.totals.users)} />
                        <StatTile label="Tickets issued" value={formatInteger(data.totals.tickets)} hint={`${formatInteger(data.totals.events)} events`} />
                        <StatTile label="Lifetime gross" value={formatUsd(data.totals.lifetimeGrossCents)} hint={`${formatInteger(data.totals.lifetimePayments)} payments`} />
                        <StatTile label="Lifetime PXI take" value={formatUsd(data.totals.lifetimePxiCents)} hint={`${data.totals.openSupportTickets} open tickets · ${data.totals.pendingReports} pending reports`} />
                    </section>

                    <RevenueLines data={revenue} />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <DailyBars title="Signups per day" data={signups} color={CHART_PRIMARY} />
                        <DailyBars title="Event tickets issued per day" data={tickets} color={CHART_ACCENT} />
                    </div>
                </>
            )}
        </div>
    );
}
