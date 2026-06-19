'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon } from '@hugeicons/core-free-icons';
import {
  getNotifications,
  acceptInvite,
  declineInvite,
  markAllAsRead,
  hideNotification,
} from '@/services/notifications';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import { eventsService } from '@/services/events';
import { getTicketQuote, createCheckoutSession } from '@/services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import Button from '@/components/ui/Button';
import NotificationListRow from '@/components/notifications/NotificationListRow';
import ConfirmModal, { ModalCloseButton } from '@/components/notifications/ConfirmModal';
import { SECTION_HEADER_CLASS } from '@/components/notifications/notificationStyles';
import { groupReactionNotificationsByHour } from '@/lib/notifications/groupReactionNotificationsByHour';
import { groupThreadMessageNotificationsByHour } from '@/lib/notifications/groupThreadMessageNotificationsByHour';
import {
  buildNotificationSections,
  notificationIdsForDismiss,
} from '@/lib/notifications/notificationSections';
import { emitNotificationsRefresh } from '@/lib/notificationEvents';

const formatPrice = (usd, currency = 'USD') => {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, saveAuth, updateUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [eulaNotification, setEulaNotification] = useState(null);
  const [eulaEvent, setEulaEvent] = useState(null);
  const [quoteTotal, setQuoteTotal] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [pendingDismissIds, setPendingDismissIds] = useState(null);

  const searchParams = useSearchParams();

  const emitCapabilitiesRefresh = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('pxi:capabilities-refresh'));
  };

  const markStaffAccessHint = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('pxi_staff_access_hint', '1');
    } catch {
      /* ignore */
    }
  };

  const loadNotifications = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getNotifications(user.id)
      .then(async (res) => {
        const list = res.notifications || [];
        setNotifications(list);
        if (list.some((n) => !n.isRead)) {
          try {
            await markAllAsRead(user.id);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            emitNotificationsRefresh();
          } catch (markErr) {
            console.error('Failed to mark notifications read:', markErr);
          }
        }
      })
      .catch((err) => setError(err.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const notificationId = searchParams.get('notificationId');
    if (payment !== 'success' || !notificationId) return;
    acceptInvite(notificationId)
      .then((res) => {
        markStaffAccessHint();
        emitCapabilitiesRefresh();
        loadNotifications();
        if (res?.albumId) router.push('/dashboard/events');
      })
      .catch(() => setJoinError('Accepted, but failed to refresh. Check Events.'))
      .finally(() => router.replace('/dashboard/notifications', { scroll: false }));
  }, [searchParams, loadNotifications, router]);

  const displayNotifications = useMemo(
    () =>
      groupThreadMessageNotificationsByHour(
        groupReactionNotificationsByHour(notifications),
      ),
    [notifications],
  );

  const notificationSections = useMemo(
    () => buildNotificationSections(displayNotifications),
    [displayNotifications],
  );

  const handleStaffInviteAccept = async (notification) => {
    setJoinError(null);
    try {
      const res = await acceptInvite(notification.id);
      markStaffAccessHint();
      if (res?.token && user) {
        try {
          const me = await authService.getMe(user.id);
          const fresh = me?.user || me;
          await saveAuth({ token: res.token, user: fresh || user });
          if (fresh) updateUser(fresh);
        } catch {
          await saveAuth({ token: res.token, user });
        }
      }
      loadNotifications();
      emitCapabilitiesRefresh();
    } catch (err) {
      setJoinError(err?.response?.data?.error || err.message || 'Failed to accept staff invite');
    }
  };

  const handleLineupInviteAccept = async (notification) => {
    setJoinError(null);
    try {
      const res = await acceptInvite(notification.id);
      markStaffAccessHint();
      if (res?.token && user) {
        try {
          const me = await authService.getMe(user.id);
          const fresh = me?.user || me;
          await saveAuth({ token: res.token, user: fresh || user });
          if (fresh) updateUser(fresh);
        } catch {
          await saveAuth({ token: res.token, user });
        }
      }
      loadNotifications();
      emitCapabilitiesRefresh();
    } catch (err) {
      setJoinError(err?.response?.data?.error || err.message || 'Failed to accept line-up invite');
    }
  };

  const handleJoinClick = async (notification) => {
    if (notification.type !== 'ALBUM_INVITE') return;
    setJoinError(null);
    const eventId = notification.data?.eventId;
    if (!eventId) {
      setJoinError('Invalid invite: missing event.');
      return;
    }
    try {
      const res = await eventsService.getEvent(eventId);
      const event = res.event || res;
      setEulaEvent(event);
      setEulaNotification(notification);
      setQuoteTotal(null);
      const inviteRole = notification.data?.inviteRole;
      const isMemberInvite = inviteRole == null || inviteRole === 'MEMBER';
      if (isMemberInvite && event?.ticketType === 'PAID' && (event?.ticketPrice ?? 0) > 0) {
        getTicketQuote(event.id)
          .then((q) => setQuoteTotal(q.totalForBuyerUsd))
          .catch(() => setQuoteTotal(null));
      }
    } catch (err) {
      setJoinError(err.message || 'Could not load event.');
    }
  };

  const handleAcceptAlbumInvite = useCallback(
    (notificationId) => {
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return;
      if (notification.type === 'STAFF_INVITE') {
        void handleStaffInviteAccept(notification);
        return;
      }
      if (notification.type === 'LINEUP_INVITE') {
        void handleLineupInviteAccept(notification);
        return;
      }
      void handleJoinClick(notification);
    },
    [notifications],
  );

  const handleRejectAlbumInvite = useCallback(
    async (notificationId) => {
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return;
      try {
        await declineInvite(notification.id);
        loadNotifications();
      } catch (err) {
        setError(err.message || 'Failed to decline');
      }
    },
    [notifications, loadNotifications],
  );

  const handleEulaConfirm = async () => {
    if (!eulaNotification || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    const eventId = eulaEvent?.id || eulaNotification.data?.eventId;
    const isPaid = eulaEvent?.ticketType === 'PAID' && (eulaEvent?.ticketPrice ?? 0) > 0;
    const inviteRole = eulaNotification?.data?.inviteRole;
    const isMemberInvite = inviteRole == null || inviteRole === 'MEMBER';

    try {
      if (isPaid && isMemberInvite) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const successUrl = `${origin}/dashboard/notifications?payment=success&notificationId=${eulaNotification.id}`;
        const cancelUrl = `${origin}/dashboard/notifications?payment=cancelled`;
        const { url } = await createCheckoutSession(eventId, successUrl, cancelUrl);
        setEulaNotification(null);
        setEulaEvent(null);
        if (url) window.open(url, '_blank');
      } else {
        const res = await acceptInvite(eulaNotification.id);
        markStaffAccessHint();
        setEulaNotification(null);
        setEulaEvent(null);
        emitCapabilitiesRefresh();
        loadNotifications();
        if (res?.albumId) router.push('/dashboard/events');
      }
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  const handleAcceptFriendRequest = async (notificationId, requestId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && n.type === 'FRIEND_REQ'
          ? { ...n, isRead: true, data: { ...n.data, requestDecision: 'accepted' } }
          : n,
      ),
    );
    try {
      await acceptFriendRequest(requestId);
      emitNotificationsRefresh();
    } catch (err) {
      setError(err.message || 'Failed to accept');
      loadNotifications();
    }
  };

  const handleRejectFriendRequest = async (notificationId, requestId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && n.type === 'FRIEND_REQ'
          ? { ...n, isRead: true, data: { ...n.data, requestDecision: 'rejected' } }
          : n,
      ),
    );
    try {
      await rejectFriendRequest(requestId);
      emitNotificationsRefresh();
    } catch (err) {
      setError(err.message || 'Failed to reject');
      loadNotifications();
    }
  };

  const confirmDismiss = async () => {
    if (!pendingDismissIds?.length) return;
    const ids = [...new Set(pendingDismissIds)];
    setPendingDismissIds(null);
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    try {
      await Promise.all(ids.map((id) => hideNotification(id)));
      emitNotificationsRefresh();
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
      loadNotifications();
    }
  };

  const handleNavigateAlbum = useCallback(
    (albumId) => {
      if (albumId) router.push(`/album/${albumId}`);
    },
    [router],
  );

  const handleClickMedia = useCallback(
    (_mediaId, notification) => {
      const albumId = notification.data?.albumId;
      if (albumId) handleNavigateAlbum(albumId);
    },
    [handleNavigateAlbum],
  );

  const handleClickAlbumCover = useCallback(
    (notification) => {
      const eventId = notification.data?.eventId;
      if (eventId) {
        router.push(`/dashboard/events/${eventId}`);
        return;
      }
      const albumId = notification.data?.albumId;
      if (albumId) handleNavigateAlbum(albumId);
    },
    [router, handleNavigateAlbum],
  );

  const eulaInviteRole = eulaNotification?.data?.inviteRole;
  const eulaIsMemberInvite = eulaInviteRole == null || eulaInviteRole === 'MEMBER';
  const isPaidInvite =
    eulaIsMemberInvite && eulaEvent?.ticketType === 'PAID' && (eulaEvent?.ticketPrice ?? 0) > 0;
  const priceDisplay = isPaidInvite
    ? formatPrice(quoteTotal != null ? quoteTotal : eulaEvent?.ticketPrice, eulaEvent?.currency)
    : null;

  const dismissDescription =
    pendingDismissIds?.length > 1
      ? `These ${pendingDismissIds.length} notifications will be permanently removed.`
      : 'This notification will be permanently removed.';

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <h1 className="text-2xl font-black text-white tracking-tight mb-6">Notifications</h1>

      {joinError && !eulaNotification ? (
        <p className="text-red-400 text-sm mb-4">{joinError}</p>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <HugeiconsIcon icon={Loading02Icon} size={32} className="animate-spin text-pxi-purple" />
          <p className="text-zinc-500 text-sm">Loading notifications...</p>
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : displayNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3" aria-hidden>
            📭
          </span>
          <p className="text-white font-bold text-lg">No Notifications</p>
          <p className="text-zinc-500 text-sm mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notificationSections.map((section) => (
            <section key={section.title}>
              <h2 className={SECTION_HEADER_CLASS}>{section.title}</h2>
              <div>
                {section.data.map((notification) => (
                  <NotificationListRow
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => setPendingDismissIds(notificationIdsForDismiss(notification))}
                    onAcceptFriendRequest={handleAcceptFriendRequest}
                    onRejectFriendRequest={handleRejectFriendRequest}
                    onAcceptAlbumInvite={handleAcceptAlbumInvite}
                    onRejectAlbumInvite={handleRejectAlbumInvite}
                    onClickMedia={handleClickMedia}
                    onClickAlbumCover={handleClickAlbumCover}
                    onNavigateAlbum={handleNavigateAlbum}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDismissIds?.length}
        title="Delete notification?"
        description={dismissDescription}
        confirmLabel="Delete"
        confirmClassName="bg-red-500/90 hover:bg-red-500 text-white"
        onClose={() => setPendingDismissIds(null)}
        onConfirm={() => void confirmDismiss()}
      />

      {eulaNotification && eulaEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => !joining && (setEulaNotification(null), setEulaEvent(null))}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-pxi-purple text-xs font-bold uppercase tracking-widest mb-1">Heads Up</p>
                <h3 className="text-white text-xl font-black">
                  {isPaidInvite ? 'Get Ticket' : 'Accept Invite'}
                </h3>
              </div>
              <ModalCloseButton
                disabled={joining}
                onClick={() => {
                  if (!joining) {
                    setEulaNotification(null);
                    setEulaEvent(null);
                  }
                }}
              />
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {isPaidInvite
                ? `You're about to purchase a ticket for "${eulaEvent.name}". Photos posted in public events may be used for marketing by the host.${priceDisplay ? ` Total: ${priceDisplay}` : ''}`
                : "You're about to accept this event invite. Photos posted may be visible to other members and the host."}
            </p>
            {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => !joining && (setEulaNotification(null), setEulaEvent(null))}
                className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5"
              >
                Cancel
              </button>
              <Button
                variant="neon"
                className="flex-1 uppercase tracking-widest py-3"
                onClick={handleEulaConfirm}
                disabled={joining || !isAuthenticated}
              >
                {joining ? (
                  <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin mx-auto" />
                ) : isPaidInvite ? (
                  'Agree & Get Ticket'
                ) : (
                  'Agree & Accept'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
