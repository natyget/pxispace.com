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
import { api } from '@/services/api';
import { listAdCampaigns } from '@/services/ads';
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
        <div className="dashboard-surface rounded-[1.25rem] p-5">
            <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">{title}</p>
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
                    <span className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">{centerLabel}</span>
                    <span className="text-xl font-bold text-white">{centerValue}</span>
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
        <section className="flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
                <p className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-500">
                    Account
                    <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">@{user?.username || 'account'}</span>
                </p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Settings</h1>
                <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500">
                    Your identity, music, billing rails, and account controls.
                </p>
            </div>
            <p className="shrink-0 text-sm text-zinc-500 lg:pb-1">
                Viewing <span className="font-semibold text-zinc-300">{activeLabel}</span>
            </p>
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
                    <span className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Display name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={profileInputCls} />
                </label>
                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3">
                    <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Username</p>
                    <p className="mt-2 text-sm font-semibold text-white">@{user?.username || 'account'}</p>
                </div>
                <label className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3 sm:col-span-2">
                    <span className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Bio</span>
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
                    <span className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">City</span>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Where you're based" className={profileInputCls} />
                </label>
                <label className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.02em] text-zinc-500">
                        <HugeiconsIcon icon={InstagramIcon} size={13} />
                        Instagram
                    </span>
                    <input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@handle" className={profileInputCls} />
                </label>
                <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Email</p>
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

/** Ensure MusicKit JS is loaded, configured, and return the instance. */
async function getConfiguredMusicKit() {
    if (!window.MusicKit) {
        await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-musickit]');
            const onLoaded = () => resolve();
            document.addEventListener('musickitloaded', onLoaded, { once: true });
            if (!existing) {
                const s = document.createElement('script');
                s.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
                s.async = true;
                s.dataset.musickit = '1';
                s.onerror = () => reject(new Error('Could not load Apple MusicKit'));
                document.head.appendChild(s);
            }
            setTimeout(() => reject(new Error('Apple MusicKit took too long to load')), 15000);
        });
    }
    const { developerToken } = await musicService.getAppleDeveloperToken();
    await window.MusicKit.configure({
        developerToken,
        app: { name: 'PXI', build: '1.0' },
    });
    return window.MusicKit.getInstance();
}

/** Spotify + Apple Music connect/disconnect. One provider at a time powers match scores. */
function MusicConnectionsCard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const refreshProfile = () => {
        return musicService
            .getProfile()
            .then(setProfile)
            .catch(() => setProfile(null));
    };

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

    const connectApple = async () => {
        setBusy(true);
        setError('');
        try {
            const music = await getConfiguredMusicKit();
            const musicUserToken = await music.authorize();
            if (!musicUserToken) throw new Error('Authorization was cancelled.');
            await musicService.connectAppleMusic(musicUserToken);
            await refreshProfile();
        } catch (err) {
            const message =
                err?.code === 'APPLE_MUSIC_UNCONFIGURED'
                    ? 'Apple Music is not configured yet — try again later.'
                    : err?.code === 'APPLE_MUSIC_EMPTY_LIBRARY'
                        ? 'Your Apple Music library looks empty — save some songs and try again.'
                        : err?.message || 'Could not connect Apple Music';
            setError(message);
        } finally {
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
    const provider = profile?.provider || null;
    const spotifyConnected = connected && provider !== 'APPLE_MUSIC';
    const appleConnected = connected && provider === 'APPLE_MUSIC';
    const genresSuffix = profile?.topGenres?.length ? ` · ${profile.topGenres.slice(0, 3).join(', ')}` : '';

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
                            : spotifyConnected
                                ? `Connected${genresSuffix}. Powers your event match scores.`
                                : 'Connect to get events matched to your music taste.'}
                    </p>
                    </div>
                </div>
                {spotifyConnected ? (
                    <button
                        type="button"
                        onClick={disconnect}
                        disabled={busy}
                        className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:opacity-50"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={connect}
                        disabled={busy || loading}
                        className="rounded-full bg-[#1DB954] px-5 py-2 text-xs font-bold tracking-[0.02em] text-black disabled:opacity-50"
                    >
                        {busy ? 'Opening...' : 'Connect Spotify'}
                    </button>
                )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fa2d48]/15 text-[#fa2d48]">
                        <HugeiconsIcon icon={MusicNote01Icon} size={18} />
                    </div>
                    <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Apple Music</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        {loading
                            ? 'Checking connection...'
                            : appleConnected
                                ? `Connected${genresSuffix}. Powers your event match scores.`
                                : 'Connect your Apple Music library for event matching.'}
                    </p>
                    </div>
                </div>
                {appleConnected ? (
                    <button
                        type="button"
                        onClick={disconnect}
                        disabled={busy}
                        className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:opacity-50"
                    >
                        Disconnect
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={connectApple}
                        disabled={busy || loading}
                        className="rounded-full bg-[#fa2d48] px-5 py-2 text-xs font-bold tracking-[0.02em] text-white disabled:opacity-50"
                    >
                        {busy ? 'Opening...' : 'Connect Apple Music'}
                    </button>
                )}
            </div>
            <p className="mt-3 text-xs text-zinc-600">One provider at a time — connecting the other replaces your taste profile.</p>
            {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </SettingsSurface>
    );
}

function SettingsSurface({ eyebrow, title, children, action = null }) {
    return (
        <section className="dashboard-surface rounded-[1.25rem] p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    {eyebrow ? <p className="text-[11px] font-medium tracking-[0.02em] text-white/35">{eyebrow}</p> : null}
                    <h2 className="mt-1 text-xl font-bold text-white">{title}</h2>
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
    const [billing, setBilling] = useState(null);
    const [usageBreakdown, setUsageBreakdown] = useState([]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (activeTab === 'billing' || activeTab === 'payments') {
            authService.getVendorDashboard().then(setBilling).catch(() => setBilling(null));
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'usage') return;
        let cancelled = false;
        Promise.all([
            api.get('/api/campaigns').then((r) => r.campaigns || []).catch(() => []),
            listAdCampaigns().then((r) => r.campaigns || []).catch(() => []),
        ]).then(([campaigns, adCampaigns]) => {
            if (cancelled) return;
            const marketingSendsCents = campaigns
                .filter((c) => c.status === 'SENT')
                .reduce((sum, c) => sum + (c.priceCents || 0), 0);
            const adBoostsCents = adCampaigns
                .filter((c) => !['DRAFT', 'CANCELLED'].includes(c.status))
                .reduce((sum, c) => sum + (c.priceCents || 0), 0);
            setUsageBreakdown([
                { name: 'Marketing sends', value: Math.round(marketingSendsCents) / 100 },
                { name: 'Ad boosts', value: Math.round(adBoostsCents) / 100 },
            ]);
        });
        return () => { cancelled = true; };
    }, [activeTab]);

    const usageTotal = useMemo(
        () => usageBreakdown.reduce((sum, item) => sum + item.value, 0),
        [usageBreakdown]
    );
    const paidOutCents = useMemo(
        () => (billing?.payouts || []).filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        [billing]
    );
    const availableBalanceCents = Math.max(0, (billing?.aggregates?.netPayout || 0) - paidOutCents);
    const lastPayout = billing?.payouts?.[0] || null;
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

            <div className="grid w-full grid-cols-2 gap-1 rounded-[1rem] bg-white/[0.045] p-1 sm:flex sm:w-fit sm:rounded-full" role="tablist" aria-label="Account settings sections">
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
                            {!billing ? (
                                <p className="text-sm text-zinc-500">Loading real payout data...</p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                                        <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Available balance</p>
                                        <p className="mt-2 text-2xl font-bold text-white">${(availableBalanceCents / 100).toFixed(2)}</p>
                                        <p className="mt-1 text-xs text-zinc-500">Net of PXI fees, not yet paid out by Stripe</p>
                                    </div>
                                    <div className="rounded-[1.25rem] bg-white/[0.035] px-4 py-4">
                                        <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Most recent payout</p>
                                        <p className="mt-2 text-2xl font-bold text-white">
                                            {lastPayout ? `$${(lastPayout.amount / 100).toFixed(2)}` : '—'}
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            {lastPayout
                                                ? `${lastPayout.status === 'paid' ? 'Paid' : 'Failed'}${lastPayout.arrivalDate ? ' · ' + new Date(lastPayout.arrivalDate).toLocaleDateString() : ''}`
                                                : 'No payouts yet'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </SettingsSurface>
                    )}

                    {activeTab === 'usage' && (
                        <SettingsSurface eyebrow="All-time" title="Usage & costs">
                            {!usageBreakdown.length ? (
                                <p className="text-sm text-zinc-500">No paid marketing or ad spend yet.</p>
                            ) : (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {usageBreakdown.map((item) => (
                                            <div key={item.name} className="rounded-[1.25rem] bg-white/[0.035] p-4">
                                                <p className="text-[11px] font-medium tracking-[0.02em] text-white/35">{item.name}</p>
                                                <p className="mt-2 text-2xl font-bold text-white">${item.value.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-sm text-zinc-400">
                                        Total spend <span className="font-bold text-white">${usageTotal.toFixed(2)}</span> all-time (email campaigns + ad boosts).
                                    </p>
                                </>
                            )}
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
                                    className="pill-ghost cursor-not-allowed px-3 py-1.5 text-xs font-bold tracking-[0.02em] opacity-40"
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
                        {activeTab === 'usage' && usageBreakdown.length > 0 && (
                            <DonutPanel
                                title="Cost breakdown"
                                data={usageBreakdown}
                                centerLabel="All-time"
                                centerValue={`$${usageTotal.toFixed(2)}`}
                            />
                        )}
                        {(activeTab === 'billing' || activeTab === 'payments') && (
                            <div className="dashboard-surface rounded-[1.25rem] p-5">
                                <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Payout rail</p>
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
