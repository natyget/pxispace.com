'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, UserPlus, Users, Loader2, Search } from 'lucide-react';
import { eventsService, searchUsers } from '../../services/events';
import { useAuth } from '@/contexts/AuthContext';

const LINEUP_ROLE_MAX_LEN = 80;

/** Map free-text role to send path: staff, line-up featured person + album invite, or album invite only. */
function parseInviteRoleLabel(raw) {
  const t = String(raw ?? '').trim();
  const lower = t.toLowerCase().replace(/\s+/g, ' ');
  if (
    !lower ||
    lower === 'member' ||
    lower === 'guest' ||
    lower === 'attendee' ||
    lower === 'audience'
  ) {
    return { kind: 'MEMBER' };
  }
  if (lower === 'co-host' || lower === 'co host' || lower === 'cohost') {
    return { kind: 'CO_HOST' };
  }
  if (lower === 'bouncer' || lower === 'security') {
    return { kind: 'BOUNCER' };
  }
  return { kind: 'LINEUP', role: t.slice(0, LINEUP_ROLE_MAX_LEN) };
}

function formatRoleForDisplay(label) {
  const t = String(label ?? '').trim();
  return t || 'Guest';
}

const FEATURED_ROLE_STYLES = {
  SINGER: { border: 'border-pink-400/70', bg: 'bg-pink-500/20', text: 'text-pink-300' },
  DANCER: { border: 'border-blue-400/70', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  DESIGNER: { border: 'border-emerald-400/70', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  BAND: { border: 'border-amber-400/70', bg: 'bg-amber-500/20', text: 'text-amber-300' },
};

export default function EventDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const eventId = params?.id;
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [inviteRoleLabel, setInviteRoleLabel] = useState('');
  const [audienceCandidates, setAudienceCandidates] = useState([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState(new Set());
  const [draftInvites, setDraftInvites] = useState([]);
  const [audienceInviting, setAudienceInviting] = useState(false);
  const [audienceInviteError, setAudienceInviteError] = useState(null);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [featuredPeople, setFeaturedPeople] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    mode: null, // 'add' | 'send'
    users: [],
    role: null,
  });
  const searchTimeoutRef = useRef(null);

  const loadEvent = useCallback(() => {
    if (!eventId) return;
    eventsService
      .getEvent(eventId)
      .then((data) => setEvent(data.event || data))
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const albumId = event?.albumId || event?.albums?.[0]?.id;

  const loadParticipants = useCallback(() => {
    if (!albumId) return;
    eventsService
      .getAlbumParticipants(albumId)
      .then((res) => setParticipants(res.participants || []))
      .catch(() => setParticipants([]));
  }, [albumId]);

  const loadFeaturedPeople = useCallback(() => {
    if (!albumId) return;
    eventsService
      .getFeaturedPeople(albumId)
      .then((res) => setFeaturedPeople(res.featuredPeople || []))
      .catch(() => setFeaturedPeople([]));
  }, [albumId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (albumId) loadParticipants();
  }, [albumId, loadParticipants]);

  useEffect(() => {
    if (albumId) loadFeaturedPeople();
  }, [albumId, loadFeaturedPeople]);

  // Debounced user search for invite flow (by username/email)
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

        // Friends are always invite candidates.
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

        // For public events also include previous attendees.
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
                // Ignore inaccessible historical albums and continue.
              }
            })
          );
        }

        // Include search results from invite input too.
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
    setConfirmModal({ open: true, mode: 'add', users: selected, role: inviteRole });
  };

  const confirmAddToDraft = () => {
    const selected = confirmModal.users || [];
    if (selected.length === 0) return;
    setDraftInvites((prev) => {
      const map = new Map(prev.map((d) => [d.id, d]));
      selected.forEach((c) => {
        map.set(c.id, {
          id: c.id,
          username: c.username,
          name: c.name,
          role: confirmModal.role ?? inviteRoleLabel,
        });
      });
      return Array.from(map.values());
    });
    setSelectedAudienceIds(new Set());
    setConfirmModal({ open: false, mode: null, users: [], role: null });
  };

  const removeDraftInvite = (userId) => {
    setDraftInvites((prev) => prev.filter((d) => d.id !== userId));
  };

  const sendAudienceInvites = async () => {
    if (!albumId) return;
    const toInvite = draftInvites;
    if (toInvite.length === 0) return;
    setConfirmModal({ open: true, mode: 'send', users: [...toInvite], role: null });
  };

  const confirmSendInvites = async () => {
    const toInvite = confirmModal.users || [];
    if (!albumId || toInvite.length === 0) return;

    setAudienceInviting(true);
    setAudienceInviteError(null);
    setConfirmModal({ open: false, mode: null, users: [], role: null });
    const failed = [];
    for (const candidate of toInvite) {
      try {
        if (candidate.role === 'CO_HOST') {
          await eventsService.inviteStaff(eventId, candidate.username, 'co-host');
        } else if (candidate.role === 'BOUNCER') {
          await eventsService.inviteStaff(eventId, candidate.username, 'bouncer');
        } else if (FEATURED_ROLE_OPTIONS.includes(candidate.role)) {
          await eventsService.upsertFeaturedPerson(albumId, candidate.username, candidate.role);
          await eventsService.inviteAlbumUser(albumId, candidate.username);
        } else {
          // MEMBER default invite path
          await eventsService.inviteAlbumUser(albumId, candidate.username);
        }
      } catch {
        failed.push(candidate.username);
      }
    }
    setAudienceInviting(false);
    setSelectedAudienceIds(new Set());
    setDraftInvites([]);
    loadParticipants();
    loadFeaturedPeople();

    if (failed.length > 0) {
      setAudienceInviteError(`Some invites failed: ${failed.map((u) => `@${u}`).join(', ')}`);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-pxi-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-red-400">{error || 'Event not found'}</p>
        <Link href="/dashboard/events" className="text-pxi-purple mt-4 inline-block">
          ← Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-white tracking-tight truncate">
            {event.name}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">{formatDate(event.startDate)}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Users size={18} className="text-pxi-purple" />
          <h2 className="font-bold text-white uppercase tracking-widest text-sm">Invite people</h2>
        </div>
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
            Role for people you add: Guest (or empty), Co-host, Bouncer, or any custom line-up label — up to{' '}
            {LINEUP_ROLE_MAX_LEN} characters.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={inviteRoleLabel}
              onChange={(e) => setInviteRoleLabel(e.target.value.slice(0, LINEUP_ROLE_MAX_LEN))}
              placeholder="e.g. Guest, DJ, Co-host…"
              className="flex-1 min-w-[10rem] rounded-xl bg-zinc-800 border border-white/10 text-white text-sm px-3 py-2.5 placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
              autoComplete="off"
            />
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
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2">
                  <p className="text-sm text-white truncate">
                    @{d.username}{' '}
                    <span className={`${FEATURED_ROLE_STYLES[d.role]?.text || 'text-zinc-400'}`}>
                      • {d.role.replace(/_/g, ' ')}
                    </span>
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

          {featuredPeople.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-3 space-y-2">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Featured people</p>
              {featuredPeople.map((person) => (
                <div key={person.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2">
                  <p className="text-sm text-white truncate">@{person.username || 'unknown'}</p>
                  <span className={`text-xs font-bold tracking-wider ${FEATURED_ROLE_STYLES[person.role]?.text || 'text-pxi-purple'}`}>
                    {person.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {audienceInviteError && <p className="text-sm text-red-400">{audienceInviteError}</p>}
        </div>
      </section>

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
                    ? `(${formatRoleForDisplay(confirmModal.role ?? inviteRoleLabel)})`
                    : `— ${formatRoleForDisplay(u.role)}`}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, mode: null, users: [], role: null })}
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
