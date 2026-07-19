'use client';

import { useId, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { getPassportLevelDisplay, getOdysseyTierFromXp, getPassportLevelBadgeTheme } from '@/utils/odysseyTier';
import { getLevelProgress, ODYSSEY_TIER_BANDS } from '@/components/passport/passportVisualParts';
import { PassportMrzFooter } from '@/components/passport/PassportMrzFooter';
import { PassportStampsLayer } from '@/components/passport/PassportStampsLayer';
import { PassportCardShell } from '@/components/passport/PassportCardShell';
import { PassportDottedText } from '@/components/passport/PassportDottedText';
import { usePassportSeason } from '@/hooks/usePassportSeason';
import { getPassportDisplayFields } from '@/components/passport/pxiPassportDisplay';
import UserAvatar from '@/components/ui/UserAvatar';

/** Photo + info typography — single source for dashboard + public profile. */
const AVATAR_W = 92;
const AVATAR_H = 106;
const INFO_ROW_H = 28;

function PassportChipIcon({ filterId }) {
    return (
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
            <g filter={`url(#${filterId})`}>
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
                    id={filterId}
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
    );
}

/**
 * PXI Passport card (map, stamps, photo, fields, MRZ).
 * Use inside `PxiPassportSection` or standalone when you only need the card.
 */
export function PxiPassportCard({ user, attendedEvents = [], className = '', animateStamps = false }) {
    const chipFilterId = useId().replace(/:/g, '');
    const fields = useMemo(() => getPassportDisplayFields(user), [user]);
    const { fullName, username, city, bio, instagram, age, passportNumber, passportType } = fields;

    const { levelText, badgeLetter } = getPassportLevelDisplay(user);
    const tierId = getOdysseyTierFromXp(user?.odysseyXp).id;
    const badgeTheme = getPassportLevelBadgeTheme(tierId);
    const levelProgress = getLevelProgress(user?.odysseyXp);

    const odessaVsNext = useMemo(() => {
        const current = Math.max(0, Math.floor(Number(user?.odysseyXp) || 0));
        const band =
            ODYSSEY_TIER_BANDS.find((b) => b.max === null || current <= b.max) ??
            ODYSSEY_TIER_BANDS[ODYSSEY_TIER_BANDS.length - 1];
        if (band.max === null) return `${current.toLocaleString('en-US')}/∞`;
        return `${current.toLocaleString('en-US')}/${band.max.toLocaleString('en-US')}`;
    }, [user?.odysseyXp]);

    const { availableYears, selectedSeason, setSelectedSeason, filteredEvents } =
        usePassportSeason(attendedEvents);
    // Shared with PassportStampsLayer so the map background translates in lockstep
    // with the live-tracked season-pager drag — top half only, per design law.
    const topDragX = useMotionValue(0);

    return (
        <PassportCardShell
            className={className}
            top={
                <>
                    <motion.div className="absolute inset-0" style={{ x: topDragX }}>
                        <Image
                            src="/images/map-world.png"
                            alt=""
                            fill
                            unoptimized
                            className="object-cover opacity-90"
                            priority
                        />
                    </motion.div>
                    <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[70px] z-[2] overflow-hidden opacity-90 pr-12">
                        <PassportStampsLayer
                            events={filteredEvents}
                            availableYears={availableYears}
                            selectedSeason={selectedSeason}
                            onSelectSeason={setSelectedSeason}
                            seasonPillsPointerEvents
                            dragX={topDragX}
                            animateEntrance={animateStamps}
                        />
                    </div>
                </>
            }
            overlay={
                <>
                    <div className="pointer-events-none absolute right-1 top-2 z-10">
                        <PassportDottedText text={passportNumber} fontSize={14} width={120} />
                    </div>
                    <div
                        className="pointer-events-none absolute z-10 flex items-center justify-center"
                        style={{ top: 130, left: -185, width: 400, transform: 'rotate(-90deg)' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedSeason ?? 'default'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <PassportDottedText
                                    text={`SEASON ${selectedSeason ?? new Date().getFullYear()}`}
                                    fontSize={24}
                                    width={300}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </>
            }
            bottom={
                <div className="relative h-full px-3 py-2 sm:px-4 sm:py-2">
                    <div className="mx-auto w-full max-w-[380px] shrink-0 px-2 sm:px-3">
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
                                <PassportChipIcon filterId={chipFilterId} />
                                <span className="truncate text-[8px] font-semibold uppercase tracking-[0.04em] text-white">
                                    PASSPORT • PASS • PORT
                                </span>
                            </div>
                            <div className="flex shrink-0 flex-col items-stretch" style={{ width: 108 }}>
                                <p className="mb-[3px] text-[9px] font-semibold uppercase leading-[12px] text-white/80">
                                    LEVEL {levelText}
                                </p>
                                <div
                                    className="h-[4px] w-full overflow-hidden rounded-full"
                                    style={{ backgroundColor: badgeTheme.progressTrack }}
                                >
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${levelProgress * 100}%`,
                                            backgroundColor: badgeTheme.progressFill,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="ml-2 shrink-0 text-right">
                                <span className="text-[10px] font-bold text-white">{odessaVsNext}</span>
                            </div>
                        </div>

                        <div className="mt-2 flex items-start" style={{ gap: 12 }}>
                            <div
                                className="relative shrink-0 overflow-hidden rounded-[6px]"
                                style={{ width: AVATAR_W, height: AVATAR_H }}
                            >
                                <UserAvatar
                                    user={user}
                                    size={AVATAR_H}
                                    rounded="md"
                                    className="!h-[106px] !w-[92px]"
                                    alt={fullName}
                                />
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col items-stretch">
                                <div className="flex w-full items-start justify-between" style={{ gap: 10 }}>
                                    <div className="min-w-0 flex-1">
                                        <div
                                            className="flex flex-col justify-start overflow-hidden"
                                            style={{ height: INFO_ROW_H }}
                                        >
                                            <p className="text-[8px] font-medium uppercase text-white/70">Full name</p>
                                            <p className="truncate text-[10px] font-semibold uppercase leading-snug text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                                                {fullName.toUpperCase()}
                                            </p>
                                        </div>
                                        <div
                                            className="flex flex-col justify-start overflow-hidden"
                                            style={{ height: INFO_ROW_H }}
                                        >
                                            <p className="text-[8px] font-medium uppercase text-white/70">username</p>
                                            <p className="truncate text-[10px] text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                                                {username}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end justify-start">
                                        <div className="flex items-baseline">
                                            <span
                                                className="font-extrabold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
                                                style={{ fontSize: 52, lineHeight: '52px' }}
                                            >
                                                {passportType.charAt(0).toUpperCase()}
                                            </span>
                                            <span
                                                className="font-semibold capitalize text-white"
                                                style={{
                                                    fontSize: 13,
                                                    lineHeight: '13px',
                                                    marginLeft: 2,
                                                    marginBottom: 2,
                                                }}
                                            >
                                                {passportType.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="flex items-start justify-between overflow-hidden"
                                    style={{ height: INFO_ROW_H }}
                                >
                                    <div
                                        className="flex flex-col justify-start overflow-hidden"
                                        style={{ width: 34 }}
                                    >
                                        <p className="text-[8px] font-medium uppercase text-white/70">Age</p>
                                        <p className="text-[10px] text-white/90">{age}</p>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-start overflow-hidden">
                                        <p className="text-[8px] font-medium uppercase text-white/70">Insta</p>
                                        <p className="truncate text-[10px] text-white/90" title={instagram}>
                                            {instagram}
                                        </p>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-start overflow-hidden">
                                        <p className="text-[8px] font-medium uppercase text-white/70">City</p>
                                        <p className="truncate text-[10px] text-white/90">{city}</p>
                                    </div>
                                </div>

                                <div
                                    className="flex flex-col justify-start overflow-hidden"
                                    style={{ height: INFO_ROW_H }}
                                >
                                    <p className="text-[8px] font-medium uppercase text-white/70">Bio</p>
                                    <p className="truncate text-[10px] text-white/90">{bio}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-[380px] shrink-0 px-2 sm:px-3">
                        <PassportMrzFooter
                            variant="inline"
                            userId={user?.id}
                            username={username}
                            fullName={fullName}
                            issuedAt={user?.createdAt ?? user?.passportIssuedAt}
                        />
                    </div>
                </div>
            }
        />
    );
}
