import { eventsService } from '@/services/events';
import { authService } from '@/services/auth';
import { getNotifications } from '@/services/notifications';

const STAFF_ACCESS_HINT_KEY = 'pxi_staff_access_hint';

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

function getLocalStaffAccessHint() {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STAFF_ACCESS_HINT_KEY) === '1';
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

    const hasBouncerFromEvents = events.some((event) => eventHasBouncerRole(event, userId));
    const hasBouncerFromNotifications = notifications.some((n) => {
        const type = String(n?.type || '').toUpperCase();
        if (type !== 'STAFF_INVITE' && type !== 'ALBUM_INVITE') return false;
        return hasAcceptedBouncerInvite(n);
    });
    const freshUser = meResult.status === 'fulfilled' ? (meResult.value?.user || meResult.value) : null;
    const hasBouncerFromUser = userHasStaffAccess(baseUser) || userHasStaffAccess(freshUser);
    const hasBouncerFromLocalHint = getLocalStaffAccessHint();
    const hasBouncerAccess =
        hasBouncerFromEvents || hasBouncerFromNotifications || hasBouncerFromUser || hasBouncerFromLocalHint;

    if (typeof window !== 'undefined' && hasBouncerAccess) {
        try {
            window.localStorage.setItem(STAFF_ACCESS_HINT_KEY, '1');
        } catch {
            /* ignore */
        }
    }
    const determined = eventsResult.status === 'fulfilled'
        || notificationsResult.status === 'fulfilled'
        || meResult.status === 'fulfilled'
        || hasBouncerFromLocalHint;

    return {
        hasBouncerAccess,
        determined,
        source: {
            events: eventsResult.status === 'fulfilled',
            notifications: notificationsResult.status === 'fulfilled',
            user: meResult.status === 'fulfilled',
        },
        freshUser,
    };
}
