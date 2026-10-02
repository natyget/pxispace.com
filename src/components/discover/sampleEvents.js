// DEV ONLY. PublicEventsPage loads this (by dynamic import) when the URL carries ?sample=1 and
// NODE_ENV is not "production", so the carousel, the record, the stamps and the empty state can
// be previewed while the dev API has one event. In a production build the branch that imports
// it is dead code and this file is never bundled. Shape = GET /api/events?discover=1 rows.

const DAY = 86400000;

function at(days, hour, minute = 0) {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const ago = (hours) => new Date(Date.now() - hours * 3600000).toISOString();
const av = (n) => `/site/img/av/A${n}.jpg`;
// Avatar numbers that exist in public/site/img/av.
const FACES = [2, 5, 7, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21, 24, 27];

const GALLERY = '/landing/shared-event-gallery';
const SANAA = '/landing/sanaa-groove';
const PASSPORT = '/landing/passport-legacy';

function row(i, fields) {
  return {
    description: '',
    currency: 'USD',
    ticketType: 'FREE',
    ticketPrice: null,
    visibility: 'PUBLIC',
    venueName: null,
    stampImageUrl: null,
    albumId: `sample-album-${i}`,
    createdAt: ago(i * 5 + 1),
    _count: { tickets: 12 * (i + 1) },
    // Three guests' faces, as the API will send them (not live yet).
    attendeePreview: [0, 1, 2].map((k) => ({ id: `sample-guest-${i}-${k}`, avatarUrl: av(FACES[(i * 3 + k) % FACES.length]) })),
    ...fields,
    id: `sample-${i}`,
  };
}

export const SAMPLE_API_EVENTS = [
  row(0, {
    name: 'Late Checkout',
    description: 'A rooftop night. Amapiano all the way up.',
    location: '1234 Easy Street, Brooklyn, NY',
    venueName: 'The Roof at 1234',
    startDate: at(2, 22),
    coverImage: `${GALLERY}/gallery-02.jpg`,
    ticketType: 'PAID',
    ticketPrice: 10,
    _count: { tickets: 248 },
    organizer: { name: 'Naty', username: 'naty', avatarUrl: av(2) },
    playlist: { topGenres: ['Amapiano', 'Afrobeats'] },
    musicMatchScore: 93,
    previousEdition: { topReaction: { emoji: '🔥', count: 128 }, photos: [{ id: 'sample-photo-0', url: `${GALLERY}/gallery-01.jpeg` }, { id: 'sample-photo-1', url: `${GALLERY}/gallery-04.jpg` }] },
  }),
  row(1, {
    name: 'Omnia 2026',
    description: 'A festival for the whole crew.',
    location: 'Roxbury Crossing, Boston, MA',
    startDate: at(0, 21),
    coverImage: `${GALLERY}/gallery-03.jpg`,
    organizer: { name: 'Omnia Collective', username: 'omnia', avatarUrl: av(5) },
    playlist: { topGenres: ['House'] },
    musicMatchScore: 81,
  }),
  row(2, {
    name: 'Sunday Sessions',
    location: 'Williamsburg, Brooklyn, NY',
    startDate: at(5, 17),
    coverImage: `${PASSPORT}/gallery-02.jpg`,
    organizer: { name: 'DJ Kora', username: 'kora', avatarUrl: av(7) },
    playlist: { topGenres: ['Alternative R&B'] },
  }),
  row(3, {
    name: 'Fashion Week Brooklyn: Season 2 Opening Night',
    location: 'Brooklyn Navy Yard, Brooklyn, NY',
    venueName: 'Brooklyn Navy Yard',
    startDate: at(9, 19, 30),
    coverImage: `${SANAA}/gallery-06.jpg`,
    ticketType: 'PAID',
    ticketPrice: 45.5,
    organizer: { name: 'FWBK', username: 'fwbk', avatarUrl: av(9) },
    previousEdition: { topReaction: { emoji: '🔥', count: 54 }, photos: [{ id: 'sample-photo-0', url: `${SANAA}/gallery-07.jpg` }] },
  }),
  row(4, {
    name: 'Rooftop Brunch',
    description: 'Sunday brunch with a view of the harbor.',
    location: 'Seaport, Boston, MA',
    startDate: at(6, 11),
    coverImage: `${PASSPORT}/gallery-03.jpeg`,
    ticketType: 'PAID',
    ticketPrice: 25,
    organizer: { name: 'Seaport Social', username: 'seaport', avatarUrl: av(10) },
  }),
  row(5, {
    name: 'Underground Warehouse Cypher',
    location: 'Bushwick, Brooklyn, NY',
    startDate: at(12, 23),
    coverImage: `${GALLERY}/gallery-04.jpg`,
    organizer: { name: 'The Basement', username: 'basement', avatarUrl: av(11) },
    playlist: { topGenres: ['Hip-Hop'] },
  }),
  row(6, {
    name: 'Album',
    location: 'Somerville, MA',
    startDate: at(3, 20),
    coverImage: `${SANAA}/gallery-08.jpeg`,
    ticketType: 'PAID',
    ticketPrice: 10,
    organizer: { name: 'PXI User', username: 'pxi', avatarUrl: av(12) },
  }),
  row(7, {
    name: 'Friends and Family Kickback',
    location: 'Allston, Boston, MA',
    startDate: at(14, 18),
    visibility: 'PRIVATE',
    coverImage: `${GALLERY}/gallery-01.jpeg`,
    organizer: { name: 'Maya', username: 'maya', avatarUrl: av(14) },
  }),
  row(8, {
    name: 'Golden Hour Run Club',
    location: 'Harlem, New York, NY',
    startDate: at(4, 18, 30),
    coverImage: `${SANAA}/gallery-07.jpg`,
    organizer: { name: 'Run Harlem', username: 'runharlem', avatarUrl: av(16) },
  }),
];
