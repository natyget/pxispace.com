'use client';

import { getPassportLevelDisplay } from '@/utils/odysseyTier';
import { getLevelProgress, HeaderPolygonBadge } from '@/components/passport/passportVisualParts';
import { usePassportAttendedEvents } from '@/hooks/usePassportAttendedEvents';
import { PxiPassportCard } from '@/components/passport/PxiPassportCard';

/**
 * Full PXI Passport block: header row (badge, title, optional right slot) + card.
 * Used on `/dashboard/passport` and public `/u/:id` so UI stays in sync.
 */
export function PxiPassportSection({
    user,
    friendsCount = 0,
    /** Slot for vendor badge, vendor setup link, or spacer */
    headerRight = null,
    /** e.g. share link button — rendered below friends count */
    headerBelowFriends = null,
    /** `self` = logged-in dashboard; `public` = public profile XP fetch */
    eventsMode = 'self',
    className = '',
    cardClassName = 'w-full',
    children,
}) {
    const attendedEvents = usePassportAttendedEvents(user?.id, eventsMode);
    const { badgeLetter } = getPassportLevelDisplay(user);
    const levelProgress = getLevelProgress(user?.odysseyXp);

    return (
        <div className={`mx-auto max-w-2xl ${className}`.trim()}>
            <div className="mx-auto w-full max-w-[min(95vw,361px)] space-y-4 sm:space-y-6">
                <div className="min-w-0">
                    <div className="relative flex min-h-[36px] items-center justify-between">
                        <div className="relative z-10 flex shrink-0 items-center">
                            <HeaderPolygonBadge letter={badgeLetter} progress={levelProgress} />
                        </div>
                        <h1 className="pointer-events-none absolute left-0 right-0 top-1/2 z-0 -translate-y-1/2 px-16 text-center text-[clamp(1rem,4.2vw,22px)] font-bold leading-none tracking-wide text-white sm:px-20">
                            PXI Passport
                        </h1>
                        <div className="relative z-10 shrink-0">{headerRight}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-base font-bold text-white">{friendsCount}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/45">Friends</p>
                        </div>
                    </div>
                    {headerBelowFriends ? (
                        <div className="mt-4 flex justify-center">{headerBelowFriends}</div>
                    ) : null}
                </div>

                <PxiPassportCard user={user} attendedEvents={attendedEvents} className={cardClassName} />
            </div>
            {children}
        </div>
    );
}
