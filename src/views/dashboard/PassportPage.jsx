'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Smartphone, Shield, CheckCircle2, Loader2, RefreshCw, ArrowRight, Share2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { getRelationshipStatus } from '../../services/friends';
import { getUserTickets } from '../../services/tickets';
import { getEventsForWallet, getMyEventXp } from '../../services/events';
import { getPassportLevelDisplay } from '../../utils/odysseyTier';
import { PXI_APP_STORE_URL } from '@/lib/appStoreLinks';
import IosDownloadLink from '@/components/links/IosDownloadLink';
import {
    formatMRZ,
    getLevelProgress,
    ODYSSEY_TIER_BANDS,
    HeaderPolygonBadge,
    DynamicStamp,
    getStampShape,
    getStampLayout,
    getStampColor,
    formatStampName,
    formatStampDate,
    formatStampCity,
    getEventYear,
} from '@/components/passport/passportVisualParts';
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
            {copied ? <Check size={16} className="shrink-0 text-emerald-400" /> : <Share2 size={16} className="shrink-0" />}
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
    const [attendedEvents, setAttendedEvents] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);

    useEffect(() => {
        if (!user?.id) return;
        getRelationshipStatus(user.id)
            .then((status) => setFriendsCount(status.friendsCount || 0))
            .catch(() => {});
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        Promise.all([
            getUserTickets(user.id),
            getEventsForWallet(100, 0),
            getMyEventXp(),
        ]).then(([tickets, eventsData, xpByEventId]) => {
            const events = tickets.flatMap((t) => {
                const ev = (eventsData.events ?? []).find((e) => e.id === t.eventId);
                if (!ev) return [];
                return [{ id: ev.id, name: ev.name, startDate: ev.startDate, location: ev.location, xp: xpByEventId[ev.id] }];
            });
            setAttendedEvents(events);
        }).catch(() => {});
    }, [user?.id]);

    const availableYears = useMemo(() => {
        const years = [...new Set(attendedEvents.map((e) => getEventYear(e.startDate)))].sort((a, b) => b - a);
        return years;
    }, [attendedEvents]);

    useEffect(() => {
        if (availableYears.length > 0 && (selectedSeason === null || !availableYears.includes(selectedSeason))) {
            setSelectedSeason(availableYears[0]);
        }
    }, [availableYears]);

    const filteredEvents = useMemo(() => {
        if (selectedSeason === null) return attendedEvents;
        return attendedEvents.filter((e) => getEventYear(e.startDate) === selectedSeason);
    }, [attendedEvents, selectedSeason]);

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
    const passportType = user?.isVendor ? 'Diplomat' : user?.isPassportIssued ? 'Citizen' : 'Partial';

    const odessaVsNext = (() => {
        const current = Math.max(0, Math.floor(Number(user?.odysseyXp) || 0));
        const band = ODYSSEY_TIER_BANDS.find((b) => b.max === null || current <= b.max) ?? ODYSSEY_TIER_BANDS[ODYSSEY_TIER_BANDS.length - 1];
        if (band.max === null) return `${current.toLocaleString('en-US')}/∞`;
        return `${current.toLocaleString('en-US')}/${band.max.toLocaleString('en-US')}`;
    })();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Above-card header */}
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
                    <button type="button" className="text-center">
                        <p className="text-white text-base font-bold">{friendsCount}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/45">Friends</p>
                    </button>
                </div>
                {user?.id ? (
                    <div className="mt-4 flex justify-center">
                        <ShareProfileLinkButton userId={user.id} />
                    </div>
                ) : null}
            </div>

            {/* Passport card */}
            <div className="flex justify-center">
                <div className="relative w-[min(95vw,361px)] h-[558px] overflow-hidden rounded-[8px] border border-white bg-black shadow-[0_1px_12px_rgba(255,255,255,0.25)]">

                    {/* Top half: world map (matches mobile MapBackground over #0a0a0a) */}
                    <div className="absolute left-0 right-0 top-0 h-1/2 z-[1] overflow-hidden bg-[#0a0a0a]">
                        <Image
                            src="/images/map-world.png"
                            alt=""
                            fill
                            unoptimized
                            className="object-cover opacity-90"
                            priority
                        />
                    </div>
                    {/* Stamps */}
                    <div className="absolute left-0 right-0 top-0 h-1/2 z-[2] overflow-hidden opacity-90">
                        {/* Season pills */}
                        {availableYears.length > 1 && (
                            <div className="absolute top-2 left-0 right-0 z-10 flex justify-center gap-1.5 px-2">
                                {availableYears.map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => setSelectedSeason(year)}
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border transition-all ${
                                            year === selectedSeason
                                                ? 'bg-white/20 border-white/60 text-white'
                                                : 'bg-black/30 border-white/20 text-white/50 hover:bg-white/10'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Dynamic stamps */}
                        {filteredEvents.map((event, index) => {
                            const shape = getStampShape(event.id);
                            const layout = getStampLayout(event.id, index);
                            const color = getStampColor(event.xp, 'WANDERER');
                            return (
                                <div
                                    key={event.id}
                                    style={{
                                        position: 'absolute',
                                        left: layout.left,
                                        top: layout.top,
                                        width: layout.width,
                                        height: layout.height,
                                        transform: `rotate(${layout.rotation}deg)`,
                                        zIndex: index + 1,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <DynamicStamp
                                        shape={shape}
                                        color={color}
                                        name={formatStampName(event.name)}
                                        date={formatStampDate(event.startDate)}
                                        city={formatStampCity(event.location)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="absolute top-[8px] right-[8px] z-[10] text-[12px] text-white/60 tracking-[0.08em] uppercase">
                        {passportNumber}
                    </div>
                    <div className="absolute left-[-182px] top-[128px] z-[10] -rotate-90 text-[16px] tracking-[0.24em] text-white/55 uppercase">
                        SEASON {selectedSeason ?? '01 2026'}
                    </div>

                    {/* Crease fold */}
                    <div className="absolute inset-x-0 top-1/2 z-20 h-[80px] -translate-y-1/2 pointer-events-none">
                        <div className="h-1/2 bg-gradient-to-b from-transparent via-black/55 to-black/90" />
                        <div className="relative h-0">
                            <div className="h-[3px] bg-[#050505] shadow-[0_0_6px_3px_rgba(0,0,0,0.9)]" />
                            <div className="absolute left-0 right-0 top-[-1px] border-t-2 border-dashed border-white/40" />
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-transparent via-black/55 to-black/90" />
                    </div>

                    {/* Bottom half */}
                    <div className="absolute left-0 right-0 bottom-0 top-1/2 z-10 overflow-hidden bg-[#0f0f0f]">
                        {/* Content — px-6 pt-6 matches mobile bottomContent paddingHorizontal:24 paddingTop:24 */}
                        <div className="px-6 pt-6 h-full relative">

                            {/* Header row: title+line | passport number */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="shrink-0" style={{ width: 200 }}>
                                    <p className="text-[14px] font-bold uppercase tracking-[0.16em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                        PXI PASSPORT
                                    </p>
                                    <div className="mt-1 h-[6px] border-t-[6px] border-white" />
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-[9px] uppercase text-white/70">PXI Passport No.</p>
                                    <p className="text-[11px] uppercase text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">{passportNumber}</p>
                                </div>
                            </div>

                            {/* Multi-lang + level + XP row (3 slots, matching mobile multiLangLevelRow) */}
                            <div className="flex items-center w-full overflow-hidden mt-1" style={{ minHeight: 30 }}>
                                {/* Slot 1: icon + "PASSPORT • PASS • PORT" */}
                                <div className="flex-1 min-w-0 flex items-center" style={{ gap: 2 }}>
                                    <svg width="20" height="12" viewBox="12 11 17 10" preserveAspectRatio="xMinYMid meet" fill="none" className="shrink-0" aria-hidden>
                                        <path d="M12 11H29V21H12V11Z" fill="#BB17E8" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M20.5 13C21.9864 13 23.2194 14.0812 23.4575 15.5H29V16.5H23.4575C23.2194 17.9188 21.9864 19 20.5 19C19.0136 19 17.7806 17.9188 17.5425 16.5H12V15.5H17.5425C17.7806 14.0812 19.0136 13 20.5 13ZM20.5 14C19.3954 14 18.5 14.8954 18.5 16C18.5 17.1046 19.3954 18 20.5 18C21.6046 18 22.5 17.1046 22.5 16C22.5 14.8954 21.6046 14 20.5 14Z" fill="#0C0C0C" />
                                    </svg>
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-white truncate">
                                        PASSPORT • PASS • PORT
                                    </span>
                                </div>
                                {/* Slot 2: LEVEL label + progress bar (fixed 108px, matching mobile levelBadgeInline) */}
                                <div className="shrink-0 flex flex-col items-stretch" style={{ width: 108 }}>
                                    <p className="text-[9px] font-semibold uppercase text-white/80 leading-[12px] mb-[3px]">LEVEL {levelText}</p>
                                    <div className="h-[4px] w-full rounded-full overflow-hidden bg-[rgba(176,38,255,0.22)]">
                                        <div className="h-full rounded-full bg-pxi-purple" style={{ width: `${levelProgress * 100}%` }} />
                                    </div>
                                </div>
                                {/* Slot 3: XP score (matching mobile odessaScoreSlot) */}
                                <div className="shrink-0 ml-2 text-right">
                                    <span className="text-[10px] font-bold text-white">{odessaVsNext}</span>
                                </div>
                            </div>

                            {/* Details grid: photo | info column (matching mobile detailsGrid) */}
                            <div className="flex mt-2" style={{ gap: 14 }}>
                                {/* Photo (matching mobile photoContainer: 113×130) */}
                                <div className="shrink-0 rounded-[6px] overflow-hidden shadow-[0_1px_24px_2px_rgba(255,255,255,0.3)]" style={{ width: 113, height: 130 }}>
                                    {user?.avatarUrl ? (
                                        <Image src={user.avatarUrl} alt={fullName} width={113} height={130} unoptimized className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-pxi-purple/20 text-2xl font-black text-pxi-purple">
                                            {avatarFallback}
                                        </div>
                                    )}
                                </div>

                                {/* Info column (matching mobile infoColumn → infoStack) */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    {/* infoTopRow: name+username column | type badge cell */}
                                    <div className="flex items-end justify-between w-full" style={{ gap: 10 }}>
                                        {/* infoNameColumn */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col justify-center overflow-hidden" style={{ height: 34 }}>
                                                <p className="text-[9px] font-medium uppercase text-white/70">Full name</p>
                                                <p className="text-[12px] font-semibold uppercase leading-snug text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] truncate">{fullName.toUpperCase()}</p>
                                            </div>
                                            <div className="flex flex-col justify-center overflow-hidden" style={{ height: 34 }}>
                                                <p className="text-[9px] font-medium uppercase text-white/70">username</p>
                                                <p className="text-[12px] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] truncate">{username}</p>
                                            </div>
                                        </div>
                                        {/* typeBadgeColumnCell: height 68, align bottom-right */}
                                        <div className="shrink-0 flex flex-col items-end justify-end" style={{ height: 68 }}>
                                            <div className="flex items-baseline">
                                                <span className="font-extrabold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]" style={{ fontSize: 52, lineHeight: '52px' }}>
                                                    {passportType.charAt(0).toUpperCase()}
                                                </span>
                                                <span className="font-semibold capitalize text-white" style={{ fontSize: 13, lineHeight: '13px', marginLeft: 2, marginBottom: 2 }}>
                                                    {passportType.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* infoMetaPrimaryRow: Age | Insta | City */}
                                    <div className="flex items-center justify-between overflow-hidden" style={{ height: 34 }}>
                                        <div className="flex flex-col justify-center overflow-hidden" style={{ width: 38 }}>
                                            <p className="text-[9px] font-medium uppercase text-white/70">Age</p>
                                            <p className="text-[12px] text-white/90">{typeof age === 'number' ? age : '—'}</p>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                                            <p className="text-[9px] font-medium uppercase text-white/70">Insta</p>
                                            <p className="text-[12px] text-white/90 truncate">{instagram}</p>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                                            <p className="text-[9px] font-medium uppercase text-white/70">City</p>
                                            <p className="text-[12px] text-white/90 truncate">{city}</p>
                                        </div>
                                    </div>

                                    {/* infoGridRowBio */}
                                    <div className="flex flex-col justify-center overflow-hidden" style={{ height: 34 }}>
                                        <p className="text-[9px] font-medium uppercase text-white/70">Bio</p>
                                        <p className="text-[12px] text-white/90 truncate">{bio}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator line — absolute bottom:38, left/right:24 (matching mobile separatorLine) */}
                        <div className="absolute left-6 right-6 h-[2px] bg-white/40" style={{ bottom: 38 }} />

                        {/* MRZ footer — absolute bottom:4, left/right:24 (matching mobile passportFooterContainer) */}
                        <div className="absolute left-6 right-6" style={{ bottom: 4 }}>
                            <p className="font-mono text-[12px] leading-[15px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.32)] truncate mb-[2px]">{mrzLine1}</p>
                            <p className="font-mono text-[12px] leading-[15px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.32)] truncate text-right">{mrzLine2}</p>
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
