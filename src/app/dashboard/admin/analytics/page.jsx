'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminStats, fetchPlatformAnalytics } from '@/services/admin';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { adminErrorMessage } from '@/components/admin/adminFormat';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { DataTable, EmptyState, Notice, PageHeader, Panel, Skeleton, WordTabs } from '@/components/dashboard/ui/kit';
import { count, money } from '@/lib/dashFormat';

import { getDashboardChartShade } from '@/components/dashboard/chartStyles';

const CHART_PRIMARY = getDashboardChartShade(0);
const CHART_ACCENT = getDashboardChartShade(1);

const RANGES = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 90, label: '90 days' },
];

function dayKey(d) {
    return new Date(d).toISOString().slice(0, 10);
}

function shortDay(key) {
    const d = new Date(`${key}T00:00:00Z`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function percentOf(part, whole) {
    return whole > 0 ? `${(Math.round((part / whole) * 1000) / 10).toFixed(1)}%` : '-';
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
        <Panel
            title={title}
            subtitle={`${daysWithActivity} active days, ${format(total)} total`}
            action={
                <span className="text-[13px] tabular-nums text-white/55">
                    {hover != null ? `${shortDay(data[hover].key)}, ${format(data[hover].value)}` : `Peak ${format(max)}`}
                </span>
            }
        >
            <div className="rounded-2xl bg-pxi-field p-3">
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
                    <text x={PAD.left} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10">{shortDay(data[0]?.key)}</text>
                    <text x={W - PAD.right} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">{shortDay(data[data.length - 1]?.key)}</text>
                </svg>
            </div>
        </Panel>
    );
}

/**
 * Two-line revenue chart with crosshair hover + legend.
 *
 * Gross is ticket FACE VALUE (GMV), what organizers priced tickets at. PXI revenue
 * is what the company actually keeps: the $0.99 flat fee off each payout plus the
 * 5.49% buyer service fee, minus credits burned. The buyer's card charge and Stripe's
 * cut are shown as money movement beneath, never as revenue.
 */
function RevenueLines({ data, rangeTabs }) {
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
        <Panel title="Revenue" subtitle="Ticket sales against what PXI keeps.">
            {rangeTabs}
            <div className="mb-3 mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/60">
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: CHART_PRIMARY }} /> Ticket sales
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: CHART_ACCENT }} /> PXI revenue
                    </span>
                </div>
                {hover != null ? (
                    <span className="text-[13px] tabular-nums text-white/70">
                        {shortDay(data[hover].key)}, sales {money(data[hover].gross)}, PXI {money(data[hover].take)}
                    </span>
                ) : null}
            </div>
            <div className="rounded-2xl bg-pxi-field p-3">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="block h-auto w-full"
                    role="img"
                    aria-label="Daily ticket face value and PXI revenue"
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
                            <circle cx={x(hover)} cy={y(data[hover].gross)} r="4" fill={CHART_PRIMARY} stroke="#2e2e2e" strokeWidth="2" />
                            <circle cx={x(hover)} cy={y(data[hover].take)} r="4" fill={CHART_ACCENT} stroke="#2e2e2e" strokeWidth="2" />
                        </g>
                    )}
                    <text x={PAD.left} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10">{shortDay(data[0]?.key)}</text>
                    <text x={W - PAD.right} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">{shortDay(data[data.length - 1]?.key)}</text>
                </svg>
            </div>
        </Panel>
    );
}

/** The money, this range and for all time, side by side. On phones each number carries its label. */
function MoneyTable({ rows, rangeLabel }) {
    const cell = (label, value) => (
        <div className="flex items-baseline justify-between gap-3 md:block">
            <span className="text-[12px] text-white/40 md:hidden">{label}</span>
            <span className="text-[14px] tabular-nums text-white">{value}</span>
        </div>
    );
    const columns = [
        { key: 'label', label: 'Money', render: (row) => <span className="text-[14px] font-semibold text-white">{row.label}</span> },
        { key: 'range', label: rangeLabel, width: '130px', align: 'right', render: (row) => cell(rangeLabel, row.range) },
        { key: 'lifetime', label: 'All time', width: '130px', align: 'right', render: (row) => cell('All time', row.lifetime) },
    ];
    return <DataTable columns={columns} rows={rows} rowKey="label" />;
}

export default function AdminAnalyticsPage() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLive: isLiveAdmin, cityScope } = useAdminMode();

    const load = useCallback(async () => {
        if (!isLiveAdmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // The organizer and upcoming-event counts come from the platform stats; a miss there only costs two hints.
            const [res, platform] = await Promise.all([fetchPlatformAnalytics(days), fetchAdminStats().catch(() => null)]);
            setData(res);
            setStats(platform);
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
    // gross = ticket face value (GMV), take = PXI's actual revenue ($0.99 + 5.49% − credits)
    // buyerPaid/processing = money that moved through Stripe, never PXI revenue.
    const revenue = useMemo(
        () =>
            data
                ? fillDays(data.days, data.series.revenue, (r) => ({
                      gross: r?.grossCents ?? 0,
                      take: r?.pxiCents ?? 0,
                      buyerPaid: r?.buyerPaidCents ?? 0,
                      processing: r?.processingCents ?? 0,
                      payout: r?.payoutCents ?? 0,
                  })).map((d) => ({ key: d.key, ...d.value }))
                : [],
        [data]
    );

    // PART-4: a city-scoped admin gets users, tickets and events for their city; money is withheld.
    const revenueWithheld = Boolean(data?.withheld?.includes('revenue'));

    // The platform numbers, most important first: people, events, tickets and what PXI keeps.
    const kpis = useMemo(() => {
        if (!data) return null;
        const items = [
            {
                label: data.cityScope ? `Users in ${cityLabel(data.cityScope)}` : 'Users',
                value: count(data.totals.users),
                hint: stats?.users ? `${count(stats.users.vendor)} organizers` : undefined,
            },
            { label: 'Events', value: count(data.totals.events), hint: stats?.events ? `${count(stats.events.upcoming)} upcoming` : undefined },
            { label: 'Tickets', value: count(data.totals.tickets), hint: 'Issued' },
        ];
        if (!revenueWithheld) {
            items.push({
                label: 'PXI revenue',
                value: money(data.totals.lifetimePxiCents),
                tone: 'purple',
                hint: Number(data.totals.lifetimeGrossCents || 0) > 0
                    ? `${percentOf(Number(data.totals.lifetimePxiCents || 0), Number(data.totals.lifetimeGrossCents || 0))} of sales`
                    : undefined,
            });
        }
        return items;
    }, [data, stats, revenueWithheld]);

    const rangeLabel = `${days} days`;
    const rangeGross = sumValues(revenue, 'gross');
    const rangeTake = sumValues(revenue, 'take');
    const moneyRows = data && !revenueWithheld
        ? [
              { label: 'Ticket sales', range: money(rangeGross), lifetime: money(data.totals.lifetimeGrossCents) },
              { label: 'PXI revenue', range: money(rangeTake), lifetime: money(data.totals.lifetimePxiCents) },
              {
                  label: 'Share kept by PXI',
                  range: percentOf(rangeTake, rangeGross),
                  lifetime: percentOf(Number(data.totals.lifetimePxiCents || 0), Number(data.totals.lifetimeGrossCents || 0)),
              },
              { label: 'Charged to buyers', range: money(sumValues(revenue, 'buyerPaid')), lifetime: money(data.totals.lifetimeBuyerPaidCents) },
              { label: 'Stripe processing', range: money(sumValues(revenue, 'processing')), lifetime: money(data.totals.lifetimeProcessingCents) },
              { label: 'Paid to organizers', range: money(sumValues(revenue, 'payout')), lifetime: money(data.totals.lifetimePayoutCents) },
          ]
        : [];

    const rangeTabs = (
        <WordTabs
            items={RANGES.map((range) => ({ key: String(range.days), label: range.label }))}
            value={String(days)}
            onChange={(key) => setDays(Number(key))}
        />
    );

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader
                title={cityScope && isLiveAdmin ? `${cityLabel(cityScope)} analytics` : 'Analytics'}
                kpis={isLiveAdmin ? kpis : null}
            />

            {!isLiveAdmin ? <EmptyState title="Live analytics needs a PXI admin account" /> : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            {isLiveAdmin && loading && !data ? (
                <div className="space-y-5 md:space-y-6">
                    <Skeleton className="h-[360px]" />
                    <Skeleton className="h-[260px]" />
                </div>
            ) : null}

            {isLiveAdmin && data ? (
                <>
                    {revenueWithheld ? (
                        <>
                            {rangeTabs}
                            <Notice>Revenue, support and report figures are not shown to city admins.</Notice>
                        </>
                    ) : (
                        <>
                            <RevenueLines data={revenue} rangeTabs={rangeTabs} />
                            <Panel title="Money movement" subtitle="Stripe processing passes straight through. PXI keeps none of it.">
                                <MoneyTable rows={moneyRows} rangeLabel={rangeLabel} />
                            </Panel>
                        </>
                    )}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DailyBars title="Signups per day" data={signups} color={CHART_PRIMARY} />
                        <DailyBars title="Tickets issued per day" data={tickets} color={CHART_ACCENT} />
                    </div>
                </>
            ) : null}
        </div>
    );
}
