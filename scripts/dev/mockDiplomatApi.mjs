// Dev-only API stub for the Diplomat tools: event reads, waitlist, referral links, guest CSV,
// city demand, referral credit and the two purchase calls (logged, so `ref` can be seen reaching them).
//
// node scripts/dev/mockDiplomatApi.mjs            port 3197 (PORT= to change)
// MOCK_ROLE=citizen                               the signed-in user is a Citizen (default: diplomat)
// MOCK_DEMAND=none                                GET /api/demand/mine answers 404
// MOCK_CREDIT=none                                GET /api/referrals/credit answers 404
// Event ids starting with "soldout" are sold out (every paid tier has soldOut: true); ids containing
// "noalbum" have no album.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT || 3197);
const ROLE = process.env.MOCK_ROLE === 'citizen' ? 'citizen' : 'diplomat';
const DEMAND_OFF = process.env.MOCK_DEMAND === 'none';
const CREDIT_OFF = process.env.MOCK_CREDIT === 'none';
const ME = { id: 'mock-user-1', username: 'mockhost', name: 'Mock Host', email: 'host@example.com' };

const waitlists = new Map(); // eventId -> [{ name, username, email, createdAt }]
const refLinks = new Map(); // eventId -> [{ code, label, clicks, tickets, revenueCents }]

const isDiplomat = () => ROLE === 'diplomat';

function eventFor(id) {
  const soldOut = id.startsWith('soldout');
  return {
    id,
    name: soldOut ? 'Sold Out Night' : 'Open Night',
    description: 'Mock night for the Diplomat tools.',
    visibility: 'PUBLIC',
    ticketType: 'PAID',
    ticketPrice: 20,
    currency: 'USD',
    startDate: '2026-10-24T02:00:00.000Z',
    endDate: '2026-10-24T07:00:00.000Z',
    location: 'Brooklyn, NY',
    albumId: id.includes('noalbum') ? null : `album-${id}`,
    canManage: true,
    host: { id: ME.id, name: ME.name, username: ME.username, avatarUrl: null },
    ticketTiersJson: [
      { id: 't1', name: 'General', priceUsd: 20, capacity: 100, remaining: soldOut ? 0 : 40, soldOut },
    ],
    _count: { members: 3, tickets: soldOut ? 100 : 12 },
    featuredPeople: [],
  };
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const csv = (res, name, rows) => {
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${name}"`,
  });
  res.end(rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n');
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const newCode = () => Array.from(randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(req) : {};
  const m = (re) => path.match(re);
  let hit;

  if (method === 'GET' && (hit = m(/^\/api\/auth\/user\/([^/]+)$/))) {
    return json(res, 200, {
      user: { ...ME, id: hit[1], accountTier: 'CITIZEN', isPassportIssued: true, isVendor: isDiplomat() },
    });
  }
  if (method === 'GET' && (hit = m(/^\/api\/events\/([^/]+)$/))) {
    return json(res, 200, { event: eventFor(hit[1]) });
  }
  if (method === 'GET' && (hit = m(/^\/api\/albums\/([^/]+)\/participants$/))) {
    return json(res, 200, { participants: [] });
  }
  if (method === 'GET' && (hit = m(/^\/api\/albums\/([^/]+)\/featured-people$/))) {
    return json(res, 200, { lineup: [] });
  }

  // Waitlist: host reads (Diplomat); anyone joins. One row per event and email.
  if ((hit = m(/^\/api\/events\/([^/]+)\/waitlist$/))) {
    const eventId = hit[1];
    const list = waitlists.get(eventId) || [];
    if (method === 'POST') {
      const email = String(body.email || ME.email).trim().toLowerCase();
      if (!list.some((e) => e.email === email)) {
        list.push({ name: 'Guest', username: null, email, createdAt: new Date().toISOString() });
      }
      waitlists.set(eventId, list);
      return json(res, 200, { ok: true, count: list.length });
    }
    if (!isDiplomat()) return json(res, 403, { error: 'Diplomats only' });
    if (method === 'GET' && url.searchParams.get('format') === 'csv') {
      return csv(res, `waitlist-${eventId}.csv`, [
        ['name', 'username', 'email', 'created_at'],
        ...list.map((e) => [e.name, e.username, e.email, e.createdAt]),
      ]);
    }
    if (method === 'GET') return json(res, 200, { count: list.length, entries: list });
  }

  if ((hit = m(/^\/api\/events\/([^/]+)\/ref-links$/))) {
    const eventId = hit[1];
    if (!isDiplomat()) return json(res, 403, { error: 'Diplomats only' });
    const links = refLinks.get(eventId) || [];
    if (method === 'POST') {
      const label = String(body.label || '').trim();
      if (!label) return json(res, 400, { error: 'label is required' });
      const code = newCode();
      links.push({ code, label, clicks: 0, tickets: 0, revenueCents: 0 });
      refLinks.set(eventId, links);
      return json(res, 200, { code, label, url: `https://pxispace.com/events/${eventId}?ref=${code}` });
    }
    if (method === 'GET') {
      return json(res, 200, {
        links: links.map((l) => ({ ...l, url: `https://pxispace.com/events/${eventId}?ref=${l.code}` })),
      });
    }
  }

  if (method === 'POST' && (hit = m(/^\/api\/public\/ref\/([^/]+)\/([^/]+)\/click$/))) {
    const [, eventId, code] = hit;
    const link = (refLinks.get(eventId) || []).find((l) => l.code === code);
    if (link) link.clicks += 1;
    const auth = req.headers.authorization ? 'signed in' : 'signed out';
    console.log(`[mock] ref click ${eventId} ${code} (${link ? 'known' : 'unknown code'}, ${auth})`);
    res.writeHead(204);
    return res.end();
  }

  if (method === 'GET' && (hit = m(/^\/api\/events\/([^/]+)\/guests\.csv$/))) {
    if (!isDiplomat()) return json(res, 403, { error: 'Diplomats only' });
    return csv(res, `guests-${hit[1]}.csv`, [
      ['name', 'username', 'tier', 'checked_in', 'bought_at'],
      ['Ada Lovelace', 'ada', 'General', 'yes', '2026-10-20T18:00:00.000Z'],
      ['Sam Rivera', 'samr', 'General', 'no', '2026-10-21T09:30:00.000Z'],
    ]);
  }

  if (method === 'GET' && path === '/api/demand/mine') {
    if (DEMAND_OFF) return json(res, 404, { error: 'Not found' });
    if (!isDiplomat()) return json(res, 403, { error: 'Diplomats only' });
    return json(res, 200, {
      city: 'NYC',
      top: [
        { area: 'Brooklyn', genre: 'house', count: 87 },
        { area: 'Manhattan', genre: 'techno', count: 64 },
        { area: 'Brooklyn', genre: 'disco', count: 41 },
        { area: 'Queens', genre: 'afrobeats', count: 23 },
        { area: 'Bronx', genre: 'hip-hop', count: 9 },
        { area: 'Manhattan', genre: 'pop', count: 6 },
      ],
    });
  }

  if (method === 'GET' && path === '/api/referrals/credit') {
    if (CREDIT_OFF) return json(res, 404, { error: 'Not found' });
    return json(res, 200, {
      earnedCents: 500,
      availableCents: 500,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }

  if (method === 'GET' && path === '/api/tickets/quote') {
    return json(res, 200, { ticketPriceUsd: 20, serviceFeeUsd: 1, processingFeeUsd: 1, totalForBuyerUsd: 22 });
  }
  if (method === 'POST' && (path === '/api/tickets/purchase' || path === '/api/tickets/checkout-session')) {
    console.log(`[mock] ${path} body=${JSON.stringify(body)}`);
    if (path.endsWith('checkout-session')) return json(res, 200, { url: body.successUrl || 'http://localhost:5192/' });
    return json(res, 200, { clientSecret: 'mock_secret' });
  }

  console.log(`[mock] 404 ${method} ${path}`);
  return json(res, 404, { error: `mock has no route for ${method} ${path}` });
}

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  handle(req, res).catch((err) => {
    console.error('[mock] error', err);
    json(res, 500, { error: 'mock error' });
  });
}).listen(PORT, () => console.log(`[mock] diplomat API on :${PORT} role=${ROLE}`));
