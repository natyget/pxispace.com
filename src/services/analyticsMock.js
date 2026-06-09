const FALLBACK_EVENTS = [
    {
        id: 'neon-nights',
        name: 'Neon Nights',
        venue: 'Eclipse Social',
        status: 'LIVE',
        startDate: '2026-06-07T20:00:00-04:00',
        tickets: 860,
        baseHype: 84,
    },
    {
        id: 'warehouse-pulse',
        name: 'Warehouse Pulse',
        venue: 'District 9 Loft',
        status: 'UPCOMING',
        startDate: '2026-06-14T21:00:00-04:00',
        tickets: 640,
        baseHype: 76,
    },
    {
        id: 'diaspora-groove',
        name: 'Diaspora Groove',
        venue: 'The Canal Room',
        status: 'UPCOMING',
        startDate: '2026-06-21T19:30:00-04:00',
        tickets: 520,
        baseHype: 72,
    },
];

const HYPE_TIMES = ['8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM'];

const ROOM_BLUEPRINTS = [
    { id: 'main-stage', label: 'Main Stage', kind: 'stage', x: 312, y: 56, w: 176, h: 86, scoreBias: 14 },
    { id: 'dj-booth', label: 'DJ Booth', kind: 'booth', x: 348, y: 166, w: 106, h: 48, scoreBias: 18 },
    { id: 'latino-room', label: 'Latino Room', kind: 'room', x: 40, y: 62, w: 170, h: 126, scoreBias: 8 },
    { id: 'afrobeats-room', label: 'Afrobeats Room', kind: 'room', x: 550, y: 62, w: 170, h: 126, scoreBias: 10 },
    { id: 'soca-lounge', label: 'Soca Lounge', kind: 'room', x: 40, y: 268, w: 170, h: 116, scoreBias: 4 },
    { id: 'aapi-den', label: 'AAPI Den', kind: 'room', x: 550, y: 268, w: 170, h: 116, scoreBias: 2 },
    { id: 'bar', label: 'Main Bar', kind: 'bar', x: 262, y: 274, w: 238, h: 60, scoreBias: 6 },
    { id: 'tables', label: 'Community Tables', kind: 'tables', x: 270, y: 360, w: 220, h: 72, scoreBias: -2 },
];

const AUDIENCE_SEGMENTS = [
    { name: 'Scene Staples', ratio: 0.3 },
    { name: 'First Timers', ratio: 0.24 },
    { name: 'High Rollers', ratio: 0.18 },
    { name: 'Creators', ratio: 0.16 },
    { name: 'Community Voices', ratio: 0.12 },
];

const MOMENT_TITLES = [
    ['Headliner Drop', 'Main Stage'],
    ['Diaspora Dance Circle', 'Afrobeats Room'],
    ['Birthday Toast', 'Soca Lounge'],
    ['DJ Call-And-Response', 'DJ Booth'],
    ['Last Song Singalong', 'Latino Room'],
    ['Bar Line Chant', 'Main Bar'],
];

const EVENT_COMPARISON_COLORS = ['#d84aff', '#38bdf8', '#f59e0b', '#22c55e', '#f472b6', '#a78bfa', '#14b8a6', '#fb7185'];

function hashString(value = '') {
    return String(value).split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatEventDate(value) {
    if (!value) return 'Date TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date TBD';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function ticketsForEvent(event, index) {
    return Math.max(160, Number(event?.tickets || event?._count?.tickets || event?._count?.attendees || 420 + index * 96));
}

export function normalizeAnalyticsEvents(events = []) {
    const sourceEvents = Array.isArray(events) && events.length ? events : FALLBACK_EVENTS;
    return sourceEvents.slice(0, 8).map((event, index) => {
        const seed = Math.abs(hashString(event?.id || event?.name || `event-${index}`));
        const fallback = FALLBACK_EVENTS[index % FALLBACK_EVENTS.length];
        const startDate = event?.startDate || event?.date || fallback.startDate;
        const parsedDate = new Date(startDate);
        return {
            id: String(event?.id || fallback.id),
            name: event?.name || fallback.name,
            venue: event?.venue || event?.locationName || event?.location || fallback.venue,
            status: event?.status || fallback.status,
            startDate,
            dateMs: Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime(),
            dateLabel: formatEventDate(startDate),
            tickets: ticketsForEvent(event, index),
            baseHype: clamp(Number(event?.baseHype) || 66 + (seed % 24), 48, 92),
            seed,
        };
    });
}

function selectedOrAll(events, selectedEventIds) {
    const selected = events.filter((event) => selectedEventIds.includes(event.id));
    return selected.length ? selected : events;
}

function buildMomentImage(title, eventName, seed) {
    const hue = 260 + (seed % 58);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="hsl(${hue}, 86%, 62%)"/>
                    <stop offset="52%" stop-color="#18181b"/>
                    <stop offset="100%" stop-color="hsl(${(hue + 70) % 360}, 72%, 48%)"/>
                </linearGradient>
                <radialGradient id="r" cx="50%" cy="38%" r="62%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity=".44"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <rect width="420" height="420" rx="44" fill="url(#g)"/>
            <circle cx="${110 + (seed % 80)}" cy="${104 + (seed % 48)}" r="108" fill="url(#r)"/>
            <circle cx="${290 - (seed % 50)}" cy="${278 + (seed % 36)}" r="118" fill="#ffffff" opacity=".08"/>
            <path d="M50 92c78 18 118 18 196 0M66 154c84 24 162 24 246 0M44 222c96 30 232 30 328 0" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".16"/>
            <g opacity=".22">
                <rect x="54" y="252" width="64" height="64" rx="18" fill="#ffffff"/>
                <rect x="136" y="236" width="86" height="86" rx="24" fill="#ffffff"/>
                <rect x="246" y="254" width="112" height="112" rx="34" fill="#ffffff"/>
            </g>
            <text x="34" y="318" fill="#ffffff" font-size="28" font-family="Arial, sans-serif" font-weight="800">${title}</text>
            <text x="34" y="354" fill="#e4e4e7" font-size="18" font-family="Arial, sans-serif">${eventName}</text>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildHypeSeries(selectedEvents) {
    return HYPE_TIMES.map((time, timeIndex) => {
        const eventPoints = selectedEvents.map((event, eventIndex) => {
            const peakCurve = Math.sin((timeIndex / (HYPE_TIMES.length - 1)) * Math.PI);
            const lateBump = Math.sin(((timeIndex + eventIndex) / HYPE_TIMES.length) * Math.PI * 2) * 5;
            const hype = clamp(Math.round(event.baseHype - 15 + peakCurve * 26 + lateBump + (event.seed % 7)), 38, 99);
            const previous = clamp(Math.round(hype - 7 + Math.cos((timeIndex + eventIndex) * 0.6) * 4), 32, 94);
            return {
                hype,
                previous,
                reactions: Math.round(hype * 8.6 + event.tickets * 0.08 + timeIndex * 9),
                scans: Math.round(event.tickets * (0.04 + timeIndex * 0.006)),
                posts: Math.round(hype * 2.8 + (event.seed % 26)),
            };
        });
        const current = Math.round(average(eventPoints.map((point) => point.hype)));
        return {
            time,
            current,
            previous: Math.round(average(eventPoints.map((point) => point.previous))),
            hype: current,
            reactions: eventPoints.reduce((sum, point) => sum + point.reactions, 0),
            scans: eventPoints.reduce((sum, point) => sum + point.scans, 0),
            posts: eventPoints.reduce((sum, point) => sum + point.posts, 0),
        };
    });
}

function buildRoomReadingsForEvent(event, eventIndex, timeIndex) {
    return ROOM_BLUEPRINTS.map((room, roomIndex) => {
        const pulse = Math.sin((timeIndex + roomIndex + eventIndex) * 0.72) * 10;
        const peak = Math.sin((timeIndex / (HYPE_TIMES.length - 1)) * Math.PI) * 16;
        const score = clamp(Math.round(event.baseHype + room.scoreBias + peak + pulse - 12 + (event.seed % 5)), 24, 99);
        return {
            id: room.id,
            score,
            intensity: clamp(score / 100, 0.2, 0.99),
            attendees: Math.round(event.tickets * (score / 100) * (0.045 + roomIndex * 0.004)),
        };
    });
}

function buildSpatial(selectedEvents) {
    const eventComparisons = selectedEvents.map((event, eventIndex) => ({
        id: event.id,
        name: event.name,
        venue: event.venue,
        color: EVENT_COMPARISON_COLORS[eventIndex % EVENT_COMPARISON_COLORS.length],
        timeSlices: HYPE_TIMES.map((time, timeIndex) => ({
            label: time,
            rooms: buildRoomReadingsForEvent(event, eventIndex, timeIndex),
        })),
    }));

    const timeSlices = HYPE_TIMES.map((time, timeIndex) => ({
        label: time,
        rooms: ROOM_BLUEPRINTS.map((room, roomIndex) => {
            const eventReadings = eventComparisons.map((event) => event.timeSlices[timeIndex].rooms[roomIndex]);
            const score = Math.round(average(eventReadings.map((reading) => reading.score)));
            return {
                id: room.id,
                score,
                intensity: clamp(score / 100, 0.2, 0.99),
                attendees: eventReadings.reduce((sum, reading) => sum + reading.attendees, 0),
            };
        }),
    }));

    return {
        rooms: ROOM_BLUEPRINTS,
        timeSlices,
        eventComparisons,
    };
}

function buildAudience(selectedEvents) {
    const totalTickets = selectedEvents.reduce((sum, event) => sum + event.tickets, 0);
    const composition = AUDIENCE_SEGMENTS.map((segment, index) => {
        const adjustment = selectedEvents.reduce((sum, event) => sum + ((event.seed + index * 13) % 9), 0);
        return {
            name: segment.name,
            value: Math.round(totalTickets * segment.ratio + adjustment),
        };
    });

    const topSegment = composition.slice().sort((a, b) => b.value - a.value)[0];
    const firstTimers = composition.find((segment) => segment.name === 'First Timers');
    const creators = composition.find((segment) => segment.name === 'Creators');
    const retainedPool = Math.round(totalTickets * 0.31);

    return {
        composition,
        insights: [
            {
                name: 'Welcome first-timers',
                insight: `${formatNumber(firstTimers?.value || 0)} newer attendees are primed for a guided pre-event message sequence.`,
                cta: 'Create welcome flow',
                href: '/dashboard/audience?view=campaigns&segment=first-timers',
            },
            {
                name: 'Amplify creators',
                insight: `${formatNumber(creators?.value || 0)} creator-leaning guests can seed recap content within 24 hours.`,
                cta: 'Brief creators',
                href: '/dashboard/audience?view=campaigns&segment=creators',
            },
            {
                name: 'Protect core fans',
                insight: `${topSegment?.name || 'Core attendees'} is your largest cluster; reward them before the next drop.`,
                cta: 'Send loyalty perk',
                href: '/dashboard/audience?view=campaigns&segment=loyalty',
            },
            {
                name: 'Retain afterglow',
                insight: `${formatNumber(retainedPool)} guests are likely to return if they receive a timely moment recap.`,
                cta: 'Schedule recap',
                href: '/dashboard/audience?view=campaigns&segment=retention',
            },
        ],
    };
}

function buildMoments(selectedEvents) {
    return selectedEvents.flatMap((event, eventIndex) => (
        MOMENT_TITLES.slice(0, 3).map(([title, cluster], momentIndex) => {
            const seed = event.seed + eventIndex * 29 + momentIndex * 47;
            return {
                id: `${event.id}-${momentIndex}`,
                title,
                cluster,
                eventName: event.name,
                reactions: Math.round(320 + (seed % 280) + event.tickets * 0.12),
                image: buildMomentImage(title, event.name, seed),
            };
        })
    )).sort((a, b) => b.reactions - a.reactions).slice(0, 6).map((moment, index) => ({
        ...moment,
        href: `https://pxi.app/moments/${moment.id}-${String(index + 1).padStart(3, '0')}`,
    }));
}

function buildFunnel(selectedEvents) {
    const tickets = selectedEvents.reduce((sum, event) => sum + event.tickets, 0);
    const aware = Math.round(tickets * 1.92);
    const interested = Math.round(aware * 0.64);
    const registered = tickets;
    const attended = Math.round(tickets * 0.79);
    const engaged = Math.round(attended * 0.58);
    const retained = Math.round(engaged * 0.48);
    return [
        {
            stage: 'Aware',
            value: aware,
            cta: 'Boost awareness',
            href: '/dashboard/audience?view=campaigns&stage=aware',
            suggestions: ['Retarget profile visitors with one social proof clip.', 'Invite adjacent scene followers from your top referrers.'],
        },
        {
            stage: 'Interested',
            value: interested,
            cta: 'Convert interest',
            href: '/dashboard/audience?view=campaigns&stage=interested',
            suggestions: ['Send a venue-specific reminder to saved-event users.', 'Offer crew pricing to people who shared the event.'],
        },
        {
            stage: 'Registered',
            value: registered,
            cta: 'Prepare arrivals',
            href: '/dashboard/audience?view=campaigns&stage=registered',
            suggestions: ['Push set-time and entry instructions the morning of the event.'],
        },
        {
            stage: 'Attended',
            value: attended,
            cta: 'Lift check-ins',
            href: '/dashboard/audience?view=campaigns&stage=attended',
            suggestions: ['Nudge late arrivals with the fastest entry lane.', 'Reward early scanners with a bar or merch perk.'],
        },
        {
            stage: 'Engaged',
            value: engaged,
            cta: 'Prompt reactions',
            href: '/dashboard/audience?view=campaigns&stage=engaged',
            suggestions: ['Ask high-hype guests to post their favorite moment.', 'Trigger a live poll near the next hype spike.'],
        },
        {
            stage: 'Retained',
            value: retained,
            cta: 'Invite back',
            href: '/dashboard/audience?view=campaigns&stage=retained',
            suggestions: ['Send afterglow recaps within 18 hours.', 'Offer early access to the next same-venue event.'],
        },
    ];
}

export function buildAnalyticsMock(events = [], selectedEventIds = []) {
    const normalizedEvents = normalizeAnalyticsEvents(events);
    const selectedEvents = selectedOrAll(normalizedEvents, selectedEventIds);
    return {
        events: normalizedEvents,
        selectedEvents,
        hypeSeries: buildHypeSeries(selectedEvents),
        spatial: buildSpatial(selectedEvents),
        audience: buildAudience(selectedEvents),
        moments: buildMoments(selectedEvents),
        funnel: buildFunnel(selectedEvents),
    };
}
