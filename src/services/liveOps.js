import { api } from './api';

/**
 * Real-time event-day operations: scan activity, revenue-to-date, cost-to-date
 * (see budget.js), net profit. Backs the "Operations" / live-scan dashboard.
 */
export function getLiveOpsSnapshot(eventId) {
    return api.get(`/api/analytics/events/${eventId}/live-ops`);
}
