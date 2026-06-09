'use client';

/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import { eventsService, getEventsForWallet, getMyEventXp } from '@/services/events';
import { getNotifications } from '@/services/notifications';
import { getUserTickets } from '@/services/tickets';
import { resolveDashboardCapabilities } from '@/lib/dashboardCapabilities';

const DEFAULT_TTL = 60_000;
const EVENTS_TTL = 90_000;
const VENDOR_TTL = 45_000;
const NOTIFICATIONS_TTL = 30_000;
const CAPABILITIES_TTL = 120_000;
const ATTENDED_EVENTS_TTL = 90_000;

const DashboardDataContext = createContext(null);

function paramsKey(params = {}) {
    return new URLSearchParams(
        Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => [key, String(value)])
    ).toString();
}

export function createResourceCache() {
    const entries = new Map();

    const read = (key, loader, ttl = DEFAULT_TTL, { force = false } = {}) => {
        const now = Date.now();
        const current = entries.get(key);

        if (!force && current?.data !== undefined && now - current.ts < ttl) {
            return Promise.resolve(current.data);
        }

        if (!force && current?.promise) {
            return current.promise;
        }

        const promise = Promise.resolve()
            .then(loader)
            .then((data) => {
                entries.set(key, { data, error: null, ts: Date.now(), promise: null });
                return data;
            })
            .catch((error) => {
                entries.set(key, {
                    data: current?.data,
                    error,
                    ts: current?.ts ?? 0,
                    promise: null,
                });
                throw error;
            });

        entries.set(key, {
            data: current?.data,
            error: current?.error ?? null,
            ts: current?.ts ?? 0,
            promise,
        });

        return promise;
    };

    return {
        read,
        peek: (key) => entries.get(key)?.data,
        invalidate: (key) => {
            if (!key) {
                entries.clear();
                return;
            }
            for (const entryKey of entries.keys()) {
                if (entryKey === key || entryKey.startsWith(`${key}:`)) {
                    entries.delete(entryKey);
                }
            }
        },
    };
}

function makeKeys(userId) {
    return {
        events: (params) => `events:${paramsKey({ limit: 100, offset: 0, ...params })}`,
        attendedEvents: (params) => `attended-events:${userId}:${paramsKey({ limit: 100, offset: 0, ...params })}`,
        notifications: (limit, unreadOnly) => `notifications:${userId}:${limit}:${unreadOnly ? 'unread' : 'all'}`,
        vendor: `vendor:${userId}`,
        me: `me:${userId}`,
        capabilities: `capabilities:${userId}`,
    };
}

function samePatch(base, patch) {
    if (!base || !patch) return true;
    return Object.entries(patch).every(([key, value]) => Object.is(base[key], value));
}

function useCachedResource(loader, fallback) {
    const [state, setState] = useState({
        data: fallback,
        error: null,
        loading: true,
    });

    const refresh = useCallback(
        async (options = {}) => {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            try {
                const data = await loader(options);
                setState({ data, error: null, loading: false });
                return data;
            } catch (error) {
                setState((prev) => ({ ...prev, error, loading: false }));
                return fallback;
            }
        },
        [fallback, loader]
    );

    useEffect(() => {
        let cancelled = false;
        setState((prev) => ({ ...prev, loading: true, error: null }));
        loader()
            .then((data) => {
                if (!cancelled) setState({ data, error: null, loading: false });
            })
            .catch((error) => {
                if (!cancelled) setState((prev) => ({ ...prev, error, loading: false }));
            });
        return () => {
            cancelled = true;
        };
    }, [loader]);

    return { ...state, refresh };
}

export function DashboardDataProvider({ children }) {
    const { user } = useAuth();
    const cache = useMemo(() => createResourceCache(), []);

    const userId = user?.id ? String(user.id) : '';
    const keys = useMemo(() => makeKeys(userId), [userId]);

    const loadEvents = useCallback(
        (params = {}, options = {}) => {
            const nextParams = { limit: 100, offset: 0, ...params };
            return cache
                .read(
                    keys.events(nextParams),
                    () => eventsService.getMyEvents(nextParams).then((res) => res?.events || []),
                    EVENTS_TTL,
                    options
                );
        },
        [cache, keys]
    );

    const loadAttendedEvents = useCallback(
        async (params = {}, options = {}) => {
            if (!userId) return [];
            const nextParams = { limit: 100, offset: 0, ...params };
            return cache.read(
                keys.attendedEvents(nextParams),
                async () => {
                    const [tickets, eventsData, xpByEventId] = await Promise.all([
                        getUserTickets(userId),
                        getEventsForWallet(nextParams.limit, nextParams.offset),
                        getMyEventXp(),
                    ]);
                    const eventsById = new Map((eventsData?.events || []).map((event) => [String(event.id), event]));
                    return (tickets || []).flatMap((ticket) => {
                        const eventId = String(ticket.eventId || ticket.event?.id || '');
                        if (!eventId) return [];
                        const event = ticket.event || eventsById.get(eventId);
                        if (!event) return [];
                        return [{
                            ...event,
                            id: eventId,
                            ticket,
                            ticketId: ticket.id,
                            xp: xpByEventId?.[eventId] || 0,
                            attendeeStatus: ticket.status || ticket.state || 'ticketed',
                        }];
                    });
                },
                ATTENDED_EVENTS_TTL,
                options
            );
        },
        [cache, keys, userId]
    );

    const loadNotifications = useCallback(
        (limit = 50, unreadOnly = false, options = {}) => {
            if (!userId) return Promise.resolve({ notifications: [], unreadCount: 0 });
            return cache.read(
                keys.notifications(limit, unreadOnly),
                () => getNotifications(userId, limit, unreadOnly),
                NOTIFICATIONS_TTL,
                options
            );
        },
        [cache, keys, userId]
    );

    const loadVendorDashboard = useCallback(
        (options = {}) => {
            if (!userId || !user?.isVendor) return Promise.resolve(null);
            return cache.read(keys.vendor, () => authService.getVendorDashboard(), VENDOR_TTL, options);
        },
        [cache, keys, user?.isVendor, userId]
    );

    const loadMe = useCallback(
        (options = {}) => {
            if (!userId) return Promise.resolve(null);
            return cache.read(keys.me, () => authService.getMe(userId), DEFAULT_TTL, options);
        },
        [cache, keys, userId]
    );

    const loadCapabilities = useCallback(
        async (options = {}) => {
            if (!userId) {
                return { hasBouncerAccess: false, loading: false, determined: false, source: {} };
            }

            return cache.read(
                keys.capabilities,
                async () => {
                    const [eventsResult, notificationsResult, meResult] = await Promise.allSettled([
                        loadEvents({ limit: 100, offset: 0 }, options),
                        loadNotifications(100, false, options),
                        loadMe(options),
                    ]);

                    return resolveDashboardCapabilities({
                        user,
                        userId,
                        events: eventsResult.status === 'fulfilled' ? eventsResult.value : [],
                        notifications:
                            notificationsResult.status === 'fulfilled'
                                ? notificationsResult.value?.notifications || []
                                : [],
                        freshUser:
                            meResult.status === 'fulfilled'
                                ? meResult.value?.user || meResult.value
                                : null,
                        source: {
                            events: eventsResult.status === 'fulfilled',
                            notifications: notificationsResult.status === 'fulfilled',
                            user: meResult.status === 'fulfilled',
                        },
                        determined:
                            eventsResult.status === 'fulfilled' ||
                            notificationsResult.status === 'fulfilled' ||
                            meResult.status === 'fulfilled',
                    });
                },
                CAPABILITIES_TTL,
                options
            );
        },
        [cache, keys, loadEvents, loadMe, loadNotifications, user, userId]
    );

    const invalidate = useCallback((key) => cache.invalidate(key), [cache]);

    useEffect(() => {
        if (!userId) return;
        loadEvents();
        loadNotifications(50);
        loadCapabilities();
        if (user?.isVendor) loadVendorDashboard();
    }, [loadCapabilities, loadEvents, loadNotifications, loadVendorDashboard, user?.isVendor, userId]);

    const value = useMemo(
        () => ({
            cache,
            invalidate,
            loadAttendedEvents,
            loadCapabilities,
            loadEvents,
            loadNotifications,
            loadVendorDashboard,
            sameUserPatch: (patch) => samePatch(user, patch),
        }),
        [cache, invalidate, loadAttendedEvents, loadCapabilities, loadEvents, loadNotifications, loadVendorDashboard, user]
    );

    return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

function useDashboardData() {
    const context = useContext(DashboardDataContext);
    if (!context) throw new Error('Dashboard data hooks must be used inside DashboardDataProvider');
    return context;
}

export function useEvents(params = {}) {
    const { invalidate, loadEvents } = useDashboardData();
    const limit = params.limit ?? 100;
    const offset = params.offset ?? 0;
    const fallback = useMemo(() => [], []);
    const loader = useCallback(
        (options = {}) => loadEvents({ limit, offset }, options),
        [limit, loadEvents, offset]
    );
    const resource = useCachedResource(
        loader,
        fallback
    );

    return {
        ...resource,
        events: resource.data || [],
        invalidate: () => invalidate('events'),
    };
}

export function useAttendedEvents(params = {}) {
    const { invalidate, loadAttendedEvents } = useDashboardData();
    const limit = params.limit ?? 100;
    const offset = params.offset ?? 0;
    const fallback = useMemo(() => [], []);
    const loader = useCallback(
        (options = {}) => loadAttendedEvents({ limit, offset }, options),
        [limit, loadAttendedEvents, offset]
    );
    const resource = useCachedResource(
        loader,
        fallback
    );

    return {
        ...resource,
        events: resource.data || [],
        invalidate: () => invalidate('attended-events'),
    };
}

export function useNotifications(limit = 50, unreadOnly = false) {
    const { invalidate, loadNotifications } = useDashboardData();
    const fallback = useMemo(() => ({ notifications: [], unreadCount: 0 }), []);
    const loader = useCallback(
        (options = {}) => loadNotifications(limit, unreadOnly, options),
        [limit, loadNotifications, unreadOnly]
    );
    const resource = useCachedResource(
        loader,
        fallback
    );

    const data = resource.data || { notifications: [], unreadCount: 0 };
    return {
        ...resource,
        data,
        notifications: data.notifications || [],
        unreadCount: data.unreadCount ?? data.notifications?.filter((item) => !item.readAt).length ?? 0,
        invalidate: () => invalidate('notifications'),
    };
}

export function useVendorDashboard() {
    const { invalidate, loadVendorDashboard } = useDashboardData();
    const loader = useCallback((options = {}) => loadVendorDashboard(options), [loadVendorDashboard]);
    const resource = useCachedResource(
        loader,
        null
    );

    return {
        ...resource,
        invalidate: () => invalidate('vendor'),
    };
}

export function useCapabilities() {
    const { invalidate, loadCapabilities, sameUserPatch } = useDashboardData();
    const { updateUser } = useAuth();
    const fallback = useMemo(() => ({ hasBouncerAccess: false, loading: true, determined: false, source: {} }), []);
    const loader = useCallback((options = {}) => loadCapabilities(options), [loadCapabilities]);
    const resource = useCachedResource(
        loader,
        fallback
    );
    const capabilities = resource.data || { hasBouncerAccess: false, determined: false, source: {} };

    useEffect(() => {
        if (capabilities?.freshUser && !sameUserPatch(capabilities.freshUser)) {
            updateUser(capabilities.freshUser);
        }
    }, [capabilities?.freshUser, sameUserPatch, updateUser]);

    return {
        ...resource,
        capabilities: {
            ...capabilities,
            loading: resource.loading,
        },
        invalidate: () => invalidate('capabilities'),
    };
}
