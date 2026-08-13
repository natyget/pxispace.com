import { NextResponse } from 'next/server';

/**
 * Stripe Connect OAuth redirect target — the redirect_uri registered in the
 * Stripe dashboard (Settings → Connect → Onboarding options → OAuth) points
 * here. The browser lands on this route after the organizer authorizes (or
 * denies) connecting their Standard account; forward the untouched query
 * string (code/state or error/state) to the backend, which verifies the
 * signed state and exchanges the code. Mirrors the twilio-callback pattern
 * of a web-hosted callback handing off to the API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export function GET(request) {
  const { search } = new URL(request.url);
  return NextResponse.redirect(`${API_BASE_URL}/api/stripe/connect/callback${search}`, 307);
}
