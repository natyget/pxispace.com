'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Cancel01Icon, LockIcon, UserIcon } from '@hugeicons/core-free-icons';
import { getPassportDisplayFields } from '@/components/passport/pxiPassportDisplay';
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
                    <div className="dashboard-surface relative rounded-[1.25rem] p-3 md:p-4">
                        <button
                            type="button"
                            onClick={() => setAndRemember(true)}
                            aria-label="Hide passport"
                            aria-expanded={true}
                            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:text-white md:right-4 md:top-4"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        </button>

                        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                            <div className="min-w-0 md:flex-[1.35]">
                                {partial ? <PassportLocked /> : <PassportDataPage user={user} />}
                            </div>
                            <div className="relative hidden min-w-0 overflow-hidden rounded-[1rem] bg-pxi-field lg:block lg:flex-1">
                                <img src="/passport-map.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                            </div>
                            <OdysseyBadge user={user} />
                        </div>
                    </div>
                </MotionSection>
            )}
        </AnimatePresence>
    );
}

function OdysseyBadge({ user }) {
    const xp = Math.max(0, Math.floor(Number(user?.odysseyXp) || 0));
    const { current, next, ceilingXp } = getNextOdysseyTier(xp);
    const theme = getPassportLevelBadgeTheme(current.id);
    const pct = ceilingXp ? Math.min(100, Math.round((xp / ceilingXp) * 100)) : 100;

    return (
        <div className="flex items-center gap-4 rounded-[1rem] bg-pxi-field p-4 md:w-[200px] md:shrink-0 md:flex-col md:justify-center md:gap-3 md:text-center">
            <HeaderPolygonBadge
                letter={current.badgeLetter}
                progress={getLevelProgress(xp)}
                hexFill={theme.fill}
                hexStroke={theme.stroke}
                ringMuted={theme.progressTrack}
                ringBright={theme.progressFill}
            />
            <div className="min-w-0 flex-1 md:w-full md:flex-none">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{current.label}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-pxi-purple" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-zinc-400">
                    <span>{next ? `Next: ${next.label}` : 'Highest level'}</span>
                    <span>{ceilingXp ? `${xp.toLocaleString('en-US')} / ${ceilingXp.toLocaleString('en-US')}` : `${xp.toLocaleString('en-US')} XP`}</span>
                </div>
            </div>
        </div>
    );
}

/** Landscape passport data page: photo, identity fields, and the tier letter set large like the Figma. */
function PassportDataPage({ user }) {
    const f = getPassportDisplayFields(user);
    const tier = f.passportType;
    const photo = user?.avatarUrl || user?.profilePicture || null;
    const fullName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || f.fullName;
    // Empty fields are left out rather than shown as placeholders.
    const fields = [
        ['Full name', fullName],
        ['Username', `@${f.username}`],
        ['City', f.city],
        ['Age', f.age],
        ['Insta', f.instagram],
    ].filter(([, value]) => value !== '—' && value !== '' && value != null);

    return (
        <div className="relative h-full overflow-hidden rounded-[1rem] bg-pxi-field p-4 md:p-5">
            <div className="flex items-baseline justify-between gap-3 pr-10">
                <p className="border-b-2 border-white pb-1 text-[12px] font-bold uppercase tracking-[0.28em] text-white">PXI Passport</p>
                <p className="text-right text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    No. <span className="font-semibold text-white">{f.passportNumber}</span>
                </p>
            </div>
            <div className="mt-4 flex gap-4">
                <div className="flex h-[104px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[0.75rem] bg-black/40">
                    {photo ? (
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <HugeiconsIcon icon={UserIcon} size={36} className="text-white/30" />
                    )}
                </div>
                <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    {fields.map(([label, value]) => (
                        <div key={label} className="min-w-0">
                            <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
                            <dd className="truncate text-[13px] font-semibold text-white">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <p className="pointer-events-none absolute bottom-2 right-4 select-none leading-none text-white" aria-label={`${tier} tier`}>
                <span className="font-[family-name:var(--font-heading)] text-[56px] text-pxi-purple md:text-[72px]">{tier.charAt(0)}</span>
                <span className="text-xl font-bold md:text-2xl">{tier.slice(1)}</span>
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
