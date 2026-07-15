import { api } from './api';

/**
 * Real, per-attendee CRM data + server-persisted segments.
 *
 * Replaces the old buildAudienceRows() planning model (fabricated rows from
 * events+notifications) and the localStorage-backed segment drafts.
 *
 * filterJson shape (opaque to the backend, defined here so a saved segment
 * can be "replayed" as fresh query params against GET /api/analytics/audience/attendees):
 * {
 *   emailOptIn: boolean | null,
 *   smsOptIn: boolean | null,
 *   faceEnrolled: boolean | null,
 *   city: string,
 *   accountTier: 'PARTIAL' | 'CITIZEN' | 'ADMIN' | '',
 *   minOdysseyXp: number | string,
 * }
 */

/** Build the URLSearchParams for GET /api/analytics/audience/attendees from a filterJson-shaped object. */
function buildAttendeeQuery(filters = {}, { skip = 0, take = 50 } = {}) {
  const params = new URLSearchParams();

  if (filters.emailOptIn === true) params.set('emailOptIn', 'true');
  else if (filters.emailOptIn === false) params.set('emailOptIn', 'false');

  if (filters.smsOptIn === true) params.set('smsOptIn', 'true');
  else if (filters.smsOptIn === false) params.set('smsOptIn', 'false');

  if (filters.faceEnrolled === true) params.set('faceEnrolled', 'true');
  else if (filters.faceEnrolled === false) params.set('faceEnrolled', 'false');

  if (filters.city && String(filters.city).trim()) params.set('city', String(filters.city).trim());
  if (filters.accountTier) params.set('accountTier', filters.accountTier);

  const minXp = Number(filters.minOdysseyXp);
  if (filters.minOdysseyXp !== '' && filters.minOdysseyXp != null && Number.isFinite(minXp)) {
    params.set('minOdysseyXp', String(minXp));
  }

  params.set('skip', String(Math.max(0, Number(skip) || 0)));
  params.set('take', String(Math.min(200, Math.max(1, Number(take) || 50))));

  return params;
}

/** Real, row-level, paginated attendee data for the caller's own events. */
export function fetchAudienceAttendees(filters = {}, pagination = {}) {
  const params = buildAttendeeQuery(filters, pagination);
  return api.get(`/api/analytics/audience/attendees?${params}`);
}

/** { segments: [{ id, organizerId, name, filterJson, createdAt, updatedAt }] } — newest first. */
export function listAudienceSegments() {
  return api.get('/api/audience/segments');
}

/** body: { name, filterJson } → { segment } */
export function saveAudienceSegment({ name, filterJson }) {
  return api.post('/api/audience/segments', { name, filterJson });
}

/** body: { name?, filterJson? } → { segment } */
export function updateAudienceSegment(segmentId, body) {
  return api.patch(`/api/audience/segments/${segmentId}`, body);
}

/** → { ok: true } */
export function deleteAudienceSegment(segmentId) {
  return api.delete(`/api/audience/segments/${segmentId}`);
}
