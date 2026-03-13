import { api } from './api';

const TOKEN_KEY = 'pxi_token';
const USER_KEY = 'pxi_user';

/** Sync PASETO to HttpOnly cookie so Edge middleware can verify (Next.js only). */
async function setPasetoCookie(token) {
    if (typeof window === 'undefined') return;
    try {
        await fetch('/api/auth/set-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'same-origin',
        });
    } catch { /* ignore */ }
}

/** Clear HttpOnly PASETO cookie on logout (Next.js only). */
async function clearPasetoCookie() {
    if (typeof window === 'undefined') return;
    try {
        await fetch('/api/auth/clear-cookie', { method: 'POST', credentials: 'same-origin' });
    } catch { /* ignore */ }
}

export const authStorage = {
    getToken: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
    getUser: () => {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(USER_KEY);
        try {
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    save: async ({ token, user }) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user ?? '{}'));
            if (token) await setPasetoCookie(token);
        }
    },
    clear: async () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            await clearPasetoCookie();
        }
    },
    isAuthenticated: () => typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY),
};

export const authService = {
    register: (email, password, username) =>
        api.post('/api/auth/register', { email, password, username }),

    checkUsername: (username) =>
        api.get(`/api/auth/check-username?username=${encodeURIComponent(username)}`),

    login: (identifier, password) =>
        api.post('/api/auth/login', { identifier, password }),

    googleAuth: (idToken) =>
        api.post('/api/auth/google', { idToken }),

    /** Web OAuth2 token flow (shows account selection + consent). Use access_token from useGoogleLogin. */
    googleTokenAuth: (accessToken) =>
        api.post('/api/auth/google-token', { access_token: accessToken }),

    appleAuth: (identityToken, fullName) =>
        api.post('/api/auth/apple', {
            identityToken,
            ...(fullName && { fullName }),
        }),

    getMe: (userId) =>
        api.get(`/api/auth/user/${userId}`),

    vendorOnboard: () =>
        api.post('/api/vendor/onboard', {
            returnUrl: `${window.location.origin}/dashboard/vendor-upgrade?stripe=success`,
            refreshUrl: `${window.location.origin}/dashboard/vendor-upgrade?stripe=refresh`,
        }),

    checkVendorStatus: () =>
        api.post('/api/vendor/status', {}),

    getVendorDashboard: () =>
        api.get('/api/vendor/dashboard'),

    deleteAccount: () =>
        api.delete('/api/auth/account'),
};
