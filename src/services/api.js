const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Backend Stripe webhook path (used by Stripe, not by this app): POST /api/webhooks/stripe

function getToken() {
    return localStorage.getItem('pxi_token');
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const error = new Error(data.error || data.message || `HTTP ${res.status}`);
        error.status = res.status;
        error.code = data.code;
        error.data = data;
        throw error;
    }

    return data;
}

export const api = {
    get: (endpoint, options) =>
        request(endpoint, { method: 'GET', ...options }),
    post: (endpoint, body, options) =>
        request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
    put: (endpoint, body, options) =>
        request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
    delete: (endpoint, options) =>
        request(endpoint, { method: 'DELETE', ...options }),
};
