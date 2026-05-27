/**
 * Backend origin for server-side fetches (SSR, generateMetadata).
 *
 * Prefer `API_BASE_URL` on Netlify/hosting: it is read at **runtime** in the Node
 * serverless bundle. `NEXT_PUBLIC_API_BASE_URL` is often inlined at **build time**;
 * if the build did not see the correct value, public profile SSR would call localhost.
 *
 * Client code should keep using `NEXT_PUBLIC_API_BASE_URL` only (see `src/services/api.js`).
 */
export function getServerApiBaseUrl() {
    const raw =
        process.env.API_BASE_URL ||
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'http://localhost:3000';
    return String(raw).replace(/\/$/, '');
}
