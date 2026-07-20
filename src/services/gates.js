import { api } from './api';

/** Server-persisted event gates (EventGate) — shared by every operator. */

export function listGates(eventId) {
    return api.get(`/api/events/${eventId}/gates`);
}

/** { name, staffJson? } */
export function createGate(eventId, body) {
    return api.post(`/api/events/${eventId}/gates`, body);
}

/** { name?, isPaused?, staffJson?, incidentsJson?, appendIncident? } */
export function updateGate(eventId, gateId, body) {
    return api.patch(`/api/events/${eventId}/gates/${gateId}`, body);
}

export function deleteGate(eventId, gateId) {
    return api.delete(`/api/events/${eventId}/gates/${gateId}`);
}
