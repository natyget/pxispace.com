'use client';

import { useState, useEffect, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Smartphone, Shield, CheckCircle2, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getPassportLevelDisplay } from '../../utils/odysseyTier';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import {
    formatMRZ,
    getLevelProgress,
    HeaderPolygonBadge,
    NeonCurvesSVG,
    StampRed,
    StampYellow,
    StampCyan,
    StampWhite,
    GreenStampPositioned,
} from '@/components/passport/passportVisualParts';

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
    const chipFilterId = useId().replace(/:/g, '');
    const fullName = user?.name ?? 'PXI CITIZEN';
    const username = user?.username ?? 'citizen';
    const avatarFallback = fullName.charAt(0).toUpperCase();
    const city = user?.city ?? '—';
    const bio = user?.bio ?? '—';
    const instagram = user?.instagramHandle
        ? (user.instagramHandle.startsWith('@') ? user.instagramHandle : `@${user.instagramHandle}`)
        : '—';

    const age = (() => {
        if (!user?.birthdate) return '—';
        const birth = new Date(user.birthdate);
        const today = new Date();
        let a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
        return a;
    })();

    const passportNumber = `P${String(user?.id || '0512026').slice(0, 7).toUpperCase()}XI`;
    const formatIssuedDate = (dateString) => {
        if (!dateString) return '01JAN26';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year = String(date.getFullYear()).slice(-2);
        return `${day}${month}${year}`;
    };
    const nameParts = fullName.toUpperCase().replace(' ', '<');
    const mrzLine1 = formatMRZ(`PXI<${username.toUpperCase()}<<${nameParts}`, 36);
    const mrzLine2 = formatMRZ(`ISSUED${formatIssuedDate(user?.passportIssuedAt)}<${passportNumber}<<<PXISPACE`, 36);

    const { levelText, badgeLetter } = getPassportLevelDisplay(user);
    const levelProgress = getLevelProgress(user?.odysseyXp);
    const passportType = user?.isVendor
        ? 'Diplomat'
        : user?.isPassportIssued
          ? 'Citizen'
          : 'Partial';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="relative px-2">
                <div className="flex items-center justify-between">
                    <HeaderPolygonBadge letter={badgeLetter} progress={levelProgress} />
                    <h1 className="absolute left-0 right-0 text-center text-[22px] font-bold text-white tracking-wide pointer-events-none">
                        PXI Passport
                    </h1>
                    {user?.isVendor ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span className="sm:hidden">Vendor</span>
                            <span className="hidden sm:inline">You are vendor!</span>
                        </span>
                    ) : (
                        <Link href="/dashboard/vendor-upgrade" className="inline-flex items-center rounded-full bg-pxi-purple/20 border border-pxi-purple/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-pxi-purple hover:bg-pxi-purple/30">
                            Vendor Setup
                        </Link>
                    )}
                </div>
                <div className="mt-4 flex items-center justify-center">
                    <button className="text-center">
                        <p className="text-white text-base font-bold">{user?.friendsCount ?? 0}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/45">Friends</p>
                    </button>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="relative w-[min(95vw,361px)] h-[558px] overflow-hidden rounded-[8px] border border-white bg-black shadow-[0_1px_12px_rgba(255,255,255,0.25)]">
                    <div
                        className="absolute left-0 right-0 top-0 h-1/2 z-[1] opacity-35 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
                            backgroundSize: '4px 4px',
                        }}
                    />
                    <div className="absolute inset-0 opacity-25 pointer-events-none">
                        <NeonCurvesSVG className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-90">
                        <StampRed />
                        <StampYellow />
                        <StampCyan />
                        <StampWhite />
                        <GreenStampPositioned />
                    </div>

                    <div className="absolute top-[8px] right-[8px] z-20 text-[12px] text-white/60 tracking-[0.08em] uppercase">
                        {passportNumber}
                    </div>
                    <div className="absolute left-[-182px] top-[128px] z-20 -rotate-90 text-[16px] tracking-[0.24em] text-white/55 uppercase">
                        SEASON 01 2026
                    </div>

                    <div className="absolute inset-x-0 top-1/2 z-20 h-[80px] -translate-y-1/2 pointer-events-none">
                        <div className="h-1/2 bg-gradient-to-b from-transparent via-black/55 to-black/90" />
                        <div className="relative h-0">
                            <div className="h-[3px] bg-[#050505] shadow-[0_0_6px_3px_rgba(0,0,0,0.9)]" />
                            <div className="absolute left-0 right-0 top-[-1px] border-t-2 border-dashed border-white/40" />
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-transparent via-black/55 to-black/90" />
                    </div>

                    <div className="absolute left-0 right-0 bottom-0 top-1/2 z-10 min-h-0 overflow-y-auto bg-[#0f0f0f] px-3 py-2 sm:px-4 sm:py-2">
                        <div className="mx-auto w-full max-w-[380px] shrink-0 overflow-hidden rounded-lg px-2 sm:px-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1 pr-1">
                                            <h2 className="text-[14px] font-bold uppercase tracking-[0.16em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                                PXI PASSPORT
                                            </h2>
                                            <div className="mt-1 h-[6px] border-t-[6px] border-white" />
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[9px] uppercase text-white/70">PXI Passport No.</p>
                                            <p className="text-[11px] uppercase text-white/90">{passportNumber}</p>
                                        </div>
                                    </div>

                                    <div className="mt-1.5 grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2.5 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3">
                                        <div className="col-span-2 flex min-w-0 items-center gap-1">
                                            <svg
                                                width="41"
                                                height="34"
                                                viewBox="0 0 41 34"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-[22px] w-[38px] shrink-0 sm:h-[24px] sm:w-[40px]"
                                                aria-hidden
                                            >
                                                <g filter={`url(#${chipFilterId})`}>
                                                    <path d="M12 11H29V21H12V11Z" fill="#BB17E8" />
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M20.5 13C21.9864 13 23.2194 14.0812 23.4575 15.5H29V16.5H23.4575C23.2194 17.9188 21.9864 19 20.5 19C19.0136 19 17.7806 17.9188 17.5425 16.5H12V15.5H17.5425C17.7806 14.0812 19.0136 13 20.5 13ZM20.5 14C19.3954 14 18.5 14.8954 18.5 16C18.5 17.1046 19.3954 18 20.5 18C21.6046 18 22.5 17.1046 22.5 16C22.5 14.8954 21.6046 14 20.5 14Z"
                                                        fill="#0C0C0C"
                                                    />
                                                </g>
                                                <defs>
                                                    <filter
                                                        id={chipFilterId}
                                                        x="0"
                                                        y="0"
                                                        width="41"
                                                        height="34"
                                                        filterUnits="userSpaceOnUse"
                                                        colorInterpolationFilters="sRGB"
                                                    >
                                                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                                        <feColorMatrix
                                                            in="SourceAlpha"
                                                            type="matrix"
                                                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                                            result="hardAlpha"
                                                        />
                                                        <feOffset dy="1" />
                                                        <feGaussianBlur stdDeviation="6" />
                                                        <feComposite in2="hardAlpha" operator="out" />
                                                        <feColorMatrix
                                                            type="matrix"
                                                            values="0 0 0 0 0.733333 0 0 0 0 0.0901961 0 0 0 0 0.909804 0 0 0 1 0"
                                                        />
                                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_vector" />
                                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_vector" result="shape" />
                                                    </filter>
                                                </defs>
                                            </svg>
                                            <span className="whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.03em] text-white sm:text-[8px]">
                                                PASSPORT • PASS • PASAPORTE
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-col items-start justify-center">
                                            <p className="text-[9px] font-semibold uppercase leading-none text-white/80">LEVEL {levelText}</p>
                                            <div className="mt-1 h-1 w-[72px] overflow-hidden rounded-full bg-[rgba(176,38,255,0.22)] sm:w-[80px]">
                                                <div
                                                    className="h-full rounded-full bg-pxi-purple"
                                                    style={{ width: `${Math.round(levelProgress * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-1 grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-2.5 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-3">
                                        <div className="relative h-[118px] w-full max-w-[88px] overflow-hidden rounded-[6px] shadow-[0_1px_24px_2px_rgba(255,255,255,0.3)] sm:h-[128px] sm:max-w-[100px]">
                                            {user?.avatarUrl ? (
                                                <Image src={user.avatarUrl} alt={fullName} fill unoptimized className="object-cover" sizes="112px" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-pxi-purple/20 text-2xl font-black text-pxi-purple">
                                                    {avatarFallback}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex min-h-0 min-w-0 flex-col gap-1.5 pl-1 pr-1 sm:pl-2 sm:pr-2">
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-white/70">Full name</p>
                                                <p className="text-[11px] font-semibold uppercase leading-snug text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:text-[12px]">
                                                    {fullName.toUpperCase()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-white/70">username</p>
                                                <p className="truncate text-[11px] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] sm:text-[12px]">
                                                    {username}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-white/90 sm:text-[12px]">Age {typeof age === 'number' ? age : '—'}</p>
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-white/70">City</p>
                                                <p className="line-clamp-2 text-[11px] text-white/90 sm:text-[12px]">{city}</p>
                                            </div>
                                        </div>
                                        <div className="flex min-h-0 min-w-0 flex-col gap-2">
                                            <div className="shrink-0">
                                                <div className="flex items-end">
                                                    <span className="text-[28px] font-extrabold leading-[30px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] sm:text-[36px] sm:leading-9">
                                                        {passportType.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="mb-0.5 ml-0.5 text-[11px] font-semibold capitalize text-white sm:text-[13px]">
                                                        {passportType.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="truncate text-[11px] text-white/90 sm:text-[12px]" title={instagram}>
                                                Insta {instagram}
                                            </p>
                                            <div className="min-h-0 flex-1">
                                                <p className="text-[9px] font-medium uppercase text-white/70">Bio</p>
                                                <p className="line-clamp-3 text-[11px] leading-snug text-white/90 sm:text-[12px]">{bio}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 h-[2px] w-full bg-white/40 sm:mt-3" />
                                    <div className="pt-1.5 font-mono text-[10px] uppercase leading-4 tracking-[0.12em] text-white/70 sm:pt-2 sm:text-[11px]">
                                        <p className="truncate">{mrzLine1}</p>
                                        <p className="truncate">{mrzLine2}</p>
                                    </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-zinc-600 text-xs text-center">
                To update your PXI Passport details, use the PXI mobile app.
            </p>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12, color: 'white', textTransform: 'uppercase', textShadow: '0px 2px 12px rgba(255,255,255,0.8)' }}>{value}</span>
        </div>
    );
}

function InfoRowInline({ label, value, truncate }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: truncate ? 1 : undefined, width: truncate ? undefined : 60 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12, color: 'white', textShadow: '0px 2px 12px rgba(255,255,255,0.8)', whiteSpace: truncate ? 'nowrap' : undefined, overflow: truncate ? 'hidden' : undefined, textOverflow: truncate ? 'ellipsis' : undefined }}>
                {value}
            </span>
        </div>
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
                        <Shield size={14} className="text-zinc-500" />
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">PXI Passport</span>
                    </div>
                    {user?.isVendor ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span className="sm:hidden">Vendor</span>
                            <span className="hidden sm:inline">You are vendor!</span>
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
                    <Smartphone size={26} className="text-pxi-purple" />
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
                                <CheckCircle2 size={12} />
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
                            {checkingVendor ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                            Check verification
                        </button>
                        <Link
                            href="/dashboard/vendor-upgrade"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-pxi-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                        >
                            Continue vendor setup
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
