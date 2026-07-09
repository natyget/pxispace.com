'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    CreditCardIcon,
    Delete02Icon,
    InstagramIcon,
    Loading02Icon,
    Mail01Icon,
    MusicNote01Icon,
    SecurityCheckIcon,
    UserIcon,
    Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { musicService } from '@/services/music';
import { getSingleShadeDonutCellProps } from '@/components/dashboard/chartStyles';

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
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'billing', label: 'Payouts', icon: Wallet01Icon },
    { id: 'usage', label: 'Usage', icon: SecurityCheckIcon },
    { id: 'payments', label: 'Cards', icon: CreditCardIcon },
];

const USAGE_BREAKDOWN = [
    { name: 'Marketing sends', value: 420 },
    { name: 'Ad boosts', value: 280 },
    { name: 'Data & storage', value: 160 },
];

function UsageTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="rounded-xl bg-black/90 px-3 py-2 text-xs shadow-2xl">
            <p className="font-bold text-white">{item.name}</p>
            <p className="mt-1 font-mono font-bold text-zinc-200">${item.value}</p>
        </div>
    );
}

function DonutPanel({ title, data, centerLabel, centerValue }) {
    return (
        <div className="dashboard-surface rounded-[1.5rem] p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
            <div className="relative mt-4 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={3} cornerRadius={8}>
                            {data.map((entry, index) => (
                                <Cell key={entry.name} {...getSingleShadeDonutCellProps(index)} />
                            ))}
                        </Pie>
                        <Tooltip content={<UsageTooltip />} cursor={false} wrapperStyle={{ outline: 'none' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{centerLabel}</span>
                    <span className="text-xl font-black text-white">{centerValue}</span>
                </div>
            </div>
        </div>
    );
}

const profileInputCls =
    'mt-2 w-full rounded-[1rem] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white placeholder:text-zinc-600 outline-none transition focus:bg-white/[0.065] focus:ring-1 focus:ring-white/12';

function SettingsHero({ user, activeTab }) {
    const activeLabel = TABS.find((tab) => tab.id === activeTab)?.label || 'Profile';
    return (
        <section className="dashboard-surface-b relative overflow-hidden rounded-[1.75rem] px-5 py-7 md:px-8">
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
                <div className="max-w-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">PXI Account</p>
                    <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-normal text-white md:text-6xl">Account settings</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                        Your identity, music, billing rails, and account controls.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[1.25rem] bg-white/[0.04] p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Account</p>
                        <p className="mt-2 truncate text-lg font-black text-white">@{user?.username || 'account'}</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/[0.04] p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Section</p>
                        <p className="mt-2 truncate text-lg font-black text-white">{activeLabel}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Editable profile fields (bio etc.) + save via PUT /api/auth/user/:id. */
function ProfileEditor({ user, updateUser }) {
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [city, setCity] = useState(user?.city || '');
    const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const save = async () => {
        if (!user?.id) return;
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const res = await authService.updateProfile(user.id, {
                name: name.trim() || null,
                bio: bio.trim() || null,
                city: city.trim() || null,
                instagramHandle: instagramHandle.trim() || null,
            });
            if (res?.user) updateUser(res.user);
            setSaved(true);
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsSurface eyebrow="Identity" title="Profile">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Display name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={profileInputCls} />
                </label>
                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Username</p>
                    <p className="mt-2 text-sm font-semibold text-white">@{user?.username || 'account'}</p>
                </div>
                <label className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3 sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Bio</span>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={280}
                        placeholder="Tell people what you're about..."
                        className={`${profileInputCls} resize-y`}
                    />
                    <span className="mt-1 block text-right text-[10px] text-zinc-600">{bio.length}/280</span>
                </label>
                <label className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">City</span>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Where you're based" className={profileInputCls} />
                </label>
                <label className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <HugeiconsIcon icon={InstagramIcon} size={13} />
                        Instagram
                    </span>
                    <input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@handle" className={profileInputCls} />
                </label>
                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                        <HugeiconsIcon icon={Mail01Icon} size={14} className="text-zinc-500" />
                        {user?.email || 'Add email in mobile app'}
                    </p>
                </div>
            </div>
            {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
            {saved ? <p className="mt-3 text-xs text-emerald-400">Profile saved.</p> : null}
            <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
                {saving ? 'Saving...' : 'Save profile'}
            </button>
        </SettingsSurface>
    );
}

/** Spotify connect/disconnect (Apple Music connects in the mobile app). */
function MusicConnectionsCard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        musicService
            .getProfile()
            .then((res) => { if (!cancelled) setProfile(res); })
            .catch(() => { if (!cancelled) setProfile(null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const connect = async () => {
        setBusy(true);
        setError('');
        try {
            const { authorizeUrl } = await musicService.startSpotifyConnect();
            window.location.href = authorizeUrl;
        } catch (err) {
            setError(err?.message || 'Could not start Spotify connect');
            setBusy(false);
        }
    };

    const disconnect = async () => {
        setBusy(true);
        setError('');
        try {
            await musicService.disconnect();
            setProfile({ connected: false });
        } catch (err) {
            setError(err?.message || 'Could not disconnect');
        } finally {
            setBusy(false);
        }
    };

    const connected = Boolean(profile?.connected);

    return (
        <SettingsSurface eyebrow="Personalization" title="Music">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954]">
                        <HugeiconsIcon icon={MusicNote01Icon} size={18} />
                    </div>
                    <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Spotify</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        {loading
                            ? 'Checking connection...'
                            : connected
                                ? `Connected${profile?.topGenres?.length ? ` · ${profile.topGenres.slice(0, 3).join(', ')}` : ''}. Powers your event match scores.`
                                : 'Connect to get events matched to your music taste.'}
                    </p>
                    </div>
                </div>
                {connected ? (
                    <button
                        type="button"
                        onClick={disconnect}
                        disabled={busy}
                        className="pill-ghost px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={connect}
                        disabled={busy || loading}
                        className="rounded-full bg-[#1DB954] px-5 py-2 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50"
                    >
                        {busy ? 'Opening...' : 'Connect Spotify'}
                    </button>
                )}
            </div>
            <p className="mt-3 text-xs text-zinc-600">Apple Music connects from the PXI mobile app.</p>
            {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </SettingsSurface>
    );
}

function SettingsSurface({ eyebrow, title, children, action = null }) {
    return (
        <section className="dashboard-surface rounded-[1.5rem] p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">{eyebrow}</p> : null}
                    <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function AccountPageContent() {
    const { user, logout, updateUser } = useAuth();
    const searchParams = useSearchParams();
    const activeTab = TABS.some((tab) => tab.id === searchParams.get('tab'))
        ? searchParams.get('tab')
        : 'profile';

    const [mounted, setMounted] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const usageTotal = useMemo(
        () => USAGE_BREAKDOWN.reduce((sum, item) => sum + item.value, 0),
        []
    );
    const showSettingsAside = activeTab === 'usage' || activeTab === 'billing' || activeTab === 'payments';

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

    if (!mounted) {
        return <div className="mx-auto max-w-6xl space-y-6 md:space-y-8" />;
    }

    return (
        <div className="mx-auto max-w-6xl space-y-5 md:space-y-6">
            <SettingsHero user={user} activeTab={activeTab} />

            <div className="grid w-full grid-cols-2 gap-1 rounded-[1.35rem] bg-white/[0.045] p-1 sm:flex sm:w-fit sm:rounded-full" role="tablist" aria-label="Account settings sections">
                {TABS.map((tab) => (
                    <a
                        key={tab.id}
                        href={`/dashboard/account?tab=${tab.id}`}
                        className="dashboard-segmented-toggle__item flex items-center justify-center gap-2 px-3 sm:flex-none"
                        data-active={activeTab === tab.id}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        <HugeiconsIcon icon={tab.icon} size={14} />
                        {tab.label}
                    </a>
                ))}
            </div>

            <div className={`grid grid-cols-1 gap-5 ${showSettingsAside ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
                <div className="space-y-5">
                    {activeTab === 'profile' && (
                        <>
                            <ProfileEditor user={user} updateUser={updateUser} />
                            <MusicConnectionsCard />
                        </>
                    )}

                    {activeTab === 'billing' && (
                        <SettingsSurface eyebrow="Money movement" title="Billing & payouts">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Next payout</p>
                                    <p className="mt-2 text-2xl font-black text-white">$1,240.00</p>
                                    <p className="mt-1 text-xs text-zinc-500">Est. arrival in 2 business days</p>
                                </div>
                                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Pending balance</p>
                                    <p className="mt-2 text-2xl font-black text-white">$386.50</p>
                                    <p className="mt-1 text-xs text-zinc-500">From recent ticket sales</p>
                                </div>
                            </div>
                        </SettingsSurface>
                    )}

                    {activeTab === 'usage' && (
                        <SettingsSurface eyebrow="Current cycle" title="Usage & costs">
                            <div className="grid gap-3 sm:grid-cols-3">
                                {USAGE_BREAKDOWN.map((item) => (
                                    <div key={item.name} className="rounded-[1.25rem] bg-white/[0.035] p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{item.name}</p>
                                        <p className="mt-2 text-2xl font-black text-white">${item.value}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-sm text-zinc-400">
                                Total spend <span className="font-bold text-white">${usageTotal}</span> this cycle.
                            </p>
                        </SettingsSurface>
                    )}

                    {activeTab === 'payments' && (
                        <SettingsSurface eyebrow="Checkout" title="Payment methods">
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.055]">
                                        <HugeiconsIcon icon={CreditCardIcon} size={20} className="text-white opacity-70" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Cards are entered at checkout</p>
                                        <p className="text-xs text-zinc-500">PXI doesn&apos;t store payment methods — Stripe handles each purchase securely.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled
                                    title="Saved payment methods are not available yet — cards are entered per purchase at checkout"
                                    className="pill-ghost cursor-not-allowed px-3 py-1.5 text-xs font-bold uppercase tracking-widest opacity-40"
                                >
                                    Manage
                                </button>
                            </div>
                        </SettingsSurface>
                    )}

                    <SettingsSurface eyebrow="Security" title="Account controls">
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
                                                Deleting...
                                            </>
                                        ) : (
                                            'Yes, Permanently Delete'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowConfirm(false); setError(''); }}
                                        disabled={deleting}
                                        className="pill-ghost px-4 py-2.5 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </SettingsSurface>
                </div>

                {showSettingsAside && (
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
                            <div className="dashboard-surface rounded-[1.5rem] p-5">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Payout rail</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <HugeiconsIcon icon={Wallet01Icon} size={20} className="text-emerald-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Stripe Connect</p>
                                        <p className="text-xs text-zinc-500">{user?.isVendor ? 'Connected' : 'Complete hosting setup'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-5xl p-8 text-zinc-500">Loading account...</div>}>
            <AccountPageContent />
        </Suspense>
    );
}
