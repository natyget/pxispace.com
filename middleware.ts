/**
 * Task 4: Edge Middleware RBAC Gatekeeper
 * Intercepts /dashboard/*, validates PASETO from HttpOnly cookie,
 * enforces: token present and (when applicable) event ownership.
 * Secondary verification remains in Next.js DAL / server-side.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'pxi_paseto';
const AUDIENCE = 'pxi-studio';
const ISSUER = 'pxi-backend';

/** LE64: little-endian 64-bit unsigned (MSB cleared for interoperability) */
function le64(n: number): Uint8Array {
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = n & 0xff;
    n = n >>> 8;
  }
  if (out[7] & 0x80) out[7] &= 0x7f;
  return out;
}

function base64UrlDecode(s: string): Uint8Array {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * PAE: accept string or Uint8Array; encode strings as UTF-8 for length.
 */
function paePieces(pieces: (string | Uint8Array)[]): Uint8Array {
  const parts: Uint8Array[] = [le64(pieces.length)];
  for (const p of pieces) {
    const buf = typeof p === 'string' ? new TextEncoder().encode(p) : p;
    parts.push(le64(buf.length), buf);
  }
  const total = parts.reduce((acc, u) => acc + u.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const u of parts) {
    out.set(u, offset);
    offset += u.length;
  }
  return out;
}

/** Decode PASETO v4 public token and verify Ed25519 signature. Returns payload or null. */
async function verifyPasetoV4(
  token: string,
  publicKeyBase64: string
): Promise<{ sub: string; isVendor: boolean; staffEventIds?: string[]; ownedEventIds?: string[] } | null> {
  try {
    const header = 'v4.public.';
    if (!token.startsWith(header)) return null;
    const rest = token.slice(header.length);
    const segments = rest.split('.');
    // Format: <b64(payload||signature)> or <b64(payload||signature)>.<b64(footer)>
    const combinedB64 = segments[0];
    if (!combinedB64) return null;
    const combined = base64UrlDecode(combinedB64);
    const sigLength = 64; // Ed25519
    if (combined.length < sigLength) return null;
    const payloadBytes = combined.slice(0, -sigLength);
    const signatureBytes = combined.slice(-sigLength);
    const footer = segments[1] ? base64UrlDecode(segments[1]) : new Uint8Array(0);
    // v4.public signed message uses PAE(header, payload, footer, implicit-assertion).
    // Empty footer / implicit assertion must still be included as empty pieces.
    const implicitAssertion = new Uint8Array(0);
    const message = paePieces(['v4.public.', payloadBytes, footer, implicitAssertion]);
    const keyBytes = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    const ok = await crypto.subtle.verify(
      'Ed25519',
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      message as unknown as BufferSource
    );
    if (!ok) return null;

    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as {
      sub?: string;
      isVendor?: boolean;
      staffEventIds?: string[];
      ownedEventIds?: string[];
      aud?: string;
      iss?: string;
      exp?: string;
    };
    if (!payload.sub) return null;
    if (payload.aud !== AUDIENCE || payload.iss !== ISSUER) return null;
    const exp = payload.exp ? new Date(payload.exp).getTime() : 0;
    if (exp && Date.now() > exp + 60_000) return null; // 1 min clock tolerance
    return {
      sub: payload.sub,
      isVendor: !!payload.isVendor,
      staffEventIds: payload.staffEventIds,
      ownedEventIds: payload.ownedEventIds,
    };
  } catch {
    return null;
  }
}

/** Path prefix for event-scoped dashboard routes. Event [id] is the first segment after this. */
const DASHBOARD_EVENTS_PREFIX = '/dashboard/events/';

/** Only a UUID is an event id. Anything else under /dashboard/events/ is a static route. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getEventIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(DASHBOARD_EVENTS_PREFIX)) return null;
  const segment = pathname.slice(DASHBOARD_EVENTS_PREFIX.length).split('/')[0];
  // Previously this returned any segment and the caller excluded the literal 'new'. An
  // allowlist of one: the day someone adds /dashboard/events/archived it would be read as an
  // event id. Shape-checking is the durable version of that rule.
  return segment && UUID_RE.test(segment) ? segment : null;
}

/**
 * Whether the token ALREADY proves this event — a fast path, never a verdict.
 *
 * WEB-2. This used to be the verdict: a miss meant /403, computed from claims that are
 * stale by construction. `ownedEventIds` is creator-only and capped, and claims freeze at
 * token issue, so three ordinary people were locked out of events they run: an accepted
 * co-host, anyone whose cookie predates the event (a second device, or an event made
 * elsewhere), and a prolific organizer whose older events fell past the cap.
 *
 * The edge now gates AUTHENTICATION only. Whether you may manage an event is answered by
 * the API, against the database, where the answer cannot be stale — see `canManage` on
 * GET /api/events/:id. A hit here just tells the app it need not re-check.
 */
function claimsProveEvent(claims: { ownedEventIds?: string[]; staffEventIds?: string[] }, eventId: string): boolean {
  const owned = claims.ownedEventIds ?? [];
  const staff = claims.staffEventIds ?? [];
  return owned.includes(eventId) || staff.includes(eventId);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const login = new URL('/login', request.url);
    // Full return path (path + query) for EmailAuthPage `redirect`. Keep query
    // params like create=1 / from=mobile / events=… intact through login.
    const returnPath = `${pathname}${request.nextUrl.search}`;
    login.searchParams.set('redirect', returnPath);
    return NextResponse.redirect(login);
  }

  const publicKeyRaw = process.env.NEXT_PUBLIC_PASETO_PUBLIC_KEY || process.env.PASETO_PUBLIC_KEY;
  const publicKey = (publicKeyRaw ?? '').trim().replace(/^['"]|['"]$/g, '');
  if (!publicKey) {
    console.error('[middleware] NEXT_PUBLIC_PASETO_PUBLIC_KEY not set');
    return NextResponse.redirect(new URL('/503', request.url));
  }

  const claims = await verifyPasetoV4(token, publicKey);
  if (!claims) {
    const login = new URL('/login', request.url);
    const returnPath = `${pathname}${request.nextUrl.search}`;
    login.searchParams.set('redirect', returnPath);
    login.searchParams.set('reason', 'invalid_token');
    return NextResponse.redirect(login);
  }

  // No vendor gate here. /dashboard/events is "My Events" for every signed-in user:
  // the sidebar offers it to everyone, the page has an Attended tab for ticket
  // holders, and a Citizen may create a free event under /new. This used to send
  // every non-vendor to /403 — a leftover from before the member dashboard
  // existed. The client-side VENDOR_ONLY_ROUTE_PREFIXES list covers the surfaces
  // that really are vendor-only, and the API re-checks every mutation.
  // NOTE: /dashboard/vendor-upgrade must also stay open to non-vendors — it is the
  // page where a CITIZEN becomes a vendor.
  const res = NextResponse.next();
  res.headers.set('x-pxi-user-id', claims.sub);

  // Event [id]: a claim miss is no longer a refusal. The page loads and asks the API, which
  // knows the truth. We flag the miss so the dashboard re-issues its token once and the claim
  // list catches up — a stale cookie heals itself instead of being carried around forever.
  //
  // The flag is a bare '1'. WEB-2 forbids putting event ids in a client-readable cookie, and
  // rightly: this cookie is readable by any script on the origin, and a list of event ids a
  // person has opened is not something to hand out for a convenience signal.
  const eventId = getEventIdFromPath(pathname);
  if (eventId && !claimsProveEvent(claims, eventId)) {
    res.cookies.set('pxi_claims_stale', '1', {
      httpOnly: false, // read and cleared by the dashboard; carries no authority of its own
      sameSite: 'lax',
      path: '/',
      maxAge: 300,
    });
  }
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
