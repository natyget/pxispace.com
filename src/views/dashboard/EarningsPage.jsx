'use client';

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon, Calendar01Icon, ArrowRight02Icon, Loading02Icon, RefreshIcon, StarIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';
import SectionCard from '@/components/dashboard/SectionCard';
import BudgetPanel from '@/components/dashboard/BudgetPanel';
import { RechartsChart } from '@/components/dashboard/ChartFrame';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { useEvents } from '@/lib/dashboardStore';
import { getBudgetSummary } from '@/services/budget';

// `process.env.NEXT_PUBLIC_*` verbatim — Next inlines this form only. Written as
// `globalThis.process?.env?.X` it is never substituted, resolves to undefined in the
// browser, and silently falls through to the localhost default in production.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(cents) {
    return '$' + ((cents ?? 0) / 100).toFixed(2);
}

function splitMoney(cents) {
    const negative = (cents ?? 0) < 0;
    const n = (Math.abs(cents ?? 0) / 100).toFixed(2);
    const [whole, dec] = n.split('.');
    return { whole: `${negative ? '-' : ''}${whole}`, dec };
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

const CATEGORY_LABELS = {
    STAFF: 'Staff',
    VENUE: 'Venue',
    VENDOR: 'Vendor',
    MARKETING: 'Marketing (logged)',
    EQUIPMENT: 'Equipment',
    OTHER: 'Other',
};

/**
 * Ticket face value for one payment — the organizer's gross revenue.
 *
 * `grossAmount` on the row is the BUYER's card charge: face value plus the 5.49%
 * service fee and Stripe's processing cost, neither of which is the organizer's
 * money. Face value comes back exactly as payout + the flat fee taken off it.
 * Mirrors PXIStudio-App/src/lib/paymentRevenue.ts.
 */
function faceValueCents(payment) {
    return (payment?.netPayout ?? 0) + (payment?.vendorFlatFee ?? 0);
}

/** Real monthly gross/net series from payment timestamps — no projections, no estimates. */
function buildMonthlySeries(payments) {
    const byMonth = new Map();
    for (const payment of payments) {
        const date = new Date(payment.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const entry = byMonth.get(key) || { key, gross: 0, net: 0 };
        entry.gross += dollars(faceValueCents(payment));
        entry.net += dollars(payment.netPayout);
        byMonth.set(key, entry);
    }
    return [...byMonth.values()]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((entry) => ({
            ...entry,
            month: new Date(`${entry.key}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        }));
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

function RevenueTableRow({ title, value, unit, subheading, emphasize = false }) {
    return (
        <div className="flex items-center justify-between border-b border-white/[0.05] py-3.5 last:border-b-0">
            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{subheading}</p>
            </div>
            <p className={`text-sm font-semibold tabular-nums ${emphasize ? 'text-emerald-300' : 'text-white'}`}>
                {value}<span className="ml-1 text-[11px] font-medium text-zinc-500">{unit}</span>
            </p>
        </div>
    );
}

function EarningsHero({ heroValue, heroLabel, gross, retainedPct, retainedLabel, sseStatus, loading, onRefresh, includeCosts, onToggleCosts }) {
    const heroMoney = splitMoney(heroValue);
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
                        Ticket face value, the $0.99 platform fee, event costs, marketing spend, payouts, and profit — all real numbers.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.09] hover:text-white disabled:opacity-40"
                        >
                            {loading ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" /> : <HugeiconsIcon icon={RefreshIcon} size={14} />}
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={onToggleCosts}
                            role="switch"
                            aria-checked={includeCosts}
                            className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.09] hover:text-white"
                        >
                            Include costs
                            <span className={`relative h-4 w-7 shrink-0 rounded-full transition ${includeCosts ? 'bg-[#d84aff]' : 'bg-white/[0.12]'}`}>
                                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${includeCosts ? 'left-[14px]' : 'left-0.5'}`} />
                            </span>
                        </button>
                    </div>
                </div>
                <div className="shrink-0 xl:pb-1 xl:text-right">
                    <p className="text-[12px] font-medium text-zinc-500">{heroLabel}</p>
                    <p className={`mt-2 text-5xl font-semibold leading-none tracking-tight md:text-6xl ${heroValue < 0 ? 'text-red-300' : 'text-white'}`}>
                        ${heroMoney.whole}<span className={`text-2xl ${heroValue < 0 ? 'text-red-300/40' : 'text-white/40'}`}>.{heroMoney.dec}</span>
                    </p>
                    <p className="mt-3 text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-300">{fmtCompact(gross)}</span> gross
                        <span className="mx-2 text-zinc-700">·</span>
                        <span className="font-semibold text-zinc-300">{retainedPct.toFixed(0)}%</span> {retainedLabel}
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
    const [data, setData] = useState(null); // { aggregates, payments, payouts, costs, marketing }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sseStatus, setSseStatus] = useState('disconnected');
    const [budgetEventId, setBudgetEventId] = useState('');
    const [budgetSummary, setBudgetSummary] = useState(null);
    // Toggles whether logged event costs + cash marketing spend deduct from the headline figure.
    const [includeCosts, setIncludeCosts] = useState(true);

    const esRef = useRef(null);
    const reconnectRef = useRef(null);

    const { events } = useEvents({ limit: 100, offset: 0 });
    const sortedEvents = useMemo(
        () => [...(events || [])].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)),
        [events]
    );

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

    // ── budget panel (per-event, backend EventBudget/EventExpense) ─────────
    useEffect(() => {
        if (!budgetEventId && sortedEvents.length) {
            setBudgetEventId(sortedEvents[0].id);
        }
    }, [sortedEvents, budgetEventId]);

    const refreshBudget = useCallback(() => {
        if (!budgetEventId) {
            setBudgetSummary(null);
            return;
        }
        getBudgetSummary(budgetEventId).then(setBudgetSummary).catch(() => setBudgetSummary(null));
    }, [budgetEventId]);

    useEffect(() => {
        const timeout = setTimeout(refreshBudget, 0);
        return () => clearTimeout(timeout);
    }, [refreshBudget]);

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
                                grossRevenue:       prev.aggregates.grossRevenue       + faceValueCents(payment),
                                vendorFlatFeeTotal: prev.aggregates.vendorFlatFeeTotal + payment.vendorFlatFee,
                                netPayout:          prev.aggregates.netPayout          + payment.netPayout,
                                buyerPaid: {
                                    serviceFeeCents:    (prev.aggregates.buyerPaid?.serviceFeeCents ?? 0)    + payment.consumerFee,
                                    processingFeeCents: (prev.aggregates.buyerPaid?.processingFeeCents ?? 0) + payment.processingFee,
                                    totalCents:         (prev.aggregates.buyerPaid?.totalCents ?? 0)         + payment.grossAmount,
                                },
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

    // ─── derived numbers (all real) ───────────────────────────────────────
    const payments = data?.payments ?? [];
    const payouts = data?.payouts ?? [];
    // Gross = ticket face value. The $0.99 flat fee is the ONLY platform fee that comes
    // out of it — the 5.49% service fee and Stripe's cost are added on top at checkout
    // and paid by the buyer, so they never reduce this payout or this margin.
    const gross = data?.aggregates?.grossRevenue ?? 0;
    const platformFee = data?.aggregates?.vendorFlatFeeTotal ?? 0;
    const netPayout = data?.aggregates?.netPayout ?? 0;
    const buyerServiceFee = data?.aggregates?.buyerPaid?.serviceFeeCents ?? 0;
    const buyerProcessingFee = data?.aggregates?.buyerPaid?.processingFeeCents ?? 0;
    const buyerPaidTotal = data?.aggregates?.buyerPaid?.totalCents ?? 0;
    const eventCostCents = data?.costs?.totalCents ?? 0;
    // Only cash marketing spend deducts — credit-covered sends cost PXI, not you.
    const marketingCashCents = data?.marketing?.cashCents ?? 0;
    const marketingCreditCents = data?.marketing?.creditCents ?? 0;
    const netProfit = netPayout - eventCostCents - marketingCashCents;
    const spendTotal = eventCostCents + marketingCashCents;
    const profitRetainedPct = gross > 0 ? Math.max(0, Math.min(100, (netProfit / gross) * 100)) : 0;
    const payoutRetainedPct = gross > 0 ? Math.max(0, Math.min(100, (netPayout / gross) * 100)) : 0;

    // "Include costs" off = pure revenue view (gross/fees/payout); on = full profit view.
    const heroValue = includeCosts ? netProfit : netPayout;
    const heroLabel = includeCosts ? 'Net profit' : 'Net payout';
    const retainedPct = includeCosts ? profitRetainedPct : payoutRetainedPct;
    const retainedLabel = includeCosts ? 'kept as profit' : 'kept after fees';

    const monthlySeries = useMemo(() => buildMonthlySeries(payments), [payments]);

    const breakdownData = useMemo(() => {
        const slices = [];
        // Flat fee only — the buyer's service fee was never yours to spend.
        if (platformFee > 0) slices.push({ name: 'PXI platform fee', value: dollars(platformFee) });
        for (const row of data?.costs?.byCategory ?? []) {
            if (row.amountCents > 0) slices.push({ name: CATEGORY_LABELS[row.category] || row.category, value: dollars(row.amountCents) });
        }
        if ((data?.marketing?.adCardCents ?? 0) > 0) slices.push({ name: 'Ad boosts (card)', value: dollars(data.marketing.adCardCents) });
        if ((data?.marketing?.campaignCardCents ?? 0) > 0) slices.push({ name: 'Email & SMS (card)', value: dollars(data.marketing.campaignCardCents) });
        return slices;
    }, [data, platformFee]);

    const eventRows = data?.costs?.byEvent ?? [];

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

    // ─── render ───────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
            <EarningsHero
                heroValue={heroValue}
                heroLabel={heroLabel}
                gross={gross}
                retainedPct={retainedPct}
                retainedLabel={retainedLabel}
                sseStatus={sseStatus}
                loading={loading}
                onRefresh={load}
                includeCosts={includeCosts}
                onToggleCosts={() => setIncludeCosts((v) => !v)}
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
                                subheading="Ticket face value sold — your listed prices"
                            />
                            <RevenueTableRow
                                title="Platform Fee" value={fmtCompact(platformFee)} unit="USD"
                                subheading="$0.99 per ticket — the only fee off your payout"
                            />
                            <RevenueTableRow
                                title="Net Payout" value={fmtCompact(netPayout)} unit="USD"
                                subheading="Transferred to you by Stripe"
                            />
                            {includeCosts ? (
                                <>
                                    <RevenueTableRow
                                        title="Event Costs" value={fmtCompact(eventCostCents)} unit="USD"
                                        subheading="Expenses you logged per event"
                                    />
                                    <RevenueTableRow
                                        title="Marketing Spend" value={fmtCompact(marketingCashCents)} unit="USD"
                                        subheading={marketingCreditCents > 0
                                            ? `Card only — ${fmtCompact(marketingCreditCents)} more covered by credits, no cash spent`
                                            : 'Ad boosts + email/SMS campaigns (card)'}
                                    />
                                    <RevenueTableRow
                                        title="Net Profit" value={fmtCompact(netProfit)} unit="USD"
                                        subheading="Payout minus costs and cash marketing" emphasize
                                    />
                                </>
                            ) : null}
                        </div>
                    </SectionCard>

                    <SectionCard title="What buyers paid">
                        <div className="px-5 py-2">
                            <RevenueTableRow
                                title="Service Fee" value={fmtCompact(buyerServiceFee)} unit="USD"
                                subheading="5.49%, added at checkout — kept by PXI"
                            />
                            <RevenueTableRow
                                title="Card Processing" value={fmtCompact(buyerProcessingFee)} unit="USD"
                                subheading="Stripe's cost, passed through at checkout"
                            />
                            <RevenueTableRow
                                title="Buyer Total" value={fmtCompact(buyerPaidTotal)} unit="USD"
                                subheading="Charged to cards across all your tickets"
                            />
                        </div>
                        <p className="px-5 pb-4 pt-1 text-xs leading-5 text-zinc-500">
                            These sit on top of your ticket price and come out of the buyer&apos;s
                            card, not your payout. They&apos;re here so you can see the price
                            attendees actually saw — they never reduce your revenue or margin.
                        </p>
                    </SectionCard>

                    {includeCosts ? (
                        <SectionCard title="Return on spend">
                            <div className="px-5 py-6 text-center">
                                {spendTotal > 0 ? (
                                    <>
                                        <p className="text-xs tracking-[0.02em] text-zinc-500 font-bold mb-2">Profit vs. what you spent</p>
                                        <p className={`text-5xl font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-300'}`}>
                                            {((netProfit / spendTotal) * 100).toFixed(0)}%
                                        </p>
                                        <p className="text-sm text-zinc-500 font-semibold mt-2">
                                            {fmtCompact(netProfit)} profit on {fmtCompact(spendTotal)} of costs + cash marketing
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-5xl font-bold text-zinc-600">—</p>
                                        <p className="text-sm text-zinc-500 font-semibold mt-2">
                                            Log event costs or run a campaign to see your return on spend.
                                        </p>
                                    </>
                                )}
                            </div>
                        </SectionCard>
                    ) : null}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <SectionCard title="Revenue by month">
                        {monthlySeries.length ? (
                            <RechartsChart className="h-[300px]">
                                {(charts) =>
                                    createElement(
                                        charts.ResponsiveContainer,
                                        { width: '100%', height: '100%' },
                                        createElement(
                                            charts.ComposedChart,
                                            { data: monthlySeries, margin: { top: 12, right: 8, bottom: 0, left: -12 } },
                                            createElement(charts.CartesianGrid, { stroke: 'rgba(255,255,255,0.05)', vertical: false }),
                                            createElement(charts.XAxis, { dataKey: 'month', axisLine: false, tickLine: false, tick: { fill: 'rgba(255,255,255,0.45)', fontSize: 11 } }),
                                            createElement(charts.YAxis, { axisLine: false, tickLine: false, tickFormatter: fmtChartMoney, tick: { fill: 'rgba(255,255,255,0.35)', fontSize: 10 }, width: 54 }),
                                            createElement(charts.Tooltip, { cursor: { fill: 'rgba(255,255,255,0.03)' }, content: createElement(MoneyTooltip) }),
                                            createElement(charts.Area, { type: 'monotone', dataKey: 'gross', name: 'Gross', stroke: getDashboardChartShade(1), fill: 'rgba(13,148,136,0.14)', strokeWidth: 2 }),
                                            createElement(charts.Line, { type: 'monotone', dataKey: 'net', name: 'Net to you', stroke: getDashboardChartShade(0), strokeWidth: 2, dot: false })
                                        )
                                    )
                                }
                            </RechartsChart>
                        ) : (
                            <div className="px-5 py-16 text-center">
                                <p className="text-sm font-semibold text-white">No sales yet.</p>
                                <p className="mt-1 text-xs text-zinc-500">Monthly gross and net revenue appear here after your first ticket sale.</p>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="Event profitability">
                        <div className="p-5">
                            {eventRows.length ? (
                                <div className="space-y-2">
                                    {eventRows.map((row) => {
                                        const profit = row.netCents - row.costCents;
                                        return (
                                            <div key={row.eventId} className="grid gap-3 rounded-2xl bg-white/[0.035] p-4 md:grid-cols-[1.4fr_110px_110px_110px] md:items-center">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-white">{row.name}</p>
                                                    <p className="mt-0.5 text-xs text-zinc-500">{fmtDate(row.startDate)}</p>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-[11px] font-medium text-zinc-500">Gross</p>
                                                    <p className="font-mono text-sm font-bold text-white">{fmt(row.grossCents)}</p>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-[11px] font-medium text-zinc-500">Costs</p>
                                                    <p className="font-mono text-sm font-bold text-white">{fmt(row.costCents)}</p>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-[11px] font-medium text-zinc-500">Profit</p>
                                                    <p className={`font-mono text-sm font-bold ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{fmt(profit)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl bg-white/[0.025] px-4 py-8 text-center">
                                    <p className="text-sm font-semibold text-white">No event revenue or costs yet.</p>
                                    <p className="mt-1 text-xs text-zinc-500">Sell tickets or log expenses in the budget below to see per-event profit.</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {includeCosts ? (
                    <SectionCard title="Cost breakdown">
                        {breakdownData.length ? (
                            <>
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
                                {marketingCreditCents > 0 ? (
                                    <p className="px-5 pb-4 text-xs leading-5 text-zinc-500">
                                        Cash costs only — {fmtCompact(marketingCreditCents)} more marketing was covered by credits and isn&apos;t counted here or deducted from profit.
                                    </p>
                                ) : null}
                            </>
                        ) : (
                            <div className="px-5 py-16 text-center">
                                <p className="text-sm font-semibold text-white">No cash costs tracked yet.</p>
                                <p className="mt-1 text-xs text-zinc-500">Platform fees, logged expenses, and card-paid marketing spend break down here.</p>
                            </div>
                        )}
                    </SectionCard>
                ) : (
                    <div className="dashboard-surface rounded-[1.25rem] px-5 py-16 text-center">
                        <p className="text-sm font-semibold text-white">Cost breakdown is hidden.</p>
                        <p className="mt-1 text-xs text-zinc-500">Turn on &quot;Include costs&quot; above to see where the money went.</p>
                    </div>
                )}

                <div className="space-y-4">
                    {sortedEvents.length ? (
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.045] px-4 py-3">
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Budget for event</p>
                            <select
                                value={budgetEventId}
                                onChange={(e) => setBudgetEventId(e.target.value)}
                                className="glass-field max-w-[260px] rounded-xl px-3 py-2 text-sm text-white"
                            >
                                {sortedEvents.map((event) => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                    {budgetEventId && budgetSummary ? (
                        <BudgetPanel
                            eventId={budgetEventId}
                            summary={budgetSummary}
                            onChanged={() => { refreshBudget(); load(); }}
                        />
                    ) : (
                        <div className="dashboard-surface rounded-[1.25rem] px-5 py-10 text-center">
                            <p className="text-sm font-semibold text-white">No event selected.</p>
                            <p className="mt-1 text-xs text-zinc-500">Create an event to plan budgets and log real costs against it.</p>
                        </div>
                    )}
                </div>
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
