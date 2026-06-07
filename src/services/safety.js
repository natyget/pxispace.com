import { api } from './api';

/**
 * @returns {Promise<{ blocks: Array<{ id: string, blockedUser: { id: string, username: string | null, avatarUrl?: string | null }, blockedAt: string }>, count: number }>}
 */
export async function getBlockedUsers() {
    return api.get('/api/safety/blocks');
}

export async function unblockUser(blockedId) {
    return api.delete(`/api/safety/block/${encodeURIComponent(blockedId)}`);
}
