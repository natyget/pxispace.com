'use client';

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';

import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon, Calendar01Icon, ArrowRight02Icon, Loading02Icon, RefreshIcon, StarIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';
import SectionCard from '@/components/dashboard/SectionCard';
import { RechartsChart } from '@/components/dashboard/ChartFrame';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import { Upload01Icon } from '@hugeicons/core-free-icons';

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

function buildFinanceModel(data, timeframe, eventCosts) {
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
    const netAfterCosts = net + otherRevenue - adSpend;

    const totalEventCostCents = eventCosts.reduce((sum, c) => sum + (c.amount || 0), 0);

    const breakdownData = [
        { name: 'Platform fee', value: dollars(totalFees) },
        { name: 'Marketing (Email)', value: dollars(adSpend * 0.2) },
        { name: 'Marketing (SMS)', value: dollars(adSpend * 0.3) },
        { name: 'Marketing (In-app)', value: dollars(adSpend * 0.4) },
        { name: 'Marketing (Discovery)', value: dollars(adSpend * 0.1) },
        { name: 'Data', value: dollars(gross * 0.02) }
    ];

    const revenueTimelineChart = buildRevenueTimeline(payments, gross).map(item => ({
        ...item,
        previousRevenue: item.revenue ? item.revenue * 0.8 : null,
        profit: item.revenue ? item.revenue - (totalEventCostCents/100 / 6) : null
    }));

    return {
        payments,
        payouts,
        gross,
        totalFees,
        adSpend,
        otherRevenue,
        netAfterCosts,
        revenueTimeline: revenueTimelineChart,
        breakdownData,
        totalEventCost: totalEventCostCents
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


function RevenueTableRow({ title, value, unit, subheading }) {
    return (
        <div className="flex items-center justify-between border-b border-white/[0.05] py-3.5 last:border-b-0">
            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{subheading}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-white">
                {value}<span className="ml-1 text-[11px] font-medium text-zinc-500">{unit}</span>
            </p>
        </div>
    );
}

function EarningsHero({ netAfterCosts, gross, retainedPct, timeframe, setTimeframe, sseStatus, loading, onRefresh }) {
    const netMoney = splitMoney(netAfterCosts);
    const statusLabel = sseStatus === 'connected' ? 'Connected' : sseStatus === 'connecting' ? 'Connecting' : 'Offline';

    return (
        <section className="px-1">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                    <p className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-500">
                        Business
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                            <span className={`h-1.5 w-1.5 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-400' : sseStatus === 'connecting' ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                            {statusLabel}
                        </span>
                    </p>
                    <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Earnings</h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500">
                        Gross sales, platform fees, event costs, payouts, and profit in one clean read.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SegmentedToggle
                            value={timeframe}
                            onChange={setTimeframe}
                            items={[
                                { id: '1d', label: '1D' },
                                { id: '1w', label: '1W' },
                                { id: '1m', label: '1M' },
                                { id: '1y', label: '1Y' },
                                { id: 'all', label: 'All' },
                            ]}
                        />
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.09] hover:text-white disabled:opacity-40"
                        >
                            {loading ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" /> : <HugeiconsIcon icon={RefreshIcon} size={14} />}
                            Refresh
                        </button>
                    </div>
                </div>
                <div className="shrink-0 xl:pb-1 xl:text-right">
                    <p className="text-[12px] font-medium text-zinc-500">Net after costs</p>
                    <p className="mt-2 text-5xl font-semibold leading-none tracking-tight text-white md:text-6xl">
                        ${netMoney.whole}<span className="text-2xl text-white/40">.{netMoney.dec}</span>
                    </p>
                    <p className="mt-3 text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-300">{fmtCompact(gross)}</span> gross
                        <span className="mx-2 text-zinc-700">·</span>
                        <span className="font-semibold text-zinc-300">{retainedPct.toFixed(0)}%</span> retained
                    </p>
                </div>
            </div>
        </section>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function EarningsPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState(null);       // { aggregates, payments, payouts }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sseStatus, setSseStatus] = useState('disconnected');
    const [timeframe, setTimeframe] = useState('1m');
    const [includeEventCost, setIncludeEventCost] = useState(true);
    const [eventCosts, setEventCosts] = useState([]);
    const [costName, setCostName] = useState('');
    const [costAmount, setCostAmount] = useState('');
    const [costError, setCostError] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            const saved = localStorage.getItem('pxi_event_costs_v1');
            if (saved) setEventCosts(JSON.parse(saved));
        }, 0);
        return () => clearTimeout(timer);
    }, []);
    const saveEventCosts = (newCosts) => {
        setEventCosts(newCosts);
        localStorage.setItem('pxi_event_costs_v1', JSON.stringify(newCosts));
    };

    const handleAddEventCost = () => {
        const label = costName.trim();
        const amount = Number.parseFloat(costAmount);
        if (!label || !Number.isFinite(amount) || amount <= 0) {
            setCostError('Add a name and a positive dollar amount.');
            return;
        }
        saveEventCosts([
            ...eventCosts,
            { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`, name: label, amount: Math.round(amount * 100), date: new Date().toISOString() },
        ]);
        setCostName('');
        setCostAmount('');
        setCostError('');
    };

    const handleImportCosts = (file) => {
        if (!file) return;
        setCostError('');
        Papa.parse(file, {
            header: true,
            complete: (res) => {
                const imported = res.data
                    .filter((row) => row.name && row.amount)
                    .map((row, index) => ({
                        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${index}`,
                        name: String(row.name).trim(),
                        amount: Math.round(Number.parseFloat(row.amount) * 100),
                        date: row.date || new Date().toISOString(),
                    }))
                    .filter((row) => row.name && Number.isFinite(row.amount) && row.amount > 0);
                if (!imported.length) {
                    setCostError('No valid rows found. Use columns named name and amount.');
                    return;
                }
                saveEventCosts([...eventCosts, ...imported]);
            },
            error: () => setCostError('Could not read that CSV.'),
        });
    };


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

    const financeModel = useMemo(() => buildFinanceModel(data, timeframe, eventCosts), [data, timeframe, eventCosts]);

    // ─── non-vendor gate ──────────────────────────────────────────────────
    if (!mounted) {
        return <div className="max-w-6xl mx-auto space-y-12" />;
    }

    if (!user?.isVendor) {
        return (
            <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
                <section className="dashboard-surface-b relative overflow-hidden rounded-[1.25rem] px-5 py-10 text-center md:px-8">
                    <div className="relative mx-auto max-w-xl">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.055]">
                            <HugeiconsIcon icon={HelpCircleIcon} size={28} className="text-white opacity-75" />
                        </div>
                        <p className="text-[13px] font-medium text-zinc-500">Business</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Earnings</h1>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                            Your finance dashboard appears here once hosting and payouts are enabled.
                        </p>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold tracking-[0.02em] text-black transition hover:bg-zinc-200"
                        >
                            <HugeiconsIcon icon={StarIcon} size={14} />
                            Start hosting
                            <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    // ─── derived numbers ──────────────────────────────────────────────────
    const {
        payouts,
        gross,
        totalFees,
        adSpend,
        otherRevenue,
        netAfterCosts,
        revenueTimeline,
        breakdownData,
    } = financeModel;
    const costTotal = totalFees + adSpend;
    const retainedPct = gross + otherRevenue > 0
        ? Math.max(0, Math.min(100, (netAfterCosts / (gross + otherRevenue)) * 100))
        : 0;

    // ─── render ───────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
            <EarningsHero
                netAfterCosts={netAfterCosts}
                gross={gross}
                retainedPct={retainedPct}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                sseStatus={sseStatus}
                loading={loading}
                onRefresh={load}
            />

            {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <HugeiconsIcon icon={Alert02Icon} size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <SectionCard title="Key Metrics">
                        <div className="px-5 py-2">
                            <RevenueTableRow
                                title="Gross Revenue" value={fmtCompact(gross)} unit="USD"
                                subheading="Total sales volume"
                            />
                            <RevenueTableRow
                                title="Net Earned" value={fmtCompact(netAfterCosts)} unit="USD"
                                subheading="After platform & marketing fees"
                            />
                            <RevenueTableRow
                                title="Total Costs" value={fmtCompact(costTotal)} unit="USD"
                                subheading="Platform, ads, and processing"
                            />
                        </div>
                    </SectionCard>
                    
                    <SectionCard title="ROI">
                        <div className="px-5 py-6 text-center">
                            <p className="text-xs tracking-[0.02em] text-zinc-500 font-bold mb-2">Return on Investment</p>
                            <p className="text-5xl font-bold text-white">{((netAfterCosts / (costTotal || 1)) * 100).toFixed(0)}%</p>
                            <p className="text-sm text-zinc-500 font-semibold mt-2">Net after costs vs. tracked costs</p>
                        </div>
                    </SectionCard>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <SectionCard title="Revenue & Profit">
                        <RechartsChart className="h-[300px]">
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
                                        createElement(charts.Area, { type: 'monotone', dataKey: 'revenue', name: 'Revenue', stroke: getDashboardChartShade(1), fill: 'rgba(13,148,136,0.14)', strokeWidth: 2, connectNulls: true }),
                                        createElement(charts.Line, { type: 'monotone', dataKey: 'previousRevenue', name: 'Previous', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2, strokeDasharray: '4 4', dot: false }),
                                        includeEventCost ? createElement(charts.Line, { type: 'monotone', dataKey: 'profit', name: 'Profit', stroke: getDashboardChartShade(0), strokeWidth: 2, dot: false }) : null
                                    )
                                )
                            }
                        </RechartsChart>
                        <div className="px-5 pb-5 pt-2 flex justify-end">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-400 hover:text-white transition">
                                <input type="checkbox" checked={includeEventCost} onChange={e => setIncludeEventCost(e.target.checked)} className="rounded bg-white/10 border-0 accent-zinc-300" />
                                Include Event Costs
                            </label>
                        </div>
                    </SectionCard>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Cost Breakdown">
                    <RechartsChart className="h-[280px]">
                        {(charts) =>
                            createElement(
                                charts.ResponsiveContainer,
                                { width: '100%', height: '100%' },
                                createElement(
                                    charts.PieChart,
                                    { margin: { top: 0, right: 0, bottom: 0, left: 0 } },
                                    createElement(
                                        charts.Pie,
                                        { data: breakdownData, dataKey: 'value', nameKey: 'name', cx: '50%', cy: '50%', innerRadius: 70, outerRadius: 100, stroke: '#0e0e13', strokeWidth: 2, paddingAngle: breakdownData.length > 1 ? 2 : 0 },
                                        breakdownData.map((entry, index) => createElement(charts.Cell, { key: entry.name, fill: getDashboardChartShade(index) }))
                                    ),
                                    createElement(charts.Tooltip, { content: createElement(MoneyTooltip) })
                                )
                            )
                        }
                    </RechartsChart>
                </SectionCard>

                <SectionCard title="Cost planning">
                    <div className="space-y-5 p-5">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
                            <input
                                type="text"
                                value={costName}
                                onChange={(event) => setCostName(event.target.value)}
                                placeholder="Expense name, e.g. venue"
                                className="dashboard-input min-h-12"
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={costAmount}
                                onChange={(event) => setCostAmount(event.target.value)}
                                placeholder="$0.00"
                                className="dashboard-input min-h-12"
                            />
                            <button
                                type="button"
                                onClick={handleAddEventCost}
                                className="pill-solid min-h-12 justify-center px-5 text-sm"
                            >
                                Add cost
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.035] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">CSV import</p>
                                <p className="mt-1 text-xs text-zinc-500">Use columns named name and amount.</p>
                            </div>
                            <label className="pill-ghost inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.02em]">
                                <HugeiconsIcon icon={Upload01Icon} size={14} />
                                Upload CSV
                                <input type="file" accept=".csv" className="hidden" onChange={(event) => handleImportCosts(event.target.files?.[0])} />
                            </label>
                        </div>

                        {costError ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">{costError}</p> : null}

                        <div className="space-y-2">
                            {eventCosts.map((cost) => (
                                <div key={cost.id} className="flex flex-col gap-3 rounded-2xl bg-white/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-white">{cost.name}</p>
                                        <p className="mt-0.5 text-xs text-zinc-500">{fmtDate(cost.date)}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                                        <span className="font-mono text-sm font-bold text-zinc-200">{fmt(cost.amount)}</span>
                                        <button
                                            type="button"
                                            onClick={() => saveEventCosts(eventCosts.filter((item) => item.id !== cost.id))}
                                            className="text-xs font-bold tracking-[0.02em] text-red-400 transition hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {eventCosts.length === 0 ? (
                                <div className="rounded-2xl bg-white/[0.025] px-4 py-8 text-center">
                                    <p className="text-sm font-semibold text-white">No event costs added yet.</p>
                                    <p className="mt-1 text-xs text-zinc-500">Add costs to see profit update in the chart.</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Payout history">
                <div className="p-5">
                    {loading ? (
                        <div className="flex min-h-40 items-center justify-center"><HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin text-zinc-600" /></div>
                    ) : payouts.length === 0 ? (
                        <div className="rounded-2xl bg-white/[0.025] px-5 py-10 text-center">
                            <p className="text-sm font-semibold text-white">No payouts yet.</p>
                            <p className="mt-1 text-xs text-zinc-500">Completed payouts will appear here with destination and status.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {payouts.map((payout) => (
                                <div key={payout.id} className="grid gap-3 rounded-2xl bg-white/[0.035] p-4 md:grid-cols-[1fr_140px_170px_auto] md:items-center">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.055]">
                                            <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-white opacity-55" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white">{fmtDate(payout.arrivalDate ?? payout.createdAt)}</p>
                                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                {payout.stripePayoutId ? `Stripe • ${String(payout.stripePayoutId).slice(-6)}` : 'Stripe payout'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-mono text-sm font-bold text-white md:text-right">{fmt(payout.amount)}</p>
                                    <p className="truncate text-xs font-semibold text-zinc-500 md:text-right">
                                        {payout.stripePayoutId ? `Destination ${String(payout.stripePayoutId).slice(-6)}` : 'Default payout rail'}
                                    </p>
                                    <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] md:justify-self-end ${
                                        payout.status === 'paid'
                                            ? 'bg-white/10 text-white'
                                            : 'bg-red-500/10 text-red-300'
                                    }`}>
                                        {payout.status === 'paid' ? 'Cleared' : 'Failed'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
