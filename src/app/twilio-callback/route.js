import { NextResponse } from 'next/server';
import { getServerApiBaseUrl } from '@/lib/apiBase';
import { SSR_FETCH_HEADERS } from '@/lib/ssrFetch';

/**
 * Real Twilio webhook target (both inbound SMS replies and delivery status
 * callbacks point here — same URL, distinguished by params on the backend).
 * This route does NOT verify the Twilio signature itself — it forwards the
 * raw form params + the exact public URL + the X-Twilio-Signature header to
 * the backend, which holds the real Twilio auth token and verifies there
 * (see PXIStudio-App src/routes/webhook.routes.ts POST /twilio/callback).
 * Mirrors the spotify-callback / apple-music-connect-embed pattern of a
 * web-hosted callback calling the API.
 *
 * Two things this route got wrong until RELAY-4 tested it for real, both silent:
 *
 * 1. The forward went out with Node's default User-Agent ("node"), which the API's
 *    Cloudflare challenges with a 403. Every other server-side fetch on this site
 *    already sends SSR_FETCH_HEADERS for exactly that reason; this one did not.
 * 2. The response was never read, and Twilio was told 200 regardless. So a STOP
 *    could be dropped on the way to the database with nothing anywhere to show it.
 *
 * Now the backend's verdict decides the answer. Twilio does not retry a messaging
 * webhook on a 5xx (it tries the service's fallback URL, if one is set, and logs
 * the failure in its console), so a 502 here costs nothing and is the only way a
 * lost opt-out becomes visible. It also makes the chain testable from outside:
 * a correctly signed request gets 200 only if every hop worked.
 */

const FORWARD_SECRET = process.env.TWILIO_CALLBACK_FORWARD_SECRET || '';
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
// Twilio gives a webhook 15 seconds. Answer inside that even if the API hangs.
const FORWARD_TIMEOUT_MS = 10000;

const twiml = (status) =>
  new NextResponse(EMPTY_TWIML, { status, headers: { 'Content-Type': 'text/xml' } });

const first = (value) => (value || '').split(',')[0].trim();

/**
 * The URL Twilio signed is the public one. Behind a proxy `request.url` can be
 * the origin's own view of the request (another host, or http), so the public
 * scheme and host are taken from the forwarded headers when they are there.
 * The backend also checks the signature against its configured web origin, so a
 * host that reports neither correctly still verifies.
 */
function publicUrl(request) {
  const seen = new URL(request.url);
  const host = first(request.headers.get('x-forwarded-host')) || first(request.headers.get('host')) || seen.host;
  const proto = first(request.headers.get('x-forwarded-proto')) || seen.protocol.replace(':', '');
  return `${proto}://${host}${seen.pathname}${seen.search}`;
}

export async function POST(request) {
  let accepted = false;
  try {
    const formData = await request.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = String(value);
    }
    const signature = request.headers.get('x-twilio-signature') || '';

    const res = await fetch(`${getServerApiBaseUrl()}/api/webhooks/twilio/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': SSR_FETCH_HEADERS['User-Agent'],
        ...(FORWARD_SECRET ? { 'x-pxi-webhook-secret': FORWARD_SECRET } : {}),
      },
      body: JSON.stringify({ url: publicUrl(request), params, signature }),
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });
    accepted = res.ok;
    if (!res.ok) {
      console.error('[twilio-callback] the API did not accept the forward', {
        status: res.status,
        cfMitigated: res.headers.get('cf-mitigated'),
      });
    }
  } catch (error) {
    console.error('[twilio-callback] forward failed:', error);
  }

  return twiml(accepted ? 200 : 502);
}
