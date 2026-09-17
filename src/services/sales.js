import { api } from './api';

// PART-4 sales tools for ambassadors and regional managers (backend: /api/sales).

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
