import { fetchPublicListing, logListingTraffic } from '@/lib/publicListing';
import { isEnded, isListingId, isPreviewBot, outTarget, visitorFromHeaders } from '@/lib/goListing';

/**
 * GET /go/[id]/out: the "Tickets on DICE" button.
 *
 * Logs one CLICK for the listing (first-party traffic, contract section 3), then sends the visitor on with a 302 to
 * the listing's own ticket page. `?via=posh` sends them to the page of another source the night is sold on, the
 * rows under the button ("Also on Posh").
 *
 * The address is read from the listing the API returns, never from the request, and only http(s) addresses are
 * followed (safeRedirectUrl), so this cannot be turned into an open redirect.
 *
 * Counting never gets in the way: the call is cut off after 800 ms and a failure is ignored. A listing that is gone,
 * over or has no usable address sends the visitor back to its page, which says what happened.
 */
export const dynamic = 'force-dynamic';

const LOGGING_BUDGET_MS = 800;

/** A relative Location, so the answer does not depend on which host this function believes it is serving. */
const redirectTo = (location) =>
  new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // Every click is counted: nothing may keep this answer and replay it.
      'Cache-Control': 'no-store, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

export async function GET(request, { params }) {
  const { id } = await params;
  const page = `/go/${encodeURIComponent(String(id))}`;
  if (!isListingId(id)) return redirectTo(page);

  const result = await fetchPublicListing(id);
  if (result.status !== 'ok' || isEnded(result.listing)) return redirectTo(page);

  const target = outTarget(result.listing, request.nextUrl.searchParams.get('via') || '');
  if (!target) return redirectTo(page);

  const visitor = visitorFromHeaders(request.headers);
  // A link-preview bot or a scanner following the button is not somebody buying a ticket.
  if (!isPreviewBot(visitor.userAgent)) {
    await logListingTraffic(id, { kind: 'CLICK', surface: 'go_page', ...visitor }, LOGGING_BUDGET_MS);
  }
  return redirectTo(target);
}
