import { eventsService } from '@/services/events';
import { authService } from '@/services/auth';
import { getNotifications } from '@/services/notifications';

const STAFF_ACCESS_HINT_KEY = 'pxi_staff_access_hint';

/** Per-user hint key — a hint left by one account must never grant UI to another. */
function staffHintKey(userId) {
    return userId ? `${STAFF_ACCESS_HINT_KEY}:${userId}` : STAFF_ACCESS_HINT_KEY;
}

/** Remove all staff-access hints (legacy global key included). Called on logout. */
export function clearStaffAccessHints() {
    if (typeof window === 'undefined') return;
    try {
        const stale = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith(STAFF_ACCESS_HINT_KEY)) stale.push(key);
        }
        stale.forEach((key) => window.localStorage.removeItem(key));
    } catch {
        /* ignore */
    }
}

function normalizeRole(value) {
    return String(value || '').trim().toUpperCase().replace('-', '_');
}

function isStaffConsoleRole(value) {
    const role = normalizeRole(value);
    return (
        role === 'BOUNCER' ||
        role === 'COHOST' ||
        role === 'ADMIN' ||
        role === 'OWNER' ||
        role === 'HOST'
    );
}

function eventHasBouncerRole(event, userId) {
    const directRoles = [
        event?.myRole,
        event?.role,
        event?.userRole,
        event?.albumRole,
        event?.membershipRole,
        event?.inviteRole,
        event?.staffRole,
    ];
    if (directRoles.some((role) => isStaffConsoleRole(role))) return true;

    const ownershipSignals = [
        event?.isHost,
        event?.isOwner,
        event?.isCreator,
        event?.isStaff,
    ];
    if (ownershipSignals.some(Boolean)) return true;

    const ownerIds = [
        event?.creatorId,
        event?.hostId,
        event?.ownerId,
        event?.createdById,
        event?.createdBy?.id,
        event?.creator?.id,
    ];
    if (userId && ownerIds.some((id) => id && String(id) === String(userId))) return true;

    const staffEntries = Array.isArray(event?.staff) ? event.staff : [];
    if (staffEntries.some((entry) => isStaffConsoleRole(entry?.role))) return true;
    if (userId && staffEntries.some((entry) => String(entry?.userId) === String(userId))) return true;

    return false;
}

function hasAcceptedBouncerInvite(notification) {
    if (!notification) return false;
    const role = notification?.data?.role || notification?.data?.inviteRole;
    if (!isStaffConsoleRole(role)) return false;
    const response = String(notification?.data?.inviteResponse || '').toLowerCase();
    return response === 'accepted' || notification?.data?.acceptedAt;
}

function getLocalStaffAccessHint(userId) {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(staffHintKey(userId)) === '1';
}

function userHasStaffAccess(user) {
    if (!user) return false;
    const roleCollections = [
        user?.roles,
        user?.staffRoles,
        user?.eventRoles,
        user?.permissions,
    ];
    if (
        roleCollections
            .flatMap((value) => (Array.isArray(value) ? value : []))
            .some((role) => isStaffConsoleRole(role))
    ) {
        return true;
    }

    const directFlags = [user?.isHost, user?.isEventStaff, user?.isBouncer, user?.isCohost];
    return directFlags.some(Boolean);
}

export async function getDashboardCapabilities(userOrId) {
    const userId = typeof userOrId === 'object' ? userOrId?.id : userOrId;
    if (!userId) {
        return { hasBouncerAccess: false, source: { events: false, notifications: false } };
    }

    const baseUser = typeof userOrId === 'object' ? userOrId : null;

    const [eventsResult, notificationsResult, meResult] = await Promise.allSettled([
        eventsService.getMyEvents({ limit: 100, offset: 0 }),
        getNotifications(userId, 100),
        authService.getMe(userId),
    ]);

    const events = eventsResult.status === 'fulfilled' ? (eventsResult.value?.events || []) : [];
    const notifications =
        notificationsResult.status === 'fulfilled' ? (notificationsResult.value?.notifications || []) : [];

    const freshUser = meResult.status === 'fulfilled' ? (meResult.value?.user || meResult.value) : null;
    const determined = eventsResult.status === 'fulfilled'
        || notificationsResult.status === 'fulfilled'
        || meResult.status === 'fulfilled';

    return resolveDashboardCapabilities({
        user: baseUser,
        userId,
        events,
        notifications,
        freshUser,
        source: {
            events: eventsResult.status === 'fulfilled',
            notifications: notificationsResult.status === 'fulfilled',
            user: meResult.status === 'fulfilled',
        },
        determined,
    });
}

/**
 * Resolve dashboard capabilities from already-fetched data (no network).
 * @param {object} params
 * @param {object} [params.user]
 * @param {string} params.userId
 * @param {object[]} [params.events]
 * @param {object[]} [params.notifications]
 * @param {object} [params.freshUser]
 * @param {object} [params.source]
 * @param {boolean} [params.determined]
 */
export function resolveDashboardCapabilities({
    user,
    userId,
    events = [],
    notifications = [],
    freshUser = null,
    source = {},
    determined = false,
}) {
    const hasBouncerFromEvents = events.some((event) => eventHasBouncerRole(event, userId));
    const hasBouncerFromNotifications = notifications.some((n) => {
        const type = String(n?.type || '').toUpperCase();
        if (type !== 'STAFF_INVITE' && type !== 'ALBUM_INVITE') return false;
        return hasAcceptedBouncerInvite(n);
    });
    const hasBouncerFromUser = userHasStaffAccess(user) || userHasStaffAccess(freshUser);
    const hasBouncerFromServer = hasBouncerFromEvents || hasBouncerFromNotifications || hasBouncerFromUser;

    // The local hint only bridges the gap while nothing could be fetched (offline,
    // cold start). Once a real answer exists, the server wins — including revocation.
    const hasBouncerAccess = hasBouncerFromServer || (!determined && getLocalStaffAccessHint(userId));

    if (typeof window !== 'undefined' && determined) {
        try {
            if (hasBouncerFromServer) {
                window.localStorage.setItem(staffHintKey(userId), '1');
            } else {
                window.localStorage.removeItem(staffHintKey(userId));
                window.localStorage.removeItem(STAFF_ACCESS_HINT_KEY);
            }
        } catch {
            /* ignore */
        }
    }

    return {
        hasBouncerAccess,
        determined,
        source,
        freshUser,
    };
}
