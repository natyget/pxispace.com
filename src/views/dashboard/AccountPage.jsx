'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Camera01Icon,
    InstagramIcon,
    Loading02Icon,
    Mail01Icon,
    MusicNote01Icon,
    UserIcon,
} from '@hugeicons/core-free-icons';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { musicService } from '@/services/music';
import { api } from '@/services/api';
import { listAdCampaigns } from '@/services/ads';
import { uploadImageToR2 } from '@/services/media';
import { getSingleShadeDonutCellProps } from '@/components/dashboard/chartStyles';
import AppleMusicConnectPanel from '@/components/music/AppleMusicConnectPanel';
import { Button, PageHeader, Panel, Skeleton, WordTabs } from '@/components/dashboard/ui/kit';
import { money, shortDate } from '@/lib/dashFormat';

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
    { id: 'billing', label: 'Payouts' },
    { id: 'usage', label: 'Usage' },
];

function UsageTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="rounded-2xl bg-pxi-field px-3.5 py-2.5 text-[13px]">
            <p className="font-semibold text-white">{item.name}</p>
            <p className="mt-1 tabular-nums text-white/70">{money(Math.round(item.value * 100))}</p>
        </div>
    );
}

function DonutPanel({ title, data, centerLabel, centerValue }) {
    return (
        <Panel title={title}>
            <div className="relative h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={3} cornerRadius={8} isAnimationActive={false}>
                            {data.map((entry, index) => (
                                <Cell key={entry.name} {...getSingleShadeDonutCellProps(index)} />
                            ))}
                        </Pie>
                        <Tooltip content={<UsageTooltip />} cursor={false} wrapperStyle={{ outline: 'none' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[12px] text-white/45">{centerLabel}</span>
                    <span className="text-xl font-semibold text-white">{centerValue}</span>
                </div>
            </div>
        </Panel>
    );
}

const profileInputCls =
    'mt-2 w-full rounded-[1rem] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white placeholder:text-zinc-600 outline-none transition focus:bg-white/[0.065] focus:ring-1 focus:ring-white/12';

/** Editable profile fields (avatar, username, bio etc.) + save via PUT /api/auth/user/:id. */
function ProfileEditor({ user, updateUser }) {
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    // Strict city picker: free text is never submitted — only selections from the
    // curated /api/meta/cities list are stored (canonical city + IATA cityCode).
    const [cityPick, setCityPick] = useState(
        user?.city ? { city: user.city, cityCode: user?.cityCode || null } : null
    );
    const [cityInput, setCityInput] = useState(
        user?.city ? (user?.cityCode ? `${user.city} (${user.cityCode})` : user.city) : ''
    );
    const [cityDirty, setCityDirty] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [cityOpen, setCityOpen] = useState(false);
    const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [username, setUsername] = useState(user?.username || '');
    const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
    const [birthdate, setBirthdate] = useState(user?.birthdate ? String(user.birthdate).slice(0, 10) : '');
    const [showAge, setShowAge] = useState(Boolean(user?.showAge));
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const usernameChanged = username.trim() !== (user?.username || '');

    useEffect(() => {
        if (!usernameChanged || !username.trim()) {
            setUsernameStatus(null);
            return undefined;
        }
        setUsernameStatus('checking');
        const timer = setTimeout(() => {
            api.get(`/api/auth/check-username?username=${encodeURIComponent(username.trim())}&userId=${encodeURIComponent(user?.id || '')}`)
                .then((res) => {
                    if (res.reason === 'invalid_format') setUsernameStatus('invalid');
                    else setUsernameStatus(res.available ? 'available' : 'taken');
                })
                .catch(() => setUsernameStatus(null));
        }, 400);
        return () => clearTimeout(timer);
    }, [username, usernameChanged, user?.id]);

    // Debounced typeahead against the curated city dataset. A locked selection
    // (cityPick) or empty text means there is nothing to search.
    useEffect(() => {
        const q = cityInput.trim();
        if (!q || cityPick) {
            setCitySuggestions([]);
            return undefined;
        }
        const timer = setTimeout(() => {
            api.get(`/api/meta/cities?q=${encodeURIComponent(q)}`)
                .then((res) => setCitySuggestions(res?.cities || []))
                .catch(() => setCitySuggestions([]));
        }, 300);
        return () => clearTimeout(timer);
    }, [cityInput, cityPick]);

    const onCityInputChange = (value) => {
        setCityInput(value);
        setCityDirty(true);
        setCityPick(null);
        setCityOpen(true);
    };

    const pickCity = (c) => {
        setCityPick({ city: c.city, cityCode: c.code });
        setCityInput(c.label);
        setCityDirty(true);
        setCitySuggestions([]);
        setCityOpen(false);
    };

    const pickAvatar = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadingAvatar(true);
        setError('');
        try {
            const publicUrl = await uploadImageToR2(file, {
                filename: `avatar_${Date.now()}.${(file.name?.split('.').pop() || 'jpg').toLowerCase()}`,
                contentType: file.type || 'image/jpeg',
            });
            setAvatarUrl(publicUrl);
        } catch (err) {
            setError(err?.message || 'Could not upload photo');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const save = async () => {
        if (!user?.id) return;
        if (usernameChanged && (usernameStatus === 'taken' || usernameStatus === 'invalid')) {
            setError(usernameStatus === 'taken' ? 'That username is taken.' : 'That username has an invalid format.');
            return;
        }
        // Strict picker: typed-but-unpicked city text is never submitted.
        if (cityDirty && cityInput.trim() && !cityPick) {
            setError('Pick a city from the list.');
            return;
        }
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const res = await authService.updateProfile(user.id, {
                name: name.trim() || null,
                bio: bio.trim() || null,
                // Only send city when the field was actually edited: a picked entry
                // stores canonical city + code, a cleared field wipes both.
                ...(cityDirty
                    ? {
                        city: cityPick ? cityPick.city : null,
                        cityCode: cityPick ? cityPick.cityCode : null,
                    }
                    : {}),
                instagramHandle: instagramHandle.trim() || null,
                ...(avatarUrl && avatarUrl !== user?.avatarUrl ? { avatarUrl } : {}),
                ...(usernameChanged && username.trim() ? { username: username.trim() } : {}),
                birthdate: birthdate || null,
                showAge,
            });
            if (res?.user) updateUser(res.user);
            setSaved(true);
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const usernameHint =
        usernameStatus === 'checking' ? { text: 'Checking availability...', cls: 'text-zinc-500' }
        : usernameStatus === 'available' ? { text: 'Available', cls: 'text-emerald-400' }
        : usernameStatus === 'taken' ? { text: 'Taken', cls: 'text-red-400' }
        : usernameStatus === 'invalid' ? { text: 'Letters, numbers and underscores only', cls: 'text-red-400' }
        : null;

    return (
        <SettingsSurface>
            <div className="mb-5 flex items-center gap-4">
                <div className="relative">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="h-[72px] w-[72px] rounded-full object-cover" />
                    ) : (
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-pxi-field">
                            <HugeiconsIcon icon={UserIcon} size={28} className="text-zinc-500" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        aria-label="Change profile photo"
                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-pxi-purple text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
                    >
                        {uploadingAvatar
                            ? <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                            : <HugeiconsIcon icon={Camera01Icon} size={14} />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">Profile photo</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Shown on your passport, events, and posts. Saved when you save the profile.</p>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-[1.25rem] bg-pxi-field px-4 py-3">
                    <span className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Display name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={profileInputCls} />
                </label>
                <label className="rounded-[1.25rem] bg-pxi-field px-4 py-3">
                    <span className="flex items-center justify-between text-[11px] font-bold tracking-[0.02em] text-zinc-500">
                        Username
                        {usernameHint ? <span className={`font-medium ${usernameHint.cls}`}>{usernameHint.text}</span> : null}
                    </span>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                        placeholder="username"
                        className={profileInputCls}
                    />
                </label>
                <label className="rounded-[1.25rem] bg-pxi-field px-4 py-3 sm:col-span-2">
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
                <div className="relative rounded-[1.25rem] bg-pxi-field px-4 py-3">
                    <span className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">City</span>
                    <input
                        value={cityInput}
                        onChange={(e) => onCityInputChange(e.target.value)}
                        onFocus={() => {
                            if (citySuggestions.length > 0) setCityOpen(true);
                        }}
                        onBlur={() => setTimeout(() => setCityOpen(false), 200)}
                        placeholder="Where you're based"
                        className={profileInputCls}
                    />
                    {cityOpen && citySuggestions.length > 0 && (
                        <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-[1.25rem] bg-pxi-field shadow-xl">
                            {citySuggestions.map((c, i) => (
                                <button
                                    key={c.code || i}
                                    type="button"
                                    onClick={() => pickCity(c)}
                                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5"
                                >
                                    <span className="text-sm font-medium text-white">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <label className="rounded-[1.25rem] bg-pxi-field px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.02em] text-zinc-500">
                        <HugeiconsIcon icon={InstagramIcon} size={13} />
                        Instagram
                    </span>
                    <input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@handle" className={profileInputCls} />
                </label>
                <label className="rounded-[1.25rem] bg-pxi-field px-4 py-3">
                    <span className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Birthday</span>
                    <input
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className={`${profileInputCls} [color-scheme:dark]`}
                    />
                </label>
                <div className="flex items-center justify-between rounded-[1.25rem] bg-pxi-field px-4 py-3">
                    <div>
                        <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Show age</p>
                        <p className="mt-1 text-xs text-zinc-500">Display your age on your profile</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={showAge}
                        onClick={() => setShowAge((v) => !v)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${showAge ? 'bg-pxi-purple' : 'bg-pxi-cancel'}`}
                    >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${showAge ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                </div>
                <div className="rounded-[1.25rem] bg-pxi-field px-4 py-3 sm:col-span-2">
                    <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Email</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                        <HugeiconsIcon icon={Mail01Icon} size={14} className="text-zinc-500" />
                        {user?.email || 'Not set'}
                    </p>
                </div>
            </div>
            {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
            {saved ? <p className="mt-3 text-xs text-emerald-400">Profile saved.</p> : null}
            <button
                type="button"
                onClick={save}
                disabled={saving || uploadingAvatar}
                className="mt-4 rounded-full bg-pxi-purple px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50 uppercase tracking-[0.08em]"
            >
                {saving ? 'Saving...' : 'Save profile'}
            </button>
        </SettingsSurface>
    );
}

/**
 * Music Match connection: Apple Music (2026-10-06, the founder brought it back and retired Spotify, whose
 * development mode allows only a handful of users). Connecting opens AppleMusicConnectPanel, which shows the
 * disclosure before MusicKit asks Apple. A Spotify profile from before the switch still counts until its owner
 * disconnects it, but there is no new Spotify connect.
 */
function MusicConnectionsCard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [connecting, setConnecting] = useState(false);

    const loadProfile = () =>
        musicService
            .getProfile()
            .then((res) => setProfile(res))
            .catch(() => setProfile(null));

    useEffect(() => {
        let cancelled = false;
        musicService
            .getProfile()
            .then((res) => { if (!cancelled) setProfile(res); })
            .catch(() => { if (!cancelled) setProfile(null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

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
    const isLegacySpotify = connected && provider === 'SPOTIFY';
    const genresSuffix = profile?.topGenres?.length ? `, ${profile.topGenres.slice(0, 3).join(', ')}` : '';
    const providerLabel = isLegacySpotify ? 'Spotify' : 'Apple Music';
    const status = loading
        ? 'Checking connection...'
        : isLegacySpotify
            ? 'Spotify is no longer supported. Disconnect it, then connect Apple Music.'
            : connected
                ? `Connected${genresSuffix}. Powers your event match scores.`
                : 'Connect to get events matched to your music taste.';

    return (
        <SettingsSurface title="Music">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-pxi-field px-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A523EF]/15 text-[#A523EF]">
                        <HugeiconsIcon icon={MusicNote01Icon} size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{providerLabel}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{status}</p>
                    </div>
                </div>
                {connected ? (
                    <button
                        type="button"
                        onClick={disconnect}
                        disabled={busy}
                        className="pill-ghost px-4 py-2 text-xs font-bold tracking-[0.02em] disabled:opacity-50"
                    >
                        Disconnect
                    </button>
                ) : !connecting ? (
                    <button
                        type="button"
                        onClick={() => setConnecting(true)}
                        disabled={loading}
                        className="rounded-full bg-[#A523EF] px-5 py-2 text-xs font-bold tracking-[0.02em] text-white disabled:opacity-50"
                    >
                        Connect Apple Music
                    </button>
                ) : null}
            </div>
            {!connected && connecting ? (
                <AppleMusicConnectPanel
                    entryPoint="account_settings"
                    onConnected={() => {
                        setConnecting(false);
                        void loadProfile();
                    }}
                    onCancel={() => setConnecting(false)}
                />
            ) : null}
            {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </SettingsSurface>
    );
}

/** A settings card: the kit Panel, so it matches every other dashboard page. */
function SettingsSurface({ title = null, children, action = null }) {
    return (
        <Panel title={title} action={action}>
            {children}
        </Panel>
    );
}

function AccountPageContent() {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
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
        if (activeTab === 'billing') {
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
    const showSettingsAside = activeTab === 'usage' || activeTab === 'billing';

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
        return <div />;
    }

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader title="Settings" />

            <WordTabs
                items={TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                value={activeTab}
                onChange={(key) => router.replace(`/dashboard/account?tab=${key}`, { scroll: false })}
            />

            <div className={`grid items-start gap-5 ${showSettingsAside ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
                <div className="min-w-0 space-y-5 md:space-y-6">
                    {activeTab === 'profile' && (
                        <>
                            <ProfileEditor user={user} updateUser={updateUser} />
                            <MusicConnectionsCard />
                        </>
                    )}

                    {activeTab === 'billing' && (
                        <SettingsSurface>
                            {!billing ? (
                                <Skeleton className="h-28" />
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-pxi-field px-4 py-4">
                                        <p className="text-[12px] text-white/45">Available balance</p>
                                        <p className="mt-2 text-[22px] font-semibold leading-none text-white">{money(availableBalanceCents)}</p>
                                        <p className="mt-2 text-[12px] text-white/40">After PXI fees, not yet paid out</p>
                                    </div>
                                    <div className="rounded-2xl bg-pxi-field px-4 py-4">
                                        <p className="text-[12px] text-white/45">Most recent payout</p>
                                        <p className="mt-2 text-[22px] font-semibold leading-none text-white">
                                            {lastPayout ? money(lastPayout.amount) : '-'}
                                        </p>
                                        <p className="mt-2 text-[12px] text-white/40">
                                            {lastPayout
                                                ? `${lastPayout.status === 'paid' ? 'Paid' : 'Failed'}${lastPayout.arrivalDate ? ', ' + shortDate(lastPayout.arrivalDate) : ''}`
                                                : 'No payouts yet'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </SettingsSurface>
                    )}

                    {activeTab === 'usage' && (
                        <SettingsSurface>
                            {!usageBreakdown.length ? (
                                <p className="text-[14px] text-white/50">No paid marketing or ad spend yet.</p>
                            ) : (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {usageBreakdown.map((item) => (
                                            <div key={item.name} className="rounded-2xl bg-pxi-field px-4 py-4">
                                                <p className="text-[12px] text-white/45">{item.name}</p>
                                                <p className="mt-2 text-[22px] font-semibold leading-none text-white">{money(Math.round(item.value * 100))}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[14px] text-white/60">
                                        All-time total <span className="font-semibold text-white">{money(Math.round(usageTotal * 100))}</span>
                                    </p>
                                </>
                            )}
                        </SettingsSurface>
                    )}

                </div>

                {showSettingsAside && (
                    <aside className="min-w-0 space-y-5 md:space-y-6">
                        {activeTab === 'usage' && usageBreakdown.length > 0 && (
                            <DonutPanel
                                title="Cost breakdown"
                                data={usageBreakdown}
                                centerLabel="All-time"
                                centerValue={money(Math.round(usageTotal * 100))}
                            />
                        )}
                        {activeTab === 'billing' && (
                            <Panel title="Stripe">
                                <p className="text-[14px] text-white/60">
                                    {user?.isVendor ? 'Payouts go to your bank through Stripe.' : 'Finish hosting setup to receive payouts.'}
                                </p>
                            </Panel>
                        )}
                    </aside>
                )}
            </div>

            <SettingsSurface title="Delete account">
                {!showConfirm ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[14px] text-white/60">
                            Deletes your PXI account and everything on it. This cannot be undone.
                        </p>
                        <Button variant="danger" onClick={() => setShowConfirm(true)}>
                            Delete
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ul className="space-y-2">
                            {DELETION_ITEMS.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-[14px] text-white/60">
                                    <span className="mt-0.5 flex-shrink-0 text-red-400">×</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        {error ? (
                            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-[13px] text-red-200">{error}</p>
                        ) : null}
                        <div className="flex items-center gap-3">
                            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? (
                                    <>
                                        <HugeiconsIcon icon={Loading02Icon} size={14} className="animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Yes, delete account'
                                )}
                            </Button>
                            <Button onClick={() => { setShowConfirm(false); setError(''); }} disabled={deleting}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </SettingsSurface>
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<Skeleton className="h-40" />}>
            <AccountPageContent />
        </Suspense>
    );
}
