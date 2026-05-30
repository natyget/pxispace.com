'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, SmartPhone01Icon } from '@hugeicons/core-free-icons';
import { getPassportLevelDisplay } from '@/utils/odysseyTier';
import {
    buildPassportFooterLine,
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
    renderPassportFooterSegments,
} from '@/components/passport/passportVisualParts';
import { displayImageSrc } from '@/lib/mediaUrl';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';
import AppOpenBanner from '@/components/links/AppOpenBanner';
import { getUserTickets } from '@/services/tickets';
import { getEventsForWallet, getUserEventXp } from '@/services/events';

function PublicProfileBottomBar({ userId }) {
    /** Same-origin https://…/u/:id does not reliably open the app from Safari; use registered app scheme (see app.json `scheme`). */
    return (
        <AppOpenBanner
            deepLinkUrl={userId ? `pxi://u/${userId}` : null}
            title="Open in PXI"
            subtitle="Full profile and social features in the app"
            storageKey={`pxi_app_banner_user_${userId || 'unknown'}_dismissed`}
        />
    );
}

function PassportReadOnly({ user }) {
    const chipFilterId = useId().replace(/:/g, '');
    const fullName = user?.name ?? 'PXI CITIZEN';
    const username = user?.username ?? 'citizen';
    const avatarFallback = fullName.charAt(0).toUpperCase();
    const city = user?.city ?? '—';
    const bio = user?.bio?.trim() ? user.bio.trim() : '—';
    const instagram = user?.instagramHandle
        ? user.instagramHandle.startsWith('@')
            ? user.instagramHandle
            : `@${user.instagramHandle}`
        : '—';

    const age =
        typeof user?.age === 'number' && !Number.isNaN(user.age)
            ? user.age
            : '—';

    const passportNumber = `P${String(user?.id || '').slice(0, 7).toUpperCase()}XI`;
    const formatIssuedDate = (dateString) => {
        if (!dateString) return 'ISSUED??????';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'ISSUED??????';
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const year = String(date.getFullYear()).slice(-2);
        return `ISSUED${day}${month}${year}`;
    };

    /** Footer width → chevron count: matches mobile NewPassportCard sizing math. */
    const PASSPORT_FOOTER_CHEV_GLYPH = 6.0;
    const passportFooterRef = useRef(null);
    const [passportFooterWidth, setPassportFooterWidth] = useState(0);
    useLayoutEffect(() => {
        const node = passportFooterRef.current;
        if (!node) return;
        const update = () => setPassportFooterWidth(node.offsetWidth || 0);
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(update);
        ro.observe(node);
        return () => ro.disconnect();
    }, []);
    const footerChevronCount =
        passportFooterWidth > 0
            ? Math.max(5, Math.min(220, Math.floor(passportFooterWidth / PASSPORT_FOOTER_CHEV_GLYPH)))
            : 56;
    const passportFooterIssued = formatIssuedDate(user?.passportIssuedAt);
    const footerUsername = username.replace(/^@/, '').toUpperCase().replace(/\s+/g, '<');
    const footerFullName = fullName.toUpperCase().replace(/\s+/g, '<');
    const passportFooterLineOne = buildPassportFooterLine(
        ['PXI', footerUsername, footerFullName],
        footerChevronCount,
    );
    const passportFooterLineTwo = buildPassportFooterLine(
        [passportFooterIssued, passportNumber, 'PXISPACE'],
        footerChevronCount,
    );

    const { levelText, badgeLetter } = getPassportLevelDisplay(user);
    const levelProgress = getLevelProgress(user?.odysseyXp);
    const passportType = user?.isVendor ? 'Diplomat' : user?.isPassportIssued ? 'Citizen' : 'Partial';

    const odessaVsNext = (() => {
        const current = Math.max(0, Math.floor(Number(user?.odysseyXp) || 0));
        const band =
            ODYSSEY_TIER_BANDS.find((b) => b.max === null || current <= b.max) ??
            ODYSSEY_TIER_BANDS[ODYSSEY_TIER_BANDS.length - 1];
        if (band.max === null) return `${current.toLocaleString('en-US')}/∞`;
        return `${current.toLocaleString('en-US')}/${band.max.toLocaleString('en-US')}`;
    })();

    const avatarSrc = displayImageSrc(user?.avatarUrl, null);

    /** Real attended events drive the stamps — same layout/colors as mobile NewPassportCard. */
    const [attendedEvents, setAttendedEvents] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        Promise.all([
            getUserTickets(user.id),
            getEventsForWallet(100, 0),
            getUserEventXp(user.id),
        ])
            .then(([tickets, eventsData, xpByEventId]) => {
                if (cancelled) return;
                const events = (tickets ?? []).flatMap((t) => {
                    const ev = (eventsData?.events ?? []).find((e) => e.id === t.eventId);
                    if (!ev) return [];
                    return [
                        {
                            id: ev.id,
                            name: ev.name,
                            startDate: ev.startDate,
                            location: ev.location,
                            xp: xpByEventId?.[ev.id],
                        },
                    ];
                });
                setAttendedEvents(events);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const availableYears = useMemo(() => {
        const years = [...new Set(attendedEvents.map((e) => getEventYear(e.startDate)))].sort(
            (a, b) => b - a,
        );
        return years;
    }, [attendedEvents]);

    useEffect(() => {
        if (
            availableYears.length > 0 &&
            (selectedSeason === null || !availableYears.includes(selectedSeason))
        ) {
            setSelectedSeason(availableYears[0]);
        }
    }, [availableYears]);

    const filteredEvents = useMemo(() => {
        if (selectedSeason === null) return attendedEvents;
        return attendedEvents.filter((e) => getEventYear(e.startDate) === selectedSeason);
    }, [attendedEvents, selectedSeason]);

    return (
        <div className="mx-auto max-w-2xl">
            {/* Same width as passport: badge/title/vendor edges align with card borders */}
            <div className="mx-auto w-full max-w-[min(95vw,361px)] space-y-4 sm:space-y-6">
                <div className="min-w-0">
                    {/* Title is absolutely centered on the full row width; badge + vendor stay on one line */}
                    <div className="relative flex min-h-[36px] items-center justify-between">
                        <div className="relative z-10 flex shrink-0 items-center">
                            <HeaderPolygonBadge letter={badgeLetter} progress={levelProgress} />
                        </div>
                        <h1 className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 -translate-y-1/2 px-16 text-center text-[clamp(1rem,4.2vw,22px)] font-bold leading-none tracking-wide text-white sm:px-20">
                            PXI Passport
                        </h1>
                        {user?.isVendor ? (
                            <span className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 sm:gap-1.5 sm:px-2.5 sm:text-[10px] md:px-3 md:text-[11px]">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="shrink-0" />
                                Vendor
                            </span>
                        ) : (
                            <span
                                className="relative z-10 inline-block w-[52px] shrink-0 sm:w-[72px] md:w-[100px]"
                                aria-hidden
                            />
                        )}
                    </div>
                    <div className="mt-4 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-base font-bold text-white">{user?.friendsCount ?? 0}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/45">Friends</p>
                        </div>
                    </div>
                </div>

                <div className="relative h-[558px] w-full min-w-0 overflow-hidden rounded-[8px] border border-white bg-black shadow-[0_1px_12px_rgba(255,255,255,0.25)]">
                    {/* Top half: world map background (matches mobile MapBackground over #0a0a0a) */}
                    <div className="absolute left-0 right-0 top-0 z-[1] h-1/2 overflow-hidden bg-[#0a0a0a]">
                        <Image
                            src="/images/map-world.png"
                            alt=""
                            fill
                            unoptimized
                            className="object-cover opacity-90"
                            priority
                        />
                    </div>
                    {/* Stamps — same dynamic shape/color logic as mobile NewPassportCard */}
                    <div className="pointer-events-none absolute left-0 right-0 top-0 z-[2] h-1/2 overflow-hidden opacity-90">
                        {availableYears.length > 1 && (
                            <div className="pointer-events-auto absolute left-0 right-0 top-2 z-10 flex justify-center gap-1.5 px-2">
                                {availableYears.map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => setSelectedSeason(year)}
                                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider transition-all ${
                                            year === selectedSeason
                                                ? 'border-white/60 bg-white/20 text-white'
                                                : 'border-white/20 bg-black/30 text-white/50 hover:bg-white/10'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        )}
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

                    <div className="absolute right-[8px] top-[8px] z-20 text-[12px] uppercase tracking-[0.08em] text-white/60">
                        {passportNumber}
                    </div>
                    <div className="absolute left-[-182px] top-[128px] z-20 -rotate-90 text-[16px] uppercase tracking-[0.24em] text-white/55">
                        SEASON {selectedSeason ?? '01 2026'}
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[80px] -translate-y-1/2">
                        <div className="h-1/2 bg-gradient-to-b from-transparent via-black/55 to-black/90" />
                        <div className="relative h-0">
                            <div className="h-[3px] bg-[#050505] shadow-[0_0_6px_3px_rgba(0,0,0,0.9)]" />
                            <div className="absolute left-0 right-0 top-[-1px] border-t-2 border-dashed border-white/40" />
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-transparent via-black/55 to-black/90" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 top-1/2 z-10 min-h-0 overflow-hidden bg-[#0f0f0f] px-3 py-2 sm:px-4 sm:py-2">
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

                            <div className="mt-1.5 flex w-full items-center overflow-hidden" style={{ minHeight: 30 }}>
                                <div className="flex min-w-0 flex-1 items-center" style={{ gap: 2 }}>
                                    <svg
                                        width="20"
                                        height="12"
                                        viewBox="12 11 17 10"
                                        preserveAspectRatio="xMinYMid meet"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="shrink-0"
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
                                    <span className="truncate text-[9px] font-semibold uppercase tracking-[0.05em] text-white">
                                        PASSPORT • PASS • PORT
                                    </span>
                                </div>
                                <div className="flex shrink-0 flex-col items-stretch" style={{ width: 108 }}>
                                    <p className="mb-[3px] text-[9px] font-semibold uppercase leading-[12px] text-white/80">
                                        LEVEL {levelText}
                                    </p>
                                    <div className="h-[4px] w-full overflow-hidden rounded-full bg-[rgba(176,38,255,0.22)]">
                                        <div
                                            className="h-full rounded-full bg-pxi-purple"
                                            style={{ width: `${levelProgress * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="ml-2 shrink-0 text-right">
                                    <span className="text-[10px] font-bold text-white">{odessaVsNext}</span>
                                </div>
                            </div>

                            {/* Details grid — mirrors mobile NewPassportCard `detailsGrid`: photo (113×130) + info column */}
                            <div className="mt-2 flex" style={{ gap: 14 }}>
                                <div
                                    className="relative shrink-0 overflow-hidden rounded-[6px] shadow-[0_1px_24px_2px_rgba(255,255,255,0.3)]"
                                    style={{ width: 113, height: 130 }}
                                >
                                    {avatarSrc ? (
                                        <Image
                                            src={avatarSrc}
                                            alt={fullName}
                                            width={113}
                                            height={130}
                                            unoptimized
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-pxi-purple/20 text-2xl font-black text-pxi-purple">
                                            {avatarFallback}
                                        </div>
                                    )}
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col">
                                    {/* Top row: name+username column | passport type badge (height 68, bottom-right) */}
                                    <div className="flex w-full items-end justify-between" style={{ gap: 10 }}>
                                        <div className="min-w-0 flex-1">
                                            <div
                                                className="flex flex-col justify-center overflow-hidden"
                                                style={{ height: 34 }}
                                            >
                                                <p className="text-[9px] font-medium uppercase text-white/70">Full name</p>
                                                <p className="truncate text-[12px] font-semibold uppercase leading-snug text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                                                    {fullName.toUpperCase()}
                                                </p>
                                            </div>
                                            <div
                                                className="flex flex-col justify-center overflow-hidden"
                                                style={{ height: 34 }}
                                            >
                                                <p className="text-[9px] font-medium uppercase text-white/70">username</p>
                                                <p className="truncate text-[12px] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                                                    {username}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className="flex shrink-0 flex-col items-end justify-end"
                                            style={{ height: 68 }}
                                        >
                                            <div className="flex items-baseline">
                                                <span
                                                    className="font-extrabold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
                                                    style={{ fontSize: 52, lineHeight: '52px' }}
                                                >
                                                    {passportType.charAt(0).toUpperCase()}
                                                </span>
                                                <span
                                                    className="font-semibold capitalize text-white"
                                                    style={{ fontSize: 13, lineHeight: '13px', marginLeft: 2, marginBottom: 2 }}
                                                >
                                                    {passportType.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta row: Age | Insta | City */}
                                    <div
                                        className="flex items-center justify-between overflow-hidden"
                                        style={{ height: 34 }}
                                    >
                                        <div
                                            className="flex flex-col justify-center overflow-hidden"
                                            style={{ width: 38 }}
                                        >
                                            <p className="text-[9px] font-medium uppercase text-white/70">Age</p>
                                            <p className="text-[12px] text-white/90">{age}</p>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
                                            <p className="text-[9px] font-medium uppercase text-white/70">Insta</p>
                                            <p className="truncate text-[12px] text-white/90" title={instagram}>
                                                {instagram}
                                            </p>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
                                            <p className="text-[9px] font-medium uppercase text-white/70">City</p>
                                            <p className="truncate text-[12px] text-white/90">{city}</p>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div
                                        className="flex flex-col justify-center overflow-hidden"
                                        style={{ height: 34 }}
                                    >
                                        <p className="text-[9px] font-medium uppercase text-white/70">Bio</p>
                                        <p className="truncate text-[12px] text-white/90">{bio}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 h-[2px] w-full bg-white/40" />
                            <div
                                ref={passportFooterRef}
                                className="pt-1.5 font-mono uppercase"
                                style={{
                                    color: 'rgba(255,255,255,0.32)',
                                    letterSpacing: '1.2px',
                                }}
                            >
                                <p
                                    className="overflow-hidden whitespace-nowrap"
                                    style={{ fontSize: 12, lineHeight: '15px', marginBottom: 2 }}
                                >
                                    {renderPassportFooterSegments(
                                        passportFooterLineOne,
                                        'text-[15px]',
                                    )}
                                </p>
                                <p
                                    className="overflow-hidden whitespace-nowrap"
                                    style={{ fontSize: 12, lineHeight: '15px' }}
                                >
                                    {renderPassportFooterSegments(
                                        passportFooterLineTwo,
                                        'text-[15px]',
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PublicProfileClient({ userId, initialProfile }) {
    if (!initialProfile) {
        return (
            <div className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 pb-40 pt-28 text-center md:pt-32">
                <p className="text-lg font-semibold text-white">Profile not found</p>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">This link may be invalid or the account is no longer available.</p>
                <Link href="/" className="mt-6 text-sm font-medium text-pxi-purple hover:text-white">
                    Back to PXI
                </Link>
                <PublicProfileBottomBar userId={userId} />
            </div>
        );
    }

    if (initialProfile.isPrivateAccount) {
        return (
            <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
                <div className="mx-auto flex max-w-lg flex-col px-4">
                    {/* Same blurred preview treatment as `/p/[postId]` when the account is private */}
                    <div className="relative aspect-[3/4] w-full max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                        <div
                            className="absolute inset-0 opacity-90"
                            style={{
                                background:
                                    'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.25), transparent 50%), linear-gradient(180deg, #18181b, #09090b)',
                                filter: 'blur(24px)',
                                transform: 'scale(1.08)',
                            }}
                            aria-hidden
                        />
                        <div className="absolute inset-0 flex flex-col">
                            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-4 pt-8 text-center">
                                <p className="text-lg font-bold tracking-tight">This profile is private</p>
                                <p className="mt-2 text-sm text-zinc-400">
                                    Passport details are only visible in the PXI app for approved connections.
                                </p>
                            </div>
                            <div className="shrink-0 border-t border-white/10 bg-black/30 p-3 backdrop-blur-md md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                                <AppStoreCtaPair variant="row" />
                            </div>
                        </div>
                    </div>
                </div>
                <PublicProfileBottomBar userId={userId} />
            </div>
        );
    }

    if (!initialProfile.isPassportIssued) {
        return (
            <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
                <div className="mx-auto max-w-lg px-4">
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-pxi-purple/20 bg-pxi-purple/10">
                            <HugeiconsIcon icon={SmartPhone01Icon} size={26} className="text-pxi-purple" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight">
                            {initialProfile.name || initialProfile.username || 'PXI member'}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                            This member has not published their PXI Passport on the web yet. Open the app to connect.
                        </p>
                        <div className="mt-8 md:hidden">
                            <AppStoreCtaPair className="mx-auto max-w-md" />
                        </div>
                    </div>
                </div>
                <PublicProfileBottomBar userId={userId} />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
            <PassportReadOnly user={initialProfile} />
            <PublicProfileBottomBar userId={userId} />
        </div>
    );
}
