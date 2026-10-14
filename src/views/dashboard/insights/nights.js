// Small helpers for the Analytics page: which night to open first, how nights are named in the picker,
// and what the sales pace adds up to by the doors.

import { shortDate } from '@/lib/dashFormat';

/** 'live' | 'upcoming' | 'past' for one event row (same rules as the Events page). */
export function nightState(event, now = Date.now()) {
    const start = event?.startDate ? new Date(event.startDate).getTime() : null;
    const end = event?.endDate ? new Date(event.endDate).getTime() : null;
    // The API reads the clock too (LIVE, DORMANT before the start, GRACE and ARCHIVED after the end), so it wins when it is sent.
    const status = String(event?.effectiveStatus || event?.status || '').toLowerCase();
    if (status === 'live') return 'live';
    if (['ended', 'past', 'completed', 'grace', 'archived'].includes(status)) return 'past';
    if (['upcoming', 'scheduled', 'draft', 'dormant'].includes(status)) return 'upcoming';
    if (start && end) {
        if (start <= now && now <= end) return 'live';
        return now > end ? 'past' : 'upcoming';
    }
    if (start) return start <= now ? 'past' : 'upcoming';
    return 'upcoming';
}

function startTime(event) {
    const time = new Date(event?.startDate || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
}

/** Live nights first, then the next one coming, then the most recent past, so the picker reads in the order of need. */
export function sortNights(events, now = Date.now()) {
    const rank = { live: 0, upcoming: 1, past: 2 };
    return [...events].sort((a, b) => {
        const sa = nightState(a, now);
        const sb = nightState(b, now);
        if (sa !== sb) return rank[sa] - rank[sb];
        return sa === 'past' ? startTime(b) - startTime(a) : startTime(a) - startTime(b);
    });
}

/** The night to open on: the one happening now, else the next one (not a draft), else the last one. */
export function pickRelevantNight(events, now = Date.now()) {
    const ordered = sortNights(events, now);
    const live = ordered.find((event) => nightState(event, now) === 'live');
    if (live) return live;
    const next = ordered.find((event) => nightState(event, now) === 'upcoming' && String(event?.status || '').toLowerCase() !== 'draft');
    if (next) return next;
    return ordered.find((event) => nightState(event, now) === 'past') || ordered[0] || null;
}

/** "Rooftop Sessions, Oct 22", or "Late Checkout, live now". */
export function nightLabel(event, now = Date.now()) {
    const name = event?.name || 'Untitled event';
    if (nightState(event, now) === 'live') return `${name}, live now`;
    const when = shortDate(event?.startDate);
    return when ? `${name}, ${when}` : name;
}

/** Days to doors and the total the last 7 days of sales add up to by then. `projected` is null once doors are open. */
export function projectSales({ velocityPerDay7d, totalSold, startDate }, nowMs = Date.now()) {
    const start = startDate ? new Date(startDate).getTime() : NaN;
    if (Number.isNaN(start)) return null;
    const pace = Number(velocityPerDay7d) || 0;
    const sold = Number(totalSold) || 0;
    const daysToDoors = Math.ceil((start - nowMs) / 86400000);
    if (daysToDoors <= 0) return { pace, daysToDoors, projected: null };
    return { pace, daysToDoors, projected: Math.round(sold + pace * daysToDoors) };
}
