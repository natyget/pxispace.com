import { api } from './api';

export function fetchAdminStats() {
    return api.get('/api/admin/stats');
}

export function fetchAdminUsers(params = {}) {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.q) search.set('q', params.q);
    const q = search.toString();
    return api.get(`/api/admin/users${q ? `?${q}` : ''}`);
}

export function fetchAdminEvents(params = {}) {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const q = search.toString();
    return api.get(`/api/admin/events${q ? `?${q}` : ''}`);
}

export function fetchAdminReports(params = {}) {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const q = search.toString();
    return api.get(`/api/admin/reports${q ? `?${q}` : ''}`);
}
