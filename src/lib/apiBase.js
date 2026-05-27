import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Backend origin for server-side fetches (SSR, generateMetadata).
 *
 * Prefer `API_BASE_URL` on Netlify/hosting: it is read at **runtime** in the Node
 * serverless bundle. `NEXT_PUBLIC_API_BASE_URL` is often inlined at **build time**;
 * if the build did not see the correct value, public profile SSR would call localhost.
 *
 * Client code should keep using `NEXT_PUBLIC_API_BASE_URL` only (see `src/services/api.js`).
 */

const LOCAL_API = 'http://localhost:3000';

/** When SSR env vars point at localhost, infer API from the deployed site URL. */
const SITE_API_FALLBACKS = {
  'https://test.pxispace.com': 'https://dev.pxispace.com',
  'https://www.test.pxispace.com': 'https://dev.pxispace.com',
  'https://dev.pxispace.com': 'https://dev.pxispace.com',
  'https://www.dev.pxispace.com': 'https://dev.pxispace.com',
  'https://pxispace.com': 'https://api.pxispace.com',
  'https://www.pxispace.com': 'https://api.pxispace.com',
};

function isLocalApiUrl(url) {
  const u = String(url).replace(/\/$/, '').toLowerCase();
  return u === LOCAL_API || u === 'http://127.0.0.1:3000';
}

export function getServerApiBaseUrl() {
  const explicit = process.env.API_BASE_URL || process.env.BACKEND_URL;
  if (explicit && !isLocalApiUrl(explicit)) {
    return String(explicit).replace(/\/$/, '');
  }

  const fromPublic = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromPublic && !isLocalApiUrl(fromPublic)) {
    return String(fromPublic).replace(/\/$/, '');
  }

  const siteFallback = SITE_API_FALLBACKS[getSiteUrl()];
  if (siteFallback) return siteFallback;

  return String(fromPublic || explicit || LOCAL_API).replace(/\/$/, '');
}
