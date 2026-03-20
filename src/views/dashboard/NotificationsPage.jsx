'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, Loader2, X, UserPlus, Settings } from 'lucide-react';
import { getNotifications, acceptInvite, declineInvite, markAllAsRead, hideNotification, hideAllNotifications } from '@/services/notifications';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import { eventsService } from '@/services/events';
import { getTicketQuote, createCheckoutSession, generateTicket } from '@/services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

const formatPrice = (usd, currency = 'USD') => {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—');

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // EULA + checkout state for invite flow
  const [eulaNotification, setEulaNotification] = useState(null);
  const [eulaEvent, setEulaEvent] = useState(null);
  const [quoteTotal, setQuoteTotal] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'mark-all-read' | 'delete-all'
  const settingsRef = useRef(null);

  const loadNotifications = () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getNotifications(user.id)
      .then((res) => setNotifications(res.notifications || []))
      .catch((err) => setError(err.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  // After Stripe Checkout redirect: accept invite and refresh
  useEffect(() => {
    const payment = searchParams.get('payment');
    const notificationId = searchParams.get('notificationId');
    if (payment !== 'success' || !notificationId) return;
    acceptInvite(notificationId)
      .then((res) => {
        loadNotifications();
        if (res?.albumId) router.push('/dashboard/events');
      })
      .catch(() => setJoinError('Accepted, but failed to refresh. Check Events.'))
      .finally(() => router.replace('/dashboard/notifications', { scroll: false }));
  }, [searchParams]);

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
      if (event?.ticketType === 'PAID' && (event?.ticketPrice ?? 0) > 0) {
        getTicketQuote(event.id)
          .then((q) => setQuoteTotal(q.totalForBuyerUsd))
          .catch(() => setQuoteTotal(null));
      }
    } catch (err) {
      setJoinError(err.message || 'Could not load event.');
    }
  };

  const handleEulaConfirm = async () => {
    if (!eulaNotification || !user?.id) return;
    setJoining(true);
    setJoinError(null);
    const eventId = eulaEvent?.id || eulaNotification.data?.eventId;
    const isPaid = eulaEvent?.ticketType === 'PAID' && (eulaEvent?.ticketPrice ?? 0) > 0;

    try {
      if (isPaid) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const successUrl = `${origin}/dashboard/notifications?payment=success&notificationId=${eulaNotification.id}`;
        const cancelUrl = `${origin}/dashboard/notifications?payment=cancelled`;
        const { url } = await createCheckoutSession(eventId, successUrl, cancelUrl);
        setEulaNotification(null);
        setEulaEvent(null);
        if (url) window.open(url, '_blank');
      } else {
        const res = await acceptInvite(eulaNotification.id);
        setEulaNotification(null);
        setEulaEvent(null);
        loadNotifications();
        if (res?.albumId) router.push(`/dashboard/events`);
      }
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  const handleDecline = async (notification) => {
    if (notification.type !== 'ALBUM_INVITE') return;
    try {
      await declineInvite(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (err) {
      setError(err.message || 'Failed to decline');
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    const requestId = notification.data?.requestId;
    if (!requestId) return;
    try {
      await acceptFriendRequest(requestId);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (err) {
      setError(err.message || 'Failed to accept');
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    const requestId = notification.data?.requestId;
    if (!requestId) return;
    try {
      await rejectFriendRequest(requestId);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (err) {
      setError(err.message || 'Failed to reject');
    }
  };

  const handleHide = async (notificationId) => {
    try {
      await hideNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      setError(err.message || 'Failed to hide');
    }
  };

  const handleConfirmMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setConfirmAction(null);
      setSettingsOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to mark all read');
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (!user?.id) return;
    try {
      await hideAllNotifications(user.id);
      setNotifications([]);
      setConfirmAction(null);
      setSettingsOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to delete all');
    }
  };

  useEffect(() => {
    const onOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    if (settingsOpen) {
      document.addEventListener('click', onOutside);
      return () => document.removeEventListener('click', onOutside);
    }
  }, [settingsOpen]);

  const inviteNotifications = notifications.filter((n) => n.type === 'ALBUM_INVITE');
  const friendRequestNotifications = notifications.filter((n) => n.type === 'FRIEND_REQ');
  const otherNotifications = notifications.filter((n) => n.type !== 'ALBUM_INVITE' && n.type !== 'FRIEND_REQ');
  const isPaidInvite = eulaEvent?.ticketType === 'PAID' && (eulaEvent?.ticketPrice ?? 0) > 0;
  const priceDisplay = isPaidInvite
    ? formatPrice(quoteTotal != null ? quoteTotal : eulaEvent?.ticketPrice, eulaEvent?.currency)
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-pxi-purple" />
          <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
        </div>
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Notification settings"
          >
            <Settings size={20} />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 py-1 min-w-[160px] bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-50">
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                onClick={() => { setSettingsOpen(false); setConfirmAction('mark-all-read'); }}
              >
                Mark all read
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-white/5"
                onClick={() => { setSettingsOpen(false); setConfirmAction('delete-all'); }}
              >
                Delete all
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-pxi-purple" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-zinc-500 text-sm">No notifications yet.</p>
      ) : (
        <div className="space-y-4">
          {inviteNotifications.map((n) => (
            <div
              key={n.id}
              className={`relative rounded-2xl border border-white/10 bg-zinc-900/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${!n.isRead ? 'ring-1 ring-pxi-purple/30' : ''}`}
            >
              {!n.isRead && (
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-pxi-purple" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => handleHide(n.id)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-colors z-10"
                aria-label="Hide notification"
              >
                <X size={16} />
              </button>
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus size={16} className="text-pxi-purple flex-shrink-0" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Event invite</span>
                </div>
                <p className="text-white font-semibold truncate">{n.data?.albumName || n.data?.eventName || 'Event'}</p>
                {n.user && (
                  <p className="text-zinc-500 text-sm mt-0.5">
                    from {n.user.name || n.user.username || 'Someone'}
                  </p>
                )}
                <p className="text-zinc-600 text-xs mt-1">{formatDate(n.createdAt)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="neon"
                  className="!py-2 !px-4 !text-xs uppercase tracking-widest"
                  onClick={() => handleJoinClick(n)}
                >
                  Accept
                </Button>
                <button
                  type="button"
                  onClick={() => handleDecline(n)}
                  className="py-2 px-4 rounded-xl border border-white/20 text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {friendRequestNotifications.length > 0 && (
            <div className="space-y-4">
              {friendRequestNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`relative rounded-2xl border border-white/10 bg-zinc-900/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${!n.isRead ? 'ring-1 ring-pxi-purple/30' : ''}`}
                >
                  {!n.isRead && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-pxi-purple" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => handleHide(n.id)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-colors z-10"
                    aria-label="Hide notification"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex-1 min-w-0 pr-8">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Friend request</span>
                    <p className="text-white font-semibold mt-1">{n.user?.name || n.user?.username || 'Someone'}</p>
                    {n.user?.username && (
                      <p className="text-zinc-500 text-sm">@{n.user.username}</p>
                    )}
                    <p className="text-zinc-600 text-xs mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="neon"
                      className="!py-2 !px-4 !text-xs uppercase tracking-widest"
                      onClick={() => handleAcceptFriendRequest(n)}
                    >
                      Accept
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleRejectFriendRequest(n)}
                      className="py-2 px-4 rounded-xl border border-white/20 text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {otherNotifications.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Other activity</p>
              {otherNotifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`relative rounded-xl border border-white/5 bg-zinc-900/50 p-4 mb-2 text-sm text-zinc-400 ${!n.isRead ? 'ring-1 ring-pxi-purple/30' : ''}`}
                >
                  {!n.isRead && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-pxi-purple" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => handleHide(n.id)}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-colors z-10"
                    aria-label="Hide notification"
                  >
                    <X size={14} />
                  </button>
                  <span className="pr-8 inline-block">{n.type} — {formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm modals */}
      {confirmAction === 'mark-all-read' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Mark all as read?</h3>
            <p className="text-zinc-400 text-sm mb-6">All notifications will be marked as read.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkAllRead}
                className="px-4 py-2 rounded-xl bg-pxi-purple text-white text-sm font-medium hover:opacity-90"
              >
                Mark all read
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmAction === 'delete-all' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete all notifications?</h3>
            <p className="text-zinc-400 text-sm mb-6">All notifications will be hidden from this list. They are not removed from the server.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="px-4 py-2 rounded-xl bg-red-500/90 text-white text-sm font-medium hover:bg-red-500"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EULA modal */}
      {eulaNotification && eulaEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !joining && setEulaNotification(null) && setEulaEvent(null)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-pxi-purple text-xs font-bold uppercase tracking-widest mb-1">Heads Up</p>
                <h3 className="text-white text-xl font-black">
                  {isPaidInvite ? 'Get Ticket' : 'Accept Invite'}
                </h3>
              </div>
              <button
                onClick={() => !joining && setEulaNotification(null) && setEulaEvent(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {isPaidInvite
                ? `You're about to purchase a ticket for "${eulaEvent.name}". Photos posted in public events may be used for marketing by the host.${priceDisplay ? ` Total: ${priceDisplay}` : ''}`
                : 'You\'re about to accept this event invite. Photos posted may be visible to other members and the host.'}
            </p>
            {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => !joining && setEulaNotification(null) && setEulaEvent(null)}
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
                {joining ? <Loader2 size={18} className="animate-spin mx-auto" /> : isPaidInvite ? 'Agree & Get Ticket' : 'Agree & Accept'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
