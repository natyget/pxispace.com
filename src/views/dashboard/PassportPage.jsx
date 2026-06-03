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

function ShareProfileLinkButton({ userId }) {
    const [copied, setCopied] = useState(false);
    const url = `${getSiteUrl()}/u/${userId}`;

    const onClick = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy profile link:', url);
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="mx-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
        >
            {copied ? <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="shrink-0 text-emerald-400" /> : <HugeiconsIcon icon={Share01Icon} size={16} className="shrink-0" />}
            {copied ? 'Copied link' : 'Share profile link'}
        </button>
    );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PassportPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;
    if (!user?.isPassportIssued) return <PassportNotIssued user={user} />;
    return <PassportIssued user={user} />;
}

function PassportIssued({ user }) {
    const [friendsCount, setFriendsCount] = useState(0);

    useEffect(() => {
        if (!user?.id) return;
        getRelationshipStatus(user.id)
            .then((status) => setFriendsCount(status.friendsCount || 0))
            .catch(() => {});
    }, [user?.id]);

    const headerRight = user?.isVendor ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 sm:gap-1.5 sm:px-2.5 sm:text-[10px] md:px-3 md:text-[11px]">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="shrink-0" />
            Vendor
        </span>
    ) : (
        <Link
            href="/dashboard/vendor-upgrade"
            className="inline-flex items-center rounded-full border border-pxi-purple/30 bg-pxi-purple/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pxi-purple hover:bg-pxi-purple/30"
        >
            Vendor Setup
        </Link>
    );

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

// ─── PXI Passport not issued ──────────────────────────────────────────────────────

function PassportNotIssued({ user }) {
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
                setVendorStatusMsg('Vendor verification completed. You can now create paid events.');
                return;
            }
            if (result?.code === 'NO_STRIPE_ACCOUNT') {
                setVendorStatusMsg("No Stripe verification found yet. Start vendor setup below.");
                return;
            }
            setVendorChecks(result?.stripeStatus || null);
            setVendorStatusMsg('Verification is still in progress. Complete any outstanding Stripe requirements.');
        } catch (err) {
            setVendorStatusMsg(err?.message || 'Could not check vendor verification right now.');
        } finally {
            setCheckingVendor(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Shield01Icon} size={14} className="text-zinc-500" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">PXI Passport</span>
                    </div>
                    {user?.isVendor ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 sm:gap-1.5 sm:px-2.5 sm:text-[10px] md:px-3 md:text-[11px]">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="shrink-0" />
                            Vendor
                        </span>
                    ) : (
                        <Link href="/dashboard/vendor-upgrade" className="inline-flex items-center rounded-full bg-pxi-purple/20 border border-pxi-purple/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pxi-purple hover:bg-pxi-purple/30">
                            Vendor Setup
                        </Link>
                    )}
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Get Your PXI Passport</h1>
                <p className="text-zinc-500 text-sm mt-1">Your PXI Passport hasn't been issued yet.</p>
            </div>
            <div className="rounded-2xl p-8 text-center bg-zinc-900/50 border border-white/5">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-pxi-purple/10 border border-pxi-purple/20">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={26} className="text-pxi-purple" />
                </div>
                <h2 className="text-white font-black text-lg mb-2 tracking-tight">Use the PXI Mobile App</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    Your PXI Passport is your digital identity for events. To issue your PXI Passport, please use the PXI mobile app — it only takes a minute.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <IosDownloadLink href={PXI_APP_STORE_URL}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        App Store
                    </IosDownloadLink>
                    <a href="https://play.google.com/store/apps/pxi" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all w-full sm:w-auto justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M3.18 23.76c.3.17.64.22.98.14l13.12-7.57L14 13l-10.82 10.76zM.54 1.27C.2 1.6 0 2.14 0 2.87v18.27c0 .73.2 1.27.54 1.6L1.63 21.6 12.35 12 1.63 2.41.54 1.27zM20.46 10.37l-2.98-1.72-3.85 3.35 3.85 3.34 3-1.73c.85-.49.85-1.26-.02-1.74zM4.16.1L17.28 7.67l-3.28 2.87L3.18.24A1.2 1.2 0 0 1 4.16.1z"/></svg>
                        Google Play
                    </a>
                </div>

                {/* Vendor verification integration */}
                <div className="mt-8 rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-pxi-purple">Vendor verification</p>
                            <p className="text-xs text-zinc-400 mt-1">Check Stripe status or continue setup to unlock paid events.</p>
                        </div>
                        {user?.isVendor ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
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

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={handleCheckVendorVerification}
                            disabled={checkingVendor}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                        >
                            {checkingVendor ? <HugeiconsIcon icon={Loading02Icon} size={13} className="animate-spin" /> : <HugeiconsIcon icon={RefreshIcon} size={13} />}
                            Check verification
                        </button>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-pxi-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                        >
                            Continue vendor setup
                            <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
