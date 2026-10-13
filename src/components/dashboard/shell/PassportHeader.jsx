'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Cancel01Icon, LockIcon } from '@hugeicons/core-free-icons';
import { PxiPassportSection } from '@/components/passport/PxiPassportSection';
import { HeaderPolygonBadge, getLevelProgress } from '@/components/passport/passportVisualParts';
import { getNextOdysseyTier, getPassportLevelBadgeTheme } from '@/utils/odysseyTier';
import { isPartialUser } from '@/lib/accountTier';
import { PXI_GET_APP_HREF } from '@/lib/appStoreLinks';

const STORAGE_KEY = 'pxi_dash_passport_collapsed';
// A variable, not motion.section in JSX: keeps the framer-motion import visibly used to the linter.
const MotionSection = motion.section;

/**
 * The passport above every member page. Expanded: the passport card, a map and the Odyssey level badge.
 * Collapsed: a slim bar. Remembered per browser; phones start collapsed, desktop starts expanded.
 * Partial accounts (no passport yet) get a locked panel that points to the app.
 */
export default function PassportHeader({ user, rolesReady }) {
    const reduceMotion = useReducedMotion();
    // null until the stored choice is read after mount, so SSR and the first paint agree.
    const [collapsed, setCollapsed] = useState(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            let stored = null;
            try {
                stored = window.localStorage.getItem(STORAGE_KEY);
            } catch {
                /* private mode: fall back to the screen default */
            }
            if (stored === '1') setCollapsed(true);
            else if (stored === '0') setCollapsed(false);
            else setCollapsed(!window.matchMedia('(min-width: 768px)').matches);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const setAndRemember = (next) => {
        setCollapsed(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
        } catch {
            /* ignore */
        }
    };

    if (collapsed === null || !rolesReady || !user) {
        return <div aria-hidden="true" className="h-14" />;
    }

    const partial = isPartialUser(user);
    const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' };

    return (
        <AnimatePresence initial={false} mode="wait">
            {collapsed ? (
                <MotionSection
                    key="collapsed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={transition}
                    className="overflow-hidden"
                >
                    <div className="dashboard-surface flex items-center justify-between rounded-[1.25rem] px-4 py-3">
                        <span className="text-sm font-semibold text-white">Passport</span>
                        <button
                            type="button"
                            onClick={() => setAndRemember(false)}
                            aria-label="Show passport"
                            aria-expanded={false}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:text-white"
                        >
                            <HugeiconsIcon icon={Add01Icon} size={16} />
                        </button>
                    </div>
                </MotionSection>
            ) : (
                <MotionSection
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={transition}
                    className="overflow-hidden"
                >
                    <div className="dashboard-surface rounded-[1.25rem] p-4 md:p-5">
                        <div className="mb-3 flex items-center justify-between md:mb-4">
                            <span className="text-sm font-semibold text-white">Passport</span>
                            <button
                                type="button"
                                onClick={() => setAndRemember(true)}
                                aria-label="Hide passport"
                                aria-expanded={true}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:text-white"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
                            <div className="w-full md:w-[260px] md:shrink-0">
                                {partial ? (
                                    <PassportLocked />
                                ) : (
                                    <PxiPassportSection user={user} showHeader={false} eventsMode="self" cardClassName="w-full" />
                                )}
                            </div>

                            {partial ? null : (
                                <>
                                    <div className="hidden min-h-[180px] min-w-0 flex-1 overflow-hidden rounded-[1rem] bg-pxi-field md:block">
                                        <img src="/passport-map.svg" alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <OdysseyBadge user={user} className="hidden md:flex" />
                                    <OdysseyBadge user={user} className="flex md:hidden" />
                                </>
                            )}
                        </div>
                    </div>
                </MotionSection>
            )}
        </AnimatePresence>
    );
}

function OdysseyBadge({ user, className }) {
    const xp = Math.max(0, Math.floor(Number(user?.odysseyXp) || 0));
    const { current, next, ceilingXp } = getNextOdysseyTier(xp);
    const theme = getPassportLevelBadgeTheme(current.id);

    return (
        <div className={`w-full flex-col gap-3 rounded-[1rem] bg-pxi-field p-4 md:w-[220px] md:shrink-0 ${className}`}>
            <div className="flex items-center gap-3">
                <HeaderPolygonBadge
                    letter={current.badgeLetter}
                    progress={getLevelProgress(xp)}
                    hexFill={theme.fill}
                    hexStroke={theme.stroke}
                    ringMuted={theme.progressTrack}
                    ringBright={theme.progressFill}
                />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{current.label}</p>
                    <p className="text-xs text-zinc-400">{next ? `Next: ${next.label}` : 'Highest level'}</p>
                </div>
            </div>
            <p className="text-xs tabular-nums text-zinc-400">
                {ceilingXp ? `${xp.toLocaleString('en-US')} / ${ceilingXp.toLocaleString('en-US')}` : `${xp.toLocaleString('en-US')} XP`}
            </p>
        </div>
    );
}

function PassportLocked() {
    return (
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-[1rem] bg-pxi-field px-5 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2e2e2e]">
                <HugeiconsIcon icon={LockIcon} size={18} className="text-white/70" />
            </span>
            <p className="text-sm font-semibold text-white">Finish your account in the PXI app</p>
            <Link href={PXI_GET_APP_HREF} className="pill-solid mt-1 px-5 py-2.5 text-sm">
                Get the app
            </Link>
        </div>
    );
}
