// The organizer page's decisions: who an address names, what the API's answers are taken to mean, the numbers and
// words printed, where a host leads and the hours of a night in its own zone. Pure, no browser and no network.
//   npm run test:organizer
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    countLabel,
    instagramHandle,
    instagramUrl,
    nightWhen,
    organizerAppLink,
    organizerDescription,
    organizerHref,
    organizerKey,
    organizerTitle,
    parseNight,
    parseNights,
    parseOrganizer,
    parseScrapbook,
    parseScrapbooks,
    scrapbookCaption,
    statWord,
    zoneOf,
} from './organizerPage.js';

const ID = '3f2b6c1e-6f0a-4a4e-9d7e-2b0f6a9c1d11';

const organizerPayload = {
    id: ID,
    username: 'pix2party',
    name: 'Pix 2 Party',
    bio: 'Late nights, loud rooms.',
    avatarUrl: 'https://cdn.example.com/a.jpg',
    city: 'Boston',
    instagramHandle: 'pix2party',
    isVerified: true,
    hype: { score: 412, tier: 'BUZZING', label: 'Buzzing', badgeLetter: 'B' },
    totals: { events: 14, upcoming: 2, attendees: 1200, attendeesRounded: true, scrapbooks: 9 },
    followers: 340,
    followersRounded: false,
    viewerFollows: false,
    isSelf: false,
};

// ————— the address —————

test('an address names a user id or a username, with the "@" and the escaping taken off', () => {
    assert.equal(organizerKey(ID), ID);
    assert.equal(organizerKey(ID.toUpperCase()), ID);
    assert.equal(organizerKey('pix2party'), 'pix2party');
    assert.equal(organizerKey('Pix2Party'), 'pix2party');
    assert.equal(organizerKey('@pix2party'), 'pix2party');
    assert.equal(organizerKey('%40pix2party'), 'pix2party');
    assert.equal(organizerKey('dj.name_01'), 'dj.name_01');
    assert.equal(organizerKey('  pix2party '), 'pix2party');
});

test('anything that is neither is not asked about', () => {
    for (const bad of ['', '@', 'wp-login', 'admin/../etc', '..%2fetc', '%', 'a b', 'x'.repeat(31), 'naïve', `${ID}0`, null, undefined, {}]) {
        assert.equal(organizerKey(bad), null, String(bad));
    }
});

// ————— the organizer header —————

test('the header keeps what the page prints and nothing else', () => {
    const o = parseOrganizer(organizerPayload);
    assert.deepEqual(o, {
        id: ID,
        username: 'pix2party',
        name: 'Pix 2 Party',
        bio: 'Late nights, loud rooms.',
        avatarUrl: 'https://cdn.example.com/a.jpg',
        instagramHandle: 'pix2party',
        isVerified: true,
        hype: { tier: 'BUZZING', label: 'Buzzing', letter: 'B', score: 412 },
        totals: { events: 14, upcoming: 2, attendees: 1200, attendeesRounded: true, scrapbooks: 9 },
        followers: 340,
        followersRounded: false,
    });
});

test('a header without an id of a user, or that is not an object, is not an organizer', () => {
    for (const bad of [null, undefined, 'x', 7, [], {}, { ...organizerPayload, id: '' }, { ...organizerPayload, id: 'pix2party' }, { ...organizerPayload, id: 42 }]) {
        assert.equal(parseOrganizer(bad), null, JSON.stringify(bad));
    }
});

test('a sparse header still reads: the name falls back to the username, then to a word', () => {
    const bare = parseOrganizer({ id: ID });
    assert.equal(bare.name, 'Organizer');
    assert.equal(bare.username, null);
    assert.equal(bare.bio, null);
    assert.equal(bare.avatarUrl, null);
    assert.equal(bare.instagramHandle, null);
    assert.equal(bare.isVerified, false);
    assert.equal(bare.hype, null);
    assert.deepEqual(bare.totals, { events: 0, upcoming: 0, attendees: 0, attendeesRounded: false, scrapbooks: 0 });
    assert.equal(bare.followers, 0);
    assert.equal(parseOrganizer({ id: ID, username: 'dunes' }).name, 'dunes');
    assert.equal(parseOrganizer({ id: ID, username: 'dunes', name: '  ' }).name, 'dunes');
});

test('numbers are whole and never negative, whatever the API sent', () => {
    const o = parseOrganizer({ id: ID, totals: { events: 3.9, upcoming: -2, attendees: '40', scrapbooks: NaN }, followers: Infinity });
    assert.deepEqual(o.totals, { events: 3, upcoming: 0, attendees: 0, attendeesRounded: false, scrapbooks: 0 });
    assert.equal(o.followers, 0);
});

test('the hype badge needs a tier word and a letter; it is one capital', () => {
    assert.equal(parseOrganizer({ id: ID, hype: null }).hype, null);
    assert.equal(parseOrganizer({ id: ID, hype: { label: 'Buzzing' } }).hype, null);
    assert.equal(parseOrganizer({ id: ID, hype: { badgeLetter: 'B' } }).hype, null);
    assert.equal(parseOrganizer({ id: ID, hype: { label: 'Quiet', badgeLetter: 'q' } }).hype.letter, 'Q');
});

test('an Instagram handle is only shown if it could be one', () => {
    assert.equal(instagramHandle('pix2party'), 'pix2party');
    assert.equal(instagramHandle('@pix.2_party'), 'pix.2_party');
    for (const bad of ['', '   ', '@', 'a b', 'pix/2', '../x', 'x'.repeat(31), '<script>', null, undefined]) {
        assert.equal(instagramHandle(bad), null, String(bad));
    }
    assert.equal(parseOrganizer({ id: ID, instagramHandle: 'bad handle' }).instagramHandle, null);
});

// ————— the nights —————

const night = {
    id: 'e1',
    name: 'Late Checkout',
    startDate: '2026-10-10T02:00:00.000Z',
    endDate: '2026-10-10T08:00:00.000Z',
    location: 'The Hollis Rooftop, 1 Seaport Blvd, Boston',
    venueName: null,
    coverImage: 'https://cdn.example.com/c.jpg',
    visibility: 'PUBLIC',
    cityCode: 'BOS',
};

test('a night keeps its name, hours, venue and cover', () => {
    assert.deepEqual(parseNight(night), {
        id: 'e1',
        name: 'Late Checkout',
        startDate: '2026-10-10T02:00:00.000Z',
        endDate: '2026-10-10T08:00:00.000Z',
        venue: 'The Hollis Rooftop',
        coverImage: 'https://cdn.example.com/c.jpg',
        timezone: null,
        cityCode: 'BOS',
        location: 'The Hollis Rooftop, 1 Seaport Blvd, Boston',
    });
    // The venue's own name beats the first piece of the address.
    assert.equal(parseNight({ ...night, venueName: 'Hollis' }).venue, 'Hollis');
});

test('a night that is not public, or cannot be opened, is not shown', () => {
    assert.equal(parseNight({ ...night, visibility: 'PRIVATE' }), null);
    assert.equal(parseNight({ ...night, visibility: 'UNLISTED' }), null);
    assert.equal(parseNight({ ...night, id: '' }), null);
    assert.equal(parseNight(null), null);
    // A row that does not say is the API's call: it lists public nights only.
    assert.equal(parseNight({ ...night, visibility: undefined }).id, 'e1');
});

test('a night with a bad date still lists, without a date', () => {
    const n = parseNight({ ...night, startDate: 'soon', endDate: null });
    assert.equal(n.startDate, null);
    assert.equal(n.endDate, null);
});

test('a catalogue list is each night once, in the API\'s order', () => {
    const rows = [night, { ...night, id: 'e2', name: 'Second' }, night, null, 'x', { ...night, id: 'e3', visibility: 'PRIVATE' }];
    assert.deepEqual(parseNights(rows).map((n) => n.id), ['e1', 'e2']);
    assert.deepEqual(parseNights(undefined), []);
    assert.deepEqual(parseNights('nope'), []);
});

// ————— the scrapbooks —————

const scrapbook = {
    id: 'e1',
    albumId: 'a1',
    name: 'Dunes 2025',
    coverImage: 'https://cdn.example.com/dunes.jpg',
    startDate: '2025-07-12T22:00:00.000Z',
    location: 'Fire Island',
    mediaCount: 212,
    hideNameOnCover: true,
};

test('a scrapbook needs an album to open and a cover to show', () => {
    assert.deepEqual(parseScrapbook(scrapbook), {
        id: 'e1',
        albumId: 'a1',
        name: 'Dunes 2025',
        coverImage: 'https://cdn.example.com/dunes.jpg',
        startDate: '2025-07-12T22:00:00.000Z',
        location: 'Fire Island',
        hideNameOnCover: true,
    });
    assert.equal(parseScrapbook({ ...scrapbook, albumId: null }), null);
    assert.equal(parseScrapbook({ ...scrapbook, coverImage: '' }), null);
    assert.equal(parseScrapbook(undefined), null);
    assert.equal(parseScrapbook({ ...scrapbook, hideNameOnCover: undefined }).hideNameOnCover, false);
});

test('scrapbooks are one tile per album, in the API\'s order', () => {
    const rows = [scrapbook, { ...scrapbook, id: 'e2', albumId: 'a2' }, { ...scrapbook, id: 'e1b' }, {}];
    assert.deepEqual(parseScrapbooks(rows).map((s) => s.albumId), ['a1', 'a2']);
    assert.deepEqual(parseScrapbooks(null), []);
});

// ————— numbers and words —————

test('an exact count is written out; a rounded one is a floor', () => {
    assert.equal(countLabel(0, false), '0');
    assert.equal(countLabel(7, false), '7');
    assert.equal(countLabel(19, false), '19');
    assert.equal(countLabel(1204, false), '1,204');
    assert.equal(countLabel(20, true), '20+');
    assert.equal(countLabel(340, true), '340+');
    assert.equal(countLabel(950, true), '950+');
    assert.equal(countLabel(1000, true), '1k+');
    assert.equal(countLabel(1200, true), '1.2k+');
    assert.equal(countLabel(12300, true), '12.3k+');
    assert.equal(countLabel(1_500_000, true), '1.5M+');
});

test('a count that is not a number prints as none', () => {
    assert.equal(countLabel(undefined, false), '0');
    assert.equal(countLabel(-4, false), '0');
    assert.equal(countLabel(NaN, true), '0+');
});

test('the small word is singular for exactly one', () => {
    assert.equal(statWord('nights', 1, false), 'night');
    assert.equal(statWord('nights', 14, false), 'nights');
    assert.equal(statWord('nights', 0, false), 'nights');
    assert.equal(statWord('people', 1, false), 'person');
    assert.equal(statWord('people', 1200, true), 'people');
    assert.equal(statWord('followers', 1, false), 'follower');
    assert.equal(statWord('followers', 340, false), 'followers');
});

// ————— where things lead —————

test('a host leads to their page: by username, else by id, else nowhere', () => {
    assert.equal(organizerHref({ id: ID, username: 'Pix2Party' }), '/u/pix2party');
    assert.equal(organizerHref({ id: ID, username: '@pix2party' }), '/u/pix2party');
    assert.equal(organizerHref({ id: ID }), `/u/${ID}`);
    assert.equal(organizerHref({ id: ID.toUpperCase(), username: null }), `/u/${ID}`);
    assert.equal(organizerHref({ username: 'pix2party' }), '/u/pix2party');
    // A username the API would not have is not put in an address; the id takes over.
    assert.equal(organizerHref({ id: ID, username: 'not a username/' }), `/u/${ID}`);
    for (const none of [null, undefined, {}, 'pix2party', { name: 'Pix' }, { id: 'not-an-id' }, { username: 'a/b' }]) {
        assert.equal(organizerHref(none), null, JSON.stringify(none));
    }
});

test('Follow opens the app on the profile address the other profile pages use', () => {
    assert.equal(organizerAppLink(ID), `pxi://u/${ID}`);
});

test('the Instagram link is the profile page of a handle that could be one', () => {
    assert.equal(instagramUrl('pix2party'), 'https://www.instagram.com/pix2party/');
    assert.equal(instagramUrl('@pix.2_party'), 'https://www.instagram.com/pix.2_party/');
    assert.equal(instagramUrl('x/../y'), null);
    assert.equal(instagramUrl(null), null);
});

// ————— time in the night's own zone —————

const NOW = new Date('2026-10-08T16:00:00Z');

test('the hours are the night\'s zone\'s, whoever is looking', () => {
    // Friday 10 PM to Saturday 4 AM in New York.
    const when = nightWhen({ startDate: '2026-10-10T02:00:00Z', endDate: '2026-10-10T08:00:00Z', timezone: 'America/New_York' }, NOW);
    assert.equal(when.label, 'FRI, OCT 9');
    assert.equal(when.hours, '10 PM – 4 AM');
    assert.equal(when.weekday, 'FRI');
    assert.equal(when.month, 'OCT');
    assert.equal(when.day, '9');
    assert.equal(when.year, '');
    assert.equal(when.spoken, 'Friday, October 9, 10 PM to 4 AM');
    // The same instant in Los Angeles is a different clock: the night's zone decides, not this one.
    const la = nightWhen({ startDate: '2026-10-10T02:00:00Z', endDate: '2026-10-10T08:00:00Z', timezone: 'America/Los_Angeles' }, NOW);
    assert.equal(la.hours, '7 PM – 1 AM');
});

test('a night with no end shows its start; a night with no start shows nothing', () => {
    assert.equal(nightWhen({ startDate: '2026-10-10T02:30:00Z', timezone: 'America/New_York' }, NOW).hours, '10:30 PM');
    assert.equal(nightWhen({ startDate: null }, NOW), null);
    assert.equal(nightWhen({ startDate: 'garbage' }, NOW), null);
    assert.equal(nightWhen(null, NOW), null);
});

test('the year joins the date only when it is not this year', () => {
    const past = nightWhen({ startDate: '2025-07-13T02:00:00Z', timezone: 'America/New_York' }, NOW);
    assert.equal(past.year, '2025');
    assert.equal(past.label, 'SAT, JUL 12, 2025');
    assert.equal(past.spoken, 'Saturday, July 12, 2025, 10 PM');
    // New Year's Eve in New York is still last year at 11:30 PM there, though it is next year in UTC.
    const eve = nightWhen({ startDate: '2026-01-01T04:30:00Z', timezone: 'America/New_York' }, new Date('2026-06-01T12:00:00Z'));
    assert.equal(eve.year, '2025');
    assert.equal(eve.label, 'WED, DEC 31, 2025');
});

test('the zone is the event\'s own, else its city\'s, else Eastern', () => {
    assert.equal(zoneOf({ timezone: 'America/Chicago', cityCode: 'NYC' }), 'America/Chicago');
    assert.equal(zoneOf({ cityCode: 'BOS' }), 'America/New_York');
    assert.equal(zoneOf({ location: 'Elsewhere, 599 Johnson Ave, Brooklyn NY' }), 'America/New_York');
    assert.equal(zoneOf({ timezone: 'Not/AZone' }), 'America/New_York');
    assert.equal(zoneOf({}), 'America/New_York');
    assert.equal(zoneOf(null), 'America/New_York');
});

// ————— captions —————

test('a scrapbook\'s print is its name and the year, the year written once', () => {
    assert.deepEqual(scrapbookCaption(scrapbook), { title: 'Dunes', year: '2025', label: 'Dunes 2025' });
    assert.deepEqual(scrapbookCaption({ name: 'Dunes, 2025', startDate: '2025-07-12T22:00:00Z' }), {
        title: 'Dunes',
        year: '2025',
        label: 'Dunes 2025',
    });
    assert.deepEqual(scrapbookCaption({ name: 'Late Checkout', startDate: '2025-07-12T22:00:00Z' }), {
        title: 'Late Checkout',
        year: '2025',
        label: 'Late Checkout 2025',
    });
    // A name that is only the year keeps it as the name.
    assert.equal(scrapbookCaption({ name: '2025', startDate: '2025-07-12T22:00:00Z' }).title, '2025');
    // No date: just the name.
    assert.deepEqual(scrapbookCaption({ name: 'Dunes' }), { title: 'Dunes', year: null, label: 'Dunes' });
    assert.equal(scrapbookCaption(null).label, 'Scrapbook');
});

// ————— the link preview —————

test('the preview title is the name and the handle, whichever there are', () => {
    assert.equal(organizerTitle({ name: 'Pix 2 Party', username: 'pix2party' }), 'Pix 2 Party (@pix2party)');
    // A name that is only the handle is not said twice.
    assert.equal(organizerTitle({ name: 'Pix2Party', username: 'pix2party' }), 'Pix2Party');
    assert.equal(organizerTitle({ name: 'Pix 2 Party', username: null }), 'Pix 2 Party');
    assert.equal(organizerTitle({ name: null, username: 'pix2party' }), '@pix2party');
    assert.equal(organizerTitle({}), 'Organizer');
    assert.equal(organizerTitle(null), 'Organizer');
});

test('the preview description is their bio, cut to fit, else one line about the page', () => {
    assert.equal(organizerDescription({ name: 'Pix', bio: 'Late nights.\n\nLoud   rooms.' }), 'Late nights. Loud rooms.');
    const long = organizerDescription({ name: 'Pix', bio: 'a '.repeat(200) });
    assert.ok(long.length <= 160, String(long.length));
    assert.ok(long.endsWith('…'));
    assert.equal(organizerDescription({ name: 'Pix 2 Party', bio: null }), 'Nights and scrapbooks from Pix 2 Party, on PXI.');
    assert.equal(organizerDescription({ bio: '  ' }), 'Nights and scrapbooks from this organizer, on PXI.');
});
