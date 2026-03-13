'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

function fmt(cents) {
    return '$' + (cents / 100).toFixed(2);
}

function StatCard({ icon: Icon, label, value, sub, loading, accent }) {
    const colors = {
        purple: 'bg-pxi-purple/10 border-pxi-purple/20 text-pxi-purple',
        green:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
        zinc:   'bg-zinc-800 border-white/8 text-zinc-400',
    };
    const ring = colors[accent] ?? colors.zinc;
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${ring}`}>
                    <Icon size={16} />
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            </div>
            {loading ? (
                <div className="h-8 w-28 bg-zinc-800 rounded-lg animate-pulse" />
            ) : (
                <>
                    <p className="text-white font-black text-2xl">{value}</p>
                    {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
                </>
            )}
        </div>
    );
}

function PayoutBadge({ status }) {
    if (status === 'paid') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={11} />
                Paid
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <XCircle size={11} />
            Failed
        </span>
    );
}

export default function EarningsPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    // Non-vendor gate
    if (!user?.isVendor) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-pxi-purple/10 border border-pxi-purple/20 flex items-center justify-center">
                    <TrendingUp size={28} className="text-pxi-purple" />
                </div>
                <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
                    Earnings
                </h1>
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

    const agg = data?.aggregates ?? {};
    const payments = data?.payments ?? [];
    const payouts  = data?.payouts  ?? [];

    const totalEarned = agg.netPayout ?? 0;
    const paidOut     = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending     = Math.max(0, totalEarned - paidOut);

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
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        Earnings
                    </h1>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all disabled:opacity-40"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Refresh
                </button>
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
                    value={loading ? '—' : fmt(totalEarned)}
                    sub="Net after all platform fees"
                    loading={loading}
                    accent="purple"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Paid Out"
                    value={loading ? '—' : fmt(paidOut)}
                    sub="Transferred to your bank"
                    loading={loading}
                    accent="green"
                />
                <StatCard
                    icon={Clock}
                    label="Pending"
                    value={loading ? '—' : fmt(pending)}
                    sub="Earned but not yet paid out"
                    loading={loading}
                    accent="amber"
                />
            </div>

            {/* Fee breakdown */}
            {!loading && data && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                        Revenue Breakdown
                    </p>
                    <div className="space-y-3">
                        <BreakdownRow label="Gross Revenue" value={fmt(agg.grossRevenue ?? 0)} description="Total charged to ticket buyers" />
                        <BreakdownRow label="Consumer Fees (4.59%)" value={`−${fmt(agg.consumerFeeDeducted ?? 0)}`} description="Variable fee collected from buyers" negative />
                        <BreakdownRow label="Vendor Flat Fee ($0.90/ticket)" value={`−${fmt(agg.vendorFlatFeeTotal ?? 0)}`} description="PXI platform flat fee per ticket sold" negative />
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Net Payout</span>
                            <span className="text-emerald-400 font-black text-sm">{fmt(agg.netPayout ?? 0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent ticket sales */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h3 className="text-white font-bold text-sm">Ticket Sales</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">{payments.length} total sale{payments.length !== 1 ? 's' : ''}</p>
                </div>
                {loading ? (
                    <div className="px-5 py-10 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-zinc-600" />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="px-5 py-10 text-center text-zinc-600 text-sm">
                        No ticket sales yet.
                    </div>
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
                                    <tr key={p.id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="text-white text-sm font-medium">Ticket Sale</p>
                                            <p className="text-zinc-500 text-xs mt-0.5">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </p>
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
                                    <p className="text-zinc-500 text-xs">
                                        {p.arrivalDate
                                            ? new Date(p.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : p.createdAt
                                            ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—'}
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
