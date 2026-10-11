// VEN-8: the decisions behind the venue dashboard's cards. Pure, no browser and no network.
//   npm run test:venue
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    AUDIENCE_PRESETS,
    activityLegend,
    activitySeries,
    audienceQuery,
    buildInsights,
    comparisonNightHeading,
    comparisonRows,
    doorCaption,
    doorPercent,
    formatClock,
    formatDuration,
    formatRate,
    formatTimeRange,
    hasListOnlyFilter,
    insightsBasis,
    matchesPreset,
    mixSegments,
    nightBadge,
    nightHref,
    payoutWeek,
    relativeToDoors,
    savableFilters,
    venueDayRange,
    venuePlace,
    weekDayKeys,
} from './venueDashboard.js';

const NY = 'America/New_York';
const points = (pairs) => {
    const out = new Array(40).fill(0);
    Object.entries(pairs).forEach(([i, n]) => { out[Number(i)] = n; });
    return out;
};

test('the place under the title: the city, else the tail of the address', () => {
    assert.equal(venuePlace({ cityCode: 'NYC', address: '319 Frost St' }), 'New York, NY');
    assert.equal(venuePlace({ cityCode: 'BOS' }), 'Boston, MA');
    assert.equal(venuePlace({ cityCode: null, address: '1 Main St, Austin, TX 78701, USA' }), 'Austin, TX');
    assert.equal(venuePlace({ cityCode: null, address: null }), '');
    assert.equal(venuePlace(null), '');
});

test('times are the venue\'s, whatever the viewer\'s clock says', () => {
    // 02:00 UTC is 10 pm the evening before in New York.
    assert.equal(formatClock('2026-10-02T02:00:00Z', NY), '10PM');
    assert.equal(formatClock('2026-10-02T02:30:00Z', NY), '10:30PM');
    assert.equal(formatClock('2026-10-02T04:00:00Z', NY), '12AM');
    assert.equal(formatTimeRange('2026-10-02T01:00:00Z', '2026-10-02T04:00:00Z', NY), '9PM - 12AM');
    assert.equal(formatTimeRange('2026-10-02T01:00:00Z', null, NY), '9PM');
    assert.equal(formatClock(null, NY), '');
    assert.equal(formatClock('not a date', NY), '');
});

test('a range of days is the venue\'s days: a night that starts at 10 pm is inside its own day', () => {
    // September 17 in New York (UTC-4) runs from 04:00 UTC to 03:59:59 UTC the next day.
    assert.deepEqual(venueDayRange('2026-09-17', '2026-09-17', NY), { from: '2026-09-17T04:00:00.000Z', to: '2026-09-18T03:59:59.000Z' });
    // In winter New York is UTC-5.
    assert.deepEqual(venueDayRange('2026-12-01', '2026-12-02', NY), { from: '2026-12-01T05:00:00.000Z', to: '2026-12-03T04:59:59.000Z' });
    assert.deepEqual(venueDayRange('2026-09-17', '', null), { from: '2026-09-17T00:00:00.000Z', to: null });
    assert.deepEqual(venueDayRange('nonsense', null, NY), { from: null, to: null });
});

test('a night\'s badge: tonight, tomorrow, the weekday, then the date', () => {
    const base = { startDate: '2026-10-04T02:00:00Z', timeZone: NY }; // Saturday October 3, 10 pm
    assert.equal(nightBadge({ ...base, state: 'LIVE', daysAway: 0 }), 'TONIGHT');
    assert.equal(nightBadge({ ...base, state: 'TONIGHT', daysAway: 0 }), 'TONIGHT');
    assert.equal(nightBadge({ ...base, state: 'UPCOMING', daysAway: 1 }), 'Tomorrow');
    assert.equal(nightBadge({ ...base, state: 'UPCOMING', daysAway: 2 }), 'Saturday');
    assert.equal(nightBadge({ ...base, state: 'UPCOMING', daysAway: 9 }), 'Oct 3');
});

test('Details goes to the manage page for the venue\'s own night, the public page for a public one, nowhere for a private one', () => {
    assert.equal(nightHref({ eventId: 'e1', hostedByVenue: true, isPublic: false }), '/dashboard/events/e1');
    assert.equal(nightHref({ eventId: 'e1', hostedByVenue: false, isPublic: true, slug: 'friday-night' }), '/events/friday-night');
    assert.equal(nightHref({ eventId: 'e1', hostedByVenue: false, isPublic: true, slug: null }), '/events/e1');
    assert.equal(nightHref({ eventId: 'e1', hostedByVenue: false, isPublic: false }), null);
});

test('rates and durations read the way a person says them', () => {
    assert.equal(formatRate(26), '26 scans/min');
    assert.equal(formatRate(0.4), '0.4 scans/min');
    assert.equal(formatRate(0.47), '0.47 scans/min');
    assert.equal(formatRate(2.53), '2.5 scans/min');
    assert.equal(formatRate(9.96), '10 scans/min');
    assert.equal(formatRate(null), null);
    assert.equal(formatDuration(45), '45 min');
    assert.equal(formatDuration(-60), '1 hour');
    assert.equal(formatDuration(120), '2 hours');
    assert.equal(formatDuration(90), '1 h 30 min');
});

test('the door ring is scanned out of sold, and zero before anyone is in', () => {
    assert.equal(doorPercent({ turnoutRate: 0.71 }), 71);
    assert.equal(doorPercent({ turnoutRate: null }), 0);
    assert.equal(doorPercent(null), 0);
    assert.equal(doorCaption({ state: 'LIVE', name: 'Friday', startDate: '2026-10-02T02:00:00Z', timeZone: NY }), 'Friday');
    assert.equal(doorCaption({ state: 'TONIGHT', name: 'Friday', startDate: '2026-10-02T02:00:00Z', timeZone: NY }), 'Friday, doors 10PM');
    assert.equal(doorCaption({ state: 'LAST', name: 'Friday', scanned: 7, startDate: '2026-09-18T01:49:00Z', timeZone: NY }), 'Last scanned night: Thu, Sep 17');
    assert.equal(doorCaption({ state: 'LAST', name: 'Friday', scanned: 0, startDate: '2026-09-18T01:49:00Z', timeZone: NY }), 'Last night here: Thu, Sep 17');
});

test('the chart trims the quiet ends and reads as clock time at the venue', () => {
    const activity = {
        stepMinutes: 15, startMinute: -120, endMinute: 480,
        night: { startDate: '2026-09-18T02:00:00Z', timeZone: NY, points: points({ 10: 6, 12: 1 }) },
        previous: null,
        average: null,
    };
    const { rows, nightKey, compareKey } = activitySeries(activity);
    assert.equal(nightKey, 'night');
    assert.equal(compareKey, null);
    assert.deepEqual(rows.map((r) => r.night), [0, 6, 0, 1, 0]);
    // Step 10 is 30 minutes after 10 pm doors.
    assert.deepEqual(rows.map((r) => r.label), ['10:15PM', '10:30PM', '10:45PM', '11PM', '11:15PM']);
    assert.equal(rows[0].compare, null);
});

test('an average alone reads against doors, and the usual night is the second line', () => {
    const activity = {
        stepMinutes: 15, startMinute: -120, endMinute: 480,
        night: null,
        previous: null,
        average: { nights: 4, points: points({ 8: 2.5, 9: 4 }) },
    };
    const { rows, nightKey, compareKey } = activitySeries(activity);
    assert.equal(nightKey, null);
    assert.equal(compareKey, 'compare');
    assert.deepEqual(rows.map((r) => r.label), ['-15m', 'Doors', '+15m', '+30m']);
    assert.deepEqual(rows.map((r) => r.compare), [0, 2.5, 4, 0]);
    assert.deepEqual(activityLegend(activity, false), { night: null, compare: 'Avg of 4 nights' });
});

test('nothing measured gives no rows rather than a flat line', () => {
    assert.deepEqual(activitySeries(null).rows, []);
    assert.deepEqual(activitySeries({ stepMinutes: 15, startMinute: -120, night: null, previous: null, average: null }).rows, []);
    assert.deepEqual(activitySeries({ stepMinutes: 15, startMinute: -120, night: { startDate: '2026-09-18T02:00:00Z', points: points({}) } }).rows, []);
});

test('the legend: tonight against the average, or against last night when history is thin', () => {
    const night = { startDate: '2026-09-18T02:00:00Z', timeZone: NY, points: points({ 10: 1 }) };
    const before = { startDate: '2026-09-11T02:00:00Z', timeZone: NY, points: points({ 9: 1 }) };
    assert.deepEqual(activityLegend({ night, average: { nights: 3, points: points({}) } }, true), { night: 'Tonight', compare: 'Avg night' });
    assert.deepEqual(activityLegend({ night, previous: before }, true), { night: 'Tonight', compare: 'Last night' });
    assert.deepEqual(activityLegend({ night, previous: before }, false), { night: 'Thu, Sep 17', compare: 'Thu, Sep 10' });
    assert.deepEqual(activityLegend({ night }, false), { night: 'Thu, Sep 17', compare: null });
    assert.equal(relativeToDoors(0), 'Doors');
    assert.equal(relativeToDoors(60), '+1h');
    assert.equal(relativeToDoors(-30), '-30m');
    assert.equal(relativeToDoors(75), '+1h15');
});

test('the share bar: first time and returning, zeros when nothing is known', () => {
    assert.deepEqual(mixSegments({ firstTimeShare: 0.4, returningShare: 0.6 }).map((s) => [s.label, s.percent]), [['First Time', 40], ['Returning', 60]]);
    assert.deepEqual(mixSegments(null).map((s) => s.percent), [0, 0]);
});

test('night by night: a full row set against the venue average', () => {
    const rows = comparisonRows({
        night: { startDate: '2026-09-27T01:00:00Z', timeZone: NY, state: 'LIVE', peakScansPerMinute: 26, medianArrivalOffsetMin: -120, paidShare: 0.25, firstTimeShare: 0.4 },
        average: { nights: 5, peakScansPerMinute: 19.5, medianArrivalOffsetMin: -60, paidShare: 0.1, firstTimeShare: 0.25 },
    });
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    assert.deepEqual([by.velocity.average, by.velocity.night, by.velocity.signal], ['20 scans/min', '26 scans/min', '+33% faster']);
    // Doors at 9 pm: the usual night half the room is in by 8, tonight by 7.
    assert.deepEqual([by.arrival.average, by.arrival.night, by.arrival.signal], ['8PM', '7PM', 'Arrived 1 hour early']);
    assert.deepEqual([by.paid.average, by.paid.night, by.paid.signal], ['10% of Audience', '25% of Audience', '+15 pts on paid tickets']);
    assert.deepEqual([by.firstTime.average, by.firstTime.night, by.firstTime.signal], ['25%', '40%', 'New Audience Acquisition']);
});

test('night by night with limited history: tonight\'s figures, and nothing where the average would be', () => {
    const rows = comparisonRows({
        night: { startDate: '2026-09-18T01:49:00Z', timeZone: NY, state: 'LAST', peakScansPerMinute: 0.4, medianArrivalOffsetMin: 20, paidShare: 0, firstTimeShare: 1 },
        average: null,
    });
    assert.deepEqual(rows.map((r) => r.night), ['0.4 scans/min', '10:09PM', '0% of Audience', '100%']);
    assert.ok(rows.every((r) => r.average === null && r.signal === null));
    assert.equal(comparisonNightHeading({ night: { state: 'LAST' } }), 'Last Night');
    assert.equal(comparisonNightHeading({ night: { state: 'LIVE' } }), "Tonight's Event");
    assert.equal(comparisonNightHeading(null), "Tonight's Event");
});

test('night by night with nothing measured: every cell empty', () => {
    const rows = comparisonRows({ night: null, average: null });
    assert.equal(rows.length, 4);
    assert.ok(rows.every((r) => r.average === null && r.night === null && r.signal === null));
});

test('signals say "in line" for a small difference instead of dressing it up', () => {
    const rows = comparisonRows({
        night: { startDate: '2026-09-27T01:00:00Z', timeZone: NY, state: 'LAST', peakScansPerMinute: 20.4, medianArrivalOffsetMin: 35, paidShare: 0.12, firstTimeShare: 0.27 },
        average: { nights: 5, peakScansPerMinute: 20, medianArrivalOffsetMin: 30, paidShare: 0.1, firstTimeShare: 0.25 },
    });
    assert.deepEqual(rows.map((r) => r.signal), ['On pace', 'Arrived on time', 'In line with usual', 'In line with usual']);
});

test('insights are read off real numbers, and there are none without a measured night', () => {
    assert.deepEqual(buildInsights({ home: { history: { level: 'NONE' } } }), []);
    assert.deepEqual(buildInsights({}), []);
    const lines = buildInsights({
        home: { history: { level: 'LIMITED', measuredNights: 1 }, comparison: { night: { medianArrivalOffsetMin: 20 }, average: null } },
        analytics: {
            totalAttendance: 7, captureVolume: 5,
            firstTimeVsRepeat: { firstTime: 7, repeat: 0, repeatRate: 0 },
            peakCheckInHours: [{ hour: 21, checkIns: 1 }, { hour: 22, checkIns: 6 }],
        },
        heatmap: { gates: [{ gate: 'North', scans: 4 }, { gate: 'South', scans: 3 }] },
    });
    assert.deepEqual(lines, [
        'Half the room is in 20 min after doors.',
        'North takes 57% of door scans.',
        '7 first-time guests so far. Nobody has come back yet.',
        'The door is busiest around 10PM.',
    ]);
    assert.equal(insightsBasis({ history: { level: 'LIMITED', measuredNights: 1 } }), 'Based on one night so far,');
    assert.equal(insightsBasis({ history: { level: 'LIMITED', measuredNights: 2 } }), 'Based on 2 nights so far,');
    assert.equal(insightsBasis({ history: { level: 'FULL', measuredNights: 9 } }), null);
});

test('the week runs Monday to Sunday at the venue', () => {
    // Friday October 2 2026, 03:55 UTC is still Thursday October 1 in New York.
    const keys = weekDayKeys(new Date('2026-10-02T03:55:00Z'), NY);
    assert.deepEqual(keys.map((k) => k.label), ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
    assert.equal(keys[0].key, '2026-09-28');
    assert.equal(keys[3].key, '2026-10-01');
    assert.equal(keys[6].key, '2026-10-04');
});

test('net payout is this account\'s own, for nights at this venue, this week', () => {
    const now = new Date('2026-10-02T03:55:00Z');
    const payments = [
        { eventId: 'here-1', netPayout: 901, createdAt: '2026-09-29T23:00:00Z' }, // Tuesday evening in New York
        { eventId: 'here-1', netPayout: 901, createdAt: '2026-10-01T03:00:00Z' }, // 11 pm Wednesday in New York
        { eventId: 'here-2', netPayout: 1802, createdAt: '2026-09-20T23:00:00Z' }, // an earlier week
        { eventId: 'elsewhere', netPayout: 5000, createdAt: '2026-09-30T23:00:00Z' }, // another room
    ];
    const week = payoutWeek(payments, ['here-1', 'here-2', 'someone-elses-night'], now, NY);
    assert.equal(week.totalCents, 1802);
    assert.deepEqual(week.days.map((d) => d.cents), [0, 901, 901, 0, 0, 0, 0]);
    assert.equal(week.everPaid, true);
    assert.equal(week.lastPaidAt, '2026-10-01T03:00:00.000Z');
});

test('no payments, or none at this venue, is a zero week and never someone else\'s money', () => {
    const now = new Date('2026-10-02T03:55:00Z');
    const none = payoutWeek([], ['here-1'], now, NY);
    assert.equal(none.totalCents, 0);
    assert.equal(none.everPaid, false);
    const elsewhere = payoutWeek([{ eventId: 'elsewhere', netPayout: 5000, createdAt: '2026-09-30T23:00:00Z' }], ['here-1'], now, NY);
    assert.equal(elsewhere.totalCents, 0);
    assert.equal(elsewhere.everPaid, false);
    assert.equal(payoutWeek(undefined, undefined, now, NY).totalCents, 0);
});

test('audience: the query leaves blanks out, and presets are recognised', () => {
    assert.deepEqual(audienceQuery({ q: '', minEvents: 2 }, 3, 50), { minEvents: 2, skip: 100, take: 50 });
    assert.deepEqual(audienceQuery({}, 1, 6), { skip: 0, take: 6 });
    const [regulars, fresh, friday, engaged] = AUDIENCE_PRESETS;
    assert.equal(matchesPreset({ minEvents: 2 }, regulars), true);
    assert.equal(matchesPreset({ minEvents: 2, q: 'jo' }, regulars), true);
    assert.equal(matchesPreset({ minEvents: 2, ticketTier: 'PAID' }, regulars), false);
    assert.equal(matchesPreset({ maxEvents: '1' }, fresh), true);
    assert.equal(matchesPreset({ weekday: '5' }, friday), true);
    assert.equal(matchesPreset({ minEngagementTier: 'PATHFINDER' }, engaged), true);
    assert.equal(matchesPreset({}, regulars), false);
});

test('a saved segment holds only what a campaign can be sent to', () => {
    assert.deepEqual(savableFilters({ ticketTier: 'PAID', minEngagementTier: 'VOYAGER', minEvents: 2, q: 'jo' }), { ticketTier: 'PAID', minEngagementTier: 'VOYAGER' });
    assert.deepEqual(savableFilters({ minEvents: 2 }), {});
    assert.equal(hasListOnlyFilter({ ticketTier: 'PAID', minEvents: '' }), false);
    assert.equal(hasListOnlyFilter({ ticketTier: 'PAID', minEvents: 2 }), true);
    assert.equal(hasListOnlyFilter({ weekday: 5 }), true);
});
