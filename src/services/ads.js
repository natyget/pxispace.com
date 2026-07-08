import { api } from './api';

/**
 * Ad campaigns (W12) — organizer ads manager + public sponsored slots.
 *
 * Targeting shape: { cities: [], ageBrackets: [], genres: [], artistIds: [],
 * xpTiers: [], attendance: 'ANY_PAST' | { eventIds: [] } | null }
 */

export const AD_SURFACES = [
    { id: 'FEED', label: 'Mobile Feed', hint: 'Sponsored card ~every 8th Wall post' },
    { id: 'DISCOVERY', label: 'Mobile Discovery', hint: 'Sponsored cards in the Discover sheet' },
    { id: 'WEB_DISCOVERY', label: 'Web Discovery', hint: 'Sponsored cards in the pxispace.com events grid' },
    { id: 'WEB_FEATURED', label: 'Web Featured Hero', hint: 'Pinned hero slot on the pxispace.com events page' },
];

export const AD_INTENSITIES = [
    { id: 'LOW', label: 'Low', hint: 'Fewer slots, lower rate (0.6×)' },
    { id: 'STANDARD', label: 'Standard', hint: 'Balanced delivery (1×)' },
    { id: 'HIGH', label: 'High', hint: 'Priority delivery (1.6×)' },
];

export const AD_AGE_BRACKETS = ['18-20', '21-24', '25-29', '30-39', '40+'];

export const AD_XP_TIERS = [
    { id: 'WANDERER', label: 'Wanderer' },
    { id: 'SEEKER', label: 'Seeker' },
    { id: 'VOYAGER', label: 'Voyager' },
    { id: 'PATHFINDER', label: 'Pathfinder' },
    { id: 'LUMINARY', label: 'Luminary' },
    { id: 'ODYSSEY', label: 'Odyssey' },
];

export function listAdCampaigns() {
    return api.get('/api/ads/campaigns');
}

export function getAdCampaign(campaignId) {
    return api.get(`/api/ads/campaigns/${campaignId}`);
}

/** body: { name, eventIds, startAt, endAt, placements: [{surface,intensity}], emailEnabled, emailSubject?, emailBody?, targeting, frequencyCapPerDay? } */
export function createAdCampaign(body) {
    return api.post('/api/ads/campaigns', body);
}

export function updateAdCampaign(campaignId, body) {
    return api.patch(`/api/ads/campaigns/${campaignId}`, body);
}

/** Stateless quote: { placements, startAt, endAt, emailEnabled, targeting } → totals + credit/Stripe split */
export function quoteAd(body) {
    return api.post('/api/ads/quote', body);
}

/** { targeting } → { totalMatched, emailOptInMatched } */
export function adReachEstimate(targeting) {
    return api.post('/api/ads/reach', { targeting });
}

/** → { paid: true, campaign } when credits cover it, else { paid: false, clientSecret, ... } */
export function payAdCampaign(campaignId) {
    return api.post(`/api/ads/campaigns/${campaignId}/pay`, {});
}

export function pauseAdCampaign(campaignId) {
    return api.post(`/api/ads/campaigns/${campaignId}/pause`, {});
}

export function resumeAdCampaign(campaignId) {
    return api.post(`/api/ads/campaigns/${campaignId}/resume`, {});
}

export function cancelAdCampaign(campaignId) {
    return api.post(`/api/ads/campaigns/${campaignId}/cancel`, {});
}

export function getAdPerformance(campaignId, days = 30) {
    return api.get(`/api/ads/campaigns/${campaignId}/performance?days=${days}`);
}

// ————— Public sponsored slots (logged-out safe) —————

export async function getAdSlot(surface, limit = 2, anonId = null) {
    const params = new URLSearchParams({ surface, limit: String(limit) });
    if (anonId) params.set('anon', anonId);
    try {
        const data = await api.get(`/api/ads/slot?${params}`);
        return data.ads || [];
    } catch {
        return [];
    }
}

/** Fire-and-forget beacon batch: { anonId?, events: [{campaignId, eventId?, surface, kind}] } */
export function trackAdEvents(payload) {
    return api.post('/api/ads/track', payload).catch(() => {});
}
