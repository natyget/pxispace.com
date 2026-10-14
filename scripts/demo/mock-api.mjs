// A stand-in for the PXI API with one populated organizer ("Afrodisiac"), their events, and the albums behind them,
// so the real organizer, event and album pages can be shown full in a pitch with no backend and no account.
//   npm run demo        starts this on :3199 and the site on :5180 pointed at it
// Dates are relative to today, so the page always reads "next Saturday" and "last Saturday". Photos are the site's own
// /landing images, served by the site. Nothing here is written anywhere.

import http from 'node:http';

const PORT = Number(process.env.DEMO_API_PORT || 3199);
const DAY = 86_400_000;
const TZ = 'America/New_York';

// ————— A seeded shuffle, so reloads show the same night —————
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (list) => list[Math.floor(rand() * list.length)];
const shuffled = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ————— Dates —————
const offsetFor = (date) => {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName').value; // GMT-4
  const hours = Number(part.replace('GMT', '') || 0);
  return `${hours < 0 ? '-' : '+'}${String(Math.abs(hours)).padStart(2, '0')}:00`;
};
/** 9 pm on the first `dow` (0 Sun to 6 Sat) at least `days` from today; negative `days` looks back. */
function night(days, dow, hour = 21) {
  const d = new Date(Date.now() + days * DAY);
  const step = days < 0 ? -1 : 1;
  while (d.getDay() !== dow) d.setDate(d.getDate() + step);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return new Date(`${ymd}T${String(hour).padStart(2, '0')}:00:00${offsetFor(d)}`);
}
const iso = (d) => d.toISOString();
const plusHours = (d, h) => new Date(d.getTime() + h * 3_600_000);

// ————— People —————
const L = '/landing';
const user = (id, name, username, avatarUrl, extra = {}) => ({ id, name, username, avatarUrl, ...extra });
const HOST = user('00000000-0000-4000-8000-000000000001', 'Afrodisiac', 'afrodisiac', `${L}/assets/dj_afrobeats.jpg`, { isVerified: true });
const CAST = [
  user('u-trina', 'Trina', 'trina', `${L}/album/thread/profiles/trina.jpg`),
  user('u-kevin', 'Kevin', 'kev.on.tape', `${L}/album/thread/profiles/kevin.jpg`),
  user('u-baba', 'Baba', 'babaaa', `${L}/album/thread/profiles/baba.jpg`),
  user('u-gift', 'Gift', 'giftofgab', `${L}/album/thread/profiles/gift.jpg`),
  user('u-maya', 'Maya', 'maya.wav', `${L}/assets/maya_profile_new.jpg`),
  user('u-zuri', 'Zuri', 'zuri', `${L}/scattered/solo.jpg`),
  user('u-dami', 'Dami', 'dami.d', `${L}/scattered/interaction.jpg`),
  user('u-ama', 'Ama', 'ama.k', `${L}/scattered/group.jpg`),
];
const LINEUP = [
  user('dj-kofi', 'DJ Kofi', 'djkofi', `${L}/posters_lineups/Lineups/lineups1.jpg`),
  user('dj-sipho', 'Sipho', 'sipho.sounds', `${L}/posters_lineups/Lineups/lineups2.jpg`),
  user('dj-amani', 'Amani', 'amani.live', `${L}/posters_lineups/Lineups/lineups3.jpg`),
  user('dj-tendai', 'Tendai', 'tendai', `${L}/posters_lineups/Lineups/lineups4.jpg`),
];

// ————— Photos (all from /landing) —————
const S = (n, ext = 'jpg') => `${L}/sanaa-groove/gallery-${String(n).padStart(2, '0')}.${ext}`;
const A = (n) => `${L}/album/gallery/afrodisiac/${n}.jpg`;
const PHOTOS = [
  [S(1), 3072, 4096], [S(2, 'jpeg'), 2700, 1800], [S(3), 3072, 4096], [S(4), 2415, 3219], [S(5), 3072, 4096],
  [S(6), 3072, 4096], [S(7), 3072, 4096], [S(8, 'jpeg'), 2086, 2700], [S(9, 'jpeg'), 2700, 1800], [S(10), 3072, 4096],
  [S(11), 2700, 1800], [S(12), 3072, 4096],
  ...['DSC02894', 'DSC02905', 'DSC02918', 'DSC02929', 'DSC02941', 'DSC02954', 'DSC02963', 'DSC02978', 'DSC02998', 'DSC03010', 'DSC03036', 'DSC03070'].map((n) => [A(n), 600, 600]),
  [`${L}/scattered/crowd.jpg`, 480, 320], [`${L}/scattered/interaction.jpg`, 480, 720], [`${L}/scattered/birthday.jpg`, 480, 320],
].map(([url, width, height]) => ({ url, width, height }));
const CLIPS = [1, 2, 3].map((n) => ({ url: `${L}/scrapbook-product/scrapbook-clip-${n}.mp4`, poster: `${L}/scrapbook-product/scrapbook-clip-${n}-poster.jpg` }));
const POSTER = { sanaa: `${L}/posters_lineups/Poster/poster1.jpg`, brooklyn: `${L}/posters_lineups/Poster/poster3.jpg`, love: `${L}/posters_lineups/Poster/poster4.jpg` };

// ————— Events —————
const SPECS = [
  // Next up
  { key: 'amapiano-night', name: 'Rooftop Amapiano: Night Edition', start: night(10, 6), venue: 'Lookout Rooftop', address: '65 Causeway St, Boston, MA', lat: 42.3663, lng: -71.0622, cover: PHOTOS[6], going: 312, tiers: [['Early bird', 20, 100, 100], ['General admission', 30, 300], ['VIP, table and bottle', 90, 40]], lineup: true, upcoming: true,
    description: 'The season finale sold out. Round two goes later and louder: four DJs, log drums till 2 am, and the best view of the Boston skyline. Amapiano, Afrohouse and a little Afrobeats to close.\n\nDoors 9 pm. Rooftop is heated. 21+, bring ID.' },
  { key: 'afrohouse-sunday', name: 'Afrohouse Sunday', start: night(17, 0, 20), venue: 'The Estate', address: '1 Boylston Pl, Boston, MA', lat: 42.3504, lng: -71.0663, cover: PHOTOS[13], going: 188, tiers: [['General admission', 15, 250]], upcoming: true, description: 'Boston’s Sunday session. Afrohouse and amapiano from sunset until close.' },
  { key: 'detty-warmup', name: 'Sanaa Groove: Detty December Warm-Up', start: night(33, 6, 22), venue: 'Royale Boston', address: '279 Tremont St, Boston, MA', lat: 42.3512, lng: -71.0654, cover: PHOTOS[9], going: 95, tiers: [['General admission', 25, 400], ['VIP', 60, 60]], upcoming: true, description: 'The first big night of the season. Afrobeats, amapiano and dancehall across two rooms.' },
  { key: 'anniversary', name: 'Afrodisiac Anniversary', start: night(56, 5), venue: 'Big Night Live', address: '110 Causeway St, Boston, MA', lat: 42.3662, lng: -71.0618, cover: PHOTOS[4], going: 41, tiers: [['General admission', 35, 800]], upcoming: true, description: 'Three years of Afrodisiac. One night, everyone invited.' },
  // Past, newest first
  { key: 'amapiano-finale', name: 'Rooftop Amapiano: Season Finale', start: night(-6, 6), venue: 'Lookout Rooftop', address: '65 Causeway St, Boston, MA', lat: 42.3663, lng: -71.0622, cover: PHOTOS[5], going: 340, tiers: [['General admission', 25, 400], ['VIP', 70, 40]], lineup: true, photos: 'all', description: 'Sold out. Four DJs, log drums till 2 am, and the whole city on one rooftop.' },
  { key: 'p1', name: 'Afrohouse Sunday', start: night(-20, 0, 20), venue: 'The Estate', address: '1 Boylston Pl, Boston, MA', cover: PHOTOS[14], going: 210, tiers: [['General admission', 15]], photos: 14 },
  { key: 'p2', name: 'Labor Day Link Up', start: night(-34, 1, 15), venue: 'Royale Boston', address: '279 Tremont St, Boston, MA', cover: PHOTOS[7], going: 380, tiers: [['General admission', 20]], photos: 16 },
  { key: 'p3', name: 'Summer Solstice Cruise', start: night(-48, 6, 18), venue: 'Boston Harbor', address: 'Long Wharf, Boston, MA', cover: PHOTOS[24], going: 150, tiers: [['General admission', 45]], photos: 12 },
  { key: 'p4', name: 'Afrohouse Sunday', start: night(-62, 0, 20), venue: 'The Estate', address: '1 Boylston Pl, Boston, MA', cover: PHOTOS[16], going: 190, tiers: [['General admission', 15]], photos: 10 },
  { key: 'p5', name: 'Juneteenth Block Party', start: night(-76, 6, 14), venue: 'Seaport Common', address: 'Seaport Blvd, Boston, MA', cover: PHOTOS[26], going: 520, tiers: [['Free', 0]], photos: 18 },
  { key: 'p6', name: 'Rooftop Amapiano', start: night(-90, 6), venue: 'Lookout Rooftop', address: '65 Causeway St, Boston, MA', cover: PHOTOS[11], going: 300, tiers: [['General admission', 25]], photos: 14 },
  { key: 'p7', name: 'Afrobeats Brunch', start: night(-104, 0, 12), venue: 'Trade Boston', address: '540 Atlantic Ave, Boston, MA', cover: PHOTOS[18], going: 140, tiers: [['General admission', 30]], photos: 8 },
  { key: 'p8', name: 'Groove n’ Find Love 111', start: night(-240, 5, 21), venue: 'Revere', address: 'Revere, MA', cover: { url: POSTER.love, width: 1329, height: 1638 }, going: 260, tiers: [['General admission', 20]], photos: 12 },
  { key: 'p9', name: 'Sanaa Groove in Brooklyn', start: night(-250, 4, 20), venue: 'Brooklyn', address: 'Brooklyn, NY', cover: { url: POSTER.brooklyn, width: 1347, height: 1679 }, going: 230, tiers: [['General admission', 25]], photos: 12 },
  { key: 'p10', name: 'Sanaa Groove: Afrohouse Night', start: night(-300, 5, 21), venue: 'Boston', address: 'Boston, MA', cover: { url: POSTER.sanaa, width: 1347, height: 1679 }, going: 275, tiers: [['General admission', 20]], photos: 12 },
];
const eventId = (key) => `evt-${key}`;
const albumId = (key) => `alb-${key}`;

function buildEvent(spec) {
  const now = Date.now();
  const past = spec.start.getTime() < now;
  const featured = spec.lineup
    ? LINEUP.map((u, i) => ({ id: `fp-${spec.key}-${i}`, userId: u.id, role: i === 0 ? 'Headliner' : 'Line up', user: u }))
    : [];
  const tiers = spec.tiers.map(([label, priceUsd, capacity, left], i) => ({ id: `tier-${spec.key}-${i}`, label, priceUsd, ...(capacity ? { capacity } : {}) }));
  const paid = tiers.some((t) => t.priceUsd > 0);
  return {
    id: eventId(spec.key),
    name: spec.name,
    description: spec.description ?? null,
    coverImage: spec.cover.url,
    startDate: iso(spec.start),
    endDate: iso(plusHours(spec.start, 5)),
    timezone: TZ,
    cityCode: 'BOS',
    location: `${spec.venue}, ${spec.address}`,
    venueName: spec.venue,
    latitude: spec.lat ?? 42.3601,
    longitude: spec.lng ?? -71.0589,
    visibility: 'PUBLIC',
    ticketType: paid ? 'PAID' : 'FREE',
    ticketPrice: paid ? tiers[0].priceUsd : 0,
    currency: 'usd',
    ticketTiersJson: paid ? tiers : [],
    effectiveStatus: past ? 'ARCHIVED' : 'LIVE',
    albumId: albumId(spec.key),
    albums: [{ id: albumId(spec.key) }],
    host: HOST,
    featuredPeople: featured,
    genres: ['Amapiano', 'Afrohouse', 'Afrobeats'],
    _count: { tickets: spec.going },
  };
}
const EVENTS = new Map(SPECS.map((s) => [eventId(s.key), buildEvent(s)]));
const SPEC_BY_EVENT = new Map(SPECS.map((s) => [eventId(s.key), s]));

// ————— Albums: gallery, thread, people —————
const CHAT_PAST = [
  ['u-trina', 'ok the log drums on that last set 😭😭'], ['u-kevin', 'who has the video from when Kofi dropped Mnike??'],
  ['u-baba', 'my voice is gone. best rooftop in the city, not even a debate'], ['u-gift', 'drop the playlist!!'],
  ['u-maya', 'we were on that dance floor for FOUR hours'], ['u-zuri', 'the skyline behind the DJ booth though'],
  ['u-dami', 'sold out and it felt like it. no line at the bar somehow?'], ['u-ama', 'season 2 when 👀'],
  ['u-trina', 'photos are insane, finding myself in like six of them'], ['u-kevin', 'same time next month @afrodisiac'],
];
const CHAT_SOON = [
  ['u-trina', 'got my early bird, who else is going'], ['u-kevin', 'table for 8 is booked, squad is deep'],
  ['u-baba', 'is the rooftop heated this time?'], ['u-gift', 'it is, they said in the story'],
  ['u-maya', 'Sipho is on at midnight, do not be late'], ['u-zuri', 'see you all there 🔥'],
];

function buildAlbum(spec) {
  const event = EVENTS.get(eventId(spec.key));
  const past = spec.start.getTime() < Date.now();
  const count = spec.photos === 'all' ? PHOTOS.length : (spec.photos ?? 6);
  seed = [...spec.key].reduce((n, c) => n + c.charCodeAt(0), 11);
  const pool = shuffled(PHOTOS).slice(0, count);
  // The night itself runs 9 pm to 2 am. A coming night has had only a few days of photos and talk.
  const t0 = past ? spec.start.getTime() : Date.now() - 3 * DAY;
  const span = past ? 5 * 3_600_000 : 3 * DAY;

  const media = pool.map((p, i) => ({
    id: `m-${spec.key}-${i}`,
    type: 'PHOTO',
    r2Url: p.url,
    thumbnailUrl: p.url,
    createdAt: iso(new Date(t0 + (span * (i + 1)) / (count + 2))),
    author: pick(CAST),
    metadata: { width: p.width, height: p.height, aspectRatio: p.width / p.height },
    reactionCounts: rand() > 0.35 ? [{ emoji: pick(['🔥', '❤️', '😭', '🙌']), count: 2 + Math.floor(rand() * 28) }] : [],
  }));
  if (spec.photos === 'all' || (spec.photos ?? 0) >= 14) {
    CLIPS.forEach((c, i) => {
      media.splice(2 + i * 4, 0, {
        id: `v-${spec.key}-${i}`, type: 'VIDEO', r2Url: c.url, thumbnailUrl: c.poster,
        createdAt: iso(new Date(t0 + span * (0.25 + i * 0.2))), author: pick(CAST),
        metadata: { width: 720, height: 1280, aspectRatio: 720 / 1280 }, reactionCounts: [{ emoji: '🔥', count: 12 + i * 9 }],
      });
    });
  }
  const chat = (past ? CHAT_PAST : CHAT_SOON).map(([uid, content], i, all) => {
    const author = CAST.find((c) => c.id === uid);
    return {
      id: `c-${spec.key}-${i}`, messageType: 'text', senderId: uid, author, content,
      createdAt: iso(new Date(t0 + span * ((i + 0.5) / all.length) + (past ? span * 0.08 : 0))),
    };
  });
  const people = [...CAST.map((c, i) => ({ ...c, userId: c.id, role: 'member', joinedAt: i < 3 ? iso(new Date(t0 - (i + 2) * 3_600_000 * (past ? 1 : 9))) : null })),
    { ...HOST, userId: HOST.id, role: 'host', joinedAt: null }];
  const lineup = spec.lineup ? LINEUP.map((u, i) => ({ id: `fp-${spec.key}-${i}`, userId: u.id, name: u.name, username: u.username, avatarUrl: u.avatarUrl, role: i === 0 ? 'Headliner' : 'Line up' })) : [];
  const album = {
    id: albumId(spec.key),
    name: `${spec.name} Album`,
    coverImage: spec.cover.url,
    event,
    eventId: event.id,
    host: HOST,
    featuredPeople: lineup,
    previewParticipants: people,
    mediaCount: media.length,
    memberCount: spec.going,
    shareAccess: { tier: 'PUBLIC' },
  };
  return { album, media, chat, people };
}
const ALBUMS = new Map(SPECS.map((s) => [albumId(s.key), buildAlbum(s)]));

// ————— The organizer —————
const sum = (key) => SPECS.filter((s) => (key === 'past' ? s.start < Date.now() : s.start > Date.now())).length;
const ORGANIZER = {
  ...HOST,
  bio: 'Afrobeats, amapiano and good company. Boston’s Sunday afrohouse and the rooftop series.\nBookings: hello@afrodisiac.example',
  instagramHandle: 'afrodisiac.boston',
  hype: { tier: 'S', label: 'Legendary host', badgeLetter: 'S', score: 96 },
  totals: { events: SPECS.length + 27, upcoming: sum('up'), attendees: 6800, attendeesRounded: true, scrapbooks: 6 },
  followers: 2400,
  followersRounded: true,
};
const catalogueRow = (spec) => {
  const e = EVENTS.get(eventId(spec.key));
  return { id: e.id, name: e.name, startDate: e.startDate, endDate: e.endDate, location: e.location, venueName: e.venueName, coverImage: e.coverImage, timezone: TZ, cityCode: 'BOS', visibility: 'PUBLIC' };
};
const SCRAPBOOKS = ['amapiano-finale', 'p6', 'p2', 'p3', 'p5', 'p1'].map((key) => {
  const a = ALBUMS.get(albumId(key));
  const spec = SPECS.find((s) => s.key === key);
  return { id: `sb-${key}`, albumId: a.album.id, name: spec.name, coverImage: spec.cover.url, startDate: iso(spec.start), location: null, hideNameOnCover: false };
});

// ————— Routes —————
const send = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
};
const isHost = (key) => /^@?afrodisiac$/i.test(key) || key === HOST.id;

function route(path, query) {
  let m;
  if ((m = path.match(/^\/api\/users\/([^/]+)\/organizer$/))) {
    return isHost(decodeURIComponent(m[1])) ? { organizer: ORGANIZER } : null;
  }
  if ((m = path.match(/^\/api\/users\/([^/]+)\/catalogue$/))) {
    if (!isHost(decodeURIComponent(m[1]))) return null;
    const rows = SPECS.map((s) => [s, s.start.getTime()]);
    return {
      upcoming: rows.filter(([, t]) => t > Date.now()).sort((a, b) => a[1] - b[1]).map(([s]) => catalogueRow(s)),
      past: rows.filter(([, t]) => t <= Date.now()).sort((a, b) => b[1] - a[1]).map(([s]) => catalogueRow(s)),
    };
  }
  if ((m = path.match(/^\/api\/users\/([^/]+)\/public-scrapbooks$/))) return isHost(decodeURIComponent(m[1])) ? { scrapbooks: SCRAPBOOKS } : null;
  if ((m = path.match(/^\/api\/events\/([^/]+)$/))) {
    const event = EVENTS.get(decodeURIComponent(m[1]));
    return event ? { event } : null;
  }
  if (path === '/api/events') {
    return { events: [...EVENTS.values()].filter((e) => e.effectiveStatus === 'LIVE'), pagination: { hasMore: false } };
  }
  if ((m = path.match(/^\/api\/albums\/([^/]+)\/participants$/))) {
    const a = ALBUMS.get(decodeURIComponent(m[1]));
    return a ? { participants: a.people } : null;
  }
  if ((m = path.match(/^\/api\/albums\/public\/([^/]+)(\/media|\/thread-timeline)?$/))) {
    const a = ALBUMS.get(decodeURIComponent(m[1]));
    if (!a) return null;
    if (!m[2]) return { album: a.album };
    const limit = Number(query.get('limit') || 40);
    const offset = Number(query.get('offset') || 0);
    if (m[2] === '/media') {
      const items = [...a.media].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
      return { items: items.slice(offset, offset + limit) };
    }
    return {
      messages: a.chat,
      mediaItems: a.media.slice(0, Math.min(a.media.length, 16)),
      pagination: { offset: 0, count: a.chat.length + Math.min(a.media.length, 16), hasMore: false },
    };
  }
  return undefined;
}

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    const url = new URL(req.url, 'http://x');
    const found = route(url.pathname, url.searchParams);
    if (found === undefined) return send(res, /\/auth\/|\/me(\/|$)/.test(url.pathname) ? 401 : 404, { error: 'Not in the demo' });
    if (found === null) return send(res, 404, { error: 'Not found' });
    return send(res, 200, found);
  })
  .listen(PORT, () => console.log(`PXI demo API on http://localhost:${PORT}  (organizer: /u/afrodisiac)`));
