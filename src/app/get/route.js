import { NextResponse } from 'next/server';
import { detectAppPlatform, storeUrlForPlatform } from '@/lib/appStoreLinks';

/**
 * GET /get — send the visitor to their own app store.
 *
 * Resolving on the server keeps generic "Get the app" CTAs correct with no
 * client JS and no flash of the wrong store. It also means marketing can point
 * any link, QR code or email at /get and never revisit it.
 */
export const dynamic = 'force-dynamic';

export function GET(request) {
  const platform = detectAppPlatform(request.headers.get('user-agent') || '');
  const res = NextResponse.redirect(storeUrlForPlatform(platform), 302);
  // The response body depends on the request's User-Agent. Without both of these
  // a CDN would cache whichever store the first visitor resolved to and serve it
  // to everyone — Android users sent to the App Store, or the reverse.
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  res.headers.set('Vary', 'User-Agent');
  return res;
}
