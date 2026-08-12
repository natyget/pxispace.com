/** Headers for server-side API fetches (generateMetadata, public pages). */
export const SSR_FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (compatible; PXI-Web-SSR/1.0; +https://pxispace.com) AppleWebKit/537.36 (KHTML, like Gecko)',
};

/**
 * Hard per-request budget. Without one, `fetch` waits forever and the Netlify
 * function is killed by the platform instead — the caller never gets to run its
 * fallback, so the whole route 5xxes. That is how /sitemap.xml ended up as
 * "Couldn't fetch" in Search Console while returning 200 whenever the API was
 * healthy: the upstream is on EC2 behind Cloudflare, which has a history of
 * stalling Netlify egress rather than refusing it outright.
 *
 * A slow upstream must degrade this site to LESS data, never to an error page.
 */
export const SSR_FETCH_TIMEOUT_MS = 6000;

/**
 * @param {string} url
 * @param {{ revalidate?: number, logTag?: string, timeoutMs?: number }} [opts]
 */
export async function ssrFetchJson(url, opts = {}) {
  const { revalidate = 120, logTag = 'ssrFetch', timeoutMs = SSR_FETCH_TIMEOUT_MS } = opts;
  try {
    const res = await fetch(url, {
      headers: SSR_FETCH_HEADERS,
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 404) return { status: 404, data: null };
    if (res.status === 403) return { status: 403, data: null };
    if (!res.ok) {
      console.error(`[${logTag}] upstream error`, {
        status: res.status,
        statusText: res.statusText,
        url,
      });
      return { status: res.status, data: null };
    }
    const data = await res.json();
    return { status: 200, data };
  } catch (error) {
    // TimeoutError lands here too — deliberately. Callers already treat
    // `status: 0` as "no data", which is the correct degraded behaviour.
    console.error(`[${logTag}] fetch failed`, {
      url,
      timedOut: error?.name === 'TimeoutError',
      error,
    });
    return { status: 0, data: null };
  }
}
