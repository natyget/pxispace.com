// VEN-8: the decisions behind the venue dashboard's cards, kept apart from the markup so they can be tested
// (venueDashboard.test.mjs). Nothing here fetches, and nothing here invents a number: a figure that is not
// known is null, and the card says so.

/** People needed before audience details are shown on the home card. The same floor as the backend's wall. */
export const AUDIENCE_MIN_PEOPLE = 10;

const PLACES = { NYC: 'New York, NY', BOS: 'Boston, MA' };

/** "New York, NY" for the venue's city; else the tail of its address; else nothing. */
export function venuePlace(venue) {
    if (!venue) return '';
    if (PLACES[venue.cityCode]) return PLACES[venue.cityCode];
    const parts = String(venue.address || '').split(',').map((p) => p.trim()).filter(Boolean);
    // "1 Main St, Brooklyn, NY 11201, USA" reads as "Brooklyn, NY".
    const trimmed = parts[parts.length - 1] === 'USA' || parts[parts.length - 1] === 'United States' ? parts.slice(0, -1) : parts;
    if (trimmed.length >= 2) return `${trimmed[trimmed.length - 2]}, ${trimmed[trimmed.length - 1].replace(/\s+\d{5}(-\d{4})?$/, '')}`;
    return trimmed[0] || '';
}

// ————— Time, in the venue's own zone —————

function formatter(options, timeZone) {
    try {
        return new Intl.DateTimeFormat('en-US', { ...options, ...(timeZone ? { timeZone } : {}) });
    } catch {
        // A zone the browser does not know: show the viewer's time rather than nothing.
        return new Intl.DateTimeFormat('en-US', options);
    }
}

/** "9PM", "9:30PM". The design writes times tight. */
export function formatClock(iso, timeZone) {
    if (!iso) return '';
    const date = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return formatter({ hour: 'numeric', minute: '2-digit', hour12: true }, timeZone)
        .format(date)
        .replace(':00', '')
        .replace(/\s+/g, '');
}

/** "9PM - 12AM", or just the start when the night has no end. */
export function formatTimeRange(startIso, endIso, timeZone) {
    const start = formatClock(startIso, timeZone);
    const end = formatClock(endIso, timeZone);
    return end ? `${start} - ${end}` : start;
}

/** "Thu, Sep 17". */
export function formatNightDate(iso, timeZone) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return formatter({ weekday: 'short', month: 'short', day: 'numeric' }, timeZone).format(date);
}

/** Minutes the zone is ahead of UTC at `date`. */
function zoneOffsetMinutes(date, timeZone) {
    const parts = formatter({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }, timeZone || 'UTC').formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    return (Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - date.getTime()) / 60000;
}

/**
 * A range of calendar days at the venue, as instants: the start of `fromDay` to the end of `toDay`
 * (YYYY-MM-DD, as a date field gives them). A night belongs to the day its doors open, so a night that runs
 * past midnight is still inside its own day.
 */
export function venueDayRange(fromDay, toDay, timeZone) {
    const at = (day, clock) => {
        if (!day) return null;
        const guess = new Date(`${day}T${clock}Z`);
        if (Number.isNaN(guess.getTime())) return null;
        return new Date(guess.getTime() - zoneOffsetMinutes(guess, timeZone) * 60000).toISOString();
    };
    return { from: at(fromDay, '00:00:00'), to: at(toDay, '23:59:59') };
}

/** The badge on a night's card: TONIGHT, Tomorrow, the weekday inside a week, else the date. */
export function nightBadge(night) {
    if (!night) return '';
    if (night.state === 'LIVE' || night.state === 'TONIGHT') return 'TONIGHT';
    if (night.daysAway === 1) return 'Tomorrow';
    if (night.daysAway > 1 && night.daysAway < 7) return formatter({ weekday: 'long' }, night.timeZone).format(new Date(night.startDate));
    return formatter({ month: 'short', day: 'numeric' }, night.timeZone).format(new Date(night.startDate));
}

/** Where "Details" on a night goes: the venue's own night to its manage page, a public one to its page, else nowhere. */
export function nightHref(night) {
    if (!night) return null;
    if (night.hostedByVenue) return `/dashboard/events/${night.eventId}`;
    if (night.isPublic) return `/events/${night.slug || night.eventId}`;
    return null;
}

// ————— Numbers —————

export function formatInteger(value) {
    return Number(value || 0).toLocaleString('en-US');
}

/** A share (0 to 1) as a whole percent. Null stays null. */
export function toPercent(share) {
    return share === null || share === undefined || !Number.isFinite(Number(share)) ? null : Math.round(Number(share) * 100);
}

/** "26 scans/min", "2.5 scans/min", "0.47 scans/min": enough digits that two rates that differ read differently. */
export function formatRate(perMinute) {
    if (perMinute === null || perMinute === undefined) return null;
    const value = Number(perMinute);
    const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2;
    return `${Number(value.toFixed(digits))} scans/min`;
}

/** "45 min", "1 hour", "1 h 30 min". */
export function formatDuration(minutes) {
    const total = Math.round(Math.abs(minutes));
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (!rest) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours} h ${rest} min`;
}

export function formatMoney(cents) {
    return `$${(Math.max(0, Number(cents) || 0) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// ————— Through the door —————

/** The ring: scanned out of tickets sold, as a whole percent. 0 before anyone is in. */
export function doorPercent(door) {
    return toPercent(door?.turnoutRate) ?? 0;
}

/** One line under the title saying which night the door is about. */
export function doorCaption(door) {
    if (!door) return '';
    if (door.state === 'LIVE') return door.name;
    if (door.state === 'TONIGHT') return `${door.name} · doors ${formatClock(door.startDate, door.timeZone)}`;
    // The API passes over a past night whose door never scanned, so a scanned night here may not be the latest
    // one in the room. It is called what it is. A night with no scan is only shown when no night has one.
    return `${door.scanned > 0 ? 'Last scanned night' : 'Last night here'} · ${formatNightDate(door.startDate, door.timeZone)}`;
}

// ————— When the room fills —————

/**
 * The chart's rows. Quiet steps at both ends are trimmed so the arrivals fill the frame, keeping one quiet
 * step either side. With a single night the axis reads as clock time at the venue; an average has no date, so
 * it reads against doors.
 */
export function activitySeries(activity) {
    if (!activity) return { rows: [], nightKey: null, compareKey: null };
    const night = activity.night?.points || null;
    const compare = activity.average?.points || activity.previous?.points || null;
    const steps = (night || compare || []).length;
    if (!steps) return { rows: [], nightKey: null, compareKey: null };

    let first = steps;
    let last = -1;
    for (let i = 0; i < steps; i += 1) {
        if ((night?.[i] || 0) > 0 || (compare?.[i] || 0) > 0) {
            first = Math.min(first, i);
            last = Math.max(last, i);
        }
    }
    if (last < 0) return { rows: [], nightKey: null, compareKey: null };
    const from = Math.max(0, first - 1);
    const to = Math.min(steps - 1, last + 1);

    const doors = activity.night ? new Date(activity.night.startDate).getTime() : null;
    const zone = activity.night?.timeZone || null;
    const rows = [];
    for (let i = from; i <= to; i += 1) {
        const minute = activity.startMinute + i * activity.stepMinutes;
        rows.push({
            minute,
            label: doors !== null ? formatClock(new Date(doors + minute * 60000), zone) : relativeToDoors(minute),
            night: night ? night[i] : null,
            compare: compare ? compare[i] : null,
        });
    }
    return {
        rows,
        nightKey: night ? 'night' : null,
        compareKey: compare ? 'compare' : null,
    };
}

/** "Doors", "+1h", "-30m". */
export function relativeToDoors(minute) {
    if (minute === 0) return 'Doors';
    const sign = minute < 0 ? '-' : '+';
    const abs = Math.abs(minute);
    if (abs % 60 === 0) return `${sign}${abs / 60}h`;
    return abs < 60 ? `${sign}${abs}m` : `${sign}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, '0')}`;
}

/** What the two lines are called. `live` is whether the night shown is running now. */
export function activityLegend(activity, live) {
    const zone = activity?.night?.timeZone || null;
    const night = activity?.night ? (live ? 'Tonight' : formatNightDate(activity.night.startDate, zone)) : null;
    let compare = null;
    if (activity?.average) compare = activity.night ? 'Avg night' : `Avg of ${activity.average.nights} ${activity.average.nights === 1 ? 'night' : 'nights'}`;
    else if (activity?.previous) compare = live ? 'Last night' : formatNightDate(activity.previous.startDate, activity.previous.timeZone);
    return { night, compare };
}

/** The share bar under the chart: who came, first time or returning. Zero shares when nothing is known. */
export function mixSegments(mix) {
    const firstTime = toPercent(mix?.firstTimeShare) ?? 0;
    const returning = toPercent(mix?.returningShare) ?? 0;
    return [
        { key: 'firstTime', label: 'First Time', percent: firstTime },
        { key: 'returning', label: 'Returning', percent: returning },
    ];
}

// ————— Night by night —————

function velocitySignal(night, average) {
    if (night === null || average === null || !(average > 0)) return null;
    const change = Math.round(((night - average) / average) * 100);
    if (Math.abs(change) < 5) return 'On pace';
    return change > 0 ? `+${change}% faster` : `${Math.abs(change)}% slower`;
}

function arrivalSignal(night, average) {
    if (night === null || average === null) return null;
    const diff = night - average;
    if (Math.abs(diff) < 10) return 'Arrived on time';
    return `Arrived ${formatDuration(diff)} ${diff < 0 ? 'early' : 'late'}`;
}

function pointsSignal(night, average, up, down) {
    if (night === null || average === null) return null;
    const diff = Math.round((night - average) * 100);
    if (Math.abs(diff) < 5) return 'In line with usual';
    return diff > 0 ? up(diff) : down(Math.abs(diff));
}

/**
 * The four rows of the comparison table. A cell is null when there is nothing to put in it: the table shows
 * "Limited History" over the average and signal columns until there is an average.
 */
export function comparisonRows(comparison) {
    const night = comparison?.night || null;
    const average = comparison?.average || null;
    const zone = night?.timeZone || null;
    const doors = night ? new Date(night.startDate).getTime() : null;
    const clock = (offset) => (doors === null || offset === null || offset === undefined ? null : formatClock(new Date(doors + offset * 60000), zone));
    const of = (source, key) => (source && source[key] !== null && source[key] !== undefined ? source[key] : null);
    const share = (value, suffix) => (value === null ? null : `${toPercent(value)}%${suffix}`);

    return [
        {
            key: 'velocity',
            metric: 'Door Scan Velocity',
            average: formatRate(of(average, 'peakScansPerMinute')),
            night: formatRate(of(night, 'peakScansPerMinute')),
            signal: velocitySignal(of(night, 'peakScansPerMinute'), of(average, 'peakScansPerMinute')),
        },
        {
            key: 'arrival',
            metric: 'Arrival Time',
            // Both against this night's doors, so the two times can be read side by side.
            average: clock(of(average, 'medianArrivalOffsetMin')),
            night: clock(of(night, 'medianArrivalOffsetMin')),
            signal: arrivalSignal(of(night, 'medianArrivalOffsetMin'), of(average, 'medianArrivalOffsetMin')),
        },
        {
            key: 'paid',
            metric: 'Paid Tickets',
            average: share(of(average, 'paidShare'), ' of Audience'),
            night: share(of(night, 'paidShare'), ' of Audience'),
            signal: pointsSignal(of(night, 'paidShare'), of(average, 'paidShare'), (d) => `+${d} pts on paid tickets`, (d) => `${d} pts fewer on paid tickets`),
        },
        {
            key: 'firstTime',
            metric: 'First-Time Audience',
            average: share(of(average, 'firstTimeShare'), ''),
            night: share(of(night, 'firstTimeShare'), ''),
            signal: pointsSignal(of(night, 'firstTimeShare'), of(average, 'firstTimeShare'), () => 'New Audience Acquisition', () => 'More regulars than usual'),
        },
    ];
}

/** The heading of the night column: tonight while it runs, else the night it was. */
export function comparisonNightHeading(comparison) {
    if (!comparison?.night) return "Tonight's Event";
    return comparison.night.state === 'LIVE' ? "Tonight's Event" : 'Last Night';
}

// ————— Short insights —————

function hourLabel(hour) {
    return `${((hour + 11) % 12) + 1}${hour < 12 ? 'AM' : 'PM'}`;
}

/**
 * A few plain sentences, each one read straight off a number the venue already has. Nothing is said when
 * there is nothing measured.
 */
export function buildInsights({ home, analytics, heatmap } = {}) {
    if (!home || home.history?.level === 'NONE') return [];
    const lines = [];

    const offset = home.comparison?.average?.medianArrivalOffsetMin ?? home.comparison?.night?.medianArrivalOffsetMin ?? null;
    if (offset !== null) {
        lines.push(
            Math.abs(offset) < 5
                ? 'Half the room is in right at doors.'
                : `Half the room is in ${formatDuration(offset)} ${offset < 0 ? 'before' : 'after'} doors.`,
        );
    }

    const gates = heatmap?.gates || [];
    const scans = gates.reduce((sum, g) => sum + g.scans, 0);
    if (gates.length > 1 && scans > 0) {
        lines.push(`${gates[0].gate} takes ${Math.round((gates[0].scans / scans) * 100)}% of door scans.`);
    }

    const repeat = analytics?.firstTimeVsRepeat;
    if (repeat && repeat.repeatRate !== null && analytics.totalAttendance > 0) {
        lines.push(
            repeat.repeat > 0
                ? `${toPercent(repeat.repeatRate)}% of your guests have come back for another night.`
                : `${formatInteger(repeat.firstTime)} first-time ${repeat.firstTime === 1 ? 'guest' : 'guests'} so far. Nobody has come back yet.`,
        );
    }

    const peak = (analytics?.peakCheckInHours || []).reduce((best, h) => (h.checkIns > (best?.checkIns ?? 0) ? h : best), null);
    if (peak?.checkIns) lines.push(`The door is busiest around ${hourLabel(peak.hour)}.`);

    if (analytics?.captureVolume > 0 && analytics.totalAttendance > 0) {
        const perGuest = analytics.captureVolume / analytics.totalAttendance;
        lines.push(
            perGuest >= 1
                ? `Guests take about ${Math.round(perGuest)} ${Math.round(perGuest) === 1 ? 'photo' : 'photos'} each.`
                : `${formatInteger(analytics.captureVolume)} photos and videos taken here so far.`,
        );
    }

    return lines.slice(0, 4);
}

/** The line that opens the insights when there is not much to go on. */
export function insightsBasis(home) {
    if (!home || home.history?.level !== 'LIMITED') return null;
    const n = home.history.measuredNights;
    return n === 1 ? 'Based on one night so far,' : `Based on ${n} nights so far,`;
}

// ————— Spatial intel —————

/** Whether there is anything to draw a room from: a calibrated plan, or enough located captures for an area map. */
export function hasRoomView(heatmap) {
    return Boolean(heatmap && (heatmap.floorPlan || heatmap.media?.bbox));
}

// ————— Net payout —————

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function dayKey(date, timeZone) {
    const parts = formatter({ year: 'numeric', month: '2-digit', day: '2-digit' }, timeZone).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Monday to Sunday of the week `now` falls in, at the venue, as day keys. */
export function weekDayKeys(now, timeZone) {
    const today = dayKey(now, timeZone);
    const noon = new Date(`${today}T12:00:00Z`);
    const mondayOffset = (noon.getUTCDay() + 6) % 7;
    return WEEKDAYS.map((label, i) => {
        const day = new Date(noon.getTime() + (i - mondayOffset) * 24 * 60 * 60 * 1000);
        return { label, key: day.toISOString().slice(0, 10) };
    });
}

/**
 * This week's payout from the nights this account hosts at this venue.
 *
 * `payments` are the signed-in account's own (the organizer tools' data, GET /api/vendor/dashboard), so a night
 * someone else ran here is never in them. `venueEventIds` narrows them to this room. The venue API itself
 * carries no money: CEO decision, 2026-09-17.
 */
export function payoutWeek(payments, venueEventIds, now, timeZone) {
    const atVenue = new Set(venueEventIds || []);
    const own = (payments || []).filter((p) => atVenue.has(p.eventId));
    const days = weekDayKeys(now, timeZone).map((d) => ({ ...d, cents: 0 }));
    const byKey = new Map(days.map((d) => [d.key, d]));
    let last = null;
    for (const p of own) {
        const at = new Date(p.createdAt);
        if (Number.isNaN(at.getTime())) continue;
        if (!last || at > last) last = at;
        const day = byKey.get(dayKey(at, timeZone));
        if (day) day.cents += Number(p.netPayout) || 0;
    }
    return {
        totalCents: days.reduce((sum, d) => sum + d.cents, 0),
        days,
        /** Whether this account has ever been paid for a night here. */
        everPaid: own.length > 0,
        lastPaidAt: last ? last.toISOString() : null,
    };
}

// ————— Audience —————

/** The four ready-made audiences on the design. Each is a filter the list already understands. */
export const AUDIENCE_PRESETS = [
    { key: 'regulars', label: 'Regulars', hint: 'Came to two or more nights here', filters: { minEvents: 2 } },
    { key: 'new', label: 'New Visitors', hint: 'Came to one night here', filters: { maxEvents: 1 } },
    { key: 'friday', label: 'Friday Crowd', hint: 'Held a ticket to a Friday night here', filters: { weekday: 5 } },
    { key: 'engaged', label: 'High Engagement', hint: 'Pathfinder and above on PXI', filters: { minEngagementTier: 'PATHFINDER' } },
];

export const EMPTY_AUDIENCE_FILTERS = {
    q: '',
    ticketTier: '',
    minEngagementTier: '',
    minEvents: '',
    maxEvents: '',
    eventId: '',
    weekday: '',
};

/** The query for the audience list, with blanks left out. */
export function audienceQuery(filters, page, pageSize) {
    const out = {};
    Object.entries({ ...EMPTY_AUDIENCE_FILTERS, ...filters }).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) out[key] = value;
    });
    return { ...out, skip: (page - 1) * pageSize, take: pageSize };
}

/** Whether a set of filters is exactly a preset's, so its chip can be shown as on. */
export function matchesPreset(filters, preset) {
    const active = Object.entries({ ...EMPTY_AUDIENCE_FILTERS, ...filters }).filter(([key, value]) => key !== 'q' && value !== '' && value !== null && value !== undefined);
    const wanted = Object.entries(preset.filters);
    return active.length === wanted.length && wanted.every(([key, value]) => String(filters[key]) === String(value));
}

/** Only the two filters a saved segment can hold. A segment is also what a campaign can be sent to. */
export function savableFilters(filters) {
    const out = {};
    if (filters.ticketTier) out.ticketTier = filters.ticketTier;
    if (filters.minEngagementTier) out.minEngagementTier = filters.minEngagementTier;
    return out;
}

/** True when a filter is on that a saved segment cannot hold. */
export function hasListOnlyFilter(filters) {
    return ['q', 'minEvents', 'maxEvents', 'eventId', 'weekday'].some((key) => filters[key] !== '' && filters[key] !== null && filters[key] !== undefined);
}
