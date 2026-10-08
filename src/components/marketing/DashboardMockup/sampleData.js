import { planPxToLatLng } from '@/components/dashboard/floorplan/geo';

/**
 * The sample data every dashboard mockup on the marketing pages draws from, in one place so they tell one story:
 * Late Checkout, Fri Oct 2, Seaport Loft in Boston, 180 tickets, 164 scanned in, 214 photos. The figures are the ones
 * the platform page walks through; each export is shaped like the response the real panel is fed in the dashboard.
 */

// ───────────── Hype through the night (HypePanel's `behavior` and `capture`)
const hour = (i) => new Date(Date.UTC(2026, 9, 2, 21 + i)).toISOString();
const CHAT = [60, 70, 45, 40, 38, 35, 22];
const REACTIONS = [20, 90, 210, 260, 220, 130, 50];
const CAPTURES = [4, 22, 58, 64, 41, 20, 5];

export const HYPE_SAMPLE = {
  behavior: {
    // 10 x (reactions + comments + chat + 2 x captures) / scanned = 10 x (980 + 140 + 310 + 428) / 164
    hypeScore: 113,
    hypeTierLabel: 'Electric',
    byHour: CHAT.map((messages, i) => ({ hourIso: hour(i), messages, reactions: REACTIONS[i], media: CAPTURES[i] })),
    totals: { messages: 310, reactions: 980, media: 214, comments: 140 },
  },
  capture: { medianLagMinutes: 14, coverage: 0.42 },
};

// ───────────── The door (the live control room's capacity, entry velocity and recent scans)
// Entries per minute over the last hour, oldest first: the rush has passed its peak, 153 of 180 are in.
const VELOCITY_BARS = Array.from({ length: 60 }, (_, i) => Math.round(7 * Math.exp(-(((i - 38) / 14) ** 2)) + (i % 3 === 0 ? 1 : 0)));

export const LIVE_OPS_SAMPLE = {
  capacity: 180,
  scanned: 153,
  sold: 180,
  velocityBars: VELOCITY_BARS,
  scans: [
    { id: 'scan-1', name: '@lu.chen', ticket: 'A41F9C02', gate: 'Main door', gateId: 'gate-1', state: 'Accepted', at: '10:48 PM' },
    { id: 'scan-2', name: '@zee.m', ticket: 'B7720E5D', gate: 'Door 2', gateId: 'gate-2', state: 'Flagged', at: '10:43 PM' },
  ],
};

// ───────────── Spatial intelligence (VenueHeatMap's payload)
const BUCKETS = 48; // five minutes each, 9:30 PM to 1:30 AM
const PLAN = {
  id: 'seaport-loft',
  name: 'Seaport Loft',
  imageUrl: '/marketing/seaport-loft-plan.svg',
  imageWidthPx: 960,
  imageHeightPx: 520,
  anchorLat: 42.3519,
  anchorLng: -71.0443,
  rotationDeg: 0,
  metersPerPixel: 0.075,
  gatePins: [
    { gate: 'Main door', xPx: 670, yPx: 486 },
    { gate: 'Door 2', xPx: 150, yPx: 486 },
  ],
};

// where the photos were taken, in plan pixels: when it peaked (bucket), how long it lasted, and photos per bucket at the peak
const SPOTS = [
  { x: 270, y: 250, peak: 26, width: 9, amp: 2.6 }, // the dance floor
  { x: 105, y: 265, peak: 22, width: 8, amp: 1.5 }, // by the DJ
  { x: 610, y: 135, peak: 30, width: 8, amp: 1.7 }, // the bar
  { x: 520, y: 380, peak: 34, width: 8, amp: 1.1 }, // the lounge
  { x: 830, y: 270, peak: 38, width: 6, amp: 0.9 }, // the terrace
  { x: 670, y: 430, peak: 12, width: 6, amp: 0.9 }, // the entry, early
];

// a small seeded generator, so the picture is the same on every load
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHeatmap() {
  const rand = seeded(7);
  const at = (x, y, spread) => planPxToLatLng(x + (rand() - 0.5) * spread, y + (rand() - 0.5) * spread * 0.85, PLAN);

  // one photo per tuple: the busy spots stack up purple, the quiet ones stay a soft glow
  const tuples = [];
  for (let t = 0; t < BUCKETS; t++) {
    for (const spot of SPOTS) {
      const count = Math.round(spot.amp * Math.exp(-(((t - spot.peak) / spot.width) ** 2)));
      for (let j = 0; j < count; j++) tuples.push({ ...at(spot.x, spot.y, 80), t, n: 1 });
    }
  }
  // the rest of the 131 geotagged photos are scattered through the early and late hours, away from the busy moment
  let scatter = 131 - tuples.length;
  while (scatter-- > 0) {
    const spot = SPOTS[Math.floor(rand() * SPOTS.length)];
    const t = rand() < 0.5 ? Math.floor(rand() * 20) : 31 + Math.floor(rand() * 17);
    tuples.push({ ...at(spot.x, spot.y, 220), t, n: 1 });
  }

  // 164 scans: the main rush around 10:20 PM and a late crowd, most through the main door
  const curve = (t) => 11 * Math.exp(-(((t - 11) / 7) ** 2)) + 4 * Math.exp(-(((t - 24) / 6) ** 2));
  const weights = Array.from({ length: BUCKETS }, (_, t) => curve(t));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const totalsByBucket = weights.map((w) => Math.round((w / weightSum) * 164));
  totalsByBucket[11] += 164 - totalsByBucket.reduce((a, b) => a + b, 0); // rounding leaves it a few short
  const main = totalsByBucket.map((n) => Math.round(n * 0.72));
  const door2 = totalsByBucket.map((n, t) => n - main[t]);
  const series = (counts) => counts.flatMap((n, t) => (n > 0 ? [[t, n]] : []));

  const lats = tuples.map((tuple) => tuple.lat);
  const lngs = tuples.map((tuple) => tuple.lng);
  const ring = (spot, radiusM, count) => {
    const { lat, lng } = planPxToLatLng(spot.x, spot.y, PLAN);
    return { centroidLat: lat, centroidLng: lng, radiusM, count };
  };

  return {
    window: { startIso: '2026-10-02T21:30:00.000Z', endIso: '2026-10-03T01:30:00.000Z', bucketMinutes: 5, bucketCount: BUCKETS },
    floorPlan: PLAN,
    media: {
      tuples,
      totalGeotagged: 131,
      truncated: false,
      outsideWindow: 0,
      bbox: { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) },
    },
    scans: {
      total: 164,
      totalsByBucket,
      byGate: [
        { gate: 'Main door', counts: series(main) },
        { gate: 'Door 2', counts: series(door2) },
      ],
    },
    chat: { totalsByBucket: Array.from({ length: BUCKETS }, (_, t) => Math.round(6 * Math.exp(-(((t - 24) / 9) ** 2)))) },
    clusters: { clusters: [ring(SPOTS[0], 9, 60), ring(SPOTS[1], 6, 24), ring(SPOTS[2], 8, 28)] },
  };
}

export const HEATMAP_SAMPLE = buildHeatmap();
/** The bucket the map opens on: 11:40 PM, the dance floor at its busiest. */
export const HEATMAP_START = 26;

// ───────────── Earnings (the Key metrics rows and the Revenue by month series)
// A ticket averages $35.10, and PXI's flat $0.99 per ticket is the only fee off the payout.
const GROSS_BY_MONTH = [
  ['Apr 26', 4200],
  ['May 26', 7100],
  ['Jun 26', 6300],
  ['Jul 26', 14800],
  ['Aug 26', 19600],
  ['Sep 26', 39521],
];

export const EARNINGS_SAMPLE = {
  // the rows read as in the Earnings page: 1,126 tickets in the last 30 days, $38,406 to the organizer
  keyMetrics: [
    { title: 'Gross Revenue', value: '$39,521', unit: 'USD', subheading: 'Ticket face value sold — your listed prices' },
    { title: 'Platform Fee', value: '$1,115', unit: 'USD', subheading: '$0.99 per ticket — the only fee off your payout' },
    { title: 'Net Payout', value: '$38,406', unit: 'USD', subheading: 'Transferred to you by Stripe' },
  ],
  monthly: GROSS_BY_MONTH.map(([month, gross]) => ({ month, gross, net: Math.round(gross * (1 - 0.99 / 35.1)) })),
};
