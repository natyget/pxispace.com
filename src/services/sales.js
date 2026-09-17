import { api } from './api';

// PART-4 sales tools for ambassadors and regional managers (backend: /api/sales).

/** Always 200: { hasAccess, salesRole, cityCode }. For deciding whether to show the sales tools at all. */
export function fetchSalesAccess() {
    return api.get('/api/sales/access');
}

export function fetchSalesMe() {
    return api.get('/api/sales/me');
}

export function fetchSalesVenues(q = '') {
    return api.get(`/api/sales/venues${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}

/** Body: { venueId, beneficiaryUsername, note? } */
export function raiseSalesClaim(body) {
    return api.post('/api/sales/claims', body);
}

/** view: 'mine' (claims I raised) or 'queue' (my city's pending claims, regional managers only). */
export function fetchSalesClaims(view = 'mine') {
    return api.get(`/api/sales/claims?view=${view}`);
}

export function approveSalesClaim(claimId, note) {
    return api.post(`/api/sales/claims/${claimId}/approve`, { note });
}

export function rejectSalesClaim(claimId, note) {
    return api.post(`/api/sales/claims/${claimId}/reject`, { note });
}
