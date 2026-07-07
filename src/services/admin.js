import { api } from './api';

function query(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
    });
    const q = search.toString();
    return q ? `?${q}` : '';
}

export function fetchAdminStats() {
    return api.get('/api/admin/stats');
}

export function fetchAdminWhoami() {
    return api.get('/api/admin/whoami');
}

// ————— Users —————

export function fetchAdminUsers(params = {}) {
    return api.get(`/api/admin/users${query(params)}`);
}

export function updateAdminUser(userId, body) {
    return api.patch(`/api/admin/users/${userId}`, body);
}

export function suspendUser(userId, reason) {
    return api.post(`/api/admin/users/${userId}/suspend`, { reason });
}

export function unsuspendUser(userId) {
    return api.post(`/api/admin/users/${userId}/unsuspend`, {});
}

// ————— Events —————

export function fetchAdminEvents(params = {}) {
    return api.get(`/api/admin/events${query(params)}`);
}

// ————— Moderation —————

export function fetchAdminReports(params = {}) {
    return api.get(`/api/admin/reports${query(params)}`);
}

export function fetchAdminUgcReports(params = {}) {
    return api.get(`/api/admin/ugc-reports${query(params)}`);
}

/** body: { status: 'RESOLVED'|'CANCELLED', action?: 'NONE'|'WARN_USER'|'SUSPEND_USER', reason? } */
export function resolveAdminReport(reportId, body) {
    return api.patch(`/api/admin/reports/${reportId}`, body);
}

export function fetchModerationActions(params = {}) {
    return api.get(`/api/admin/moderation/actions${query(params)}`);
}

// ————— Support queue —————

export function fetchSupportTickets(params = {}) {
    return api.get(`/api/admin/support/tickets${query(params)}`);
}

export function fetchSupportTicket(ticketId) {
    return api.get(`/api/admin/support/tickets/${ticketId}`);
}

export function replySupportTicket(ticketId, body) {
    return api.post(`/api/admin/support/tickets/${ticketId}/messages`, { body });
}

/** body: { status?, priority?, assigneeId? } */
export function updateSupportTicket(ticketId, body) {
    return api.patch(`/api/admin/support/tickets/${ticketId}`, body);
}

// ————— Platform analytics —————

export function fetchPlatformAnalytics(days = 30) {
    return api.get(`/api/admin/analytics/platform${query({ days })}`);
}

// ————— Promos + credits —————

export function fetchAdminPromos(params = {}) {
    return api.get(`/api/admin/promos${query(params)}`);
}

/** body: { code?, kind, creditCents?, commissionBps?, ownerUserId?, maxRedemptions?, expiresAt?, note? } */
export function createAdminPromo(body) {
    return api.post('/api/admin/promos', body);
}

export function updateAdminPromo(promoId, body) {
    return api.patch(`/api/admin/promos/${promoId}`, body);
}

export function fetchPromoRedemptions(promoId) {
    return api.get(`/api/admin/promos/${promoId}/redemptions`);
}

/** body: { userId, amountCents, note } */
export function grantCredits(body) {
    return api.post('/api/admin/credits/grant', body);
}
