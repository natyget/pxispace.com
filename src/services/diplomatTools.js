import { api } from './api';
import { authStorage } from './auth';

// Same base as api.js, for the CSV downloads (api.js only parses JSON).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/** GET /api/events/:eventId/waitlist (host, Diplomat) → { count, entries } */
export const getWaitlist = (eventId) => api.get(`/api/events/${eventId}/waitlist`);

/** POST /api/events/:eventId/waitlist → { ok, count }. Signed out: pass the email. */
export const joinWaitlist = (eventId, email) =>
  api.post(`/api/events/${eventId}/waitlist`, email ? { email } : {});

/** GET /api/events/:eventId/ref-links (host, Diplomat) → { links } */
export const listRefLinks = (eventId) => api.get(`/api/events/${eventId}/ref-links`);

/** POST /api/events/:eventId/ref-links (host, Diplomat) → { code, label, url } */
export const createRefLink = (eventId, label) => api.post(`/api/events/${eventId}/ref-links`, { label });

/** POST /api/public/ref/:eventId/:code/click. Sent once per session; keepalive so it outlives the page. */
export const recordRefClick = (eventId, code) =>
  api.post(`/api/public/ref/${eventId}/${code}/click`, {}, { keepalive: true }).catch(() => {});

/** GET /api/demand/mine (Diplomat) → { city, top: [{ area, genre, count }] }. 404 when there is nothing. */
export const getDemandMine = () => api.get('/api/demand/mine');

/** Save a CSV the API serves behind the bearer token. A plain link would not carry the token. */
export async function downloadCsv(path, filename) {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
