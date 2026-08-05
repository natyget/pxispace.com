'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { SmartPhone01Icon, Shield01Icon, CheckmarkCircle02Icon, Loading02Icon, RefreshIcon, ArrowRight02Icon, Share01Icon, CheckmarkBadge01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getRelationshipStatus } from '../../services/friends';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import { PxiPassportSection } from '@/components/passport/PxiPassportSection';
import { getSiteUrl } from '@/lib/siteUrl';
import { trackPassportLevelUp, trackShare } from '@/lib/analytics';
import { getOdysseyTierFromXp } from '@/utils/odysseyTier';

/** Odyssey bands, low → high. Mirrors the ladder in src/utils/odysseyTier.js. */
const PASSPORT_LEVEL_ORDER = ['WANDERER', 'SEEKER', 'VOYAGER', 'PATHFINDER', 'LUMINARY', 'ODYSSEY'];

/**
 * Report a crossing into a higher Odyssey band, once per crossing per browser.
 * The first sighting of an account only writes the baseline — otherwise every
 * new device would report a level-up. Demotions (the band rework re-scored
 * existing XP) are recorded silently, never reported.
 */
function trackPassportLevelChange(user) {
    if (!user?.id) return;
    const level = getOdysseyTierFromXp(user.odysseyXp ?? 0).id;
    try {
        const key = `pxi_passport_level_seen_${user.id}`;
        const previous = window.localStorage.getItem(key);
        window.localStorage.setItem(key, level);
        if (!previous || previous === level) return;
        if (PASSPORT_LEVEL_ORDER.indexOf(level) > PASSPORT_LEVEL_ORDER.indexOf(previous)) {
            trackPassportLevelUp({ passportLevel: level });
        }
    } catch {
        /* storage blocked — skip rather than risk a duplicate every render */
    }
}

function ShareProfileLinkButton({ userId }) {
    const [copied, setCopied] = useState(false);
    const url = `${getSiteUrl()}/u/${userId}`;

    const onClick = async () => {
        let method = 'copy_link';
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            method = 'prompt_copy';
            window.prompt('Copy profile link:', url);
        }
        trackShare({ method, contentType: 'profile', itemId: userId });
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="mx-auto flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.02em] text-white transition hover:bg-white/10"
        >
            {copied ? <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="shrink-0 text-emerald-400" /> : <HugeiconsIcon icon={Share01Icon} size={16} className="shrink-0" />}
            {copied ? 'Copied link' : 'Share profile link'}
        </button>
    );
}

export default function PassportPage() {
    const { user, authReady, authRefreshing } = useAuth();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (authReady) trackPassportLevelChange(user);
    }, [authReady, user]);

    if (!mounted || !authReady) return null;
    const rolesReady = authReady && !authRefreshing;
    if (!user?.isPassportIssued) return <PassportNotIssued user={user} rolesReady={rolesReady} />;
    return <PassportIssued user={user} rolesReady={rolesReady} />;
}

function PassportIssued({ user, rolesReady }) {
    const [friendsCount, setFriendsCount] = useState(0);

    useEffect(() => {
        if (!user?.id) return;
        getRelationshipStatus(user.id)
            .then((status) => setFriendsCount(status.friendsCount || 0))
            .catch(() => {});
    }, [user?.id]);

    const headerRight = rolesReady
        ? user?.isVendor ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold tracking-[0.02em] text-emerald-400 sm:gap-1.5 sm:px-2.5 sm:text-[10px] md:px-3 md:text-[11px]">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="shrink-0" />
                Organizer
            </span>
        ) : (
            <Link
                href="/dashboard/vendor-upgrade"
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-[0.02em] text-black hover:bg-zinc-200"
            >
                Start hosting
            </Link>
        )
        : null;

    return (
        <PxiPassportSection
            user={user}
            friendsCount={friendsCount}
            headerRight={headerRight}
            eventsMode="self"
            headerBelowFriends={user?.id ? <ShareProfileLinkButton userId={user.id} /> : null}
        >
            <p className="mt-6 text-center text-xs text-zinc-600">
                To update your PXI Passport details, use the PXI mobile app.
            </p>
        </PxiPassportSection>
    );
}

function PassportNotIssued({ user, rolesReady }) {
    const { updateUser } = useAuth();
    const [checkingVendor, setCheckingVendor] = useState(false);
    const [vendorStatusMsg, setVendorStatusMsg] = useState('');
    const [vendorChecks, setVendorChecks] = useState(null); // {chargesEnabled,payoutsEnabled,currentlyDue}

    const handleCheckVendorVerification = async () => {
        if (!user?.id) return;
        setCheckingVendor(true);
        setVendorStatusMsg('');
        setVendorChecks(null);
        try {
            const result = await authService.checkVendorStatus();
            if (result?.isVendor) {
                updateUser({ isVendor: true });
                setVendorStatusMsg('Hosting verification is complete. You can now create paid events.');
                return;
            }
            if (result?.code === 'NO_STRIPE_ACCOUNT') {
                setVendorStatusMsg('No payment setup found yet. Start hosting setup below.');
                return;
            }
            setVendorChecks(result?.stripeStatus || null);
            setVendorStatusMsg('Verification is still in progress. Complete any outstanding Stripe requirements.');
        } catch (err) {
            setVendorStatusMsg(err?.message || 'Could not check hosting verification right now.');
        } finally {
            setCheckingVendor(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
            <section className="dashboard-surface-b relative overflow-hidden rounded-[1.25rem] px-5 py-7 md:px-8">
                <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                    <div className="max-w-2xl">
                        <div className="mb-4 flex items-center gap-2">
                            <HugeiconsIcon icon={Shield01Icon} size={14} className="text-zinc-500" />
                            <span className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">PXI Passport</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-[28px]">Claim your identity.</h1>
                        <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
                        Your Passport is the profile layer for PXI events, stamps, friends, and public identity.
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <IosDownloadLink href={PXI_APP_STORE_URL}
                                className="pill-solid inline-flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.02em]">
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-black"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                                App Store
                            </IosDownloadLink>
                        {rolesReady && user?.isVendor ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-2 text-[11px] font-medium tracking-[0.02em] text-emerald-400">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="shrink-0" />
                                Organizer
                            </span>
                        ) : rolesReady ? (
                                <Link href="/dashboard/vendor-upgrade" className="pill-ghost inline-flex items-center px-4 py-2.5 text-xs font-bold tracking-[0.02em]">
                                Start hosting
                            </Link>
                        ) : null}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                        {[
                            ['Identity', 'Profile'],
                            ['Events', 'Stamps'],
                            ['Social', 'Friends'],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-2xl bg-white/[0.055] p-4">
                                <p className="text-[11px] font-medium tracking-[0.02em] text-white/35">{label}</p>
                                <p className="mt-2 text-lg font-bold text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="rounded-[1.25rem] bg-white/[0.04] p-6">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.055]">
                        <HugeiconsIcon icon={SmartPhone01Icon} size={24} className="text-white opacity-75" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Use the PXI mobile app</h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        Issue your Passport from the app. It only takes a minute and unlocks your event identity.
                    </p>
                    <IosDownloadLink href={PXI_APP_STORE_URL}
                        className="pill-ghost mt-5 inline-flex items-center gap-2.5 px-5 py-3 text-sm font-bold tracking-[0.02em]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        App Store
                    </IosDownloadLink>
                </div>

                <div className="rounded-[1.25rem] bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Hosting setup</p>
                            <p className="text-xs text-zinc-400 mt-1">Check payment status or continue setup to unlock paid events.</p>
                        </div>
                        {user?.isVendor ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-emerald-400">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                                Verified
                            </span>
                        ) : null}
                    </div>

                    {!!vendorStatusMsg && (
                        <p className="mt-3 text-xs text-zinc-300">{vendorStatusMsg}</p>
                    )}

                    {vendorChecks && (
                        <div className="mt-3 space-y-1 text-xs text-zinc-400">
                            <p>
                                Charges: <span className={vendorChecks.chargesEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                                    {vendorChecks.chargesEnabled ? 'Enabled' : 'Pending'}
                                </span>
                            </p>
                            <p>
                                Payouts: <span className={vendorChecks.payoutsEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                                    {vendorChecks.payoutsEnabled ? 'Enabled' : 'Pending'}
                                </span>
                            </p>
                            {(vendorChecks.currentlyDue?.length ?? 0) > 0 && (
                                <p className="text-amber-400">Outstanding requirements: {vendorChecks.currentlyDue.length}</p>
                            )}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={handleCheckVendorVerification}
                            disabled={checkingVendor}
                            className="pill-ghost inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                            {checkingVendor ? <HugeiconsIcon icon={Loading02Icon} size={13} className="animate-spin" /> : <HugeiconsIcon icon={RefreshIcon} size={13} />}
                            Check verification
                        </button>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-black hover:bg-zinc-200"
                        >
                            Continue hosting setup
                            <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
