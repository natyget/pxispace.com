import { api } from './api';

function buildFallback(eventId) {
    return {
        source: 'mock',
        eventId,
        clusters: [
            { id: 'c-1', zone: 'Main Stage', peakTime: '11:20 PM', noiseRatio: '4.8%', uploads: 314 },
            { id: 'c-2', zone: 'VIP Bar', peakTime: '10:45 PM', noiseRatio: '3.2%', uploads: 204 },
            { id: 'c-3', zone: 'Entry Corridor', peakTime: '9:32 PM', noiseRatio: '7.4%', uploads: 118 },
        ],
        funnel: [
            { stage: 'Ticket Purchased', value: 1000 },
            { stage: 'Intent To Attend', value: 840 },
            { stage: 'Gate Scan', value: 690 },
            { stage: 'Retained', value: 522 },
        ],
        moments: [
            { id: 'm-1', title: 'Headliner Drop', score: 0.91, hearts: 482, cluster: 'Main Stage' },
            { id: 'm-2', title: 'VIP Toast', score: 0.87, hearts: 301, cluster: 'VIP Bar' },
            { id: 'm-3', title: 'Gate Surge', score: 0.79, hearts: 188, cluster: 'Entry Corridor' },
            { id: 'm-4', title: 'Encore Crowd', score: 0.76, hearts: 166, cluster: 'Main Stage' },
        ],
    };
}

export async function loadOrganizerAnalytics(eventId) {
    if (!eventId) return buildFallback(eventId);
    try {
        const payload = await api.get(`/api/organizer/analytics/${eventId}`);
        return {
            source: 'live',
            ...payload,
        };
    } catch {
        return buildFallback(eventId);
    }
}
