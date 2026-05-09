'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, Search, Send, UserPlus } from 'lucide-react';
import { eventsService, searchUsers } from '@/services/events';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManage } from './EventManageContext';

const LINEUP_ROLE_MAX_LEN = 80;

function formatDraftInviteLabel(d) {
  if (d.roleKind === 'lineup') return `Line-up • ${d.lineupSubrole || 'Line up'}`;
  if (d.roleKind === 'cohost') return 'Co-host';
  if (d.roleKind === 'bouncer') return 'Bouncer';
  return 'Member';
}

function formatStoredInviteRole(inviteRole, lineupSubrole) {
  if (inviteRole === 'LINEUP') return `Line-up • ${lineupSubrole?.trim() || 'Line up'}`;
  if (inviteRole === 'COHOST') return 'Co-host';
  if (inviteRole === 'BOUNCER') return 'Bouncer';
  return 'Member';
}

function formatInviteWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function EventInvitePageView() {
  const { user } = useAuth();
  const {
    event,
    eventId,
    albumId,
    participants,
    reloadParticipants,
    reloadFeaturedPeople,
  } = useEventManage();

  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [inviteRoleKind, setInviteRoleKind] = useState('member');
  const [lineupSubDraft, setLineupSubDraft] = useState('');
  const [audienceCandidates, setAudienceCandidates] = useState([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState(new Set());
  const [draftInvites, setDraftInvites] = useState([]);
  const [audienceInviting, setAudienceInviting] = useState(false);
  const [audienceInviteError, setAudienceInviteError] = useState(null);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    mode: null,
    users: [],
    meta: null,
  });
  const [invitePageTab, setInvitePageTab] = useState('send');
  const [inviteStatusSegment, setInviteStatusSegment] = useState('pending');
  const [directInvites, setDirectInvites] = useState([]);
  const [directInvitesLoading, setDirectInvitesLoading] = useState(false);
  const [directInvitesError, setDirectInvitesError] = useState(null);
  const searchTimeoutRef = useRef(null);

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
    let pending = 0;
    let accepted = 0;
    let declined = 0;
    directInvites.forEach((inv) => {
      const s = inv.status === 'DECLINED' ? 'DECLINED' : inv.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
      if (s === 'DECLINED') declined += 1;
      else if (s === 'ACCEPTED') accepted += 1;
      else pending += 1;
    });
    return { pending, accepted, declined };
  }, [directInvites]);

  const filteredByStatusSegment = useMemo(() => {
    const want =
      inviteStatusSegment === 'accepted' ? 'ACCEPTED' : inviteStatusSegment === 'rejected' ? 'DECLINED' : 'PENDING';
    return directInvites.filter((inv) => {
      const s = inv.status === 'DECLINED' ? 'DECLINED' : inv.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
      return s === want;
    });
  }, [directInvites, inviteStatusSegment]);

  useEffect(() => {
    const scrollToHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, [albumId, participants.length]);

  useEffect(() => {
    const q = inviteQuery.trim();
    if (q.length < 2) {
      setInviteResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setInviteSearching(true);
      searchUsers(q)
        .then((res) => setInviteResults(res.results || []))
        .catch(() => setInviteResults([]))
        .finally(() => setInviteSearching(false));
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [inviteQuery]);

  useEffect(() => {
    if (!event || !albumId || !user?.id) return;
    let active = true;

    const run = async () => {
      setLoadingAudience(true);
      try {
        const currentAudienceSet = new Set(participants.map((p) => p.userId));
        const map = new Map();
        const addCandidate = (candidate) => {
          if (!candidate?.id || !candidate?.username) return;
          if (candidate.id === user.id) return;
          if (currentAudienceSet.has(candidate.id)) return;
          if (map.has(candidate.id)) return;
          map.set(candidate.id, candidate);
        };

        const friendsRes = await eventsService.getFriends(user.id);
        (friendsRes.friends || []).forEach((f) => {
          addCandidate({
            id: f.id,
            username: f.username,
            name: f.name,
            avatarUrl: f.avatarUrl,
            source: 'friend',
          });
        });

        if (event.visibility === 'PUBLIC') {
          const mine = await eventsService.getMyEvents({ limit: 100, offset: 0 });
          const myEvents = (mine.events || []).filter((e) => e.id !== event.id);
          await Promise.all(
            myEvents.map(async (e) => {
              const prevAlbumId = e.albumId || e.albums?.[0]?.id;
              if (!prevAlbumId) return;
              try {
                const res = await eventsService.getAlbumParticipants(prevAlbumId);
                (res.participants || []).forEach((p) => {
                  const username = String(p.username || '').replace(/^@/, '');
                  if (!username) return;
                  addCandidate({
                    id: p.userId,
                    username,
                    name: p.username,
                    avatarUrl: p.avatarUrl,
                    source: 'attendee',
                  });
                });
              } catch {
                // Ignore inaccessible albums.
              }
            }),
          );
        }

        (inviteResults || []).forEach((u) => {
          addCandidate({
            id: u.id,
            username: u.username,
            name: u.name,
            avatarUrl: u.avatarUrl,
            source: 'search',
          });
        });

        if (active) setAudienceCandidates(Array.from(map.values()));
      } catch {
        if (active) setAudienceCandidates([]);
      } finally {
        if (active) setLoadingAudience(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [event, albumId, user?.id, participants, inviteResults]);

  const addAudienceToSelection = (candidate) => {
    if (!candidate?.id) return;
    setSelectedAudienceIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      return next;
    });
  };

  const addSelectedToDraft = () => {
    const selected = audienceCandidates.filter((c) => selectedAudienceIds.has(c.id));
    if (selected.length === 0) return;
    const lineupSubrole =
      inviteRoleKind === 'lineup'
        ? (lineupSubDraft.trim() || 'Line up').slice(0, LINEUP_ROLE_MAX_LEN)
        : undefined;
    setConfirmModal({
      open: true,
      mode: 'add',
      users: selected,
      meta: { roleKind: inviteRoleKind, lineupSubrole },
    });
  };

  const confirmAddToDraft = () => {
    const selected = confirmModal.users || [];
    const meta = confirmModal.meta || { roleKind: 'member' };
    if (selected.length === 0) return;
    setDraftInvites((prev) => {
      const map = new Map(prev.map((d) => [d.id, d]));
      selected.forEach((c) => {
        map.set(c.id, {
          id: c.id,
          username: c.username,
          name: c.name,
          roleKind: meta.roleKind,
          lineupSubrole: meta.roleKind === 'lineup' ? meta.lineupSubrole || 'Line up' : undefined,
        });
      });
      return Array.from(map.values());
    });
    setSelectedAudienceIds(new Set());
    setConfirmModal({ open: false, mode: null, users: [], meta: null });
  };

  const removeDraftInvite = (userId) => {
    setDraftInvites((prev) => prev.filter((d) => d.id !== userId));
  };

  const sendAudienceInvites = async () => {
    if (!albumId) return;
    const toInvite = draftInvites;
    if (toInvite.length === 0) return;
    setConfirmModal({ open: true, mode: 'send', users: [...toInvite], meta: null });
  };

  const confirmSendInvites = async () => {
    const toInvite = confirmModal.users || [];
    if (!albumId || toInvite.length === 0) return;

    setAudienceInviting(true);
    setAudienceInviteError(null);
    setConfirmModal({ open: false, mode: null, users: [], meta: null });
    const failed = [];
    for (const candidate of toInvite) {
      try {
        if (candidate.roleKind === 'cohost') {
          await eventsService.inviteStaff(eventId, candidate.username, 'co-host');
        } else if (candidate.roleKind === 'bouncer') {
          await eventsService.inviteStaff(eventId, candidate.username, 'bouncer');
        } else if (candidate.roleKind === 'lineup') {
          await eventsService.inviteAlbumUser(albumId, candidate.username, {
            role: 'lineup',
            lineupSubrole: candidate.lineupSubrole || 'Line up',
          });
        } else {
          await eventsService.inviteAlbumUser(albumId, candidate.username, { role: 'member' });
        }
      } catch {
        failed.push(candidate.username);
      }
    }
    setAudienceInviting(false);
    setSelectedAudienceIds(new Set());
    setDraftInvites([]);
    reloadParticipants();
    reloadFeaturedPeople();
    loadDirectInvites();

    if (failed.length > 0) {
      setAudienceInviteError(`Some invites failed: ${failed.map((u) => `@${u}`).join(', ')}`);
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

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Invite sections"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={invitePageTab === 'send'}
          onClick={() => setInvitePageTab('send')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors ${
            invitePageTab === 'send'
              ? 'border-pxi-purple bg-pxi-purple/15 text-white'
              : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
          }`}
        >
          <Send size={14} aria-hidden />
          Send invites
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={invitePageTab === 'status'}
          onClick={() => setInvitePageTab('status')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-colors ${
            invitePageTab === 'status'
              ? 'border-pxi-purple bg-pxi-purple/15 text-white'
              : 'border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
          }`}
        >
          <ClipboardList size={14} aria-hidden />
          Invite status
        </button>
      </div>

      {invitePageTab === 'status' && (
        <section
          id="event-invite-status"
          className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden"
          role="tabpanel"
        >
          <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-white uppercase tracking-widest text-sm">
              Direct invites
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={directInvitesLoading}
                onClick={() => loadDirectInvites()}
                className="px-3 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/5 disabled:opacity-50"
              >
                Refresh
              </button>
              <Link
                href={`/dashboard/events/${eventId}`}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/5 shrink-0"
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
                {seg.label}{' '}
                <span className="tabular-nums text-zinc-500">({seg.count})</span>
              </button>
            ))}
          </div>

          <div className="p-5 space-y-3 min-h-[12rem]">
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
                    <li
                      key={inv.id}
                      className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {handle ? `@${handle}` : inv.user?.id}
                          {inv.user?.name && (
                            <span className="text-zinc-500 font-normal"> · {inv.user.name}</span>
                          )}
                        </p>
                        <p className="text-xs text-violet-300/90 mt-0.5">
                          {formatStoredInviteRole(inv.inviteRole, inv.lineupSubrole)}
                        </p>
                      </div>
                      <dl className="text-xs text-zinc-500 sm:text-right shrink-0 space-y-0.5">
                        <div>
                          <dt className="inline font-bold uppercase tracking-wider text-zinc-600 mr-2">
                            Sent
                          </dt>
                          <dd className="inline">{formatInviteWhen(inv.createdAt)}</dd>
                        </div>
                        {inviteStatusSegment === 'accepted' && inv.acceptedAt && (
                          <div>
                            <dt className="inline font-bold uppercase tracking-wider text-zinc-600 mr-2">
                              Accepted
                            </dt>
                            <dd className="inline">{formatInviteWhen(inv.acceptedAt)}</dd>
                          </div>
                        )}
                        {inviteStatusSegment === 'rejected' && inv.rejectedAt && (
                          <div>
                            <dt className="inline font-bold uppercase tracking-wider text-zinc-600 mr-2">
                              Declined
                            </dt>
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

      {invitePageTab === 'send' && (
      <section id="event-invite" className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden" role="tabpanel">
        <div className="p-5 space-y-4">
          <p className="text-xs text-zinc-500">
            {event.visibility === 'PUBLIC'
              ? 'Public event: friends + previous attendees + search'
              : 'Private event: friends + search'}
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
            <input
              type="text"
              value={inviteQuery}
              onChange={(e) => setInviteQuery(e.target.value)}
              placeholder="Search username or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
              autoComplete="off"
            />
            {inviteSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={18} className="animate-spin text-zinc-500" />
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500">
            Pick a role, then select people and add to the draft. Line-up requires a short label (max {LINEUP_ROLE_MAX_LEN}{' '}
            characters). Paid events: only member invites require payment on accept.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={inviteRoleKind}
              onChange={(e) => setInviteRoleKind(e.target.value)}
              className="flex-1 min-w-[10rem] rounded-xl bg-zinc-800 border border-white/10 text-white text-sm px-3 py-2.5 focus:border-pxi-purple/50 focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="cohost">Co-host</option>
              <option value="bouncer">Bouncer</option>
              <option value="lineup">Line-up</option>
            </select>
            {inviteRoleKind === 'lineup' && (
              <input
                type="text"
                value={lineupSubDraft}
                onChange={(e) => setLineupSubDraft(e.target.value.slice(0, LINEUP_ROLE_MAX_LEN))}
                placeholder="Line-up label…"
                className="flex-1 min-w-[10rem] rounded-xl bg-zinc-800 border border-white/10 text-white text-sm px-3 py-2.5 placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
                autoComplete="off"
              />
            )}
            <button
              type="button"
              onClick={addSelectedToDraft}
              disabled={selectedAudienceIds.size === 0}
              className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={sendAudienceInvites}
              disabled={audienceInviting || draftInvites.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              {audienceInviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Send
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Search results
              </h3>
              <span className="text-xs text-zinc-500 shrink-0">
                {selectedAudienceIds.size === 1 ? '1 user' : `${selectedAudienceIds.size} users`}
              </span>
            </div>
            {loadingAudience ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={18} className="animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="max-h-72 overflow-auto rounded-xl border border-white/5 bg-zinc-900/30">
                {audienceCandidates.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-zinc-500">
                    {inviteQuery.trim().length >= 2 ? 'No users found for this search.' : 'No candidates available.'}
                  </p>
                ) : (
                  audienceCandidates.map((candidate) => {
                    const checked = selectedAudienceIds.has(candidate.id);
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => addAudienceToSelection(candidate)}
                        className="w-full px-4 py-3 border-b border-white/5 last:border-b-0 flex items-center justify-between text-left hover:bg-white/5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {candidate.name || `@${candidate.username}`}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            @{candidate.username} •{' '}
                            {candidate.source === 'friend'
                              ? 'friend'
                              : candidate.source === 'attendee'
                                ? 'previous attendee'
                                : 'search'}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border ${checked ? 'bg-pxi-purple border-pxi-purple' : 'border-zinc-600'}`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 mt-6 pt-5 border-t border-white/5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Draft list
              </h3>
              <span className="text-xs text-zinc-500 shrink-0">
                {draftInvites.length === 1 ? '1 user' : `${draftInvites.length} users`}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3 space-y-2">
              {draftInvites.length === 0 ? (
                <p className="text-sm text-zinc-500">Add selected users to draft list.</p>
              ) : (
                draftInvites.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2"
                  >
                    <p className="text-sm text-white truncate">
                      @{d.username} <span className="text-zinc-400">• {formatDraftInviteLabel(d)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => removeDraftInvite(d.id)}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {audienceInviteError && <p className="text-sm text-red-400">{audienceInviteError}</p>}
        </div>
      </section>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              {confirmModal.mode === 'add' ? 'Add to draft list' : 'Send invitations'}
            </h3>
            <p className="text-sm text-zinc-300">
              {confirmModal.mode === 'add'
                ? 'Do you want to add these members to the draft list?'
                : 'Do you want to send these invitations now?'}
            </p>
            <div className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-zinc-800/40 p-2 space-y-1">
              {confirmModal.users.map((u) => (
                <p key={u.id} className="text-xs text-zinc-200">
                  • @{u.username}{' '}
                  {confirmModal.mode === 'add'
                    ? `(${formatDraftInviteLabel({
                        roleKind: confirmModal.meta?.roleKind || 'member',
                        lineupSubrole: confirmModal.meta?.lineupSubrole,
                      })})`
                    : `— ${formatDraftInviteLabel(u)}`}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, mode: null, users: [], meta: null })}
                className="px-3 py-2 rounded-lg border border-white/10 text-xs text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={audienceInviting}
                onClick={confirmModal.mode === 'add' ? confirmAddToDraft : confirmSendInvites}
                className="px-3 py-2 rounded-lg bg-pxi-purple text-xs font-bold text-white disabled:opacity-60"
              >
                {confirmModal.mode === 'add' ? 'Add' : audienceInviting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
