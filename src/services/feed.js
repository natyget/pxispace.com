import { api } from './api';

/**
 * Create album gallery / wall media (POST /api/feed/item).
 * Auth user is taken from the session cookie; do not send spoofable userId.
 */
export function createFeedItem(body) {
  return api.post('/api/feed/item', body);
}

/**
 * Delete a media item (author, or event OWNER/ADMIN moderation — the backend
 * "Bouncer" endpoint enforces permissions).
 */
export function deleteFeedItem(itemId) {
  return api.delete(`/api/feed/item/${itemId}`);
}
