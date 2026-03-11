import { api } from './api';

const TOKEN_KEY = 'pxi_token';
const USER_KEY = 'pxi_user';

export const authStorage = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    getUser: () => {
        const raw = localStorage.getItem(USER_KEY);
        try {
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    save: ({ token, user }) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export const authService = {
    register: (email, password, handle) =>
        api.post('/api/auth/register', { email, password, handle }),

    checkHandle: (handle) =>
        api.get(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`),

    login: (identifier, password) =>
        api.post('/api/auth/login', { identifier, password }),

    googleAuth: (idToken) =>
        api.post('/api/auth/google', { idToken }),

    appleAuth: (identityToken, fullName) =>
        api.post('/api/auth/apple', {
            identityToken,
            ...(fullName && { fullName }),
        }),

    getMe: (userId) =>
        api.get(`/api/auth/user/${userId}`),

    vendorOnboard: () =>
        api.post('/api/vendor/onboard', {}),

    getVendorDashboard: () =>
        api.get('/api/vendor/dashboard'),
};
