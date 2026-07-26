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

/** body: { username?, userId?, amountCents, note } — username resolved server-side */
export function grantCredits(body) {
    return api.post('/api/admin/credits/grant', body);
}

// ————— Announcements (Command Center footer) —————

export function listAdminAnnouncements() {
    return api.get('/api/admin/announcements');
}

/** body: { title, body, ctaLabel?, ctaHref?, durationDays } — 409 code ANNOUNCEMENT_LIMIT at 5 active */
export function createAdminAnnouncement(body) {
    return api.post('/api/admin/announcements', body);
}

/** body: { active?, title?, body?, ctaLabel?, ctaHref?, durationDays? } */
export function updateAdminAnnouncement(announcementId, body) {
    return api.patch(`/api/admin/announcements/${announcementId}`, body);
}

export function deleteAdminAnnouncement(announcementId) {
    return api.delete(`/api/admin/announcements/${announcementId}`);
}

// ————— Ads (W12) —————

export function fetchAdminAdsOverview() {
    return api.get('/api/admin/ads/overview');
}

export function fetchAdminAdCampaigns(params = {}) {
    return api.get(`/api/admin/ads/campaigns${query(params)}`);
}

export function adminPauseAdCampaign(campaignId, reason) {
    return api.post(`/api/admin/ads/campaigns/${campaignId}/pause`, { reason });
}

export function adminResumeAdCampaign(campaignId) {
    return api.post(`/api/admin/ads/campaigns/${campaignId}/resume`, {});
}

export function adminCancelAdCampaign(campaignId, reason) {
    return api.post(`/api/admin/ads/campaigns/${campaignId}/cancel`, { reason });
}

/** Per-surface kill switch (e.g. yank one featured placement). */
export function adminToggleAdPlacement(placementId, disabled) {
    return api.patch(`/api/admin/ads/placements/${placementId}`, { disabled });
}

// ————— Organizers (hype score / tier ranking) —————

/** params: { tier?, sort?, page?, take? } → { organizers, total, page, take } */
export function listAdminOrganizers(params = {}) {
    return api.get(`/api/admin/organizers${query(params)}`);
}

/** body: { userId?, username?, segmentId?, title, body, deepLink? } → { ok, sent } */
export function sendAdminNotification(body) {
    return api.post('/api/admin/notify', body);
}
