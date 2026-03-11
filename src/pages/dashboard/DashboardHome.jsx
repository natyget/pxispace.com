import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, DollarSign, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

export default function DashboardHome() {
    const { user } = useAuth();
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(false);

    useEffect(() => {
        if (!user?.isVendor) return;
        setVendorLoading(true);
        authService
            .getVendorDashboard()
            .then(setVendorData)
            .catch(() => {})
            .finally(() => setVendorLoading(false));
    }, [user?.isVendor]);

    const totalEarnings = vendorData?.totalNetPayout ?? 0;
    const totalPayments = vendorData?.paymentCount ?? 0;
    const recentPayments = vendorData?.payments ?? [];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Here's what's happening with your account.
                </p>
            </div>

            {/* Passport Status Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-pxi-purple/15 border border-pxi-purple/25 flex items-center justify-center">
                            <CheckCircle2 size={16} className="text-pxi-purple" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Passport
                        </span>
                    </div>
                    <p className="text-white font-bold text-lg">Issued</p>
                    <p className="text-zinc-500 text-xs mt-0.5">@{user?.handle}</p>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/8 flex items-center justify-center">
                            <Star size={16} className="text-zinc-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Vendor Status
                        </span>
                    </div>
                    {user?.isVendor ? (
                        <>
                            <p className="text-amber-400 font-bold text-lg">Active</p>
                            <p className="text-zinc-500 text-xs mt-0.5">
                                Stripe Connect verified
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-zinc-400 font-bold text-lg">Not Set Up</p>
                            <p className="text-zinc-600 text-xs mt-0.5">
                                Upgrade to sell tickets
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Vendor Upgrade CTA (only if not vendor) */}
            {!user?.isVendor && (
                <div className="relative overflow-hidden bg-gradient-to-br from-pxi-purple/10 to-zinc-900/60 border border-pxi-purple/20 rounded-2xl p-6">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-pxi-purple/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                            <Star size={14} className="text-pxi-purple" />
                            <span className="text-pxi-purple text-xs font-bold uppercase tracking-widest">
                                Become an Organizer
                            </span>
                        </div>
                        <h2 className="text-white font-black text-xl mt-2 mb-2">
                            Unlock your Diplomatic Passport
                        </h2>
                        <p className="text-zinc-400 text-sm mb-5 leading-relaxed max-w-lg">
                            Connect your Stripe account to sell tickets, collect revenue,
                            and manage events on PXI. Verification takes just a few minutes.
                        </p>
                        <Link
                            to="/dashboard/vendor-upgrade"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest shadow-[0_0_24px_rgba(216,74,255,0.3)] hover:shadow-[0_0_36px_rgba(216,74,255,0.5)] hover:brightness-110 transition-all"
                        >
                            Set Up Vendor Account
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Vendor Stats (only if vendor) */}
            {user?.isVendor && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard
                            icon={DollarSign}
                            label="Total Earnings"
                            value={`$${(totalEarnings / 100).toFixed(2)}`}
                            loading={vendorLoading}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Total Payments"
                            value={totalPayments.toString()}
                            loading={vendorLoading}
                        />
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5">
                            <h3 className="text-white font-bold text-sm">Recent Payments</h3>
                        </div>
                        {vendorLoading ? (
                            <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                                Loading…
                            </div>
                        ) : recentPayments.length === 0 ? (
                            <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                                No payments yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {recentPayments.slice(0, 10).map((p) => (
                                    <li
                                        key={p.id}
                                        className="flex items-center justify-between px-5 py-3.5"
                                    >
                                        <div>
                                            <p className="text-white text-sm font-medium">
                                                {p.eventName || 'Ticket Sale'}
                                            </p>
                                            <p className="text-zinc-500 text-xs mt-0.5">
                                                {p.createdAt
                                                    ? new Date(p.createdAt).toLocaleDateString()
                                                    : '—'}
                                            </p>
                                        </div>
                                        <span className="text-green-400 font-bold text-sm">
                                            +${((p.netPayout ?? 0) / 100).toFixed(2)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, loading }) {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/8 flex items-center justify-center">
                    <Icon size={16} className="text-zinc-400" />
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {label}
                </span>
            </div>
            {loading ? (
                <div className="h-7 w-24 bg-zinc-800 rounded-lg animate-pulse" />
            ) : (
                <p className="text-white font-black text-2xl">{value}</p>
            )}
        </div>
    );
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}
