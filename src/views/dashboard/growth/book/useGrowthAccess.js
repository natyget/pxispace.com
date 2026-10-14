'use client';

import { useEffect, useState } from 'react';
import { fetchGrowthAccess } from '@/services/growth';

// What this account may see and do in the growth tools (GET /api/growth/access). Read once per sign-in and shared
// by every page and drawer in the tab; keyed by the session token so a different account never sees a stale answer.
const cache = { token: null, promise: null };

function loadAccess() {
    let token = null;
    try {
        token = window.localStorage.getItem('pxi_token');
    } catch {
        token = null;
    }
    if (!cache.promise || cache.token !== token) {
        cache.token = token;
        cache.promise = fetchGrowthAccess().catch((error) => {
            cache.promise = null;
            throw error;
        });
    }
    return cache.promise;
}

/** { access, error, loading }. `access.can` is null when the account has no organizer book. */
export function useGrowthAccess() {
    const [state, setState] = useState({ access: null, error: null, loading: true });
    useEffect(() => {
        let cancelled = false;
        loadAccess()
            .then((access) => {
                if (!cancelled) setState({ access, error: null, loading: false });
            })
            .catch((error) => {
                if (!cancelled) setState({ access: null, error, loading: false });
            });
        return () => {
            cancelled = true;
        };
    }, []);
    return state;
}

export const NEEDS_LATEST_API = 'This needs the latest PXI API.';

/** The API is older than this page: the route does not exist. */
export function isOlderApi(error) {
    return error?.status === 404;
}

/** A line a person can read for a failed request. */
export function errorLine(error, fallback = 'Something went wrong. Try again.') {
    if (!error) return fallback;
    if (error.code === 'NETWORK_ERROR') return error.message;
    const message = String(error.message || '');
    if (!message || /^HTTP \d+$/.test(message)) return fallback;
    return message;
}
