// The /go page's decisions: the night and its hours in the listing's own zone, the price, where Directions goes,
// where the ticket button may go, and who counts as a visitor. Pure, no browser and no network.
//   npm run test:go
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    addressLine,
    alsoOnEntries,
    appStoreHref,
    directionsUrl,
    formatClock,
    formatNightLine,
    formatNightWeekday,
    formatTimeLine,
    isAppleDevice,
    isEnded,
    isListingId,
    isPreviewBot,
    isSpeculativeRequest,
    metaDescription,
    nightFromStart,
    openInPxiHref,
    outPath,
    outTarget,
    priceLabel,
    safeRedirectUrl,
    sourceDisplayName,
    ticketLabel,
    ticketSourceName,
    venueLabel,
    viaKey,
    visitorFromHeaders,
} from './goListing.js';

const NY = 'America/New_York';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const INSTAGRAM = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 Instagram 330.0.0.12.113 (iPhone14,5; iOS 17_4; en_US; en-US; scale=3.00; 1170x2532; 541234567)';
const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const WINDOWS_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const IMESSAGE_PREVIEW = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15 facebookexternalhit/1.1 Facebot Twitterbot/1.0';

const listing = {
    id: '3f2b6c1e-6f0a-4a4e-9d7e-2b0f6a9c1d11',
    title: 'Late Checkout',
    startsAt: '2026-10-10T02:00:00Z', // Friday 10 PM in New York
    endsAt: '2026-10-10T08:00:00Z', // Saturday 4 AM
    night: '2026-10-09',
    timeZone: NY,
    venueName: 'The Hollis Rooftop',
    address: 'The Hollis Rooftop, 1 Seaport Blvd, Boston, MA 02210, USA',
    lat: 42.3534,
    lng: -71.042,
    priceFromCents: 2000,
    currency: 'USD',
    isFree: false,
    source: 'DICE',
    sourceName: 'DICE',
    ticketUrl: 'https://dice.fm/event/abc-late-checkout',
    alsoOn: [{ source: 'POSH', url: 'https://posh.vip/e/late-checkout' }],
    ended: false,
};

// ————— the id —————

test('a listing id is a UUID, nothing else', () => {
    assert.equal(isListingId(listing.id), true);
    assert.equal(isListingId('3F2B6C1E-6F0A-4A4E-9D7E-2B0F6A9C1D11'), true);
    for (const bad of ['', 'abc123', 'wp-login', 'admin', 'favicon.ico', '../etc/passwd', 'a/b/c/d/e/f', 'id with spaces', '-leading', 'x'.repeat(65), '3f2b6c1e6f0a4a4e9d7e2b0f6a9c1d11', `${listing.id}0`, ` ${listing.id}`, `${listing.id}/out`, null, undefined, 42]) {
        assert.equal(isListingId(bad), false, String(bad));
    }
});

// ————— time in the listing's own zone —————

test('the clock is the listing zone\'s, whoever is looking', () => {
    assert.equal(formatClock('2026-10-10T02:00:00Z', NY), '10 PM');
    assert.equal(formatClock('2026-10-10T02:00:00Z', 'America/Los_Angeles'), '7 PM');
    assert.equal(formatClock('2026-10-10T02:30:00Z', NY), '10:30 PM');
    assert.equal(formatClock('2026-10-10T04:00:00Z', NY), '12 AM');
    assert.equal(formatClock('2026-10-10T16:00:00Z', NY), '12 PM');
});

test('a zone with a half-hour offset keeps its minutes', () => {
    assert.equal(formatClock('2026-10-09T18:30:00Z', 'Asia/Kolkata'), '12 AM');
    assert.equal(formatClock('2026-10-09T19:00:00Z', 'Asia/Kolkata'), '12:30 AM');
});

test('the clock is not a guess: no zone, an unknown zone or a bad date shows nothing', () => {
    assert.equal(formatClock('2026-10-10T02:00:00Z', undefined), '');
    assert.equal(formatClock('2026-10-10T02:00:00Z', 'Not/AZone'), '');
    assert.equal(formatClock('not a date', NY), '');
    assert.equal(formatClock(null, NY), '');
});

test('the clock follows daylight saving: the hour that does not exist is skipped', () => {
    // New York springs forward on 2026-03-08 at 02:00 (07:00 UTC).
    assert.equal(formatClock('2026-03-08T06:59:00Z', NY), '1:59 AM');
    assert.equal(formatClock('2026-03-08T07:00:00Z', NY), '3 AM');
});

test('the night reads "10 PM to 4 AM" across midnight', () => {
    assert.equal(formatTimeLine(listing.startsAt, listing.endsAt, NY), '10 PM to 4 AM');
    assert.equal(formatTimeLine('2026-10-10T02:30:00Z', '2026-10-10T07:00:00Z', NY), '10:30 PM to 3 AM');
});

test('a night with no end, or an end that makes no sense, shows only the start', () => {
    assert.equal(formatTimeLine(listing.startsAt, null, NY), '10 PM');
    assert.equal(formatTimeLine(listing.startsAt, undefined, NY), '10 PM');
    assert.equal(formatTimeLine(listing.startsAt, listing.startsAt, NY), '10 PM');
    assert.equal(formatTimeLine(listing.startsAt, '2026-10-09T20:00:00Z', NY), '10 PM');
    assert.equal(formatTimeLine(listing.startsAt, 'garbage', NY), '10 PM');
    assert.equal(formatTimeLine('garbage', listing.endsAt, NY), '');
});

test('a listing longer than a day names the weekday it ends', () => {
    // Friday 6 PM to Sunday 6 PM, New York.
    assert.equal(formatTimeLine('2026-10-09T22:00:00Z', '2026-10-11T22:00:00Z', NY), '6 PM to Sun 6 PM');
});

test('the night line is the night, in words', () => {
    assert.equal(formatNightLine(listing), 'Friday, Oct 9');
    assert.equal(formatNightWeekday(listing), 'Friday');
    // The API's night wins over the clock: a 1 AM start printed with its own night.
    assert.equal(formatNightLine({ ...listing, startsAt: '2026-10-10T05:00:00Z', night: '2026-10-09' }), 'Friday, Oct 9');
});

test('without a night, the night comes from the start: before 5 AM it is still the night before', () => {
    // 01:30 on Saturday in New York is Friday night.
    assert.equal(nightFromStart('2026-10-10T05:30:00Z', NY), '2026-10-09');
    assert.equal(nightFromStart('2026-10-10T08:59:00Z', NY), '2026-10-09'); // 04:59
    assert.equal(nightFromStart('2026-10-10T09:00:00Z', NY), '2026-10-10'); // 05:00
    assert.equal(nightFromStart('2026-10-10T02:00:00Z', NY), '2026-10-09'); // Friday 10 PM
    assert.equal(formatNightLine({ startsAt: '2026-10-10T05:30:00Z', timeZone: NY }), 'Friday, Oct 9');
    assert.equal(formatNightLine({ startsAt: '2026-10-10T09:00:00Z', timeZone: NY }), 'Saturday, Oct 10');
});

test('a night that is not a date is not printed', () => {
    assert.equal(formatNightLine({ night: '2026-13-45' }), '');
    assert.equal(formatNightLine({ night: 'tonight' }), '');
    assert.equal(formatNightLine({}), '');
    assert.equal(formatNightLine(null), '');
    assert.equal(nightFromStart('2026-10-10T05:30:00Z', undefined), '');
});

test('the night is over only when the API says so', () => {
    assert.equal(isEnded({ ended: true }), true);
    assert.equal(isEnded({ ended: false }), false);
    assert.equal(isEnded({}), false);
    assert.equal(isEnded(null), false);
});

// ————— price —————

test('price: free, from a price, or nothing', () => {
    assert.equal(priceLabel({ isFree: true }), 'Free');
    assert.equal(priceLabel({ priceFromCents: 0 }), 'Free');
    assert.equal(priceLabel({ isFree: true, priceFromCents: 2000 }), 'Free');
    assert.equal(priceLabel({ priceFromCents: 2000, currency: 'USD' }), 'From $20');
    assert.equal(priceLabel({ priceFromCents: 2000 }), 'From $20');
    assert.equal(priceLabel({ priceFromCents: 1250, currency: 'USD' }), 'From $12.50');
    assert.equal(priceLabel({ priceFromCents: 1999, currency: 'usd' }), 'From $19.99');
    assert.equal(priceLabel({ priceFromCents: 100, currency: 'USD' }), 'From $1');
});

test('price: other currencies keep their own sign, a currency we cannot read keeps its code', () => {
    assert.equal(priceLabel({ priceFromCents: 1500, currency: 'EUR' }), 'From €15');
    assert.equal(priceLabel({ priceFromCents: 1500, currency: 'GBP' }), 'From £15');
    assert.equal(priceLabel({ priceFromCents: 1500, currency: 'DOLLARS' }), 'From DOLLARS 15');
});

test('price: unknown is not zero', () => {
    for (const l of [null, undefined, {}, { priceFromCents: null }, { priceFromCents: -5 }, { priceFromCents: NaN }, { priceFromCents: '20' }, { isFree: null, priceFromCents: undefined }]) {
        assert.equal(priceLabel(l), '', JSON.stringify(l));
    }
});

// ————— where —————

test('Apple devices get Apple Maps, the rest get Google Maps', () => {
    assert.equal(isAppleDevice(IPHONE), true);
    assert.equal(isAppleDevice(MAC_SAFARI), true);
    assert.equal(isAppleDevice(INSTAGRAM), true);
    assert.equal(isAppleDevice(ANDROID_CHROME), false);
    assert.equal(isAppleDevice(WINDOWS_CHROME), false);
    assert.equal(isAppleDevice(''), false);
    assert.equal(isAppleDevice(undefined), false);
});

test('directions go to the coordinates, with the venue as the label on Apple Maps', () => {
    assert.equal(
        directionsUrl(listing, IPHONE),
        'https://maps.apple.com/?daddr=42.3534%2C-71.042&q=The%20Hollis%20Rooftop',
    );
    assert.equal(
        directionsUrl(listing, ANDROID_CHROME),
        'https://www.google.com/maps/dir/?api=1&destination=42.3534%2C-71.042',
    );
    // An agent we know nothing about is not Apple: Google Maps works in every browser.
    assert.equal(directionsUrl(listing, undefined), 'https://www.google.com/maps/dir/?api=1&destination=42.3534%2C-71.042');
});

test('without coordinates the directions go to the venue and its address', () => {
    const noCoords = { ...listing, lat: null, lng: null };
    assert.equal(
        directionsUrl(noCoords, IPHONE),
        `https://maps.apple.com/?daddr=${encodeURIComponent('The Hollis Rooftop, The Hollis Rooftop, 1 Seaport Blvd, Boston, MA 02210, USA')}`,
    );
    assert.equal(
        directionsUrl({ address: '1 Main St, Brooklyn, NY' }, WINDOWS_CHROME),
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('1 Main St, Brooklyn, NY')}`,
    );
});

test('coordinates that cannot be a place are not used, and no place means no link', () => {
    assert.equal(directionsUrl({ venueName: 'Room 12', lat: 0, lng: 0 }, ANDROID_CHROME), 'https://www.google.com/maps/dir/?api=1&destination=Room%2012');
    assert.equal(directionsUrl({ venueName: 'Room 12', lat: 123, lng: 10 }, ANDROID_CHROME), 'https://www.google.com/maps/dir/?api=1&destination=Room%2012');
    assert.equal(directionsUrl({ venueName: '', address: '', lat: null, lng: null }, IPHONE), null);
    assert.equal(directionsUrl({}, IPHONE), null);
    assert.equal(directionsUrl(null, IPHONE), null);
});

test('the address under the venue drops the country and does not repeat the venue', () => {
    assert.equal(addressLine('The Hollis Rooftop', listing.address), '1 Seaport Blvd, Boston, MA 02210');
    assert.equal(addressLine('', '1 Main St, Brooklyn, NY, United States'), '1 Main St, Brooklyn, NY');
    assert.equal(addressLine('Room 12', ''), '');
    assert.equal(addressLine(null, null), '');
});

test('the venue is its name, else the first part of its address', () => {
    assert.equal(venueLabel(listing), 'The Hollis Rooftop');
    assert.equal(venueLabel({ venueName: '  ', address: '1 Main St, Brooklyn, NY' }), '1 Main St');
    assert.equal(venueLabel({}), '');
});

// ————— the ticket button —————

test('the ticket button leaves only for web addresses', () => {
    assert.equal(safeRedirectUrl('https://dice.fm/event/abc'), 'https://dice.fm/event/abc');
    assert.equal(safeRedirectUrl('http://example.com/e/1?x=1&y=2#top'), 'http://example.com/e/1?x=1&y=2#top');
    assert.equal(safeRedirectUrl('  https://posh.vip/e/late-checkout  '), 'https://posh.vip/e/late-checkout');
    assert.equal(safeRedirectUrl('HTTPS://Partiful.com/e/Abc123'), 'https://partiful.com/e/Abc123');
});

test('the ticket button refuses everything else', () => {
    const refused = [
        'javascript:alert(1)',
        'JaVaScRiPt:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'ftp://example.com/x',
        'pxi://go/abc',
        '//evil.example/x',
        '/relative/path',
        'https://',
        'https:///no-host',
        'https:/one-slash.example/x',
        'https:no-slashes.example/x',
        'https:\\\\backslashes.example\\x',
        'http:///third-slash.example',
        'https://user:pass@example.com/x',
        'https://user@example.com/x',
        'https://exa mple.com/x',
        'https://example.com/x\nSet-Cookie: a=b',
        'https://example.com/\u0000',
        '',
        '   ',
        `https://example.com/${'a'.repeat(2100)}`,
        null,
        undefined,
        42,
        {},
    ];
    for (const raw of refused) assert.equal(safeRedirectUrl(raw), null, String(raw).slice(0, 60));
});

test('the button says what the source is: tickets, or an invitation to open for an RSVP page', () => {
    assert.equal(ticketLabel(listing), 'Tickets on DICE');
    assert.equal(ticketLabel({ source: 'POSH', sourceName: 'Posh' }), 'Tickets on Posh');
    assert.equal(ticketLabel({ source: 'TICKETMASTER' }), 'Tickets on Ticketmaster');
    assert.equal(ticketLabel({ source: 'PARTIFUL', sourceName: 'Partiful' }), 'Open on Partiful');
    assert.equal(ticketLabel({ source: 'partiful' }), 'Open on Partiful');
    assert.equal(ticketLabel({ source: 'EVENTBRITE' }), 'Tickets on Eventbrite');
    assert.equal(ticketLabel({}), 'Get tickets');
    assert.equal(ticketLabel(null), 'Get tickets');
});

test('Partiful is an RSVP page whichever way the API sends it: as the name, as the bare code, or only as the code', () => {
    assert.equal(ticketLabel({ source: 'PARTIFUL', sourceName: 'Partiful' }), 'Open on Partiful');
    assert.equal(ticketLabel({ source: 'PARTIFUL', sourceName: 'PARTIFUL' }), 'Open on Partiful');
    assert.equal(ticketLabel({ source: 'PARTIFUL' }), 'Open on Partiful');
    assert.equal(ticketLabel({ sourceName: 'Partiful' }), 'Open on Partiful');
    assert.equal(ticketSourceName({ source: 'PARTIFUL', sourceName: 'PARTIFUL' }), 'Partiful');
});

test('a source name is kept the way the API wrote it, unless it is a bare code', () => {
    // A name with lower case in it is the API's own spelling, known to us or not.
    assert.equal(ticketSourceName({ source: 'STUBHUB', sourceName: 'StubHub' }), 'StubHub');
    assert.equal(ticketLabel({ source: 'STUBHUB', sourceName: 'StubHub' }), 'Tickets on StubHub');
    // Known names are written our way whatever case they arrive in.
    assert.equal(ticketSourceName({ source: 'POSH', sourceName: 'POSH' }), 'Posh');
    assert.equal(ticketSourceName({ source: 'DICE', sourceName: 'dice' }), 'DICE');
    assert.equal(ticketSourceName({ source: 'TICKETMASTER', sourceName: 'TICKETMASTER' }), 'Ticketmaster');
    // A bare capital code we have never heard of is written out, and with no name the code is the name.
    assert.equal(ticketSourceName({ source: 'NEWSITE', sourceName: 'NEWSITE' }), 'Newsite');
    assert.equal(ticketSourceName({ source: 'SOME_NEW_SITE' }), 'Some New Site');
    assert.equal(ticketSourceName({ source: 'POSH' }), 'Posh');
    assert.equal(ticketSourceName({}), '');
});

test('sources are written the way people write them', () => {
    assert.equal(sourceDisplayName('DICE'), 'DICE');
    assert.equal(sourceDisplayName('posh'), 'Posh');
    assert.equal(sourceDisplayName('EVENTBRITE'), 'Eventbrite');
    assert.equal(sourceDisplayName('TICKETMASTER'), 'Ticketmaster');
    assert.equal(sourceDisplayName('PARTIFUL'), 'Partiful');
    assert.equal(sourceDisplayName('resident-advisor'), 'RA');
    // A source we have never heard of is still written, not dropped.
    assert.equal(sourceDisplayName('SOME_NEW_SITE'), 'Some New Site');
    assert.equal(sourceDisplayName(''), '');
    assert.equal(sourceDisplayName(null), '');
});

test('the other places a night is sold: once each, never the listing\'s own, with safe links only', () => {
    const entries = alsoOnEntries({
        ...listing,
        alsoOn: [
            { source: 'POSH', url: 'https://posh.vip/e/x' },
            { source: 'posh', url: 'https://posh.vip/e/duplicate' },
            { source: 'DICE', url: 'https://dice.fm/event/own' },
            { source: 'EVENTBRITE', url: 'javascript:alert(1)' },
            'PARTIFUL',
            { source: '', url: 'https://nowhere.example' },
            null,
        ],
    });
    assert.deepEqual(entries, [
        { key: 'posh', name: 'Posh', label: 'Also on Posh', url: 'https://posh.vip/e/x' },
        { key: 'eventbrite', name: 'Eventbrite', label: 'Also on Eventbrite', url: null },
        { key: 'partiful', name: 'Partiful', label: 'Also on Partiful', url: null },
    ]);
    // The same night on Partiful, sent as a bare code with a name that is the code.
    assert.deepEqual(
        alsoOnEntries({ source: 'DICE', alsoOn: [{ source: 'PARTIFUL', sourceName: 'PARTIFUL', url: 'https://partiful.com/e/abc' }] }),
        [{ key: 'partiful', name: 'Partiful', label: 'Also on Partiful', url: 'https://partiful.com/e/abc' }],
    );
    assert.deepEqual(alsoOnEntries({ source: 'DICE' }), []);
    assert.deepEqual(alsoOnEntries(null), []);
});

test('the redirect takes its target from the listing, never from the request', () => {
    assert.equal(outTarget(listing), 'https://dice.fm/event/abc-late-checkout');
    assert.equal(outTarget(listing, 'posh'), 'https://posh.vip/e/late-checkout');
    // A source that is not in the listing, or a key that is not a key, goes nowhere.
    assert.equal(outTarget(listing, 'eventbrite'), null);
    assert.equal(outTarget(listing, 'https://evil.example'), null);
    assert.equal(outTarget(listing, '../x'), null);
    assert.equal(outTarget({ ...listing, ticketUrl: 'javascript:alert(1)' }), null);
    assert.equal(outTarget({ ...listing, ticketUrl: '' }), null);
    assert.equal(outTarget(null), null);
});

test('the paths the buttons use', () => {
    assert.equal(outPath(listing.id), `/go/${listing.id}/out`);
    assert.equal(outPath(listing.id, 'posh'), `/go/${listing.id}/out?via=posh`);
    assert.equal(outPath(listing.id, 'Not A Key'), `/go/${listing.id}/out`);
    assert.equal(outPath('a/b'), '/go/a%2Fb/out');
    assert.equal(viaKey('RESIDENT_ADVISOR'), 'resident-advisor');
    assert.equal(viaKey(' Posh '), 'posh');
    assert.equal(viaKey(''), '');
});

// ————— the link preview —————

test('the preview line: weekday, time and venue, and only what is known', () => {
    assert.equal(metaDescription(listing), 'Friday 10 PM at The Hollis Rooftop');
    assert.equal(metaDescription({ ...listing, venueName: '', address: '' }), 'Friday 10 PM');
    assert.equal(metaDescription({ ...listing, timeZone: undefined }), 'Friday at The Hollis Rooftop');
    assert.equal(metaDescription({ venueName: 'Room 12' }), 'Room 12');
    assert.equal(metaDescription({}), '');
});

// ————— the PXI block —————

test('the App Store button goes to /get with the campaign parameters the site already reads', () => {
    const href = appStoreHref(listing.id);
    assert.ok(href.startsWith('/get?'));
    const params = new URL(href, 'https://pxispace.com').searchParams;
    assert.equal(params.get('utm_source'), 'go');
    assert.equal(params.get('utm_campaign'), 'allevents');
    assert.equal(params.get('utm_content'), listing.id);
    assert.deepEqual([...params.keys()].sort(), ['utm_campaign', 'utm_content', 'utm_source']);
});

test('Open in PXI is the app\'s own go link', () => {
    assert.equal(openInPxiHref(listing.id), `pxi://go/${listing.id}`);
    assert.equal(openInPxiHref('a b'), 'pxi://go/a%20b');
});

// ————— who is looking —————

test('link-preview bots are not visitors (the contract\'s list, and the bots that carry the word)', () => {
    const bots = [
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitterbot/1.0',
        'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
        'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
        'WhatsApp/2.23.20.0 A',
        'TelegramBot (like TwitterBot)',
        'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        IMESSAGE_PREVIEW,
        'curl/8.4.0',
        '',
        '   ',
        undefined,
        null,
    ];
    for (const ua of bots) assert.equal(isPreviewBot(ua), true, String(ua).slice(0, 50));
});

test('people on real browsers, in app browsers included, are visitors', () => {
    for (const ua of [IPHONE, INSTAGRAM, MAC_SAFARI, WINDOWS_CHROME, ANDROID_CHROME]) {
        assert.equal(isPreviewBot(ua), false, ua.slice(0, 50));
    }
});

test('a page a browser fetches ahead of time has not been looked at', () => {
    assert.equal(isSpeculativeRequest(new Headers({ 'sec-purpose': 'prefetch' })), true);
    assert.equal(isSpeculativeRequest(new Headers({ 'sec-purpose': 'prefetch;prerender' })), true);
    assert.equal(isSpeculativeRequest(new Headers({ purpose: 'prefetch' })), true);
    assert.equal(isSpeculativeRequest(new Headers({ 'x-moz': 'prefetch' })), true);
    assert.equal(isSpeculativeRequest(new Headers({ 'x-purpose': 'preview' })), true);
    assert.equal(isSpeculativeRequest(new Headers({ 'user-agent': IPHONE })), false);
    assert.equal(isSpeculativeRequest(new Headers()), false);
    assert.equal(isSpeculativeRequest(undefined), false);
});

test('the visitor forwarded to the API: their agent, and the address Netlify vouches for first', () => {
    const headers = (o) => new Headers(o);
    assert.deepEqual(
        visitorFromHeaders(headers({ 'user-agent': IPHONE, 'x-nf-client-connection-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1, 10.0.0.1' })),
        { userAgent: IPHONE, ip: '203.0.113.7' },
    );
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' })).ip, '198.51.100.1');
    assert.equal(visitorFromHeaders(headers({ 'x-real-ip': '198.51.100.9' })).ip, '198.51.100.9');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '198.51.100.1:51234' })).ip, '198.51.100.1');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '::ffff:198.51.100.2' })).ip, '198.51.100.2');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '[2001:db8::1]:443' })).ip, '2001:db8::1');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '2001:db8::1' })).ip, '2001:db8::1');
});

test('only a public address is forwarded: the API skips the rest and would count the site instead', () => {
    const headers = (o) => new Headers(o);
    // A dev server writes ::1, and a proxy chain can start with an internal hop: the first public one is the visitor.
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '::1' })).ip, '');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '127.0.0.1' })).ip, '');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '10.0.0.2, 203.0.113.5, 10.9.9.9' })).ip, '203.0.113.5');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '192.168.1.20, 172.20.3.4' })).ip, '');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': 'fd12:3456::1, 2001:db8::7' })).ip, '2001:db8::7');
    // Netlify's header still wins, and a private one is passed over like any other.
    assert.equal(visitorFromHeaders(headers({ 'x-nf-client-connection-ip': '10.1.1.1', 'x-forwarded-for': '198.51.100.8' })).ip, '198.51.100.8');
    assert.equal(visitorFromHeaders(headers({ 'x-nf-client-connection-ip': '203.0.113.9', 'x-forwarded-for': '198.51.100.8' })).ip, '203.0.113.9');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '100.64.0.1' })).ip, ''); // carrier-grade NAT
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '100.128.0.1' })).ip, '100.128.0.1'); // just outside it
});

test('an address that is not an address is not forwarded, and an agent is kept short', () => {
    const headers = (o) => new Headers(o);
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': 'unknown' })).ip, '');
    assert.equal(visitorFromHeaders(headers({ 'x-forwarded-for': '<script>alert(1)</script>' })).ip, '');
    assert.equal(visitorFromHeaders(headers({ 'x-nf-client-connection-ip': 'nope', 'x-forwarded-for': '198.51.100.4' })).ip, '198.51.100.4');
    assert.equal(visitorFromHeaders(headers({})).userAgent, '');
    assert.equal(visitorFromHeaders(headers({ 'user-agent': 'x'.repeat(900) })).userAgent.length, 300);
    assert.deepEqual(visitorFromHeaders(undefined), { userAgent: '', ip: '' });
});
