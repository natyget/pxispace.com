import { api } from './api';

export async function getRelationshipStatus(userId) {
  return api.get(`/api/friends/status/${userId}`);
}

export async function acceptFriendRequest(requestId) {
  return api.post(`/api/friends/accept/${requestId}`, {});
}

export async function rejectFriendRequest(requestId) {
  return api.post(`/api/friends/reject/${requestId}`, {});
}
