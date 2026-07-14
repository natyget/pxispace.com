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
            // Role hints must not survive the session that earned them.
            try {
                const { clearStaffAccessHints } = await import('@/lib/dashboardCapabilities');
                clearStaffAccessHints();
            } catch { /* ignore */ }
            await clearPasetoCookie();
        }
    },
    isAuthenticated: () => typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY),
};

export const authService = {
    register: (email, password, username, phone) =>
        api.post('/api/auth/register', { email, password, username, ...(phone && { phone }) }),

    /** Send OTP to phone via SMS (signup). Returns { message }. */
    sendVerification: (phone) =>
        api.post('/api/auth/send-verification', { phone }),

    /** Verify OTP. On success, register can be called. */
    verifyOtp: (phone, code) =>
        api.post('/api/auth/verify-otp', { phone, code }),

    /** For social-login users: verify phone and save to profile. Returns { token, user }. */
    verifyPhone: (phone, code) =>
        api.post('/api/auth/verify-phone', { phone, code }),

    checkUsername: (username) =>
        api.get(`/api/auth/check-username?username=${encodeURIComponent(username)}`),

    /**
     * Pre-signup email availability (public). Tries check-username?email= then check-email.
     * @returns {Promise<'available'|'taken'|'invalid'|'error'>}
     */
    checkEmail: async (email) => {
        const normalized = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalized)) return 'invalid';

        const parsePayload = (data) => {
            const reason = data.emailReason ?? data.reason;
            if (reason === 'invalid_format') return 'invalid';
            const available = data.emailAvailable ?? data.available;
            if (available === false) return 'taken';
            if (available === true) return 'available';
            return null;
        };

        const endpoints = [
            `/api/auth/check-username?email=${encodeURIComponent(normalized)}`,
            `/api/auth/check-email?email=${encodeURIComponent(normalized)}`,
        ];

        for (const endpoint of endpoints) {
            try {
                const data = await api.get(endpoint);
                const result = parsePayload(data);
                if (result) return result;
            } catch {
                // try next endpoint
            }
        }
        return 'error';
    },

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

    /** Update own profile fields (name, bio, city, instagramHandle, …). Returns { user }. */
    updateProfile: (userId, fields) =>
        api.put(`/api/auth/user/${userId}`, fields),

    vendorOnboard: (opts = {}) => {
        const base = `${window.location.origin}/dashboard/vendor-upgrade`;
        const fromMobile = opts.fromMobile ? '&from=mobile' : '';
        return api.post('/api/vendor/onboard', {
            returnUrl: `${base}?stripe=success${fromMobile}`,
            refreshUrl: `${base}?stripe=refresh${fromMobile}`,
        });
    },

    checkVendorStatus: () =>
        api.post('/api/vendor/status', {}),

    getVendorDashboard: () =>
        api.get('/api/vendor/dashboard'),

    deleteAccount: () =>
        api.delete('/api/auth/account'),
};
