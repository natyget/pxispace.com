'use client';

// VEN-8, "Weekly Forecast": how many people to expect on each night booked this week, and what is liked
// nearby (VEN-6). Always a range, never one number. A venue sees this only once forecasts are released. Until
// then the card says there is nothing to suggest yet, and does not ask: `available` is what /mine said, so an
// owner's page does not make two requests it knows will be refused.

import { useEffect, useState } from 'react';
import { fetchVenueSuggestions, fetchVenueWeekForecast } from '@/services/venues';
import { formatInteger, formatNightDate } from '@/lib/venueDashboard';
import { CardSkeleton, EmptyNote, VenueCard } from './VenueCard';

function rangeText(forecast) {
    return `${formatInteger(forecast.low)} to ${formatInteger(forecast.high)} people`;
}

export default function ForecastCard({ venueId, available = true, adminView = false, onPlan = null, className = '' }) {
    const [state, setState] = useState({ status: 'loading', week: null, genres: [] });

    useEffect(() => {
        if (!available) return undefined;
        let cancelled = false;
        Promise.all([
            fetchVenueWeekForecast(venueId),
            // The genre list is a nice-to-have; the card stands without it.
            fetchVenueSuggestions(venueId).catch(() => ({ genres: [] })),
        ])
            .then(([week, suggestions]) => {
                if (!cancelled) setState({ status: 'ready', week, genres: suggestions.genres || [] });
            })
            .catch((err) => {
                if (cancelled) return;
                setState({ status: err.status === 404 ? 'unavailable' : 'error', week: null, genres: [], message: err.message });
            });
        return () => { cancelled = true; };
    }, [venueId, available]);

    const { week, genres } = state;
    const status = available ? state.status : 'unavailable';
    const nights = week?.nights || [];
    const topGenre = genres[0] || null;
    const nothingYet = status === 'ready' && !nights.length && !week?.typical;

    return (
        <VenueCard title="Weekly Forecast" className={className} data-venue-card="forecast">
            {status === 'loading' ? <CardSkeleton className="h-40" /> : null}
            {status === 'unavailable' ? (
                <EmptyNote detail="Forecasts open here once PXI has checked them against enough real nights.">No Current Suggestions</EmptyNote>
            ) : null}
            {status === 'error' ? <EmptyNote detail={state.message}>No Current Suggestions</EmptyNote> : null}
            {status === 'ready' ? (
                <div className="flex flex-1 flex-col">
                    {adminView && !week.visibleToVenue ? (
                        <p className="mb-2 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-[11px] leading-4 text-sky-200">
                            Shadow mode. The venue does not see this yet.
                        </p>
                    ) : null}
                    {nights.length ? (
                        <ul className="space-y-2">
                            {nights.map((night) => (
                                <li key={night.eventId} className="rounded-xl bg-white/[0.04] px-3 py-2">
                                    <p className="truncate text-[11px] text-white/50">
                                        {formatNightDate(night.startDate, night.timeZone)} · {night.name}
                                    </p>
                                    <p className="mt-0.5 text-[14px] font-bold text-white tabular-nums">
                                        {night.forecast ? rangeText(night.forecast) : 'Not enough history yet'}
                                    </p>
                                    {night.forecast && !night.forecast.calibrated ? (
                                        <p className="text-[10px] text-white/40">A wide range for now.</p>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {!nights.length && week.typical ? (
                        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                            <p className="text-[11px] text-white/50">A usual night here</p>
                            <p className="mt-0.5 text-[14px] font-bold text-white tabular-nums">{rangeText(week.typical)}</p>
                            {!week.typical.calibrated ? <p className="text-[10px] text-white/40">A wide range for now.</p> : null}
                        </div>
                    ) : null}
                    {nothingYet ? (
                        <EmptyNote
                            detail={`A range appears after ${week.minHistory} nights with scanned tickets (${formatInteger(week.historyEvents)} so far).`}
                        >
                            No Current Suggestions
                        </EmptyNote>
                    ) : null}
                    {topGenre ? (
                        <p className="mt-3 text-[11px] leading-4 text-white/55">
                            Most liked nearby: <span className="font-semibold text-white/85">{topGenre.genre}</span> ({formatInteger(topGenre.people)} people)
                        </p>
                    ) : null}
                    {onPlan ? (
                        <div className="mt-auto pt-3">
                            <button type="button" onClick={onPlan} className="w-fit rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold text-white/85 transition hover:bg-white/[0.14]">
                                Plan a night
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </VenueCard>
    );
}
