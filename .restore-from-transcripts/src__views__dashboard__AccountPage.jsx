'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Alert02Icon,
    CreditCardIcon,
    Delete02Icon,
    Loading02Icon,
    Mail01Icon,
    Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import SectionCard from '@/components/dashboard/SectionCard';
import GlowCard from '@/components/dashboard/GlowCard';

const DELETION_ITEMS = [
    'Your profile, name, username, and avatar',
    'All uploaded photos and videos',
    'Your PXI Passport and digital identity',
    'All biometric face data (FaceVector)',
    'Event history, tickets, and scrapbooks',
    'Odyssey points and activity feed',
    'Your Stripe connection and payout history',
];

const TABS = [
    { id: 'profile', label: 'Profile' },
    { id: 'billing', label: 'Billing & Payouts' },
    { id: 'usage', label: 'Usage & Costs' },
    { id: 'payments', label: 'Payment Methods' },
];

const USAGE_BREAKDOWN = [
    { name: 'Marketing sends', value: 420, color: '#c084fc' },
    { name: 'Ad boosts', value: 280, color: '#60a5fa' },
    { name: 'Data & storage', value: 160, color: '#34d399' },
];

function DonutPanel({ title, data, centerLabel, centerValue }) {
    return (
        <GlowCard className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
            <div className="relative mt-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={3}>
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{centerLabel}</span>
                    <span className="text-xl font-black text-white">{centerValue}</span>
                </div>
            </div>
            <ul className="mt-3 space-y-1.5">
                {data.map((item) => (
                    <li key={item.name} className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                        </span>
                        <span className="font-mono text-zinc-200">${item.value}</span>
                    </li>
                ))}
            </ul>
        </GlowCard>
    );
}

function AccountPageContent() {
    const { user, logout } = useAuth();
    const searchParams = useSearchParams();
    const activeTab = TABS.some((tab) => tab.id === searchParams.get('tab'))
        ? searchParams.get('tab')
        : 'profile';

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const usageTotal = useMemo(
        () => USAGE_BREAKDOWN.reduce((sum, item) => sum + item.value, 0),
        []
    );

    const handleDelete = async () => {
        setDeleting(true);
        setError('');
        try {
            await authService.deleteAccount();
            await logout();
            window.location.href = '/';
        } catch (err) {
            const status = err?.status;
            const code = err?.code;
            const msg = err?.data?.error || err?.message;
            if (status === 400 && msg === 'Account already deleted') {
                await logout();
                window.location.href = '/';
                return;
            }
            if (status === 401 || code === 'ACCOUNT_DELETED' || code === 'INVALID_TOKEN') {
                await logout();
                window.location.href = '/';
                return;
            }
            setError(msg || 'Failed to delete account. Please try again.');
            setDeleting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Account & Settings</h1>
                <p className="mt-1 text-sm text-zinc-500">Costs, payouts, and account controls — no plan tiers.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => (
                    <a
                        key={tab.id}
                        href={`/dashboard/account?tab=${tab.id}`}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                            activeTab === tab.id ? 'bg-white text-black' : 'glow-chip text-zinc-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </a>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                    {activeTab === 'profile' && (
                        <SectionCard title="Profile" subtitle="Identity surfaced from your PXI account." dense>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="glow-surface-soft rounded-xl px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Name</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{user?.name || '—'}</p>
                                </div>
                                <div className="glow-surface-soft rounded-xl px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Username</p>
                                    <p className="mt-1 text-sm font-semibold text-white">@{user?.username || 'account'}</p>
                                </div>
                                <div className="glow-surface-soft rounded-xl px-4 py-3 sm:col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                                        <HugeiconsIcon icon={Mail01Icon} size={14} className="text-zinc-500" />
                                        {user?.email || 'Add email in mobile app'}
                                    </p>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {activeTab === 'billing' && (
                        <SectionCard title="Billing & Payouts" subtitle="Stripe-connected vendor payouts and receivables." dense>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="glow-surface-soft rounded-xl px-4 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Next payout</p>
                                    <p className="mt-2 text-2xl font-black text-white">$1,240.00</p>
                                    <p className="mt-1 text-xs text-zinc-500">Est. arrival in 2 business days</p>
                                </div>
                                <div className="glow-surface-soft rounded-xl px-4 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Pending balance</p>
                                    <p className="mt-2 text-2xl font-black text-white">$386.50</p>
                                    <p className="mt-1 text-xs text-zinc-500">From recent ticket sales</p>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {activeTab === 'usage' && (
                        <SectionCard title="Usage & Costs" subtitle="Marketing, ads, and data consumption this cycle." dense>
                            <p className="text-sm text-zinc-400">
                                Total spend <span className="font-bold text-white">${usageTotal}</span> — itemized in the chart panel.
                            </p>
                        </SectionCard>
                    )}

                    {activeTab === 'payments' && (
                        <SectionCard title="Payment Methods" subtitle="Cards on file for boosts and platform costs." dense>
                            <div className="glow-surface-soft flex items-center justify-between rounded-xl px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <HugeiconsIcon icon={CreditCardIcon} size={20} className="text-pxi-purple" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Visa ···· 4242</p>
                                        <p className="text-xs text-zinc-500">Expires 09/28 · Default</p>
                                    </div>
                                </div>
                                <button type="button" className="glow-chip rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-300">
                                    Manage
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    <SectionCard title="Danger Zone" subtitle="Permanent account deletion." dense>
                        {!showConfirm ? (
                            <>
                                <p className="text-sm leading-relaxed text-zinc-400">
                                    Permanently delete your PXI account and all associated data. This cannot be undone.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(true)}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/15"
                                >
                                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                                    Delete My Account
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <ul className="space-y-2">
                                    {DELETION_ITEMS.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                                            <span className="mt-0.5 flex-shrink-0 text-red-500">×</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                {error ? (
                                    <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
                                ) : null}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {deleting ? (
                                            <>
                                                <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                                                Deleting…
                                            </>
                                        ) : (
                                            'Yes, Permanently Delete'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowConfirm(false); setError(''); }}
                                        disabled={deleting}
                                        className="glow-chip rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>

                <aside className="space-y-4">
                    {(activeTab === 'usage' || activeTab === 'billing') && (
                        <DonutPanel
                            title="Cost breakdown"
                            data={USAGE_BREAKDOWN}
                            centerLabel="This cycle"
                            centerValue={`$${usageTotal}`}
                        />
                    )}
                    {(activeTab === 'billing' || activeTab === 'payments') && (
                        <GlowCard className="p-5">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Payout rail</p>
                            <div className="mt-3 flex items-center gap-3">
                                <HugeiconsIcon icon={Wallet01Icon} size={20} className="text-emerald-400" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Stripe Connect</p>
                                    <p className="text-xs text-zinc-500">{user?.isVendor ? 'Connected' : 'Complete vendor setup'}</p>
                                </div>
                            </div>
                        </GlowCard>
                    )}
                    <GlowCard className="p-5">
                        <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
                            <HugeiconsIcon icon={Alert02Icon} size={14} className="mt-0.5 text-pxi-purple" />
                            Billing figures are mock until Stripe dashboard sync is wired for web.
                        </p>
                    </GlowCard>
                </aside>
            </div>
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-5xl p-8 text-zinc-500">Loading account…</div>}>
            <AccountPageContent />
        </Suspense>
    );
}
