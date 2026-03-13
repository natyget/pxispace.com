'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
    ArrowRight,
    Loader2,
    RefreshCw,
    Star,
    AlertTriangle,
    WifiOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService, authStorage } from '../../services/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(cents) {
    return '$' + ((cents ?? 0) / 100).toFixed(2);
}

function fmtDate(raw) {
    if (!raw) return '—';
    return new Date(raw).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, loading, accent }) {
    const ring = {
        purple: 'bg-pxi-purple/10 border-pxi-purple/20 text-pxi-purple',
        green:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
    }[accent] ?? 'bg-zinc-800 border-white/8 text-zinc-400';

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${ring}`}>
                    <Icon size={16} />
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            </div>
            {loading
                ? <div className="h-8 w-28 bg-zinc-800 rounded-lg animate-pulse" />
                : (
                    <>
                        <p className="text-white font-black text-2xl">{value}</p>
                        {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
                    </>
                )
            }
        </div>
    );
}

function PayoutBadge({ status }) {
    if (status === 'paid') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={11} /> Paid
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <XCircle size={11} /> Failed
        </span>
    );
}

function LiveIndicator({ status }) {
    if (status === 'connected') return (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Live
        </span>
    );
    if (status === 'connecting') return (
        <span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
            <Loader2 size={10} className="animate-spin" /> Connecting…
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 text-zinc-600 text-xs font-medium">
            <WifiOff size={11} /> Offline
        </span>
    );
}

function BreakdownRow({ label, value, description, negative }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-zinc-300 text-sm font-medium">{label}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{description}</p>
            </div>
            <span className={`text-sm font-bold flex-shrink-0 ${negative ? 'text-red-400/80' : 'text-zinc-300'}`}>
                {value}
            </span>
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function EarningsPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);       // { aggregates, payments, payouts }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sseStatus, setSseStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'

    const esRef = useRef(null);
    const reconnectRef = useRef(null);

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
    if (!user?.isVendor) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center">
                    <TrendingUp size={28} className="text-pxi-purple" />
                </div>
                <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Earnings</h1>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                    Your earnings dashboard will appear here once you become a verified vendor.
                </p>
                <Link
                    href="/dashboard/vendor-upgrade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:brightness-110 transition-all"
                >
                    <Star size={14} />
                    Set Up Vendor Account
                    <ArrowRight size={14} />
                </Link>
            </div>
        );
    }

    // ─── derived numbers ──────────────────────────────────────────────────
    const agg      = data?.aggregates ?? {};
    const payments = data?.payments   ?? [];
    const payouts  = data?.payouts    ?? [];

    const totalEarned = agg.netPayout ?? 0;
    const paidOut     = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending     = Math.max(0, totalEarned - paidOut);

    // ─── render ───────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-pxi-purple" />
                        <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">
                            Vendor Dashboard
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Earnings</h1>
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <LiveIndicator status={sseStatus} />
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* 3 stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="Total Earned"
                    value={fmt(totalEarned)}
                    sub="Net after all platform fees"
                    loading={loading}
                    accent="purple"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Paid Out"
                    value={fmt(paidOut)}
                    sub="Transferred to your bank"
                    loading={loading}
                    accent="green"
                />
                <StatCard
                    icon={Clock}
                    label="Pending"
                    value={fmt(pending)}
                    sub="Earned but not yet paid out"
                    loading={loading}
                    accent="amber"
                />
            </div>

            {/* Revenue breakdown */}
            {!loading && data && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                        Revenue Breakdown
                    </p>
                    <div className="space-y-3">
                        <BreakdownRow label="Gross Revenue"                 value={fmt(agg.grossRevenue ?? 0)}          description="Total charged to ticket buyers" />
                        <BreakdownRow label="Consumer Fees (4.59%)"         value={`−${fmt(agg.consumerFeeDeducted ?? 0)}`} description="Variable fee collected from buyers" negative />
                        <BreakdownRow label="Vendor Flat Fee ($0.90/ticket)" value={`−${fmt(agg.vendorFlatFeeTotal ?? 0)}`} description="PXI platform flat fee per ticket sold"  negative />
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Net Payout</span>
                            <span className="text-emerald-400 font-black text-sm">{fmt(agg.netPayout ?? 0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket sales table */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-sm">Ticket Sales</h3>
                        <p className="text-zinc-500 text-xs mt-0.5">{payments.length} total sale{payments.length !== 1 ? 's' : ''}</p>
                    </div>
                    {sseStatus === 'connected' && (
                        <span className="text-xs text-zinc-600">Updates automatically</span>
                    )}
                </div>
                {loading ? (
                    <div className="px-5 py-10 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-zinc-600" />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="px-5 py-10 text-center text-zinc-600 text-sm">No ticket sales yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">Date</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">Gross</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider hidden sm:table-cell">Fees</th>
                                    <th className="text-right px-5 py-3 text-xs font-bold text-zinc-600 uppercase tracking-wider">Net</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="text-white text-sm font-medium">Ticket Sale</p>
                                            <p className="text-zinc-500 text-xs mt-0.5">{fmtDate(p.createdAt)}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-zinc-400 text-sm">{fmt(p.grossAmount)}</td>
                                        <td className="px-5 py-3.5 text-right text-red-400/70 text-sm hidden sm:table-cell">
                                            −{fmt((p.consumerFee ?? 0) + (p.vendorFlatFee ?? 0))}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-emerald-400 font-bold text-sm">
                                            +{fmt(p.netPayout)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payout history */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h3 className="text-white font-bold text-sm">Payout History</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Transfers from Stripe to your bank account</p>
                </div>
                {loading ? (
                    <div className="px-5 py-10 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-zinc-600" />
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="px-5 py-10 text-center text-zinc-600 text-sm">
                        No payouts yet. Stripe typically initiates transfers within 2–7 business days.
                    </div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {payouts.map((p) => (
                            <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <PayoutBadge status={p.status} />
                                    </div>
                                    <p className="text-zinc-500 text-xs mt-1">
                                        {fmtDate(p.arrivalDate ?? p.createdAt)}
                                    </p>
                                    {p.failureMessage && (
                                        <p className="text-red-400 text-xs mt-0.5">{p.failureMessage}</p>
                                    )}
                                </div>
                                <span className={`font-bold text-sm ${p.status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {p.status === 'paid' ? '+' : ''}{fmt(p.amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>


        </div>
    );
}
