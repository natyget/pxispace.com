'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon, PercentIcon, Calendar01Icon, ArrowRight02Icon, Loading02Icon, RefreshIcon, StarIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import SectionCard from '@/components/dashboard/SectionCard';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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
        setMounted(true);
    }, []);

    // ── initial REST load ──────────────────────────────────────────────────
    const load = () => {
        if (!user?.isVendor) return;
        setLoading(true);
        setError('');
        authService
            .getVendorDashboard()
            .then(setData)
            .catch(() => setError('Failed to load earnings. Please try again.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [user?.isVendor]);

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
    const agg      = data?.aggregates ?? {};
    const payments = data?.payments   ?? [];
    const payouts  = data?.payouts    ?? [];

    const gross = agg.grossRevenue ?? 0;
    const consumerFees = agg.consumerFeeDeducted ?? 0;
    const vendorFees = agg.vendorFlatFeeTotal ?? 0;
    const totalFees = consumerFees + vendorFees;
    const net = agg.netPayout ?? 0;
    const grossMoney = splitMoney(gross);
    const feeMoney = splitMoney(totalFees);
    const netMoney = splitMoney(net);
    const netPct = gross > 0 ? ((net / gross) * 100) : 0;
    const feePct = gross > 0 ? ((totalFees / gross) * 100) : 0;
    const eventRowsMap = new Map();
    for (const p of payments) {
        const key = p.eventId || p.eventName || p.id;
        if (!eventRowsMap.has(key)) {
            eventRowsMap.set(key, {
                id: key,
                name: p.eventName || p.event?.name || 'Ticket Sale',
                date: p.createdAt,
                gross: 0,
                fee: 0,
                net: 0,
            });
        }
        const row = eventRowsMap.get(key);
        row.gross += p.grossAmount ?? 0;
        row.fee += (p.consumerFee ?? 0) + (p.vendorFlatFee ?? 0);
        row.net += p.netPayout ?? 0;
    }
    const eventRows = Array.from(eventRowsMap.values());

    // ─── render ───────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-12">

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Financials</h1>
                    <p className="text-zinc-500 text-sm mt-1">Revenue, fees, and payout history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <DataSourceBadge source={sseStatus === 'connected' ? 'Live' : 'Derived'} />
                    <div className="flex items-center space-x-2 bg-[#4ade80]/10 px-4 py-2 rounded-full border border-[#4ade80]/20">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#4ade80]">
                            {sseStatus === 'connected' ? 'Live Updates' : sseStatus === 'connecting' ? 'Connecting' : 'Offline'}
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

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden"
            >
                <div className="p-6 md:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[200px]">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white/40 uppercase">Total Gross Revenue</span>
                        <HugeiconsIcon icon={HelpCircleIcon} className="h-4 w-4 md:h-5 md:w-5 text-white/40" />
                    </div>
                    {loading ? <div className="h-10 w-40 bg-white/5 rounded animate-pulse" /> : (
                        <div className="mt-auto flex flex-col items-start gap-3 md:gap-4">
                            <div className="text-3xl lg:text-[40px] font-[900] text-white tracking-tighter leading-none">
                                ${grossMoney.whole}<span className="text-[14px] md:text-[20px] text-white/40 font-medium ml-1">.{grossMoney.dec}</span>
                            </div>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
                                <HugeiconsIcon icon={HelpCircleIcon} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                <span>Live sales updates</span>
                            </div>
                            <DataSourceBadge source="Live" />
                        </div>
                    )}
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[200px]">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white/40 uppercase">Total Platform Fees</span>
                        <HugeiconsIcon icon={PercentIcon} className="h-4 w-4 md:h-5 md:w-5 text-[#ef4444]/60" />
                    </div>
                    {loading ? <div className="h-10 w-40 bg-white/5 rounded animate-pulse" /> : (
                        <div className="mt-auto flex flex-col items-start gap-3 md:gap-4">
                            <div className="text-3xl lg:text-[40px] font-[900] text-[#ef4444] tracking-tighter leading-none">
                                -${feeMoney.whole}<span className="text-[14px] md:text-[20px] text-[#ef4444]/50 font-medium ml-1">.{feeMoney.dec}</span>
                            </div>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase bg-white/5 text-white/50 border border-white/10">
                                <HugeiconsIcon icon={HelpCircleIcon} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                <span>Consumer + vendor fees</span>
                            </div>
                            <DataSourceBadge source="Derived" />
                        </div>
                    )}
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-between bg-white/[0.02] min-h-[160px] md:min-h-[200px]">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white uppercase">Total Net Payout</span>
                        <HugeiconsIcon icon={HelpCircleIcon} className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
                    </div>
                    {loading ? <div className="h-10 w-40 bg-white/5 rounded animate-pulse" /> : (
                        <div className="mt-auto flex flex-col items-start gap-3 md:gap-4">
                            <div className="text-3xl lg:text-[40px] font-[900] text-white tracking-tighter leading-none">
                                ${netMoney.whole}<span className="text-[14px] md:text-[20px] text-white/40 font-medium ml-1">.{netMoney.dec}</span>
                            </div>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                <HugeiconsIcon icon={HelpCircleIcon} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                <span>Available for withdrawal</span>
                            </div>
                            <DataSourceBadge source="Live" />
                        </div>
                    )}
                </div>
            </motion.div>

            <SectionCard
                title="Revenue Split Visualization"
                subtitle="Net payout and fee proportions based on ticket events."
                source="Derived"
            >
                    <div className="space-y-5">
                        <div className="flex justify-between text-[13px] font-mono font-bold">
                            <span className="text-white">Net Payout ({netPct.toFixed(1)}%)</span>
                            <span className="text-[#ef4444]">Platform Fee ({feePct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-6 rounded-full overflow-hidden flex bg-white/5 border border-white/10">
                            <div className="bg-white h-full transition-all duration-1000" style={{ width: `${netPct}%` }} />
                            <div className="bg-[#ef4444] h-full transition-all duration-1000" style={{ width: `${feePct}%` }} />
                        </div>
                    </div>
            </SectionCard>

            <SectionCard
                title="Per-Event Breakdown"
                subtitle="Gross, fee, and net totals grouped by event."
                source="Live"
            >
                <div className="overflow-x-auto -mx-6 px-6">
                    {loading ? (
                        <div className="px-5 py-10 flex items-center justify-center"><HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin text-zinc-600" /></div>
                    ) : eventRows.length === 0 ? (
                        <div className="px-5 py-10 text-center text-zinc-600 text-sm">No ticket sales yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Event</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Date</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Gross Revenue</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Platform Fee</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">Net Payout</th>
                                    <th className="px-6 py-5 text-[11px] font-bold tracking-widest text-white/40 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {eventRows.map((e) => (
                                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5 text-[15px] font-bold text-white">{e.name}</td>
                                        <td className="px-6 py-5 text-[14px] font-mono font-medium text-white/50">{fmtDate(e.date)}</td>
                                        <td className="px-6 py-5 text-[14px] font-mono font-bold text-white">{fmt(e.gross)}</td>
                                        <td className="px-6 py-5 text-[14px] font-mono font-bold text-[#ef4444]">-{fmt(e.fee)}</td>
                                        <td className="px-6 py-5 text-[14px] font-mono font-bold text-[#4ade80]">{fmt(e.net)}</td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white/10 text-white border-white/20">
                                                Recorded
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </SectionCard>

            <SectionCard
                title="Payout History"
                subtitle="Settlement activity from Stripe transfers."
                source="Live"
            >
                <div className="overflow-x-auto -mx-6 px-6">
                    {loading ? (
                        <div className="px-5 py-10 flex items-center justify-center"><HugeiconsIcon icon={Loading02Icon} size={20} className="animate-spin text-zinc-600" /></div>
                    ) : payouts.length === 0 ? (
                        <div className="px-5 py-10 text-center text-zinc-600 text-sm">
                            No payouts yet. Stripe typically initiates transfers within 2–7 business days.
                        </div>
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
