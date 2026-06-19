/** Headers for server-side API fetches (generateMetadata, public pages). */
export const SSR_FETCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (compatible; PXI-Web-SSR/1.0; +https://pxispace.com) AppleWebKit/537.36 (KHTML, like Gecko)',
};

/**
 * @param {string} url
 * @param {{ revalidate?: number, logTag?: string }} [opts]
 */
export async function ssrFetchJson(url, opts = {}) {
  const { revalidate = 120, logTag = 'ssrFetch' } = opts;
  try {
    const res = await fetch(url, {
      headers: SSR_FETCH_HEADERS,
      next: { revalidate },
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
    console.error(`[${logTag}] fetch failed`, { url, error });
    return { status: 0, data: null };
  }
}
