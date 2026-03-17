import { api } from './api';

/**
 * Accept an incoming friend request.
 * POST /api/friends/accept/:requestId
 */
export async function acceptFriendRequest(requestId) {
  return api.post(`/api/friends/accept/${requestId}`, {});
}

/**
 * Reject an incoming friend request.
 * POST /api/friends/reject/:requestId
 */
export async function rejectFriendRequest(requestId) {
  return api.post(`/api/friends/reject/${requestId}`, {});
}
