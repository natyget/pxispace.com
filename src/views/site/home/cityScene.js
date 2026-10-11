// The sample night behind the "every event in your city" scene (8:12 pm, Friday Oct 2): the pins on the drawn map
// (cityGeometry.js, 820 by 1400 map units), the cards under them, the flyers that float out beside the phone.
// Fixed on purpose, the way DoorsDiscover fixes its samples, so the server and the browser draw the same thing.
// The venues and nights are made up; Late Checkout is the PXI night the rest of the page follows (its flyer is
// the real one, public/site/img/posters). Every other flyer is drawn from the card's own words (GigPoster), so a
// date printed on a flyer is never different from the date on its card.
import { posterColors } from '@/lib/goPoster';

/** How far a mile is on the drawn map, and how the app writes a distance (src/components/discover/map/mapModel.ts). */
const PX_PER_MILE = 520;
export function formatMiles(px) {
  const mi = px / PX_PER_MILE;
  if (mi < 0.1) return 'Nearby';
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}

/** The viewer's own dot. The cards are ordered by how far they are from it, nearest first, like the app's strip. */
export const VIEWER = { x: 430, y: 800 };

/**
 * Where the map looks: the top-left corner of the 402 by 874 screen, in map units. It starts on the viewer's
 * neighbourhood and glides until the PXI night is in the middle of the band between the filter pill and the strip.
 */
export const CAMERA = {
  start: { x: 190, y: 350 },
  end: { x: 299, y: 445 },
};

/**
 * The part of the map the camera ever shows: the screen (402 by 874) at the start and at the end of the glide, and
 * everything between, with a little air. Pins and the viewer are placed relative to its corner.
 */
const SCREEN = { w: 402, h: 874 };
const AIR = 6;
export const MAP_CROP = {
  x: CAMERA.start.x - AIR,
  y: CAMERA.start.y - AIR,
  w: CAMERA.end.x - CAMERA.start.x + SCREEN.w + AIR * 2,
  h: CAMERA.end.y - CAMERA.start.y + SCREEN.h + AIR * 2,
};

const NIGHTS = { Tonight: 'Friday, Oct 2', Sat: 'Saturday, Oct 3' };

// One row per card. `pin` is where its venue sits on the map; `wave` is the night it drops in with (0 tonight, 1 the
// rest of the weekend). The two that matter for the order are the first two: House of Echoes is the nearest night,
// Late Checkout the next.
const NIGHT_LIST = [
  { key: 'echoes', title: 'House of Echoes', venue: 'The Annex', day: 'Tonight', time: '11 PM', price: 'Free', via: 'Posh', genre: 'house', pin: { x: 382, y: 760 }, wave: 0 },
  { key: 'late', title: 'Late Checkout', venue: 'The Hollis Hotel Rooftop', day: 'Tonight', time: '10 PM', price: '$10', via: '', pxi: true, cover: '/site/img/posters/late-checkout.jpg', pin: { x: 500, y: 860 }, wave: 0 },
  { key: 'cypher', title: 'Cypher Fridays', venue: 'Pier 9 Hall', day: 'Tonight', time: '9 PM', price: '$20', via: 'Eventbrite', genre: 'hip-hop', pin: { x: 530, y: 690 }, wave: 0 },
  { key: 'joburg', title: 'Joburg Nights', venue: 'Studio 41', day: 'Tonight', time: '11 PM', price: '$15', via: 'DICE', genre: 'amapiano', pin: { x: 310, y: 660 }, wave: 0 },
  { key: 'velvet', title: 'Velvet Room', venue: 'Lantern Club', day: 'Sat', time: '10 PM', price: '$25', via: 'DICE', genre: 'r-and-b', pin: { x: 320, y: 1030 }, wave: 1 },
  { key: 'harbor', title: 'Neon Harbor Live', venue: 'Harbor Theatre', day: 'Sat', time: '8 PM', price: '$45', via: 'Ticketmaster', genre: 'indie', pin: { x: 660, y: 1000 }, wave: 1 },
];

/** Every card of the strip, nearest first, with its distance worked out from where its venue sits. */
export const EVENTS = NIGHT_LIST
  .map((e) => {
    const away = Math.hypot(e.pin.x - VIEWER.x, e.pin.y - VIEWER.y);
    return {
      ...e,
      away,
      miles: formatMiles(away),
      weekend: e.day !== 'Tonight',
      night: NIGHTS[e.day],
      colors: e.cover ? null : posterColors({ id: e.key, genre: e.genre }),
    };
  })
  .sort((a, b) => a.away - b.away);

/**
 * Venues with no card in the strip: the strip is a long list and only two cards show. None is nearer to the viewer
 * than the second card, so the first two cards really are the two nearest nights.
 */
const EXTRA_PINS = [
  { key: 'n1', x: 240, y: 590, wave: 0 },
  { key: 'n2', x: 250, y: 640, wave: 1 },
  { key: 'n3', x: 225, y: 740, wave: 1 },
  { key: 'n4', x: 260, y: 830, wave: 1 },
  { key: 'stack', x: 250, y: 910, wave: 0, stack: 3 },
  { key: 'c1', x: 440, y: 640, wave: 0 },
  { key: 'p1', x: 295, y: 735, wave: 0, pxi: true },
  { key: 'p2', x: 590, y: 870, wave: 1, pxi: true },
  { key: 'c2', x: 470, y: 700, wave: 1, count: 2 },
  { key: 'e1', x: 570, y: 770, wave: 0 },
  { key: 'e2', x: 555, y: 925, wave: 0 },
  { key: 's1', x: 420, y: 930, wave: 0 },
  { key: 's2', x: 400, y: 1000, wave: 1 },
  { key: 'e3', x: 610, y: 830, wave: 1 },
  { key: 'e4', x: 610, y: 980, wave: 1 },
  { key: 'e5', x: 500, y: 1040, wave: 1 },
];

/**
 * The pins in the order they drop: tonight's first, the PXI night last of them, then the weekend's. The first card
 * (the nearest night) starts lit, as in the app.
 */
export const PINS = [
  ...EXTRA_PINS.filter((p) => p.wave === 0),
  ...EVENTS.filter((e) => e.wave === 0 && !e.pxi).map((e) => ({ key: e.key, ...e.pin, wave: 0, event: e.key })),
  ...EVENTS.filter((e) => e.pxi).map((e) => ({ key: e.key, ...e.pin, wave: 0, event: e.key, pxi: true })),
  ...EXTRA_PINS.filter((p) => p.wave === 1),
  ...EVENTS.filter((e) => e.wave === 1).map((e) => ({ key: e.key, ...e.pin, wave: 1, event: e.key })),
];

/** Three printed flyers float out beside the phone: the real Late Checkout one and two drawn from their cards. */
export const PRINTS = ['late', 'echoes', 'cypher'];
