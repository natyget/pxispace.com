import { api } from './api';

// GROWTH (backend /api/growth, contract in PXIStudio-App docs/GROWTH_API.md): the organizer book, organizer and
// venue claims, commissions, the staff inbox and staff email alerts. One client for the control room and the
// Sales tab; the backend decides what each account sees.

const qs = (params) => {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : '';
};

/** Always 200: { hasAccess, staff, scope: 'ALL'|'CITY'|'OWN'|null, city, adminRole, salesRole, can }. */
export function fetchGrowthAccess() {
    return api.get('/api/growth/access');
}

// ── Organizer book ──────────────────────────────────────────────────────────────────────────────────────────

/** view: 'signals' | 'all' | 'mine' | 'unclaimed' | 'pending' */
export function fetchOrganizers({ view = 'signals', city, q, page = 1, limit = 50 } = {}) {
    return api.get(`/api/growth/organizers${qs({ view, city, q, page, limit })}`);
}

export function fetchOrganizer(id) {
    return api.get(`/api/growth/organizers/${encodeURIComponent(id)}`);
}

/** kind: 'CALL' | 'MEETING' | 'NOTE' | 'INCENTIVE' | 'OPT_OUT' */
export function logTouch(organizerId, { kind, subject, body, meetingAt }) {
    return api.post(`/api/growth/organizers/${encodeURIComponent(organizerId)}/touches`, { kind, subject, body, meetingAt });
}

export function fetchEmailTemplates() {
    return api.get('/api/growth/email-templates');
}

export function emailOrganizer(organizerId, { subject, body, template }) {
    return api.post(`/api/growth/organizers/${encodeURIComponent(organizerId)}/email`, { subject, body, template });
}

/** Super admin: give the account to a seller (moves it if someone else has it). */
export function assignOrganizer(organizerId, { sellerUsername, note }) {
    return api.post(`/api/growth/organizers/${encodeURIComponent(organizerId)}/assign`, { sellerUsername, note });
}

// ── Claims ──────────────────────────────────────────────────────────────────────────────────────────────────

/** view: 'queue' | 'mine' | 'all'; type: 'organizer' | 'venue' | 'any' */
export function fetchClaims({ view = 'queue', type = 'any' } = {}) {
    return api.get(`/api/growth/claims${qs({ view, type })}`);
}

export function previewOrganizerClaim(username) {
    return api.get(`/api/growth/claims/organizer/preview${qs({ username })}`);
}

export function raiseOrganizerClaim({ username, note }) {
    return api.post('/api/growth/claims/organizer', { username, note });
}

/** type: 'organizer' | 'venue' */
export function approveClaim(type, id, note) {
    return api.post(`/api/growth/claims/${type}/${encodeURIComponent(id)}/approve`, { note });
}

export function rejectClaim(type, id, note) {
    return api.post(`/api/growth/claims/${type}/${encodeURIComponent(id)}/reject`, { note });
}

export function revokeOrganizerClaim(id, reason) {
    return api.post(`/api/growth/claims/organizer/${encodeURIComponent(id)}/revoke`, { reason });
}

// ── Earnings, rates, payouts ────────────────────────────────────────────────────────────────────────────────

export function fetchMyEarnings() {
    return api.get('/api/growth/earnings/me');
}

/** Super and global admins: every seller. */
export function fetchAllEarnings() {
    return api.get('/api/growth/earnings');
}

/** A regional manager's own ambassadors. */
export function fetchTeamEarnings() {
    return api.get('/api/growth/earnings/team');
}

export function fetchEarningsFor(userId) {
    return api.get(`/api/growth/earnings/${encodeURIComponent(userId)}`);
}

/** Super admin: a regional manager's share of PXI revenue, in basis points (2000 = 20%). */
export function setManagerShare({ userId, username, rateBps, note }) {
    return api.post('/api/growth/rates', { userId, username, rateBps, note });
}

/** Regional manager: the part of their share an ambassador gets, in basis points (5000 = 50%). */
export function setAmbassadorSplit(username, { rateBps, note }) {
    return api.post(`/api/growth/team/${encodeURIComponent(username)}/split`, { rateBps, note });
}

export function fetchRates(userId) {
    return api.get(`/api/growth/rates${qs({ userId })}`);
}

export function recordPayout({ userId, username, amountCents, paidAt, method, reference, note }) {
    return api.post('/api/growth/payouts', { userId, username, amountCents, paidAt, method, reference, note });
}

export function voidPayout(id) {
    return api.post(`/api/growth/payouts/${encodeURIComponent(id)}/void`, {});
}

// ── Inbox and alerts ────────────────────────────────────────────────────────────────────────────────────────

export function fetchInbox() {
    return api.get('/api/growth/inbox');
}

export function fetchAlertPrefs() {
    return api.get('/api/growth/alerts/prefs');
}

export function saveAlertPrefs({ prefs, bookingUrl }) {
    return api.put('/api/growth/alerts/prefs', { prefs, bookingUrl });
}

export function sendTestAlert() {
    return api.post('/api/growth/alerts/test', {});
}
