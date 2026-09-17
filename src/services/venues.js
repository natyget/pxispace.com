import { api } from './api';

// VEN-8: venue owner surfaces (/api/venue-analytics) and the admin venue console (/api/venues).

function query(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
    });
    const q = search.toString();
    return q ? `?${q}` : '';
}

// ————— Venue owner (and admins reading a venue) —————

export function fetchMyVenues() {
    return api.get('/api/venue-analytics/mine');
}

export function fetchVenueAnalytics(venueId, params = {}) {
    return api.get(`/api/venue-analytics/${venueId}${query(params)}`);
}

export function fetchVenueAudience(venueId, params = {}) {
    return api.get(`/api/venue-analytics/${venueId}/audience${query(params)}`);
}

export function fetchVenueForecast(venueId, params = {}) {
    return api.get(`/api/venue-analytics/${venueId}/forecast${query(params)}`);
}

export function fetchVenueSuggestions(venueId, genre) {
    return api.get(`/api/venue-analytics/${venueId}/suggestions${query({ genre })}`);
}

export function fetchVenueGuarantees(venueId) {
    return api.get(`/api/venue-analytics/${venueId}/guarantees`);
}

// ————— Admin venue console —————

export function fetchAdminVenues(params = {}) {
    return api.get(`/api/venues/${query(params)}`);
}

export function createAdminVenue(body) {
    return api.post('/api/venues/', body);
}

export function generateVenueProposals(venueId) {
    return api.post(`/api/venues/${venueId}/proposals`, {});
}

export function fetchVenueProposals(venueId, status = 'PENDING') {
    return api.get(`/api/venues/${venueId}/proposals${query({ status })}`);
}

export function confirmVenueProposal(proposalId, note) {
    return api.post(`/api/venues/proposals/${proposalId}/confirm`, { note });
}

export function rejectVenueProposal(proposalId, note) {
    return api.post(`/api/venues/proposals/${proposalId}/reject`, { note });
}

export function fetchClaimPreview(venueId) {
    return api.get(`/api/venues/${venueId}/claim-preview`);
}

export function raiseVenueClaim(venueId, beneficiaryUserId, note) {
    return api.post(`/api/venues/${venueId}/claims`, { beneficiaryUserId, note });
}

export function fetchVenueClaims(venueId) {
    return api.get(`/api/venues/${venueId}/claims`);
}

export function decideVenueClaim(claimId, action, text) {
    const body = action === 'revoke' ? { reason: text } : { note: text };
    return api.post(`/api/venues/claims/${claimId}/${action}`, body);
}

export function fetchForecastStatus() {
    return api.get('/api/venues/forecast/status');
}
