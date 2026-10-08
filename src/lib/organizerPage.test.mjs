// The organizer page's decisions: who an address names, what the API's answers are taken to mean, the numbers and
// words printed, where a host leads and the hours of a night in its own zone. Pure, no browser and no network.
//   npm run test:organizer
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    instagramHandle,
    organizerKey,
    parseNight,
    parseNights,
    parseOrganizer,
    parseScrapbook,
    parseScrapbooks,
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
