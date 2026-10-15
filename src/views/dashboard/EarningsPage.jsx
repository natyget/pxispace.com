'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { Button, DataTable, EmptyState, Notice, PageHeader, Panel, Skeleton, StateText } from '@/components/dashboard/ui/kit';
import { useEvents } from '@/lib/dashboardStore';
import { money, shortDate } from '@/lib/dashFormat';
import { getBudgetSummary } from '@/services/budget';
import BudgetEditor from '@/views/dashboard/insights/BudgetEditor';
import ChevronSelect from '@/views/dashboard/insights/ChevronSelect';
import { BuyersPanel, CostRows, MonthPanel } from '@/views/dashboard/insights/EarningsParts';

// `process.env.NEXT_PUBLIC_*` verbatim — Next inlines this form only. Written as
// `globalThis.process?.env?.X` it is never substituted, resolves to undefined in the
// browser, and silently falls through to the localhost default in production.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ─── helpers ────────────────────────────────────────────────────────────────

function dollars(cents) {
    return (cents ?? 0) / 100;
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

/** A payout the bank has not settled is on its way, not failed. */
function payoutState(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'paid') return { tone: 'good', label: 'Cleared' };
    if (['failed', 'canceled'].includes(value)) return { tone: 'bad', label: 'Failed' };
    return { tone: 'muted', label: 'On the way' };
}

function profitTone(cents) {
    if (cents > 0) return 'text-emerald-300';
    if (cents < 0) return 'text-red-300';
    return 'text-white';
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function EarningsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState(null); // { aggregates, payments, payouts, costs, marketing }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [, setSseStatus] = useState('disconnected');
    const [budgetPick, setBudgetPick] = useState('');
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

    // Refresh and Include costs sit at the right of the sub-tab row, quiet.
    const pageAction = useMemo(
        () => (user?.isVendor ? (
            <div className="flex items-center gap-1">
                <Button variant="quiet" onClick={load} disabled={loading}>{loading ? 'Refreshing' : 'Refresh'}</Button>
                <Button variant="quiet" role="switch" aria-checked={includeCosts} onClick={() => setIncludeCosts((value) => !value)} className={includeCosts ? 'text-white!' : ''}>
                    {includeCosts ? <HugeiconsIcon icon={Tick02Icon} size={14} className="text-[#c77dff]" /> : null}
                    Include costs
                </Button>
            </div>
        ) : null),
        [user?.isVendor, load, loading, includeCosts]
    );
    usePageAction(pageAction);

    // ── budget panel (per-event, backend EventBudget/EventExpense) ─────────
    // The night to plan a budget for: the one picked, else the newest.
    const budgetEventId = sortedEvents.some((event) => event.id === budgetPick) ? budgetPick : sortedEvents[0]?.id || '';

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
    const returnPct = spendTotal > 0 ? Math.round((netProfit / spendTotal) * 100) : null;

    const monthlySeries = useMemo(() => buildMonthlySeries(data?.payments ?? []), [data]);

    const costSlices = useMemo(() => {
        const slices = [];
        // Flat fee only — the buyer's service fee was never yours to spend.
        if (platformFee > 0) slices.push({ name: 'PXI platform fee', cents: platformFee });
        for (const row of data?.costs?.byCategory ?? []) {
            if (row.amountCents > 0) slices.push({ name: CATEGORY_LABELS[row.category] || row.category, cents: row.amountCents });
        }
        if ((data?.marketing?.adCardCents ?? 0) > 0) slices.push({ name: 'Ad boosts (card)', cents: data.marketing.adCardCents });
        if ((data?.marketing?.campaignCardCents ?? 0) > 0) slices.push({ name: 'Email and SMS (card)', cents: data.marketing.campaignCardCents });
        return slices.sort((a, b) => b.cents - a.cents);
    }, [data, platformFee]);

    const eventRows = data?.costs?.byEvent ?? [];

    // ─── non-vendor gate ──────────────────────────────────────────────────
    if (!mounted) {
        return <div />;
    }

    if (!user?.isVendor) {
        return (
            <div className="space-y-5 md:space-y-6">
                <PageHeader title="Earnings" />
                <EmptyState
                    title="Earnings start with hosting"
                    line="Your numbers show up here once hosting and payouts are on."
                    action={<Button variant="primary" onClick={() => router.push('/dashboard/vendor-upgrade')}>Start hosting</Button>}
                />
            </div>
        );
    }

    const waiting = !data && !error;
    const kpis = waiting
        ? null
        : includeCosts
            ? [
                { label: 'Net payout', value: money(netPayout), hint: platformFee > 0 ? `after ${money(platformFee)} in fees` : undefined },
                { label: 'Ticket sales', value: money(gross) },
                { label: 'Costs', value: money(spendTotal) },
                { label: 'Profit', value: money(netProfit), tone: netProfit >= 0 ? 'good' : 'warn', hint: returnPct != null ? `${returnPct}% return` : undefined },
            ]
            : [
                { label: 'Net payout', value: money(netPayout), hint: platformFee > 0 ? `after ${money(platformFee)} in fees` : undefined },
                { label: 'Ticket sales', value: money(gross) },
                { label: 'Platform fee', value: money(platformFee) },
            ];

    // On phones a night is two lines (name and profit, then the date and the other numbers); the columns appear from md up.
    const nightColumns = [
        {
            key: 'name',
            label: 'Night',
            render: (row) => {
                const profit = row.netCents - row.costCents;
                return (
                    <div className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="truncate text-[14px] font-semibold text-white">{row.name}</p>
                            <span className={`text-[14px] font-semibold tabular-nums md:hidden ${profitTone(profit)}`}>{money(profit)}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-white/45 md:hidden">
                            {shortDate(row.startDate)}, {money(row.grossCents)} sales, {money(row.costCents)} costs
                        </p>
                    </div>
                );
            },
        },
        { key: 'date', label: 'Date', width: '90px', hideOnMobile: true, render: (row) => <span className="text-[14px] text-white/60">{shortDate(row.startDate)}</span> },
        { key: 'sales', label: 'Ticket sales', width: '110px', align: 'right', hideOnMobile: true, render: (row) => <span className="text-[14px] tabular-nums text-white">{money(row.grossCents)}</span> },
        { key: 'costs', label: 'Costs', width: '100px', align: 'right', hideOnMobile: true, render: (row) => <span className="text-[14px] tabular-nums text-white">{money(row.costCents)}</span> },
        {
            key: 'profit',
            label: 'Profit',
            width: '100px',
            align: 'right',
            hideOnMobile: true,
            render: (row) => {
                const profit = row.netCents - row.costCents;
                return <span className={`text-[14px] font-semibold tabular-nums ${profitTone(profit)}`}>{money(profit)}</span>;
            },
        },
    ];

    const payoutColumns = [
        {
            key: 'date',
            label: 'Date',
            render: (row) => {
                const state = payoutState(row.status);
                return (
                    <div className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-[14px] font-semibold text-white">{shortDate(row.arrivalDate ?? row.createdAt)}</p>
                            <span className="text-[14px] tabular-nums text-white md:hidden">{money(row.amount)}</span>
                        </div>
                        <div className="mt-0.5 flex items-baseline justify-between gap-3">
                            <p className="truncate text-[12px] text-white/45">{row.stripePayoutId ? `Stripe ${String(row.stripePayoutId).slice(-6)}` : 'Stripe payout'}</p>
                            <span className="md:hidden"><StateText tone={state.tone}>{state.label}</StateText></span>
                        </div>
                    </div>
                );
            },
        },
        { key: 'amount', label: 'Amount', width: '120px', align: 'right', hideOnMobile: true, render: (row) => <span className="text-[14px] tabular-nums text-white">{money(row.amount)}</span> },
        {
            key: 'status',
            label: 'Status',
            width: '110px',
            align: 'right',
            hideOnMobile: true,
            render: (row) => {
                const state = payoutState(row.status);
                return <StateText tone={state.tone}>{state.label}</StateText>;
            },
        },
    ];

    const budgetReady = budgetSummary && (!budgetSummary.eventId || budgetSummary.eventId === budgetEventId);

    // ─── render ───────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader title="Earnings" kpis={kpis} />

            {error ? <Notice tone="error">{error}</Notice> : null}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-5 md:space-y-6">
                    <Panel title="Nights">
                        <DataTable
                            columns={nightColumns}
                            rows={eventRows}
                            rowKey="eventId"
                            loading={waiting}
                            empty={<EmptyState title="No sales or costs yet" line="Sell tickets or log a cost to see what each night made." />}
                        />
                    </Panel>

                    <Panel title="Payouts">
                        {payouts.some((payout) => ['failed', 'canceled'].includes(String(payout.status).toLowerCase())) ? (
                            <Notice tone="error" className="mb-3">A recent payout failed. Check your payout details in Settings.</Notice>
                        ) : null}
                        <DataTable
                            columns={payoutColumns}
                            rows={payouts}
                            loading={waiting}
                            empty={<EmptyState title="No payouts yet" line="Paid out nights show up here." />}
                        />
                    </Panel>

                    <Panel title="Costs and budget">
                        <div className="space-y-8">
                            {includeCosts && costSlices.length ? (
                                <div>
                                    <h3 className="mb-3 text-[14px] font-semibold text-white/70">Where it went</h3>
                                    <CostRows slices={costSlices} creditCents={marketingCreditCents} />
                                </div>
                            ) : null}
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h3 className="text-[14px] font-semibold text-white/70">Budget</h3>
                                    {sortedEvents.length ? (
                                        <ChevronSelect
                                            aria-label="Night"
                                            size="sm"
                                            value={budgetEventId}
                                            onChange={(e) => setBudgetPick(e.target.value)}
                                            options={sortedEvents.map((event) => ({ value: event.id, label: event.name || 'Untitled event' }))}
                                            className="w-[200px] md:w-[260px]"
                                        />
                                    ) : null}
                                </div>
                                {!sortedEvents.length ? (
                                    <EmptyState title="No nights yet" line="Create an event to plan a budget." />
                                ) : budgetReady ? (
                                    <BudgetEditor
                                        key={budgetEventId}
                                        eventId={budgetEventId}
                                        summary={budgetSummary}
                                        onChanged={() => { refreshBudget(); load(); }}
                                    />
                                ) : (
                                    <Skeleton className="h-64" />
                                )}
                            </div>
                        </div>
                    </Panel>
                </div>

                <div className="min-w-0 space-y-5 md:space-y-6">
                    <BuyersPanel
                        rows={[
                            { label: 'Service fee', cents: buyerServiceFee },
                            { label: 'Card processing', cents: buyerProcessingFee },
                            { label: 'Buyer total', cents: buyerPaidTotal },
                        ]}
                    />
                    <MonthPanel series={monthlySeries} />
                </div>
            </div>
        </div>
    );
}
