'use client';

import { useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { getPassportLevelDisplay } from '@/utils/odysseyTier';
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
import { displayImageSrc } from '@/lib/mediaUrl';
import AppStoreCtaPair from '@/components/links/AppStoreCtaPair';

function PublicProfileBottomBar({ userId }) {
    /** Same-origin https://…/u/:id does not reliably open the app from Safari; use registered app scheme (see app.json `scheme`). */
    const openInAppUrl = `pxi://u/${userId}`;
    const year = new Date().getFullYear();

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-0 md:hidden">
            <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-2">
                <div className="flex w-full max-w-[24rem] items-center gap-2 rounded-2xl border border-white/15 bg-black/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white">Open in PXI</p>
                        <p className="text-[10px] text-zinc-400">Full profile and social features in the app</p>
                    </div>
                    <a
                        href={openInAppUrl}
                        className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-zinc-200"
                        rel="noopener noreferrer"
                    >
                        Open
                    </a>
                </div>
                <p className="text-center text-[11px] text-zinc-500">
                    © {year} PXI App. All rights reserved.
                </p>
            </div>
        </div>
    );
}

function PassportReadOnly({ user }) {
    const chipFilterId = useId().replace(/:/g, '');
    const fullName = user?.name ?? 'PXI CITIZEN';
    const username = user?.username ?? 'citizen';
    const avatarFallback = fullName.charAt(0).toUpperCase();
    const city = user?.city ?? '—';
    const bio = user?.bio ?? '—';
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

    const avatarSrc = displayImageSrc(user?.avatarUrl, null);

    return (
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
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
                                <CheckCircle2 size={12} className="shrink-0" />
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
                    <div
                        className="absolute left-0 right-0 top-0 z-[1] h-1/2 opacity-35"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
                            backgroundSize: '4px 4px',
                        }}
                    />
                    <div className="pointer-events-none absolute inset-0 opacity-25">
                        <NeonCurvesSVG className="h-full w-full" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 opacity-90">
                        <StampRed />
                        <StampYellow />
                        <StampCyan />
                        <StampWhite />
                        <GreenStampPositioned />
                    </div>

                    <div className="absolute right-[8px] top-[8px] z-20 text-[12px] uppercase tracking-[0.08em] text-white/60">
                        {passportNumber}
                    </div>
                    <div className="absolute left-[-182px] top-[128px] z-20 -rotate-90 text-[16px] uppercase tracking-[0.24em] text-white/55">
                        SEASON 01 2026
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-[80px] -translate-y-1/2">
                        <div className="h-1/2 bg-gradient-to-b from-transparent via-black/55 to-black/90" />
                        <div className="relative h-0">
                            <div className="h-[3px] bg-[#050505] shadow-[0_0_6px_3px_rgba(0,0,0,0.9)]" />
                            <div className="absolute left-0 right-0 top-[-1px] border-t-2 border-dashed border-white/40" />
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-transparent via-black/55 to-black/90" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 top-1/2 z-10 min-h-0 overflow-y-auto bg-[#0f0f0f] px-3 py-2 sm:px-4 sm:py-2">
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
                                    {avatarSrc ? (
                                        <Image src={avatarSrc} alt={fullName} fill unoptimized className="object-cover" sizes="112px" />
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
                                    <p className="text-[11px] text-white/90 sm:text-[12px]">Age {age}</p>
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

    if (!initialProfile.isPassportIssued) {
        return (
            <div className="relative min-h-screen bg-[#0a0a0a] pb-40 pt-24 text-white md:pb-40 md:pt-28">
                <div className="mx-auto max-w-lg px-4">
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-pxi-purple/20 bg-pxi-purple/10">
                            <Smartphone size={26} className="text-pxi-purple" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight">
                            {initialProfile.name || initialProfile.username || 'PXI member'}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                            This member has not published their PXI Passport on the web yet. Open the app to connect.
                        </p>
                        <div className="mt-8">
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
