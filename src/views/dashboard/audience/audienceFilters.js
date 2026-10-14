// The Audience page's filters, kept apart from the markup. Each filter is one of the fields the attendee list and a
// saved list already understand (src/services/audienceSegments.js); the page only changes how they are picked.
//
// Two of them are special because of the privacy wall on the API:
//   Reach and City are targeting filters. The API answers with a count and no names (a list of names narrowed by
//   city or opt-in would say "everyone from Boston"), so the page shows the count and says why there are no rows.
//   Night is not a filter the list can take at all, and a saved list cannot carry it. It is only ever used to
//   message the people with a ticket to that night, so choosing a night puts the other filters aside.

import { shortDate } from '@/lib/dashFormat';

export const TAKE = 50;

export const FILTER_DEFAULTS = {
    ticketTier: '', // '' | 'PAID' | 'FREE'
    minEngagementTier: '',
    emailOptIn: null, // null | true | false
    smsOptIn: null,
    city: '',
    // Not in the filter row any more. A list saved before keeps them, and they still apply when it is loaded.
    accountTier: '',
    minOdysseyXp: '',
};

export const TICKET_OPTIONS = [
    { value: '', label: 'Any ticket' },
    { value: 'PAID', label: 'Paid ticket' },
    { value: 'FREE', label: 'Free ticket' },
];

export const ENGAGEMENT_OPTIONS = [
    { value: '', label: 'Any engagement' },
    { value: 'SEEKER', label: 'Seeker and above' },
    { value: 'VOYAGER', label: 'Voyager and above' },
    { value: 'PATHFINDER', label: 'Pathfinder and above' },
    { value: 'LUMINARY', label: 'Luminary and above' },
    { value: 'ODYSSEY', label: 'Odyssey' },
];

export const REACH_OPTIONS = [
    { value: '', label: 'Anyone' },
    { value: 'email', label: 'Reach by email' },
    { value: 'text', label: 'Reach by text' },
];

/** One word for who can be reached: '' (anyone), 'email', 'text', or 'both' (only from an older saved list). */
export function reachValue(filters) {
    if (filters.emailOptIn === true && filters.smsOptIn === true) return 'both';
    if (filters.emailOptIn === true) return 'email';
    if (filters.smsOptIn === true) return 'text';
    return '';
}

export function reachFields(value) {
    return {
        emailOptIn: value === 'email' || value === 'both' ? true : null,
        smsOptIn: value === 'text' || value === 'both' ? true : null,
    };
}

/** The same filters in one spelling, so a saved list and the page's state compare equal. */
export function normalizeFilters(filters) {
    const f = { ...FILTER_DEFAULTS, ...(filters || {}) };
    const xp = Number(f.minOdysseyXp);
    return {
        ticketTier: f.ticketTier === 'PAID' || f.ticketTier === 'FREE' ? f.ticketTier : '',
        minEngagementTier: f.minEngagementTier ? String(f.minEngagementTier).toUpperCase() : '',
        emailOptIn: f.emailOptIn === true ? true : f.emailOptIn === false ? false : null,
        smsOptIn: f.smsOptIn === true ? true : f.smsOptIn === false ? false : null,
        city: String(f.city || '').trim(),
        accountTier: f.accountTier || '',
        minOdysseyXp: Number.isFinite(xp) && xp > 0 ? String(xp) : '',
    };
}

export function hasActiveFilters(filters) {
    const f = normalizeFilters(filters);
    return Object.keys(FILTER_DEFAULTS).some((key) => f[key] !== FILTER_DEFAULTS[key]);
}

/** Does a saved list say exactly what the filters say? Only the filter fields are compared. */
export function filtersMatchSegment(filters, filterJson) {
    const a = normalizeFilters(filters);
    const b = normalizeFilters(filterJson);
    return Object.keys(FILTER_DEFAULTS).every((key) => a[key] === b[key]);
}

/** The cities in the audience for the City filter. The API folds small groups into an "other" bucket: not a city. */
export function cityOptions(topCities, current) {
    const names = (topCities || []).map((c) => c.city).filter((city) => city && !String(city).toLowerCase().startsWith('other'));
    if (current && !names.some((n) => n.toLowerCase() === current.toLowerCase())) names.unshift(current);
    return [{ value: '', label: 'Any city' }, ...names.map((city) => ({ value: city, label: city }))];
}

/** Their nights, newest first, each with its date so two runs of the same night can be told apart. */
export function nightOptions(events) {
    const sorted = [...(events || [])].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
    return [
        { value: '', label: 'Any night' },
        ...sorted.map((e) => ({ value: e.id, label: `${e.name}, ${shortDate(e.startDate)}`.replace(/, $/, '') })),
    ];
}

/** Where "Message them" goes: Campaigns with the audience already chosen. */
export function composeHref({ audience, eventId = null, segmentId = null }) {
    const params = new URLSearchParams({ compose: '1', audience });
    if (eventId) params.set('eventId', eventId);
    if (segmentId) params.set('segmentId', segmentId);
    return `/dashboard/campaigns?${params}`;
}

export function peopleWord(n) {
    return Number(n) === 1 ? 'person' : 'people';
}
