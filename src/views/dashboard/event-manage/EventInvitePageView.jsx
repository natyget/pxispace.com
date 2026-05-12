'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Calendar, Check, ClipboardList, Loader2, MapPin,
  Plus, QrCode, Search, Send, Share2, X,
} from 'lucide-react';
import { eventsService, searchUsers } from '@/services/events';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManage } from './EventManageContext';

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

function UserAvatar({ user, size = 38 }) {
  const initial = ((user?.name || user?.username || '?').charAt(0)).toUpperCase();
  const dim = `${size}px`;
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        style={{ width: dim, height: dim }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: dim, height: dim }}
      className="rounded-full bg-violet-900/50 flex items-center justify-center shrink-0 text-white font-bold text-base"
    >
      {initial}
    </div>
  );
}

export default function EventInvitePageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants, reloadParticipants, reloadFeaturedPeople } =
    useEventManage();

  // Tabs
  const [invitePageTab, setInvitePageTab] = useState('send');

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
    if (invitePageTab !== 'status' || !albumId) return;
    loadDirectInvites();
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
    if (q.length < 2) { setInviteResults([]); return; }
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
    const base = inviteQuery.trim().length >= 2 ? inviteResults.map((u) => ({
      id: u.id, username: u.username, name: u.name, avatarUrl: u.avatarUrl, source: 'search',
    })) : audienceCandidates;
    if (listFilter === 'attendees') return base.filter((u) => u.source === 'attendee');
    if (listFilter === 'friends') return base.filter((u) => u.source === 'friend');
    return base;
  }, [audienceCandidates, inviteResults, inviteQuery, listFilter]);

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
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Join "${title}" on PXI`, url });
      } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success('Link copied to clipboard');
    }
  };

  const handleIGShare = async () => {
    if (!eventId) return;
    const url = getPublicEventUrl(eventId);
    const title = event?.name || 'PXI Event';
    // On mobile browsers navigator.share surfaces Instagram Stories as a native target
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Join "${title}" on PXI`, url });
        return;
      } catch { /* dismissed — fall through to clipboard */ }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success('Link copied — open Instagram and paste in your Story');
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
    reloadParticipants();
    reloadFeaturedPeople();
    loadDirectInvites();
    if (failed.length > 0) {
      setSendError(`Some invites failed: ${failed.map((u) => `@${u}`).join(', ')}`);
    } else {
      toast.success(`Sent ${selectedUsers.length} invite${selectedUsers.length > 1 ? 's' : ''}`);
    }
  };

  if (!albumId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
        <p>No album linked to this event.</p>
        <Link href={`/dashboard/events/${eventId}`} className="inline-block mt-4 text-pxi-purple font-bold uppercase text-xs">
          ← Details
        </Link>
      </div>
    );
  }

  const publicUrl = eventId ? getPublicEventUrl(eventId) : '';
  const displayUrl = publicUrl.replace(/^https?:\/\//, '');
  const currentRoleLabel = roleLabel(inviteRoleKind, lineupSubDraft);

  return (
    <div className="space-y-5">
      {/* Page tabs */}
      <div role="tablist" className="flex flex-wrap gap-2">
        {[
          { id: 'send', icon: <Send size={14} />, label: 'Send invites' },
          { id: 'status', icon: <ClipboardList size={14} />, label: 'Invite status' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={invitePageTab === t.id}
            onClick={() => setInvitePageTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors ${
              invitePageTab === t.id
                ? 'border-pxi-purple bg-pxi-purple/15 text-white'
                : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Send tab ─────────────────────────────────────────────────────── */}
      {invitePageTab === 'send' && (
        <section role="tabpanel" className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">

          {/* Event hero */}
          {event && (
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
              <h2 className="text-3xl font-black italic text-white leading-tight mb-2">
                {event.name}
              </h2>
              <div className="flex flex-wrap gap-4">
                {event.startDate && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                    <Calendar size={12} />
                    {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate max-w-xs">
                    <MapPin size={12} />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Share row */}
          {eventId && (
            <div className="flex gap-2 px-4 py-3 border-b border-white/[0.07]">
              {/* Share link */}
              <button
                type="button"
                onClick={handleShareLink}
                className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-white/20 hover:border-white/35 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-[9px] font-black tracking-widest uppercase text-zinc-500 mb-0.5">TAP TO SHARE</p>
                  <p className="text-xs font-medium text-white truncate">{displayUrl}</p>
                </div>
                <Share2 size={16} className="text-zinc-500 shrink-0" />
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleIGShare}
                className="rounded-xl overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(180deg, #833ab4, #fd1d1d, #fcb045)' }}
              >
                <div className="flex flex-col items-center justify-center gap-1 px-3.5 py-2.5 h-full">
                  <span className="text-[9px] font-black tracking-widest uppercase text-white">STORY</span>
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
                className="w-[68px] flex flex-col items-center justify-center gap-1 rounded-xl border border-white/20 hover:border-white/35 transition-colors py-2.5 shrink-0"
              >
                <span className="text-[9px] font-black tracking-widest uppercase text-white">SCAN</span>
                <QrCode size={20} className="text-white" />
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
                  className={`flex-1 py-2 rounded-full text-xs font-bold border transition-colors ${
                    inviteRoleKind === key
                      ? 'border-pxi-purple bg-pxi-purple/20 text-white'
                      : 'border-white/15 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/8'
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
                placeholder="Line-up label (e.g. DJ, MC…)"
                className="w-full rounded-full bg-transparent border border-white/25 text-white text-sm px-4 py-2.5 placeholder-white/35 focus:border-pxi-purple/60 focus:outline-none"
                autoComplete="off"
              />
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                placeholder="Search username…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-transparent border border-white/25 text-white placeholder-white/35 focus:border-pxi-purple/60 focus:outline-none text-sm"
                autoComplete="off"
              />
              {inviteSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-zinc-500" />
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
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    listFilter === f.id
                      ? 'border-pxi-purple/60 bg-pxi-purple/20 text-white'
                      : 'border-white/15 text-zinc-400 hover:text-zinc-200'
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
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Section label */}
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {listFilter === 'attendees' ? 'OG Attendees' : listFilter === 'friends' ? 'Friends' : 'Previous Guests & Friends'}
            </p>

            {/* User list */}
            {loadingAudience ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={22} className="animate-spin text-zinc-500" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                {inviteSearching ? 'Searching…'
                  : listFilter === 'attendees' ? 'No past attendees found.'
                  : listFilter === 'friends' ? 'No friends found.'
                  : 'No users found.'}
              </p>
            ) : (
              <div className="space-y-0 divide-y divide-white/[0.06]">
                {filteredCandidates.slice(0, 20).map((c) => {
                  const selected = selectedIds.has(c.id);
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
                      <div className={`w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                        selected ? 'bg-white border-white' : 'border-zinc-600'
                      }`}>
                        {selected
                          ? <Check size={14} strokeWidth={3} className="text-black" />
                          : <Plus size={14} strokeWidth={2.5} className="text-zinc-400" />
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
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-zinc-900/95 border-t border-white/[0.08] backdrop-blur">
              <button
                type="button"
                disabled={sending}
                onClick={() => setConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black text-sm font-black uppercase tracking-wide disabled:opacity-50 hover:brightness-95 transition-all"
              >
                {sending
                  ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  : `Send Invite${selectedIds.size > 1 ? 's' : ''} · ${selectedIds.size}`
                }
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Status tab ───────────────────────────────────────────────────── */}
      {invitePageTab === 'status' && (
        <section role="tabpanel" className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-white uppercase tracking-widest text-sm">Direct invites</h2>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={directInvitesLoading}
                onClick={loadDirectInvites}
                className="px-3 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/5 disabled:opacity-50"
              >
                Refresh
              </button>
              <Link
                href={`/dashboard/events/${eventId}`}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/5"
              >
                Done
              </Link>
            </div>
          </div>

          <div className="p-5 border-b border-white/5 flex flex-wrap gap-2">
            {[
              { id: 'pending', label: 'Pending', count: statusCounts.pending },
              { id: 'accepted', label: 'Accepted', count: statusCounts.accepted },
              { id: 'rejected', label: 'Rejected', count: statusCounts.declined },
            ].map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => setInviteStatusSegment(seg.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors ${
                  inviteStatusSegment === seg.id
                    ? 'border-violet-500/60 bg-violet-950/40 text-white'
                    : 'border-white/10 text-zinc-400 hover:bg-white/5'
                }`}
              >
                {seg.label} <span className="tabular-nums text-zinc-500">({seg.count})</span>
              </button>
            ))}
          </div>

          <div className="p-5 min-h-48">
            {directInvitesLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 size={24} className="animate-spin text-zinc-400" />
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
                    <li key={inv.id} className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={inv.user} size={34} />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {handle ? `@${handle}` : inv.user?.id}
                            {inv.user?.name && <span className="text-zinc-500 font-normal"> · {inv.user.name}</span>}
                          </p>
                          <p className="text-xs text-violet-300/80 mt-0.5">
                            {formatStoredInviteRole(inv.inviteRole, inv.lineupSubrole)}
                          </p>
                        </div>
                      </div>
                      <dl className="text-xs text-zinc-500 sm:text-right shrink-0 space-y-0.5">
                        <div>
                          <dt className="inline font-bold uppercase tracking-wider text-zinc-600 mr-1">Sent</dt>
                          <dd className="inline">{formatInviteWhen(inv.createdAt)}</dd>
                        </div>
                        {inviteStatusSegment === 'accepted' && inv.acceptedAt && (
                          <div>
                            <dt className="inline font-bold uppercase tracking-wider text-zinc-600 mr-1">Accepted</dt>
                            <dd className="inline">{formatInviteWhen(inv.acceptedAt)}</dd>
                          </div>
                        )}
                        {inviteStatusSegment === 'rejected' && inv.rejectedAt && (
                          <div>
                            <dt className="inline font-bold uppercase tracking-wider text-zinc-600 mr-1">Declined</dt>
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
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">Scan to RSVP</p>
            <div className="bg-white p-5 rounded-3xl shadow-[0_0_60px_rgba(255,255,255,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
              onClick={handleShareLink}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 bg-white/6 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <Share2 size={14} /> Share Link
            </button>
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-300 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm modal ────────────────────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Send Invitations</h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-sm text-zinc-300">
              Send <span className="text-pxi-purple font-bold">{currentRoleLabel}</span> invite{selectedUsers.length > 1 ? 's' : ''} to {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}?
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
                className="flex-1 py-3.5 rounded-xl border border-white/20 text-sm text-zinc-300 font-bold hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSend}
                className="flex-1 py-3.5 rounded-xl bg-white text-black text-sm font-black disabled:opacity-50 hover:brightness-95 transition-all"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
