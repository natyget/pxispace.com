'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon, Loading02Icon, Cancel01Icon, UserAdd01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { getNotifications, acceptInvite, declineInvite, markAllAsRead, hideNotification, hideAllNotifications } from '@/services/notifications';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friends';
import { eventsService } from '@/services/events';
import { getTicketQuote, createCheckoutSession } from '@/services/tickets';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import Button from '@/components/ui/Button';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';

const formatPrice = (usd, currency = 'USD') => {
  if (usd == null) return null;
  const sym = currency === 'EUR' ? '€' : '$';
  return `${sym}${Number(usd).toFixed(2)}`;
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—');

const formatInviteRespondedAt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
};

function senderLabelForInvite(u) {
  if (!u) return 'Someone';
  const n = String(u.name || '').trim();
  if (n) return n;
  const un = String(u.username || '').trim().replace(/^@/, '');
  if (un) return `@${un}`;
  return 'Someone';
}

function lineUpPhraseFromData(data) {
  const sub = String(data?.lineupSubrole || data?.role || '').trim();
  return sub ? `line-up (${sub})` : 'line-up';
}

const mutedInvite = 'text-zinc-300/90';
const boldInvite = 'font-extrabold text-white';

function InviteCardDescription({ notification }) {
  const user = notification.user;
  const data = notification.data || {};
  const sender = senderLabelForInvite(user);

  if (notification.type === 'LINEUP_INVITE') {
    const role = lineUpPhraseFromData(data);
    return (
      <p className={`text-sm leading-relaxed mt-2 ${mutedInvite}`}>
        <span className={boldInvite}>{sender}</span>
        <span> sent you a </span>
        <span className={boldInvite}>{role}</span>
        <span> role invite to you.</span>
      </p>
    );
  }
  if (notification.type === 'STAFF_INVITE') {
    const map = { ADMIN: 'co-host', BOUNCER: 'bouncer', MEMBER: 'featured talent' };
    const role = map[data.role] || 'staff';
    return (
      <p className={`text-sm leading-relaxed mt-2 ${mutedInvite}`}>
        <span className={boldInvite}>{sender}</span>
        <span> sent you a </span>
        <span className={boldInvite}>{role}</span>
        <span> role invite to you.</span>
      </p>
    );
  }
  const ir = data.inviteRole;
  if (!ir) {
    return (
      <p className={`text-sm leading-relaxed mt-2 ${mutedInvite}`}>
        <span className={boldInvite}>{sender}</span>
        <span> sent you an invite to join this event.</span>
      </p>
    );
  }
  if (ir === 'LINEUP') {
    const role = lineUpPhraseFromData(data);
    return (
      <p className={`text-sm leading-relaxed mt-2 ${mutedInvite}`}>
        <span className={boldInvite}>{sender}</span>
        <span> sent you a </span>
        <span className={boldInvite}>{role}</span>
        <span> role invite to you.</span>
      </p>
    );
  }
  const map = { MEMBER: 'member', COHOST: 'co-host', BOUNCER: 'bouncer' };
  const role = map[ir] || String(ir).toLowerCase().replace(/_/g, '-');
  return (
    <p className={`text-sm leading-relaxed mt-2 ${mutedInvite}`}>
      <span className={boldInvite}>{sender}</span>
      <span> sent you a </span>
      <span className={boldInvite}>{role}</span>
      <span> role invite to you.</span>
    </p>
  );
}

function inviteCoverSrc(notification) {
  const raw = notification.data?.coverImage;
  if (raw && String(raw).trim()) return String(raw).trim();
  return 'https://images.unsplash.com/photo-1514525253440-b393452e3383?w=600&q=80';
}

const hideNotifIconBtnClass =
  'absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-zinc-300 hover:text-white hover:bg-black/60 transition-colors z-10';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, saveAuth, updateUser } = useAuth();
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
  const [inboxTab, setInboxTab] = useState('unread'); // 'unread' | 'read'
  const [hideConfirmId, setHideConfirmId] = useState(null);

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
        markStaffAccessHint();
        emitCapabilitiesRefresh();
        loadNotifications();
        if (res?.albumId) router.push('/dashboard/events');
      })
      .catch(() => setJoinError('Accepted, but failed to refresh. Check Events.'))
      .finally(() => router.replace('/dashboard/notifications', { scroll: false }));
  }, [searchParams]);

  const handleStaffInviteAccept = async (notification) => {
    if (notification.type !== 'STAFF_INVITE') return;
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
    if (notification.type !== 'LINEUP_INVITE') return;
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
        if (res?.albumId) router.push(`/dashboard/events`);
      }
    } catch (err) {
      setJoinError(err.message || err.data?.error || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  const handleDecline = async (notification) => {
    if (
      notification.type !== 'ALBUM_INVITE' &&
      notification.type !== 'STAFF_INVITE' &&
      notification.type !== 'LINEUP_INVITE'
    ) {
      return;
    }
    try {
      await declineInvite(notification.id);
      loadNotifications();
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
      setHideConfirmId(null);
      loadNotifications();
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
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
      setConfirmAction(null);
      setSettingsOpen(false);
      loadNotifications();
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

  const tabNotifications = notifications.filter((n) => (inboxTab === 'unread' ? !n.isRead : n.isRead));
  const inviteNotifications = tabNotifications.filter(
    (n) => n.type === 'ALBUM_INVITE' || n.type === 'STAFF_INVITE' || n.type === 'LINEUP_INVITE',
  );
  const friendRequestNotifications = tabNotifications.filter((n) => n.type === 'FRIEND_REQ');
  const otherNotifications = tabNotifications.filter(
    (n) =>
      n.type !== 'ALBUM_INVITE' && n.type !== 'STAFF_INVITE' && n.type !== 'LINEUP_INVITE' && n.type !== 'FRIEND_REQ',
  );
  const eulaInviteRole = eulaNotification?.data?.inviteRole;
  const eulaIsMemberInvite = eulaInviteRole == null || eulaInviteRole === 'MEMBER';
  const isPaidInvite =
    eulaIsMemberInvite && eulaEvent?.ticketType === 'PAID' && (eulaEvent?.ticketPrice ?? 0) > 0;
  const priceDisplay = isPaidInvite
    ? formatPrice(quoteTotal != null ? quoteTotal : eulaEvent?.ticketPrice, eulaEvent?.currency)
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={Notification03Icon} size={24} className="text-pxi-purple" />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
            <p className="text-zinc-500 text-sm mt-1">Invites, approvals, and account activity.</p>
          </div>
        </div>
        <div className="relative flex items-center gap-2" ref={settingsRef}>
          <DataSourceBadge source="Live" />
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Notification settings"
          >
            <HugeiconsIcon icon={Settings01Icon} size={20} />
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

      <div className="flex rounded-full bg-zinc-800/90 border border-white/10 p-1 mb-6">
        {['unread', 'read'].map((t) => {
          const active = inboxTab === t;
          const label = t === 'unread' ? 'Unread' : 'Read';
          return (
            <button
              key={t}
              type="button"
              onClick={() => setInboxTab(t)}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${
                active ? 'bg-pxi-purple text-white shadow-lg shadow-purple-900/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <HugeiconsIcon icon={Loading02Icon} size={32} className="animate-spin text-pxi-purple" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-zinc-500 text-sm">No notifications yet.</p>
      ) : tabNotifications.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          {inboxTab === 'unread' ? 'No unread notifications.' : 'No read notifications yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {inviteNotifications.map((n) => {
            const respondedAt = formatInviteRespondedAt(n.data?.inviteRespondedAt);
            return (
            <div
              key={n.id}
              className={`relative rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden flex flex-row items-stretch min-h-[120px] ${
                !n.isRead ? 'border-l-4 border-l-pxi-purple' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setHideConfirmId(n.id)}
                className={hideNotifIconBtnClass}
                aria-label="Delete notification"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </button>
              <div className="flex-1 min-w-0 p-5 pr-11 flex flex-col justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {n.type === 'ALBUM_INVITE' ? (
                      <>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_rgba(210,72,249,0.45)] ${
                            n.data?.albumType === 'public' ? 'bg-fuchsia-400' : 'bg-white'
                          }`}
                          aria-hidden
                        />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                          {n.data?.albumType === 'public' ? 'PUBLIC' : 'PRIVATE'} · {formatDate(n.createdAt)}
                        </span>
                      </>
                    ) : n.type === 'LINEUP_INVITE' ? (
                      <>
                        <HugeiconsIcon icon={UserAdd01Icon} size={14} className="text-pxi-purple flex-shrink-0" aria-hidden />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                          Line-up invite · {formatDate(n.createdAt)}
                        </span>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={UserAdd01Icon} size={14} className="text-pxi-purple flex-shrink-0" aria-hidden />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                          Co-host / staff invite · {formatDate(n.createdAt)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-white font-bold text-xl tracking-tight truncate leading-snug">
                    {n.data?.albumName || n.data?.eventName || 'Event'}
                  </p>
                  <InviteCardDescription notification={n} />
                </div>
                {n.data?.inviteResponse ? (
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      n.data.inviteResponse === 'declined' ? 'text-red-300/90' : 'text-emerald-300/90'
                    }`}
                  >
                    {n.data.inviteResponse === 'declined'
                      ? `You declined this invite${respondedAt ? ` on ${respondedAt}` : ''}.`
                      : `You accepted this invite${respondedAt ? ` on ${respondedAt}` : ''}.`}
                  </p>
                ) : (
                  <div className="flex flex-row items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (n.type === 'STAFF_INVITE') return handleStaffInviteAccept(n);
                        if (n.type === 'LINEUP_INVITE') return handleLineupInviteAccept(n);
                        return handleJoinClick(n);
                      }}
                      className="rounded-md bg-pxi-purple text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(n)}
                      className="rounded-md border border-white/30 bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/85 hover:bg-white/5"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
              <div className="relative w-24 sm:w-28 flex-shrink-0 self-stretch bg-zinc-800">
                <img
                  src={inviteCoverSrc(n)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          );
          })}

          {friendRequestNotifications.length > 0 && (
            <div className="space-y-4">
              {friendRequestNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`relative rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden flex flex-col min-h-[100px] ${
                    !n.isRead ? 'border-l-4 border-l-pxi-purple' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setHideConfirmId(n.id)}
                    className={hideNotifIconBtnClass}
                    aria-label="Delete notification"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                  <div className="flex-1 min-w-0 p-5 pr-11 flex flex-col justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Friend request · {formatDate(n.createdAt)}
                      </span>
                      <p className="text-white font-bold text-xl tracking-tight leading-snug">
                        {n.user?.name || n.user?.username || 'Someone'}
                      </p>
                      {n.user?.username && <p className="text-zinc-400 text-sm">@{n.user.username}</p>}
                    </div>
                    <div className="flex flex-row items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAcceptFriendRequest(n)}
                        className="rounded-md bg-pxi-purple text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectFriendRequest(n)}
                        className="rounded-md border border-white/30 bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/85 hover:bg-white/5"
                      >
                        Reject
                      </button>
                    </div>
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
                  className={`relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900/50 p-4 mb-2 text-sm text-zinc-400 ${
                    !n.isRead ? 'border-l-4 border-l-pxi-purple' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setHideConfirmId(n.id)}
                    className={hideNotifIconBtnClass}
                    aria-label="Delete notification"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                  <span className="pr-8 inline-block">{n.type} — {formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {hideConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setHideConfirmId(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete notification?</h3>
            <p className="text-zinc-400 text-sm mb-6">This notification will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setHideConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleHide(hideConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-500/90 text-white text-sm font-medium hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
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
            <p className="text-zinc-400 text-sm mb-6">All notifications will be permanently deleted.</p>
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
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
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
                {joining ? <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin mx-auto" /> : isPaidInvite ? 'Agree & Get Ticket' : 'Agree & Accept'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
