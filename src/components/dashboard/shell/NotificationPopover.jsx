'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import { getNotifications, markAllAsRead, markAsRead } from '@/services/notifications';
import { formatNotificationListTime } from '@/lib/notifications/notificationTime';

const LIST_LIMIT = 20;

function isUnread(notification) {
    return !(notification?.isRead || notification?.readAt);
}

/**
 * The top bar's bell. Shows the unread count (fetched once on mount) and opens a panel of the latest
 * notifications (fetched on open). Figma 740:23507.
 */
export default function NotificationPopover({ userId, unreadCount, onUnreadChange }) {
    const router = useRouter();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Unread count once on mount (and when the account changes).
    useEffect(() => {
        if (!userId) return undefined;
        let cancelled = false;
        getNotifications(userId, 50, true)
            .then((res) => {
                if (cancelled) return;
                const count = res?.unreadCount ?? (res?.notifications || []).filter(isUnread).length;
                onUnreadChange?.(count);
            })
            .catch(() => { /* the bell still works without a count */ });
        return () => { cancelled = true; };
        // onUnreadChange is a stable setter from the top bar; only the account matters here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Fetch the list on open.
    useEffect(() => {
        if (!open || !userId) return undefined;
        let cancelled = false;
        const timer = setTimeout(() => {
            if (cancelled) return;
            setLoading(true);
            setError('');
            getNotifications(userId, LIST_LIMIT)
                .then((res) => { if (!cancelled) setNotifications(res?.notifications || []); })
                .catch(() => { if (!cancelled) setError('Could not load notifications.'); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [open, userId]);

    // Outside click and Escape close the panel. The bell sits inside rootRef, so it is not "outside".
    useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const visible = filter === 'unread' ? notifications.filter(isUnread) : notifications;

    const markOneRead = useCallback(async (notification) => {
        if (!notification?.id || !isUnread(notification)) return;
        setNotifications((current) => current.map((item) => (
            item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )));
        onUnreadChange?.((count) => Math.max(0, (typeof count === 'number' ? count : 0) - 1));
        try {
            await markAsRead(notification.id);
        } catch {
            /* the row stays read locally; the next open refetches */
        }
    }, [onUnreadChange]);

    const handleMarkAll = async () => {
        if (!userId) return;
        setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
        onUnreadChange?.(0);
        try {
            await markAllAsRead(userId);
        } catch {
            setError('Could not mark all as read.');
        }
    };

    const openNotification = async (notification) => {
        await markOneRead(notification);
        const albumId = notification?.data?.albumId;
        const eventId = notification?.data?.eventId;
        setOpen(false);
        if (eventId) router.push(`/events/${eventId}`);
        else if (albumId) router.push(`/album/${albumId}`);
    };

    const count = typeof unreadCount === 'number' ? unreadCount : 0;

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
                aria-expanded={open}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-pxi-field text-white/70 transition hover:bg-white/[0.07] hover:text-white"
            >
                <HugeiconsIcon icon={Notification03Icon} size={18} />
                {count > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-pxi-purple px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                        {count > 9 ? '9+' : count}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="dashboard-popover-surface absolute right-0 top-full z-[60] mt-2 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-[1rem] p-3">
                    <div className="flex items-center justify-between gap-3 px-1">
                        <h2 className="text-base font-semibold text-white">Notifications</h2>
                        <button
                            type="button"
                            onClick={handleMarkAll}
                            disabled={!count && !notifications.some(isUnread)}
                            className="text-xs font-semibold text-pxi-purple transition hover:text-white disabled:opacity-40"
                        >
                            Mark all read
                        </button>
                    </div>

                    <SegmentedToggle
                        ariaLabel="Filter notifications"
                        className="mt-3 self-start"
                        value={filter}
                        onChange={setFilter}
                        items={[
                            { value: 'all', label: 'All' },
                            { value: 'unread', label: 'Unread' },
                        ]}
                    />

                    <ul className="dashboard-scrollbar-none mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                        {loading && !notifications.length ? (
                            <li className="px-3 py-6 text-center text-sm text-zinc-500">Loading</li>
                        ) : null}
                        {!loading && !visible.length && !error ? (
                            <li className="px-3 py-6 text-center text-sm text-zinc-500">
                                {filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
                            </li>
                        ) : null}
                        {error ? <li className="px-3 py-3 text-sm text-red-300">{error}</li> : null}
                        {visible.map((notification) => {
                            const unread = isUnread(notification);
                            const name = notification.user?.name || notification.user?.username || 'PXI';
                            return (
                                <li key={notification.id}>
                                    <button
                                        type="button"
                                        onClick={() => openNotification(notification)}
                                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.06] ${
                                            unread ? 'bg-white/[0.04]' : ''
                                        }`}
                                    >
                                        {notification.user?.avatarUrl ? (
                                            <img
                                                src={notification.user.avatarUrl}
                                                alt=""
                                                className="h-9 w-9 shrink-0 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A523EF1f] text-sm font-bold text-pxi-purple">
                                                {name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-sm ${unread ? 'font-semibold text-white' : 'text-zinc-300'}`}>
                                                {notification.title}
                                            </span>
                                            {notification.body ? (
                                                <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-zinc-500">{notification.body}</span>
                                            ) : null}
                                        </span>
                                        <span className="shrink-0 pt-0.5 text-[11px] text-zinc-500">
                                            {formatNotificationListTime(notification.createdAt)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <Link
                        href="/dashboard/notifications"
                        onClick={() => setOpen(false)}
                        className="mt-2 block rounded-full bg-pxi-field px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#3a3a3a]"
                    >
                        Show more
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
