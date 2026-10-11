'use client';

// VEN-8, "Net Payout".
//
// The venue surface carries no money: CEO decision, 2026-09-17 ("a venue that hosts its own event does so as an
// organizer and sees that revenue in the organizer tools; a night a separate organizer runs is theirs"). This
// card keeps to that. It reads the signed-in account's OWN payments from the organizer tools
// (GET /api/vendor/dashboard, the same source as Earnings) and keeps the ones for nights at this venue. A night
// someone else ran here is never in that list, so it can never be shown. An admin looking at a venue is not
// that account, so they are shown nothing.

import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';
import { DASHBOARD_BRAND_COLOR } from '@/components/dashboard/chartStyles';
import { formatMoney, formatNightDate, payoutWeek } from '@/lib/venueDashboard';
import { CardSkeleton, EmptyNote, VenueCard } from './VenueCard';

const BAR_FILL = `linear-gradient(to top, color-mix(in srgb, ${DASHBOARD_BRAND_COLOR} 35%, transparent), ${DASHBOARD_BRAND_COLOR})`;

export default function PayoutCard({ venueEventIds, timeZone = null, adminView = false, className = '' }) {
    const [week, setWeek] = useState(null);

    useEffect(() => {
        if (adminView) return undefined;
        let cancelled = false;
        authService
            .getVendorDashboard()
            .then((res) => res?.payments || [])
            // An account that is not set up to be paid has no payments, which is a zero week, not an error.
            .catch(() => [])
            .then((payments) => {
                if (!cancelled) setWeek(payoutWeek(payments, venueEventIds, new Date(), timeZone));
            });
        return () => { cancelled = true; };
    }, [adminView, venueEventIds, timeZone]);

    if (adminView) {
        return (
            <VenueCard title="Net Payout" className={className} data-venue-card="payout">
                <EmptyNote detail="Payouts belong to the account that hosts the night, so only that account sees them.">
                    Shown to the venue&apos;s own account
                </EmptyNote>
            </VenueCard>
        );
    }

    const max = Math.max(1, ...(week?.days || []).map((d) => d.cents));
    return (
        <VenueCard title="Net Payout" className={className} data-venue-card="payout">
            {!week ? <CardSkeleton className="h-36" /> : (
                <>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <p className="text-[26px] font-black leading-none text-white tabular-nums">{formatMoney(week.totalCents)}</p>
                        <p className="text-[11px] font-medium text-white/80">
                            {week.everPaid
                                ? week.totalCents > 0
                                    ? 'This week, from nights you host here'
                                    : `Nothing this week. Last paid ${formatNightDate(week.lastPaidAt, timeZone)}`
                                : 'Host your First Event to Access Weekly Payouts'}
                        </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-1.5 text-[11px] ring-1 ring-white/[0.06]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span className="text-zinc-400">Paid directly to you via Stripe, 0% held</span>
                    </div>
                    <div className="mt-3 flex min-h-[64px] flex-1 items-end gap-1.5" role="img" aria-label="Payout per day this week">
                        {week.days.map((day) => (
                            <div key={day.key} className="flex h-full flex-1 flex-col justify-end" title={`${day.label}: ${formatMoney(day.cents)}`}>
                                {day.cents > 0 ? (
                                    <div className="rounded-t-md" style={{ height: `${Math.max(6, (day.cents / max) * 100)}%`, background: BAR_FILL }} />
                                ) : null}
                            </div>
                        ))}
                    </div>
                    <div className="mt-1.5 flex gap-1.5 text-[9px] font-medium tracking-wider text-zinc-600">
                        {week.days.map((day) => <span key={day.key} className="flex-1 text-center">{day.label}</span>)}
                    </div>
                </>
            )}
        </VenueCard>
    );
}
