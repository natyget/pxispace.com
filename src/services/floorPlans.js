import { api } from './api';

/** Geo-calibrated venue floor plans + the spatial heat-map payload. */

export function listFloorPlans() {
    return api.get('/api/floor-plans');
}

/** { name, imageUrl, imageWidthPx, imageHeightPx, anchorLat, anchorLng, rotationDeg, metersPerPixel, gatePinsJson? } */
export function createFloorPlan(body) {
    return api.post('/api/floor-plans', body);
}

export function updateFloorPlan(floorPlanId, body) {
    return api.patch(`/api/floor-plans/${floorPlanId}`, body);
}

export function deleteFloorPlan(floorPlanId) {
    return api.delete(`/api/floor-plans/${floorPlanId}`);
}

export function getEventFloorPlan(eventId) {
    return api.get(`/api/events/${eventId}/floor-plan`);
}

export function attachFloorPlan(eventId, floorPlanId) {
    return api.put(`/api/events/${eventId}/floor-plan`, { floorPlanId });
}

export function detachFloorPlan(eventId) {
    return api.delete(`/api/events/${eventId}/floor-plan`);
}

/** Pre-aggregated heat-map payload: media tuples, scan/chat series, clusters, calibration. */
export function getEventHeatmap(eventId) {
    return api.get(`/api/analytics/events/${eventId}/heatmap`);
}
