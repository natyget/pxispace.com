/**
 * Task 4: Edge Middleware RBAC Gatekeeper
 * Intercepts /dashboard/*, validates PASETO from HttpOnly cookie,
 * enforces: token present, isVendor, and (when applicable) event ownership.
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
    const footerStr = footer.length ? new TextDecoder().decode(footer) : '';

    // panva/paseto: PAE(header, payloadBytes, footer); empty footer is filtered so 2 pieces
    const pieces: (string | Uint8Array)[] = ['v4.public.', payloadBytes];
    if (footerStr) pieces.push(footerStr);
    const message = paePieces(pieces);
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
      signatureBytes,
      message
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

/**
 * Event ownership: Per task, "User ID does not match ownership ID of requested event parameter [id]"
 * redirect to 403. At Edge we use ownedEventIds + staffEventIds from the PASETO payload (no DB).
 * Server-side DAL still verifies ownership for mutations.
 */
function getEventIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(DASHBOARD_EVENTS_PREFIX)) return null;
  const after = pathname.slice(DASHBOARD_EVENTS_PREFIX.length);
  const segment = after.split('/')[0];
  return segment || null;
}

function canAccessEvent(claims: { ownedEventIds?: string[]; staffEventIds?: string[] }, eventId: string): boolean {
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
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  const publicKey = process.env.PASETO_PUBLIC_KEY;
  if (!publicKey) {
    console.error('[middleware] PASETO_PUBLIC_KEY not set');
    return NextResponse.redirect(new URL('/503', request.url));
  }

  const claims = await verifyPasetoV4(token, publicKey);
  if (!claims) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    login.searchParams.set('reason', 'invalid_token');
    return NextResponse.redirect(login);
  }

  // Require isVendor only for vendor-only routes (e.g. Vendor Setup, event management).
  const vendorOnlyPaths = ['/dashboard/vendor-upgrade', '/dashboard/events'];
  const isVendorOnlyRoute = vendorOnlyPaths.some((p) => pathname.startsWith(p));
  if (isVendorOnlyRoute && !claims.isVendor) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  // Event [id] ownership: if path is /dashboard/events/:id, user must own or be staff for that event.
  const eventId = getEventIdFromPath(pathname);
  if (eventId && !canAccessEvent(claims, eventId)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  const res = NextResponse.next();
  res.headers.set('x-pxi-user-id', claims.sub);
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
