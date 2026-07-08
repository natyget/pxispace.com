'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import SectionCard from '@/components/dashboard/SectionCard';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import NotificationItem from '@/components/notifications/NotificationItem';
import { useAuth } from '@/contexts/AuthContext';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import {
  acceptInvite,
  declineInvite,
  getNotifications,
  hideNotification,
  markAllAsRead,
  markAsRead,
} from '@/services/notifications';
import { buildNotificationSections } from '@/lib/notifications/notificationSections';

function isUnread(notification) {
  return !(notification.isRead || notification.readAt);
}

function normalizeNotification(notification) {
  return {
    ...notification,
    isRead: !isUnread(notification),
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('unread');
  const [busyId, setBusyId] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    getNotifications(userId, 80)
      .then((res) => {
        setNotifications((res?.notifications || []).map(normalizeNotification));
      })
      .catch((err) => setError(err?.message || 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => loadNotifications(), 0);
    return () => clearTimeout(timer);
  }, [loadNotifications]);

  const visibleNotifications = useMemo(() => {
    if (filter === 'read') return notifications.filter((notification) => !isUnread(notification));
    if (filter === 'all') return notifications;
    return notifications.filter(isUnread);
  }, [filter, notifications]);

  const sections = useMemo(() => buildNotificationSections(visibleNotifications), [visibleNotifications]);
  const unreadCount = notifications.filter(isUnread).length;

  const markOneRead = useCallback(async (notification) => {
    if (!notification?.id || !isUnread(notification)) return;
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)),
    );
    try {
      await markAsRead(notification.id);
    } catch {
      loadNotifications();
    }
  }, [loadNotifications]);

  const navigateAlbum = useCallback(async (albumId, _albumName, notificationId) => {
    const notification = notifications.find((item) => item.id === notificationId);
    if (notification) await markOneRead(notification);
    if (albumId) router.push(`/album/${albumId}`);
  }, [markOneRead, notifications, router]);

  const clickMedia = useCallback(async (_mediaId, notification) => {
    await markOneRead(notification);
    const albumId = notification?.data?.albumId;
    router.push(albumId ? `/album/${albumId}` : '/dashboard/notifications');
  }, [markOneRead, router]);

  const clickAlbumCover = useCallback(async (notification) => {
    await markOneRead(notification);
    const eventId = notification?.data?.eventId;
    const albumId = notification?.data?.albumId;
    if (eventId) router.push(`/events/${eventId}`);
    else if (albumId) router.push(`/album/${albumId}`);
  }, [markOneRead, router]);

  const handleAcceptAlbumInvite = async (notificationId) => {
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification) return;
    setBusyId(notificationId);
    setError('');
    try {
      const res = await acceptInvite(notificationId);
      await markOneRead(notification);
      loadNotifications();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('pxi:capabilities-refresh'));
      if (res?.albumId) router.push(`/album/${res.albumId}`);
    } catch (err) {
      setError(err?.message || 'Failed to accept invite.');
    } finally {
      setBusyId('');
    }
  };

  const handleRejectAlbumInvite = async (notificationId) => {
    setBusyId(notificationId);
    setError('');
    try {
      await declineInvite(notificationId);
      loadNotifications();
    } catch (err) {
      setError(err?.message || 'Failed to decline invite.');
    } finally {
      setBusyId('');
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    const requestId = notification?.data?.requestId;
    if (!requestId) return;
    setBusyId(notification.id);
    try {
      await acceptFriendRequest(requestId);
      await markOneRead(notification);
      loadNotifications();
    } catch (err) {
      setError(err?.message || 'Failed to accept friend request.');
    } finally {
      setBusyId('');
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    const requestId = notification?.data?.requestId;
    if (!requestId) return;
    setBusyId(notification.id);
    try {
      await rejectFriendRequest(requestId);
      loadNotifications();
    } catch (err) {
      setError(err?.message || 'Failed to reject friend request.');
    } finally {
      setBusyId('');
    }
  };

  const handleHide = async (notification) => {
    setBusyId(notification.id);
    try {
      await hideNotification(notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    } catch (err) {
      setError(err?.message || 'Failed to delete notification.');
    } finally {
      setBusyId('');
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    setSettingsOpen(false);
    try {
      await markAllAsRead(userId);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })));
      setFilter('all');
    } catch (err) {
      setError(err?.message || 'Failed to mark all read.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="dashboard-surface-b rounded-[1.75rem] px-5 py-6 md:px-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Inbox</p>
            <h1 className="mt-2 text-4xl font-black leading-none text-white md:text-5xl">Notifications</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {unreadCount} unread update{unreadCount === 1 ? '' : 's'} across invites, albums, friends, and account activity.
            </p>
          </div>
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <SegmentedToggle
              value={filter}
              onChange={setFilter}
              ariaLabel="Notification filter"
              items={[
                { value: 'unread', label: 'Unread' },
                { value: 'all', label: 'All' },
                { value: 'read', label: 'Read' },
              ]}
            />
            <button
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
              className="pill-ghost h-10 w-10"
              aria-label="Notification settings"
            >
              <HugeiconsIcon icon={Settings01Icon} size={17} />
            </button>
            {settingsOpen ? (
              <div className="dashboard-popover-surface absolute right-0 top-[calc(100%+8px)] z-30 w-44 rounded-2xl p-2">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-white/85 hover:bg-white/10"
                >
                  Mark all read
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl bg-red-500/10 p-4 text-sm font-semibold text-red-200">{error}</div> : null}

      {loading ? (
        <div className="dashboard-surface flex min-h-[260px] items-center justify-center rounded-3xl text-white/60">
          <HugeiconsIcon icon={Loading02Icon} size={24} className="animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <SectionCard title="All caught up">
          <p className="text-sm leading-relaxed text-white/55">No notifications match this view.</p>
        </SectionCard>
      ) : (
        sections.map((section) => (
          <SectionCard key={section.title} title={section.title} bodyClassName="space-y-3">
            {section.data.map((notification) => (
              <div key={notification.id} className={`relative ${busyId === notification.id ? 'pointer-events-none opacity-60' : ''}`}>
                <NotificationItem
                  notification={notification}
                  onAcceptFriendRequest={handleAcceptFriendRequest}
                  onRejectFriendRequest={handleRejectFriendRequest}
                  onAcceptAlbumInvite={handleAcceptAlbumInvite}
                  onRejectAlbumInvite={handleRejectAlbumInvite}
                  onClickMedia={clickMedia}
                  onClickAlbumCover={clickAlbumCover}
                  onNavigateAlbum={navigateAlbum}
                />
                <button
                  type="button"
                  onClick={() => handleHide(notification)}
                  className="pill-ghost absolute right-3 top-3 h-7 px-3 text-[10px] font-black uppercase tracking-widest"
                >
                  Hide
                </button>
              </div>
            ))}
          </SectionCard>
        ))
      )}
    </div>
  );
}
