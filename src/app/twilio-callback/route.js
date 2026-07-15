import { NextResponse } from 'next/server';

/**
 * Real Twilio webhook target (both inbound SMS replies and delivery status
 * callbacks point here — same URL, distinguished by params on the backend).
 * This route does NOT verify the Twilio signature itself — it forwards the
 * raw form params + the exact public URL + the X-Twilio-Signature header to
 * the backend, which holds the real Twilio auth token and verifies there
 * (see PXIStudio-App src/routes/webhook.routes.ts POST /twilio/callback).
 * Mirrors the spotify-callback / apple-music-connect-embed pattern of a
 * web-hosted callback calling the API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const FORWARD_SECRET = process.env.TWILIO_CALLBACK_FORWARD_SECRET || '';
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = String(value);
    }
    const signature = request.headers.get('x-twilio-signature') || '';
    const url = new URL(request.url).toString();

    await fetch(`${API_BASE_URL}/api/webhooks/twilio/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(FORWARD_SECRET ? { 'x-pxi-webhook-secret': FORWARD_SECRET } : {}),
      },
      body: JSON.stringify({ url, params, signature }),
    });
  } catch (error) {
    console.error('[twilio-callback] forward failed:', error);
    // Still ack Twilio below — never let a forwarding hiccup cause a retry storm.
  }

  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
