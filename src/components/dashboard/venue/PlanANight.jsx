'use client';

// VEN-6, "Plan a night": pick a genre and a date, and see a realistic range and who there is to reach.
// Unchanged from the first venue dashboard; VEN-8 moved it here. Counts only, and always a range.

import { useCallback, useEffect, useState } from 'react';
import SectionCard from '@/components/dashboard/SectionCard';
import { getDashboardChartShade } from '@/components/dashboard/chartStyles';
import { fetchVenueForecast, fetchVenueSuggestions } from '@/services/venues';
import { formatInteger } from '@/lib/venueDashboard';

const inputCls = 'rounded-full bg-white/[0.055] px-4 py-2 text-[13px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]';

function Tile({ label, value, hint }) {
    return (
        <div className="rounded-2xl bg-white/[0.04] p-5">
            <p className="text-[11px] font-medium tracking-[0.02em] text-white/40">{label}</p>
            <p className="mt-3 text-[28px] font-bold leading-none text-white tabular-nums">{value}</p>
            {hint ? <p className="mt-2 text-xs font-semibold leading-5 text-white/45">{hint}</p> : null}
        </div>
    );
}

function Notice({ tone = 'neutral', children }) {
    const tones = {
        neutral: 'bg-white/[0.04] text-white/60',
        error: 'bg-red-500/10 text-red-200',
        info: 'bg-sky-500/10 text-sky-200',
    };
    return <div className={`rounded-2xl px-5 py-4 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}

export default function PlanANight({ venueId, adminView, forecastVisible }) {
    const [genres, setGenres] = useState(null);
    const [genre, setGenre] = useState('');
    const [date, setDate] = useState('');
    const [forecast, setForecast] = useState(null);
    const [suggestion, setSuggestion] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchVenueSuggestions(venueId)
            .then((res) => { if (!cancelled) setGenres(res.genres || []); })
            .catch((err) => { if (!cancelled) setError(err.status === 404 ? 'Planning tools are not available for venues yet.' : err.message); });
        return () => { cancelled = true; };
    }, [venueId]);

    const run = useCallback(async () => {
        if (!genre) return;
        setLoading(true);
        setError(null);
        try {
            const [f, s] = await Promise.all([
                fetchVenueForecast(venueId, { genre, date: date ? new Date(`${date}T21:00:00`).toISOString() : undefined }),
                fetchVenueSuggestions(venueId, genre),
            ]);
            setForecast(f);
            setSuggestion(s.suggestion);
        } catch (err) {
            setError(err.message || 'Failed to plan');
        } finally {
            setLoading(false);
        }
    }, [venueId, genre, date]);

    return (
        <div className="space-y-6">
            {adminView && !forecastVisible ? (
                <Notice tone="info">Shadow mode. Venue owners do not see forecasts until they have been checked against enough real nights.</Notice>
            ) : null}
            <SectionCard title="Plan a night">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className={`${inputCls} md:min-w-[220px]`} aria-label="Genre">
                        <option value="">Choose a genre</option>
                        {(genres || []).map((g) => (
                            <option key={g.genre} value={g.genre}>{g.genre} ({formatInteger(g.people)} nearby)</option>
                        ))}
                    </select>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-label="Date" />
                    <button type="button" disabled={!genre || loading} onClick={run} className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                        {loading ? 'Working...' : 'See the numbers'}
                    </button>
                </div>
                {genres && genres.length === 0 ? (
                    <p className="mt-3 text-[13px] text-white/45">Genres appear once enough people nearby have shared their music taste.</p>
                ) : null}
            </SectionCard>

            {error ? <Notice tone="error">{error}</Notice> : null}

            {forecast ? (
                <SectionCard title="Expected attendance">
                    {forecast.forecast ? (
                        <div className="space-y-3">
                            <p className="text-[32px] font-bold text-white tabular-nums">
                                {formatInteger(forecast.forecast.low)} to {formatInteger(forecast.forecast.high)} people
                            </p>
                            <p className="text-[13px] leading-6 text-white/55">
                                {forecast.forecast.calibrated
                                    ? `A range we expect to hold about ${Math.round((forecast.forecast.confidence || 0) * 100)}% of the time, based on how past forecasts compared with real nights.`
                                    : 'A wide range for now: there are not yet enough measured nights to size it more tightly.'}
                            </p>
                            <p className="text-[12px] leading-5 text-white/40">
                                From your last {forecast.forecast.basis.historyEvents} nights
                                {forecast.forecast.basis.genre ? `, how much ${forecast.forecast.basis.genre} is liked nearby compared with your usual nights` : ''}
                                {forecast.forecast.basis.recency < 1 ? ', and the time since your last event' : ''}.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm leading-6 text-white/55">
                            Not enough history yet. A range appears after three nights at your venue with scanned tickets
                            ({forecast.historyEvents} so far).
                        </p>
                    )}
                </SectionCard>
            ) : null}

            {suggestion ? (
                <SectionCard title={`Who to reach for ${suggestion.genre}`}>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Tile label="Nearby fans" value={formatInteger(suggestion.audienceSize)} hint="Like this genre" />
                        <Tile label="Reachable" value={formatInteger(suggestion.reachable)} hint="Agreed to hear about events" />
                        <Tile label="Already your regulars" value={formatInteger(suggestion.regulars)} hint="Came to your venue before" />
                        <Tile label="Friends of regulars" value={formatInteger(suggestion.connectedToRegulars)} hint="Connected on PXI" />
                    </div>
                    {suggestion.composition.withheld ? (
                        <p className="mt-4 text-[13px] text-white/45">{suggestion.composition.reason}</p>
                    ) : (
                        <div className="mt-5 grid gap-6 md:grid-cols-2">
                            <div>
                                <p className="mb-2 text-[11px] font-medium text-white/40">Age</p>
                                <ul className="space-y-1.5">
                                    {suggestion.composition.ageBands.map((b, i) => (
                                        <li key={b.band} className="flex items-center gap-2 text-[13px] text-white/70">
                                            <span className="h-2 w-2 rounded-full" style={{ background: getDashboardChartShade(i) }} />
                                            <span className="flex-1">{b.band}</span>
                                            <span className="tabular-nums text-white/50">{formatInteger(b.count)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="mb-2 text-[11px] font-medium text-white/40">They also like</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestion.composition.alsoLikes.length
                                        ? suggestion.composition.alsoLikes.map((g) => (
                                            <span key={g.genre} className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-white/70">{g.genre}</span>
                                        ))
                                        : <span className="text-[13px] text-white/45">Nothing that stands out yet.</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    <p className="mt-5 text-[12px] leading-5 text-white/35">
                        Counts only. PXI never shares who these people are, and only includes people who allow it.
                    </p>
                </SectionCard>
            ) : null}
        </div>
    );
}
