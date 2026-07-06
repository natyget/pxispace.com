import { api } from './api';

/**
 * Real organizer analytics — backed by /api/analytics on PXIStudio-App.
 * Replaces the old localStorage/mock builders (formerly analyticsMock.js and the
 * fallback-to-fake-data version of this file).
 */

/**
 * GET /api/analytics/overview
 * Cross-event totals + 30-day trend series for every event the caller owns.
 */
function getOverview() {
    return api.get('/api/analytics/overview');
}

/**
 * GET /api/analytics/events/:eventId
 * Deep dashboard payload for a single event: sales velocity, attendance, media,
 * funnel, and geotagged-photo location clusters.
 */
function getEventAnalytics(eventId) {
    if (!eventId) return Promise.reject(new Error('eventId is required'));
    return api.get(`/api/analytics/events/${eventId}`);
}

export const organizerAnalyticsService = {
    getOverview,
    getEventAnalytics,
};
