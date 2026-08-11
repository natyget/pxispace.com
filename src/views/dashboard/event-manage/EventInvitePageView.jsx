'use client';

/* global process */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, CheckmarkBadge01Icon, HelpCircleIcon, Loading02Icon, Location01Icon, QrCodeIcon, Search01Icon, SentIcon, Share01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { eventsService, searchUsers } from '@/services/events';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManage } from './EventManageContext';
import { eventShareLead, shareMessageWithUrl } from '@/lib/shareCopy';
import { shareEventQrImage, shareEventToInstagramStory } from '@/lib/inviteShare';
import { trackInviteSend, trackShare } from '@/lib/analytics';
import UserAvatar from '@/components/ui/UserAvatar';

const LINEUP_ROLE_MAX_LEN = 80;

const ROLE_TABS = [
  { key: 'member', label: 'Member' },
  { key: 'cohost', label: 'Co-host' },
  { key: 'bouncer', label: 'Bouncer' },
  { key: 'lineup', label: 'Line-up' },
];

function getPublicEventUrl(id) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pxispace.com').replace(/\/$/, '');
  return `${base}/events/${id}`;
}

function resolveInviteRsvpState(userId, memberIds, inviteByUserId) {
  if (memberIds.has(userId)) return 'coming';
  const inv = inviteByUserId.get(userId);
  if (!inv) return 'none';
  if (inv.status === 'PENDING') return 'pending';
  if (inv.status === 'ACCEPTED') return 'coming';
  return 'pass';
}

function formatStoredInviteRole(inviteRole, lineupSubrole) {
  if (inviteRole === 'LINEUP') return `Line-up · ${lineupSubrole?.trim() || 'Line up'}`;
  if (inviteRole === 'COHOST') return 'Co-host';
  if (inviteRole === 'BOUNCER') return 'Bouncer';
  return 'Member';
}

function formatInviteWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export default function EventInvitePageView({ initialTab = 'send', showTabs = true }) {
  const { user } = useAuth();
  const { event, eventId, albumId, participants, reloadParticipants, reloadFeaturedPeople, isPast } =
    useEventManage();

  // Tabs
  const [invitePageTab, setInvitePageTab] = useState(initialTab);

  // Search
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Role
  const [inviteRoleKind, setInviteRoleKind] = useState('member');
  const [lineupSubDraft, setLineupSubDraft] = useState('');

  // Candidates
  const [audienceCandidates, setAudienceCandidates] = useState([]);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [listFilter, setListFilter] = useState('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Send state
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Share / QR
  const [showQR, setShowQR] = useState(false);

  // Status tab
  const [inviteStatusSegment, setInviteStatusSegment] = useState('pending');
  const [directInvites, setDirectInvites] = useState([]);
  const [directInvitesLoading, setDirectInvitesLoading] = useState(false);
  const [directInvitesError, setDirectInvitesError] = useState(null);
  const [inviteActionBusyId, setInviteActionBusyId] = useState(null);

  const memberUserIds = useMemo(
    () => new Set((participants || []).map((p) => p.userId)),
    [participants],
  );

  const inviteByUserId = useMemo(() => {
    const map = new Map();
    (directInvites || []).forEach((inv) => {
      if (inv.user?.id) map.set(inv.user.id, inv);
    });
    return map;
  }, [directInvites]);

  const isSearchMode = inviteQuery.trim().length >= 2;

  // ── Load direct invites ────────────────────────────────────────────────────
  const loadDirectInvites = useCallback(async () => {
    if (!albumId) return;
    setDirectInvitesLoading(true);
    setDirectInvitesError(null);
    try {
      const data = await eventsService.getAlbumDirectInvites(albumId);
      setDirectInvites(data.invites || []);
    } catch (err) {
      setDirectInvitesError(err?.message || 'Could not load invites');
      setDirectInvites([]);
    } finally {
      setDirectInvitesLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    if (!albumId) return undefined;
    const timer = setTimeout(() => loadDirectInvites(), 0);
    return () => clearTimeout(timer);
  }, [albumId, loadDirectInvites]);

  useEffect(() => {
    if (invitePageTab !== 'status' || !albumId) return undefined;
    const timer = setTimeout(() => loadDirectInvites(), 0);
    return () => clearTimeout(timer);
  }, [invitePageTab, albumId, loadDirectInvites]);

  const statusCounts = useMemo(() => {
    let pending = 0, accepted = 0, declined = 0;
    directInvites.forEach((inv) => {
      const s = inv.status === 'DECLINED' ? 'DECLINED' : inv.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
      if (s === 'DECLINED') declined++;
      else if (s === 'ACCEPTED') accepted++;
      else pending++;
    });
    return { pending, accepted, declined };
  }, [directInvites]);

  const filteredByStatusSegment = useMemo(() => {
    const want = inviteStatusSegment === 'accepted' ? 'ACCEPTED' : inviteStatusSegment === 'rejected' ? 'DECLINED' : 'PENDING';
    return directInvites.filter((inv) => {
      const s = inv.status === 'DECLINED' ? 'DECLINED' : inv.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
      return s === want;
    });
  }, [directInvites, inviteStatusSegment]);

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    const q = inviteQuery.trim();
    if (q.length < 2) {
      const timer = setTimeout(() => setInviteResults([]), 0);
      return () => clearTimeout(timer);
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setInviteSearching(true);
      searchUsers(q)
        .then((res) => setInviteResults(res.results || []))
        .catch(() => setInviteResults([]))
        .finally(() => setInviteSearching(false));
    }, 250);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [inviteQuery]);

  // ── Load audience candidates ───────────────────────────────────────────────
  useEffect(() => {
    if (!event || !albumId || !user?.id) return;
    let active = true;
    const run = async () => {
      setLoadingAudience(true);
      try {
        const currentSet = new Set(participants.map((p) => p.userId));
        const map = new Map();
        const add = (c) => {
          if (!c?.id || !c?.username) return;
          if (c.id === user.id || currentSet.has(c.id) || map.has(c.id)) return;
          map.set(c.id, c);
        };

        const friendsRes = await eventsService.getFriends(user.id);
        (friendsRes.friends || []).forEach((f) =>
          add({ id: f.id, username: f.username, name: f.name, avatarUrl: f.avatarUrl, source: 'friend' })
        );

        if (event.visibility === 'PUBLIC') {
          const mine = await eventsService.getMyEvents({ limit: 100, offset: 0 });
          await Promise.all(
            (mine.events || [])
              .filter((e) => e.id !== event.id)
              .map(async (e) => {
                const prevAlbumId = e.albumId || e.albums?.[0]?.id;
                if (!prevAlbumId) return;
                try {
                  const res = await eventsService.getAlbumParticipants(prevAlbumId);
                  (res.participants || []).forEach((p) => {
                    const username = String(p.username || '').replace(/^@/, '');
                    if (!username) return;
                    add({ id: p.userId, username, name: p.username, avatarUrl: p.avatarUrl, source: 'attendee' });
                  });
                } catch { /* best effort */ }
              })
          );
        }

        (inviteResults || []).forEach((u) =>
          add({ id: u.id, username: u.username, name: u.name, avatarUrl: u.avatarUrl, source: 'search' })
        );

        if (active) setAudienceCandidates(Array.from(map.values()));
      } catch {
        if (active) setAudienceCandidates([]);
      } finally {
        if (active) setLoadingAudience(false);
      }
    };
    run();
    return () => { active = false; };
  }, [event, albumId, user?.id, participants, inviteResults]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    const base = isSearchMode
      ? inviteResults.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          avatarUrl: u.avatarUrl,
          source: 'search',
        }))
      : audienceCandidates;
    return base.filter((u) => {
      if (listFilter === 'attendees') return u.source === 'attendee';
      if (listFilter === 'friends') return u.source === 'friend';
      if (!isSearchMode) {
        const state = resolveInviteRsvpState(u.id, memberUserIds, inviteByUserId);
        if (state !== 'none') return false;
      }
      return true;
    });
  }, [audienceCandidates, inviteResults, isSearchMode, listFilter, memberUserIds, inviteByUserId]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // All selected users (from full candidate pool, not just visible)
  const selectedUsers = useMemo(() => {
    const seen = new Map();
    audienceCandidates.forEach((u) => { if (selectedIds.has(u.id)) seen.set(u.id, u); });
    inviteResults.forEach((u) => { if (selectedIds.has(u.id) && !seen.has(u.id)) seen.set(u.id, { ...u, source: 'search' }); });
    return Array.from(seen.values());
  }, [audienceCandidates, inviteResults, selectedIds]);

  const roleLabel = (kind, sub) => {
    if (kind === 'cohost') return 'Co-host';
    if (kind === 'bouncer') return 'Bouncer';
    if (kind === 'lineup') return `Line-up · ${sub || 'Line up'}`;
    return 'Member';
  };

  // ── Share handlers ─────────────────────────────────────────────────────────
  const handleShareLink = async () => {
    if (!eventId) return;
    const url = getPublicEventUrl(eventId);
    const title = event?.name || 'PXI Event';
    const text = eventShareLead(title, 'invite');
    const message = shareMessageWithUrl(text, url);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        trackShare({ method: 'native_share', contentType: 'event', itemId: eventId });
      } catch { /* dismissed — no share happened, so nothing to report */ }
    } else {
      await navigator.clipboard.writeText(message).catch(() => {});
      toast.success('Link copied to clipboard');
      trackShare({ method: 'copy_link', contentType: 'event', itemId: eventId });
    }
  };

  const handleIGShare = async () => {
    if (!eventId) return;
    const title = event?.name || 'PXI Event';
    try {
      const method = await shareEventToInstagramStory(eventId, title, {
        coverImageUrl: event?.coverImage,
        scrapbookThumbUrl: event?.scrapbookThumbnails?.[0],
      });
      trackShare({ method, contentType: 'event_story', itemId: eventId });
    } catch {
      toast.success('Link copied — open Instagram and paste in your Story');
    }
  };

  const handleShareQr = async () => {
    if (!eventId) return;
    try {
      const method = await shareEventQrImage(eventId, event?.name);
      toast.success('QR image ready to share');
      trackShare({ method, contentType: 'event_qr', itemId: eventId });
    } catch {
      toast.error('Could not share QR code');
    }
  };

  const handleInviteAction = async (person, state) => {
    if (!albumId || !eventId) return;
    setInviteActionBusyId(person.id);
    try {
      if (state === 'pending') {
        const inv = inviteByUserId.get(person.id);
        if (!inv) return;
        await eventsService.cancelAlbumDirectInvite(albumId, inv.id);
        toast.success('Invite cancelled');
        await loadDirectInvites();
        return;
      }
      if (state === 'pass') {
        await eventsService.inviteAlbumUser(albumId, person.username, { role: 'member' });
        toast.success(`Resent invite to @${person.username}`);
        await loadDirectInvites();
        return;
      }
      if (state === 'coming') {
        await eventsService.removeMember(albumId, person.id);
        toast.success('Guest removed');
        reloadParticipants();
        await loadDirectInvites();
      }
    } catch {
      toast.error('Could not update invitation');
    } finally {
      setInviteActionBusyId(null);
    }
  };

  // ── Send invites ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!albumId || selectedUsers.length === 0) return;
    setConfirmOpen(false);
    setSending(true);
    setSendError(null);
    const failed = [];
    const lineupSubrole =
      inviteRoleKind === 'lineup'
        ? (lineupSubDraft.trim() || 'Line up').slice(0, LINEUP_ROLE_MAX_LEN)
        : undefined;
    for (const d of selectedUsers) {
      try {
        if (inviteRoleKind === 'cohost') {
          await eventsService.inviteStaff(eventId, d.username, 'co-host');
        } else if (inviteRoleKind === 'bouncer') {
          await eventsService.inviteStaff(eventId, d.username, 'bouncer');
        } else if (inviteRoleKind === 'lineup') {
          await eventsService.inviteAlbumUser(albumId, d.username, { role: 'lineup', lineupSubrole: lineupSubrole || 'Line up' });
        } else {
          await eventsService.inviteAlbumUser(albumId, d.username, { role: 'member' });
        }
      } catch {
        failed.push(d.username);
      }
    }
    setSending(false);
    setSelectedIds(new Set());

    // Count what actually landed, not what was selected.
    const sent = selectedUsers.length - failed.length;
    if (sent > 0) {
      trackInviteSend({
        eventId,
        eventTitle: event?.name,
        channel: 'in_app',
        inviteCount: sent,
      });
    }

    await reloadParticipants();
    reloadFeaturedPeople();
    await loadDirectInvites();
    if (failed.length > 0) {
      setSendError(`Some invites failed: ${failed.map((u) => `@${u}`).join(', ')}`);
    } else {
      toast.success(`Sent ${selectedUsers.length} invite${selectedUsers.length > 1 ? 's' : ''}`);
    }
  };

  if (!albumId) {
    return (
      <div className="rounded-2xl bg-white/[0.04] p-6 text-sm text-zinc-400">
        <p>No album linked to this event.</p>
        <Link href={`/dashboard/events/${eventId}`} className="mt-4 inline-block text-xs font-bold tracking-[0.02em] text-white/60 hover:text-white">
          Details
        </Link>
      </div>
    );
  }

  const publicUrl = eventId ? getPublicEventUrl(eventId) : '';
  const displayUrl = publicUrl.replace(/^https?:\/\//, '');
  const currentRoleLabel = roleLabel(inviteRoleKind, lineupSubDraft);

  // Finalized scrapbook (event passed + grace over): inviting is closed server-side,
  // so hide the send affordances and keep the read-only status view.
  const isFinalized = event?.effectiveStatus === 'ARCHIVED';
  const activeInviteTab = isFinalized ? 'status' : invitePageTab;

  return (
    <div className="space-y-5">
      {/* Page tabs */}
      {showTabs ? <div role="tablist" className="dashboard-segmented-toggle w-full">
        {[
          ...(isFinalized ? [] : [{ id: 'send', icon: <HugeiconsIcon icon={SentIcon} size={14} />, label: 'Send invites' }]),
          { id: 'status', icon: <HugeiconsIcon icon={HelpCircleIcon} size={14} />, label: 'Invite status' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeInviteTab === t.id}
            onClick={() => setInvitePageTab(t.id)}
            className="dashboard-segmented-toggle__item"
            data-active={activeInviteTab === t.id}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div> : null}

      {isFinalized ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-bold tracking-[0.02em] text-zinc-500">
          Scrapbook — finalized · this event has ended, invites are closed
        </p>
      ) : null}

      {/* ── Send tab ─────────────────────────────────────────────────────── */}
      {activeInviteTab === 'send' && !isFinalized && (
        <section role="tabpanel" className="glass-panel overflow-hidden rounded-2xl">

          {/* Event hero */}
          {event && (
            <div className="px-5 pt-5 pb-4">
              <h2 className="mb-2 text-3xl font-black leading-tight text-white">
                {event.name}
              </h2>
              <div className="flex flex-wrap gap-4">
                {event.startDate && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                    <HugeiconsIcon icon={Calendar01Icon} size={12} />
                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate max-w-xs">
                    <HugeiconsIcon icon={Location01Icon} size={12} />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Share row */}
          {eventId && (
            <div className="flex gap-2 px-4 py-3">
              {/* Share link */}
              <button
                type="button"
                onClick={handleShareLink}
                className="flex flex-1 items-center justify-between gap-2 rounded-xl bg-white/[0.045] px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.07]"
              >
                <div className="min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.02em] text-zinc-500 mb-0.5">TAP TO SHARE</p>
                  <p className="text-xs font-medium text-white truncate">{displayUrl}</p>
                </div>
                <HugeiconsIcon icon={Share01Icon} size={16} className="text-zinc-500 shrink-0" />
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleIGShare}
                className="rounded-xl overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(180deg, #833ab4, #fd1d1d, #fcb045)' }}
              >
                <div className="flex flex-col items-center justify-center gap-1 px-3.5 py-2.5 h-full">
                  <span className="text-[9px] font-bold tracking-[0.02em] text-white">STORY</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
                  </svg>
                </div>
              </button>

              {/* QR code */}
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="flex w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-white/[0.045] py-2.5 transition-colors hover:bg-white/[0.07]"
              >
                <span className="text-[9px] font-bold tracking-[0.02em] text-white">SCAN</span>
                <HugeiconsIcon icon={QrCodeIcon} size={20} className="text-white" />
              </button>
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Role pill tabs */}
            <div className="flex gap-2">
              {ROLE_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setInviteRoleKind(key)}
                  className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${
                    inviteRoleKind === key
                      ? 'bg-white text-black'
                      : 'bg-white/[0.055] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Lineup subrole input */}
            {inviteRoleKind === 'lineup' && (
              <input
                type="text"
                value={lineupSubDraft}
                onChange={(e) => setLineupSubDraft(e.target.value.slice(0, LINEUP_ROLE_MAX_LEN))}
                placeholder="Line-up label (e.g. DJ, MC...)"
                className="glass-field w-full rounded-full px-4 py-2.5 text-sm text-white placeholder-white/35"
                autoComplete="off"
              />
            )}

            {/* Search */}
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                placeholder="Search username..."
                className="glass-field w-full rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/35"
                autoComplete="off"
              />
              {inviteSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin text-zinc-500" />
                </div>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'attendees', label: 'OG Attendees' },
                { id: 'friends', label: 'All Friends' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setListFilter(listFilter === f.id ? 'all' : f.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    listFilter === f.id
                      ? 'bg-white text-black'
                      : 'bg-white/[0.055] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {listFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setListFilter('all')}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={12} /> Clear
                </button>
              )}
            </div>

            {/* Section label */}
            <p className="text-xs font-bold text-zinc-500 tracking-[0.02em]">
              {isSearchMode
                ? 'Search results'
                : listFilter === 'attendees'
                  ? 'OG Attendees'
                  : listFilter === 'friends'
                    ? 'Friends'
                    : 'Not yet invited'}
            </p>

            {/* User list */}
            {loadingAudience ? (
              <div className="py-10 flex justify-center">
                <HugeiconsIcon icon={Loading02Icon} size={22} className="animate-spin text-zinc-500" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                {inviteSearching ? 'Searching...'
                  : listFilter === 'attendees' ? 'No past attendees found.'
                  : listFilter === 'friends' ? 'No friends found.'
                  : 'No users found.'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredCandidates.slice(0, 20).map((c) => {
                  const selected = selectedIds.has(c.id);
                  const rsvpState = resolveInviteRsvpState(c.id, memberUserIds, inviteByUserId);
                  const busy = inviteActionBusyId === c.id;

                  if (isSearchMode && rsvpState !== 'none') {
                    const tagLabel =
                      rsvpState === 'pending' ? 'Pending' : rsvpState === 'coming' ? 'Coming' : 'Pass';
                    const actionLabel =
                      rsvpState === 'pending' ? 'Cancel' : rsvpState === 'coming' ? 'Remove' : 'Resend';
                    return (
                      <div
                        key={c.id}
                        className="w-full flex items-center gap-3 py-2.5 rounded-xl px-1"
                      >
                        <UserAvatar user={c} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold truncate">{c.name || c.username}</p>
                          <p className="text-xs text-zinc-500 truncate">@{c.username}</p>
                        </div>
                        <button
                          type="button"
                          disabled={busy || isPast}
                          onClick={() => handleInviteAction(c, rsvpState)}
                          className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition-colors ${
                            rsvpState === 'pending'
                              ? 'bg-amber-500/10 text-amber-100'
                              : rsvpState === 'coming'
                                ? 'bg-emerald-500/10 text-emerald-100'
                                : 'bg-white/[0.08] text-zinc-200'
                          } disabled:opacity-50`}
                        >
                          {busy ? '...' : `${tagLabel} · ${actionLabel}`}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleSelect(c.id)}
                      className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors rounded-xl px-1"
                    >
                      <UserAvatar user={c} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{c.name || c.username}</p>
                        <p className="text-xs text-zinc-500 truncate">@{c.username}</p>
                      </div>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                        selected ? 'bg-white' : 'bg-white/[0.075]'
                      }`}>
                        {selected
                          ? <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} strokeWidth={3} className="text-black" />
                          : <HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={2.5} className="text-zinc-400" />
                        }
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {sendError && <p className="text-sm text-red-400">{sendError}</p>}
          </div>

          {/* Floating send bar — appears when ≥1 user selected */}
          {selectedIds.size > 0 && (
            <div className="sticky bottom-0 left-0 right-0 bg-zinc-950/95 p-4 backdrop-blur">
              <button
                type="button"
                disabled={sending}
                onClick={() => setConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black text-sm font-bold tracking-wide disabled:opacity-50 hover:brightness-95 transition-all"
              >
                {sending
                  ? <><HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin" /> Sending...</>
                  : `Send Invite${selectedIds.size > 1 ? 's' : ''} · ${selectedIds.size}`
                }
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Status tab ───────────────────────────────────────────────────── */}
      {activeInviteTab === 'status' && (
        <section role="tabpanel" className="glass-panel overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h2 className="font-bold text-white tracking-[0.02em] text-sm">Direct invites</h2>
            <button
              type="button"
              disabled={directInvitesLoading}
              onClick={loadDirectInvites}
              className="rounded-xl bg-white/[0.055] px-3 py-2 text-xs font-bold tracking-[0.02em] text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {[
              { id: 'pending', label: 'Pending', count: statusCounts.pending },
              { id: 'accepted', label: 'Accepted', count: statusCounts.accepted },
              { id: 'rejected', label: 'Rejected', count: statusCounts.declined },
            ].map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => setInviteStatusSegment(seg.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-[0.02em] transition-colors ${
                  inviteStatusSegment === seg.id
                    ? 'bg-white text-black'
                    : 'bg-white/[0.055] text-zinc-400 hover:bg-white/[0.08]'
                }`}
              >
                {seg.label} <span className="tabular-nums text-zinc-500">({seg.count})</span>
              </button>
            ))}
          </div>

          <div className="p-5 min-h-48">
            {directInvitesLoading ? (
              <div className="py-16 flex justify-center">
                <HugeiconsIcon icon={Loading02Icon} size={24} className="animate-spin text-zinc-400" />
              </div>
            ) : directInvitesError ? (
              <p className="text-sm text-red-400">{directInvitesError}</p>
            ) : filteredByStatusSegment.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                No {inviteStatusSegment === 'rejected' ? 'rejected' : inviteStatusSegment} invites.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredByStatusSegment.map((inv) => {
                  const handle = String(inv.user?.username || '').trim();
                  return (
                    <li key={inv.id} className="flex flex-col gap-2 rounded-xl bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={inv.user} size={34} />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {handle ? `@${handle}` : inv.user?.id}
                            {inv.user?.name && <span className="text-zinc-500 font-normal"> · {inv.user.name}</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {formatStoredInviteRole(inv.inviteRole, inv.lineupSubrole)}
                          </p>
                        </div>
                      </div>
                      <dl className="text-xs text-zinc-500 sm:text-right shrink-0 space-y-0.5">
                        <div>
                          <dt className="inline font-bold tracking-wider text-zinc-600 mr-1">Sent</dt>
                          <dd className="inline">{formatInviteWhen(inv.createdAt)}</dd>
                        </div>
                        {inviteStatusSegment === 'accepted' && inv.acceptedAt && (
                          <div>
                            <dt className="inline font-bold tracking-wider text-zinc-600 mr-1">Accepted</dt>
                            <dd className="inline">{formatInviteWhen(inv.acceptedAt)}</dd>
                          </div>
                        )}
                        {inviteStatusSegment === 'rejected' && inv.rejectedAt && (
                          <div>
                            <dt className="inline font-bold tracking-wider text-zinc-600 mr-1">Declined</dt>
                            <dd className="inline">{formatInviteWhen(inv.rejectedAt)}</dd>
                          </div>
                        )}
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ── QR code modal ────────────────────────────────────────────────── */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-6"
          onClick={() => setShowQR(false)}
        >
          <div
            className="flex flex-col items-center gap-4 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-2xl font-black text-white text-center leading-tight">{event?.name}</p>
            <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Scan to RSVP</p>
            <div className="rounded-3xl bg-white p-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}&bgcolor=ffffff&color=000000&margin=0`}
                alt="QR code"
                width={220}
                height={220}
                className="block"
              />
            </div>
            <button
              type="button"
              onClick={handleShareQr}
              className="flex items-center gap-2 rounded-full bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              <HugeiconsIcon icon={Share01Icon} size={14} /> Share QR
            </button>
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="text-xs font-bold tracking-[0.02em] text-zinc-500 hover:text-zinc-300 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm modal ────────────────────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="dashboard-popover-surface w-full max-w-sm space-y-4 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white tracking-[0.02em]">Send Invitations</h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Send <span className="font-bold text-white">{currentRoleLabel}</span> invite{selectedUsers.length > 1 ? 's' : ''} to {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}?
            </p>

            {/* Avatar stack */}
            <div className="flex items-center py-1">
              {selectedUsers.slice(0, 7).map((u, i) => (
                <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }} className="relative border-2 border-zinc-900 rounded-full">
                  <UserAvatar user={u} size={36} />
                </div>
              ))}
              {selectedUsers.length > 7 && (
                <div style={{ marginLeft: -10 }} className="w-9 h-9 rounded-full border-2 border-zinc-900 bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                  +{selectedUsers.length - 7}
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="pill-ghost flex-1 py-3.5 text-sm font-bold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSend}
                className="flex-1 py-3.5 rounded-xl bg-white text-black text-sm font-black disabled:opacity-50 hover:brightness-95 transition-all"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
