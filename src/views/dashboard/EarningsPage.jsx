'use client';

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon, Calendar01Icon, ArrowRight02Icon, Loading02Icon, RefreshIcon, StarIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';
import SectionCard from '@/components/dashboard/SectionCard';
import { RechartsChart } from '@/components/dashboard/ChartFrame';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';

const BASE_URL = globalThis.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(cents) {
    return '$' + ((cents ?? 0) / 100).toFixed(2);
}

function splitMoney(cents) {
    const n = ((cents ?? 0) / 100).toFixed(2);
    const [whole, dec] = n.split('.');
    return { whole, dec };
}

function fmtDate(raw) {
    if (!raw) return '—';
    return new Date(raw).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function dollars(cents) {
    return (cents ?? 0) / 100;
}

function fmtCompact(cents) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(dollars(cents));
}

function fmtChartMoney(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

const FALLBACK_EVENT_ROWS = [
    { id: 'future-001', name: 'Friday Night PXI', date: '2026-06-14', gross: 184000, fee: 21400, net: 162600, adSpend: 18000, otherRevenue: 26000 },
    { id: 'future-002', name: 'Afrobeats Rooftop', date: '2026-06-21', gross: 142500, fee: 17100, net: 125400, adSpend: 14500, otherRevenue: 19500 },
    { id: 'future-003', name: 'Latin Room Pop-Up', date: '2026-06-28', gross: 116800, fee: 13800, net: 103000, adSpend: 9800, otherRevenue: 13400 },
    { id: 'future-004', name: 'After Hours Social', date: '2026-07-05', gross: 96400, fee: 11600, net: 84800, adSpend: 7200, otherRevenue: 10800 },
];

const FALLBACK_TIMELINE = [
    { month: 'Feb', revenue: 1840, projected: 1920 },
    { month: 'Mar', revenue: 2140, projected: 2260 },
    { month: 'Apr', revenue: 2360, projected: 2510 },
    { month: 'May', revenue: 2820, projected: 3020 },
    { month: 'Jun', revenue: 3160, projected: 3440 },
    { month: 'Jul', revenue: null, projected: 3720 },
];

function estimateAdSpend(gross, index) {
    if (!gross) return FALLBACK_EVENT_ROWS[index % FALLBACK_EVENT_ROWS.length].adSpend;
    return Math.max(6500, Math.round(gross * (0.07 + (index % 3) * 0.015)));
}

function estimateOtherRevenue(gross, index) {
    if (!gross) return FALLBACK_EVENT_ROWS[index % FALLBACK_EVENT_ROWS.length].otherRevenue;
    return Math.round(gross * (0.08 + (index % 2) * 0.025));
}

function getMonthLabel(raw) {
    const date = raw ? new Date(raw) : new Date();
    return date.toLocaleDateString('en-US', { month: 'short' });
}

function buildRevenueTimeline(payments, fallbackTotalCents) {
    if (!payments.length) return FALLBACK_TIMELINE;

    const byMonth = new Map();
    for (const payment of payments) {
        const key = getMonthLabel(payment.createdAt);
        byMonth.set(key, (byMonth.get(key) || 0) + dollars(payment.netPayout ?? payment.grossAmount ?? 0));
    }

    const rows = [...byMonth.entries()].map(([month, revenue]) => ({
        month,
        revenue,
        projected: Math.round(revenue * 1.12),
    }));
    const recentAverage = rows.reduce((sum, row) => sum + (row.revenue || 0), 0) / rows.length || dollars(fallbackTotalCents);
    const futureMonth = new Date();
    futureMonth.setMonth(futureMonth.getMonth() + 1);
    rows.push({
        month: futureMonth.toLocaleDateString('en-US', { month: 'short' }),
        revenue: null,
        projected: Math.round(recentAverage * 1.18),
    });
    return rows;
}

function buildFinanceModel(data) {
    const aggregates = data?.aggregates ?? {};
    const payments = data?.payments ?? [];
    const payouts = data?.payouts ?? [];
    const liveEventRows = new Map();

    for (const payment of payments) {
        const key = payment.eventId || payment.eventName || payment.id;
        if (!liveEventRows.has(key)) {
            liveEventRows.set(key, {
                id: key,
                name: payment.eventName || payment.event?.name || 'Ticket Sale',
                date: payment.createdAt,
                gross: 0,
                fee: 0,
                net: 0,
            });
        }
        const row = liveEventRows.get(key);
        row.gross += payment.grossAmount ?? 0;
        row.fee += (payment.consumerFee ?? 0) + (payment.vendorFlatFee ?? 0);
        row.net += payment.netPayout ?? 0;
    }

    const eventRows = Array.from(liveEventRows.values()).map((row, index) => ({
        ...row,
        adSpend: estimateAdSpend(row.gross, index),
        otherRevenue: estimateOtherRevenue(row.gross, index),
    }));
    const modeledEvents = eventRows.length ? eventRows : FALLBACK_EVENT_ROWS;

    const gross = aggregates.grossRevenue ?? modeledEvents.reduce((sum, event) => sum + event.gross, 0);
    const consumerFees = aggregates.consumerFeeDeducted ?? 0;
    const vendorFees = aggregates.vendorFlatFeeTotal ?? 0;
    const modeledFees = modeledEvents.reduce((sum, event) => sum + event.fee, 0);
    const totalFees = consumerFees + vendorFees || modeledFees;
    const net = aggregates.netPayout ?? modeledEvents.reduce((sum, event) => sum + event.net, 0);
    const adSpend = modeledEvents.reduce((sum, event) => sum + event.adSpend, 0);
    const otherRevenue = modeledEvents.reduce((sum, event) => sum + event.otherRevenue, 0);
    const paidPayouts = payouts.reduce((sum, payout) => {
        if (payout.status && payout.status !== 'paid') return sum;
        return sum + (payout.amount ?? 0);
    }, 0) || Math.round(net * 0.62);
    const adDrivenRevenue = Math.round(adSpend * 2.65);
    const netAfterCosts = net + otherRevenue - adSpend;

    const breakdownData = [
        { name: 'Ticket sales', value: dollars(gross) },
        { name: 'Ad return', value: dollars(adDrivenRevenue) },
        { name: 'Payouts', value: dollars(paidPayouts) },
        { name: 'Other streams', value: dollars(otherRevenue) },
    ];
    const eventComparisonData = modeledEvents.slice(0, 5).map((event) => ({
        name: event.name,
        gross: dollars(event.gross),
        net: dollars(event.net + event.otherRevenue - event.adSpend),
    }));
    const roasData = [
        { channel: 'SMS', return: 3.2 },
        { channel: 'Email', return: 2.8 },
        { channel: 'Feed', return: 2.1 },
        { channel: 'Discovery', return: 3.6 },
    ];
    const netAfterCostsData = [
        { name: 'Ticket sales', value: dollars(gross) },
        { name: 'Other', value: dollars(otherRevenue) },
        { name: 'Ad costs', value: -dollars(adSpend) },
        { name: 'Fees', value: -dollars(totalFees) },
        { name: 'Net', value: dollars(netAfterCosts) },
    ];

    return {
        payments,
        payouts,
        modeledEvents,
        gross,
        totalFees,
        adSpend,
        otherRevenue,
        netAfterCosts,
        revenueTimeline: buildRevenueTimeline(payments, gross),
        breakdownData,
        eventComparisonData,
        roasData,
        netAfterCostsData,
    };
}

function MoneyTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-black/90 px-3 py-2 text-xs shadow-2xl">
            {label ? <p className="mb-1 font-bold text-white">{label}</p> : null}
            <div className="space-y-1">
                {payload
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item) => (
                        <div key={`${item.name}-${item.dataKey}`} className="flex items-center justify-between gap-4">
                            <span className="text-zinc-400">{item.name}</span>
                            <span className="font-mono font-bold text-white">{fmtChartMoney(item.value)}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

function ReturnTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-black/90 px-3 py-2 text-xs shadow-2xl">
            <p className="mb-1 font-bold text-white">{label}</p>
            <p className="font-mono font-bold text-white">{Number(payload[0].value).toFixed(1)}x</p>
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function EarningsPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState(null);       // { aggregates, payments, payouts }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sseStatus, setSseStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'

    const esRef = useRef(null);
    const reconnectRef = useRef(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    // ── initial REST load ──────────────────────────────────────────────────
    const load = useCallback(() => {
        if (!user?.isVendor) return;
        setLoading(true);
        setError('');
        authService
            .getVendorDashboard()
            .then(setData)
            .catch(() => setError('Failed to load earnings. Please try again.'))
            .finally(() => setLoading(false));
    }, [user?.isVendor]);

    useEffect(() => {
        const timeout = setTimeout(load, 0);
        return () => clearTimeout(timeout);
    }, [load]);

    // ── SSE stream ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.isVendor) return;

        let active = true;

        const connect = () => {
            if (!active) return;
            const token = authStorage.getToken();
            if (!token) return;

            setSseStatus('connecting');
            const es = new EventSource(
                `${BASE_URL}/api/vendor/dashboard/stream?token=${encodeURIComponent(token)}`
            );
            esRef.current = es;

            es.onopen = () => {
                if (active) setSseStatus('connected');
            };

            // New ticket sale
            es.addEventListener('payment', (e) => {
                if (!active) return;
                try {
                    const { payment } = JSON.parse(e.data);
                    setData(prev => {
                        if (!prev) return prev;
                        // Deduplicate by id
                        if (prev.payments.some(p => p.id === payment.id)) return prev;
                        return {
                            ...prev,
                            payments: [payment, ...prev.payments],
                            aggregates: {
                                ...prev.aggregates,
                                grossRevenue:        prev.aggregates.grossRevenue        + payment.grossAmount,
                                consumerFeeDeducted: prev.aggregates.consumerFeeDeducted + payment.consumerFee,
                                vendorFlatFeeTotal:  prev.aggregates.vendorFlatFeeTotal  + payment.vendorFlatFee,
                                netPayout:           prev.aggregates.netPayout           + payment.netPayout,
                            },
                        };
                    });
                } catch { /* malformed frame — ignore */ }
            });

            // Payout settled / failed
            es.addEventListener('payout', (e) => {
                if (!active) return;
                try {
                    const { payout } = JSON.parse(e.data);
                    setData(prev => {
                        if (!prev) return prev;
                        const idx = prev.payouts.findIndex(p => p.id === payout.id);
                        const newPayouts = idx >= 0
                            ? prev.payouts.map((p, i) => (i === idx ? payout : p))
                            : [payout, ...prev.payouts];
                        return { ...prev, payouts: newPayouts };
                    });
                } catch { /* malformed frame — ignore */ }
            });

            es.onerror = () => {
                es.close();
                esRef.current = null;
                if (active) {
                    setSseStatus('disconnected');
                    // Retry after 5 s
                    reconnectRef.current = setTimeout(connect, 5000);
                }
            };
        };

        connect();

        return () => {
            active = false;
            esRef.current?.close();
            esRef.current = null;
            clearTimeout(reconnectRef.current);
            setSseStatus('disconnected');
        };
    }, [user?.isVendor]);

    const financeModel = useMemo(() => buildFinanceModel(data), [data]);

    // ─── non-vendor gate ──────────────────────────────────────────────────
    if (!mounted) {
        return <div className="max-w-6xl mx-auto space-y-12" />;
    }

    if (!user?.isVendor) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center">
                    <HugeiconsIcon icon={HelpCircleIcon} size={28} className="text-pxi-purple" />
                </div>
                <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Earnings</h1>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                    Your earnings dashboard will appear here once you become a verified vendor.
                </p>
                <Link
                    href="/dashboard/vendor-upgrade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                >
                    <HugeiconsIcon icon={StarIcon} size={14} />
                    Set Up Vendor Account
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                </Link>
            </div>
        );
    }

    // ─── derived numbers ──────────────────────────────────────────────────
    const {
        payouts,
        modeledEvents,
        gross,
        totalFees,
        adSpend,
        otherRevenue,
        netAfterCosts,
        revenueTimeline,
        breakdownData,
        eventComparisonData,
        roasData,
        netAfterCostsData,
    } = financeModel;
    const netMoney = splitMoney(netAfterCosts);
    const costTotal = totalFees + adSpend;
    const retainedPct = gross + otherRevenue > 0
        ? Math.max(0, Math.min(100, (netAfterCosts / (gross + otherRevenue)) * 100))
        : 0;

    // ─── render ───────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-12">

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Earnings</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-white/60" />
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/60">
                            {sseStatus === 'connected' ? 'Connected' : sseStatus === 'connecting' ? 'Connecting' : 'Offline'}
                        </span>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                        {loading ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" /> : <HugeiconsIcon icon={RefreshIcon} size={14} />}
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <HugeiconsIcon icon={Alert02Icon} size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            <section className="dashboard-surface overflow-hidden rounded-2xl">
                <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_1.4fr] md:p-7">
                    <div className="flex flex-col justify-between gap-7">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">Net earned</p>
                            {loading ? (
                                <div className="mt-4 h-11 w-44 animate-pulse rounded-xl bg-white/5" />
                            ) : (
                                <div className="mt-3 text-4xl font-black leading-none tracking-tighter text-white md:text-5xl">
                                    ${netMoney.whole}<span className="ml-1 text-lg font-semibold text-white/40">.{netMoney.dec}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                                <div className="h-full rounded-full bg-white/80 transition-all duration-700" style={{ width: `${retainedPct}%` }} />
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                    <p className="font-mono font-bold text-white">{fmtCompact(gross)}</p>
                                    <p className="mt-1 text-zinc-500">Sales</p>
                                </div>
                                <div>
                                    <p className="font-mono font-bold text-white">{fmtCompact(otherRevenue)}</p>
                                    <p className="mt-1 text-zinc-500">Other</p>
                                </div>
                                <div>
                                    <p className="font-mono font-bold text-white">{fmtCompact(costTotal)}</p>
                                    <p className="mt-1 text-zinc-500">Costs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <RechartsChart className="h-[260px]">
                        {(charts) =>
                            createElement(
                                charts.ResponsiveContainer,
                                { width: '100%', height: '100%' },
                                createElement(
                                    charts.ComposedChart,
                                    { data: revenueTimeline, margin: { top: 12, right: 8, bottom: 0, left: -12 } },
                                    createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', vertical: false }),
                                    createElement(charts.XAxis, { dataKey: 'month', axisLine: false, tickLine: false, tick: { fill: 'rgba(255,255,255,0.45)', fontSize: 11 } }),
                                    createElement(charts.YAxis, { axisLine: false, tickLine: false, tickFormatter: fmtChartMoney, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 }, width: 54 }),
                                    createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(MoneyTooltip) }),
                                    createElement(charts.Area, { type: 'monotone', dataKey: 'revenue', name: 'Revenue', stroke: getDashboardChartShade(1), fill: 'rgba(212,212,216,0.18)', strokeWidth: 2, connectNulls: true }),
                                    createElement(charts.Line, { type: 'monotone', dataKey: 'projected', name: 'Projected', stroke: getDashboardChartShade(0), strokeWidth: 2, strokeDasharray: '5 5', dot: false })
                                )
                            )
                        }
                    </RechartsChart>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Revenue breakdown">
                    <RechartsChart className="h-[260px]">
                        {(charts) =>
                            createElement(
                                charts.ResponsiveContainer,
                                { width: '100%', height: '100%' },
                                createElement(
                                    charts.BarChart,
                                    { data: breakdownData, layout: 'vertical', margin: { top: 8, right: 12, bottom: 0, left: 10 } },
                                    createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', horizontal: false }),
                                    createElement(charts.XAxis, { type: 'number', axisLine: false, tickLine: false, tickFormatter: fmtChartMoney, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 } }),
                                    createElement(charts.YAxis, { type: 'category', dataKey: 'name', axisLine: false, tickLine: false, width: 96, tick: { fill: 'rgba(255,255,255,0.55)', fontSize: 11 } }),
                                    createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(MoneyTooltip) }),
                                    createElement(
                                        charts.Bar,
                                        { dataKey: 'value', name: 'Amount', radius: [0, 8, 8, 0] },
                                        breakdownData.map((entry, index) => createElement(charts.Cell, { key: entry.name, fill: getDashboardChartShade(index) }))
                                    )
                                )
                            )
                        }
                    </RechartsChart>
                </SectionCard>

                <SectionCard title="Per-event comparison">
                    <RechartsChart className="h-[260px]">
                        {(charts) =>
                            createElement(
                                charts.ResponsiveContainer,
                                { width: '100%', height: '100%' },
                                createElement(
                                    charts.BarChart,
                                    { data: eventComparisonData, margin: { top: 8, right: 8, bottom: 0, left: -10 } },
                                    createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', vertical: false }),
                                    createElement(charts.XAxis, { dataKey: 'name', axisLine: false, tickLine: false, interval: 0, tick: { fill: 'rgba(255,255,255,0.48)', fontSize: 10 } }),
                                    createElement(charts.YAxis, { axisLine: false, tickLine: false, tickFormatter: fmtChartMoney, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 }, width: 54 }),
                                    createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(MoneyTooltip) }),
                                    createElement(charts.Bar, { dataKey: 'gross', name: 'Sales', fill: getDashboardChartShade(2), radius: [8, 8, 0, 0] }),
                                    createElement(charts.Bar, { dataKey: 'net', name: 'Net', fill: getDashboardChartShade(0), radius: [8, 8, 0, 0] })
                                )
                            )
                        }
                    </RechartsChart>
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Return on ad spend">
                    <RechartsChart className="h-[240px]">
                        {(charts) =>
                            createElement(
                                charts.ResponsiveContainer,
                                { width: '100%', height: '100%' },
                                createElement(
                                    charts.BarChart,
                                    { data: roasData, layout: 'vertical', margin: { top: 8, right: 12, bottom: 0, left: 10 } },
                                    createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', horizontal: false }),
                                    createElement(charts.XAxis, { type: 'number', axisLine: false, tickLine: false, tickFormatter: (value) => `${value}x`, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 } }),
                                    createElement(charts.YAxis, { type: 'category', dataKey: 'channel', axisLine: false, tickLine: false, width: 82, tick: { fill: 'rgba(255,255,255,0.55)', fontSize: 11 } }),
                                    createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(ReturnTooltip) }),
                                    createElement(
                                        charts.Bar,
                                        { dataKey: 'return', name: 'Return', radius: [0, 8, 8, 0] },
                                        roasData.map((entry, index) => createElement(charts.Cell, { key: entry.channel, fill: getDashboardChartShade(index + 1) }))
                                    )
                                )
                            )
                        }
                    </RechartsChart>
                </SectionCard>

                <SectionCard title="Net after costs">
                    <RechartsChart className="h-[240px]">
                        {(charts) =>
                            createElement(
                                charts.ResponsiveContainer,
                                { width: '100%', height: '100%' },
                                createElement(
                                    charts.BarChart,
                                    { data: netAfterCostsData, margin: { top: 8, right: 8, bottom: 0, left: -8 } },
                                    createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', vertical: false }),
                                    createElement(charts.XAxis, { dataKey: 'name', axisLine: false, tickLine: false, tick: { fill: 'rgba(255,255,255,0.5)', fontSize: 11 } }),
                                    createElement(charts.YAxis, { axisLine: false, tickLine: false, tickFormatter: fmtChartMoney, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 }, width: 54 }),
                                    createElement(charts.ReferenceLine, { y: 0, stroke: 'rgba(255,255,255,0.14)' }),
                                    createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(MoneyTooltip) }),
                                    createElement(
                                        charts.Bar,
                                        { dataKey: 'value', name: 'Amount', radius: [8, 8, 8, 8] },
                                        netAfterCostsData.map((entry, index) => createElement(charts.Cell, {
                                            key: entry.name,
                                            fill: entry.value < 0 ? 'rgba(239,68,68,0.72)' : getDashboardChartShade(index),
                                        }))
                                    )
                                )
                            )
                        }
                    </RechartsChart>
                </SectionCard>
            </div>

            <SectionCard title="Event totals" dense>
                <div className="-mx-5 overflow-x-auto px-5">
                    <table className="w-full min-w-[620px] text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35">Event</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35">Date</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35">Sales</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35">Costs</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35">Net</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {modeledEvents.map((event) => (
                                <tr key={event.id} className="text-sm">
                                    <td className="px-4 py-4 font-bold text-white">{event.name}</td>
                                    <td className="px-4 py-4 font-mono text-white/45">{fmtDate(event.date)}</td>
                                    <td className="px-4 py-4 font-mono font-semibold text-white">{fmt(event.gross)}</td>
                                    <td className="px-4 py-4 font-mono font-semibold text-red-300">-{fmt(event.fee + event.adSpend)}</td>
                                    <td className="px-4 py-4 font-mono font-semibold text-white">{fmt(event.net + event.otherRevenue - event.adSpend)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            <SectionCard title="Payout history">
                <div className="overflow-x-auto -mx-6 px-6">
                    {loading ? (
                        <div className="px-5 py-10 flex items-center justify-center"><HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin text-zinc-600" /></div>
                    ) : payouts.length === 0 ? (
                        <div className="px-5 py-10 text-center text-zinc-600 text-sm">No payouts yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Date</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Amount</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Destination</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5 text-[14px] font-mono font-medium text-white/50 flex items-center">
                                            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 mr-3 opacity-50" /> {fmtDate(p.arrivalDate ?? p.createdAt)}
                                        </td>
                                        <td className="px-6 py-5 text-[15px] font-mono font-bold text-white">{fmt(p.amount)}</td>
                                        <td className="px-6 py-5 text-[14px] font-mono font-medium text-white/50">
                                            {p.stripePayoutId ? `Stripe • ${String(p.stripePayoutId).slice(-6)}` : 'Stripe'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                p.status === 'paid'
                                                    ? 'bg-white/10 text-white border-white/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {p.status === 'paid' ? 'Cleared' : 'Failed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
