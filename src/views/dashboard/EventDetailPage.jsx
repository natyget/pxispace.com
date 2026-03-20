'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, UserPlus, Users, Trash2, Loader2, Search } from 'lucide-react';
import { eventsService, searchUsers } from '../../services/events';
import { useAuth } from '@/contexts/AuthContext';

const STAFF_ROLES = ['OWNER', 'ADMIN', 'BOUNCER', 'MEMBER'];
const INVITE_ROLES = [
  { value: 'bouncer', label: 'Bouncer', description: 'Scan tickets, moderate content' },
  { value: 'co-host', label: 'Co-Host', description: 'Same as host except delete event; can invite staff' },
  { value: 'featured_talent', label: 'Featured Talent', description: 'Shown on event page; no gatekeeping' },
];
const FEATURED_ROLE_OPTIONS = ['SINGER', 'DANCER', 'DESIGNER', 'BAND'];

export default function EventDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const eventId = params?.id;
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToInvite, setSelectedToInvite] = useState([]); // { id, username, name?, avatarUrl? }[]
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('bouncer');
  const [audienceCandidates, setAudienceCandidates] = useState([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState(new Set());
  const [audienceInviting, setAudienceInviting] = useState(false);
  const [audienceInviteError, setAudienceInviteError] = useState(null);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [featuredPeople, setFeaturedPeople] = useState([]);
  const [featuredRole, setFeaturedRole] = useState('SINGER');
  const [featuredUsername, setFeaturedUsername] = useState('');
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [featuredError, setFeaturedError] = useState(null);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

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

  // Poll staff list so acceptance status updates without reload
  useEffect(() => {
    if (!albumId) return;
    const interval = setInterval(loadParticipants, 15000);
    return () => clearInterval(interval);
  }, [albumId, loadParticipants]);

  const staffList = participants.filter((p) => STAFF_ROLES.includes(p.role));
  const staffUserIds = new Set(staffList.map((p) => p.userId));
  // Show all participants (staff + members who joined the album)
  const allParticipants = participants;

  // Debounced user search (by username or email on backend)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearching(true);
      searchUsers(q)
        .then((res) => setSearchResults(res.results || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

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

        // Include current search results as selectable candidates too.
        (searchResults || []).forEach((u) => {
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
  }, [event, albumId, user?.id, participants, searchResults]);

  const addToSelection = (user) => {
    if (!user?.id || !user?.username) return;
    if (staffUserIds.has(user.id)) return;
    setSelectedToInvite((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, { id: user.id, username: user.username, name: user.name, avatarUrl: user.avatarUrl }];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromSelection = (userId) => {
    setSelectedToInvite((prev) => prev.filter((u) => u.id !== userId));
  };

  const addAudienceToSelection = (candidate) => {
    if (!candidate?.id) return;
    setSelectedAudienceIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      return next;
    });
  };

  const selectAllAudience = () => setSelectedAudienceIds(new Set(audienceCandidates.map((c) => c.id)));
  const clearAllAudience = () => setSelectedAudienceIds(new Set());

  const openConfirmModal = () => {
    if (selectedToInvite.length === 0) return;
    setInviteError(null);
    setShowConfirmModal(true);
  };

  const sendInvites = async () => {
    setInviting(true);
    const failed = [];
    for (const user of selectedToInvite) {
      try {
        await eventsService.inviteStaff(eventId, user.username, inviteRole);
      } catch (err) {
        failed.push({ username: user.username, error: err.message || err.error || 'Invite failed' });
      }
    }
    setInviting(false);
    setShowConfirmModal(false);
    setSelectedToInvite([]);
    setSearchQuery('');
    setSearchResults([]);
    loadParticipants();
    if (failed.length > 0) {
      setInviteError(`Some invites failed: ${failed.map((f) => `@${f.username}`).join(', ')}`);
    }
  };

  const sendAudienceInvites = async () => {
    if (!albumId) return;
    const toInvite = audienceCandidates.filter((c) => selectedAudienceIds.has(c.id));
    if (toInvite.length === 0) return;

    setAudienceInviting(true);
    setAudienceInviteError(null);
    const failed = [];
    for (const candidate of toInvite) {
      try {
        await eventsService.inviteAlbumUser(albumId, candidate.username);
      } catch {
        failed.push(candidate.username);
      }
    }
    setAudienceInviting(false);
    setSelectedAudienceIds(new Set());
    loadParticipants();

    if (failed.length > 0) {
      setAudienceInviteError(`Some invites failed: ${failed.map((u) => `@${u}`).join(', ')}`);
    }
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().replace(/^@/, '');
      if (searchResults.length > 0 && q.length >= 2) {
        const first = searchResults.find((u) => !staffUserIds.has(u.id) && !selectedToInvite.some((s) => s.id === u.id));
        if (first) addToSelection(first);
      } else if (q.length >= 2) {
        addToSelection({ id: q, username: q, name: null, avatarUrl: null });
      }
    }
  };

  const handleRemove = async (userId) => {
    if (!albumId) return;
    if (!confirm('Remove this person from staff?')) return;
    setRemoving(userId);
    try {
      await eventsService.removeMember(albumId, userId);
      loadParticipants();
    } catch (err) {
      alert(err.message || err.error || 'Remove failed');
    } finally {
      setRemoving(null);
    }
  };

  const saveFeaturedPerson = async () => {
    if (!albumId) return;
    const username = featuredUsername.replace(/^@/, '').trim();
    if (!username) return;
    setSavingFeatured(true);
    setFeaturedError(null);
    try {
      await eventsService.upsertFeaturedPerson(albumId, username, featuredRole);
      setFeaturedUsername('');
      loadFeaturedPeople();
    } catch (err) {
      setFeaturedError(err.message || err.error || 'Failed to save featured person');
    } finally {
      setSavingFeatured(false);
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

      {/* Staff section */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Users size={18} className="text-pxi-purple" />
          <h2 className="font-bold text-white uppercase tracking-widest text-sm">
            Staff & gatekeeping
          </h2>
        </div>
        <div className="p-5 space-y-6">
          {/* Multi-select: search, add users as tags, then Send invites with confirmation */}
          <div ref={searchContainerRef} className="relative">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Invite staff
            </label>
            <div className="mb-3">
              <label className="text-xs text-zinc-500 mr-2">Role:</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg bg-zinc-800 border border-white/10 text-white text-sm px-3 py-1.5 focus:border-pxi-purple/50 focus:outline-none"
              >
                {INVITE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <span className="text-xs text-zinc-500 ml-2">
                {INVITE_ROLES.find((r) => r.value === inviteRole)?.description}
              </span>
            </div>
            {/* Selected users as removable tags */}
            {selectedToInvite.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedToInvite.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-pxi-purple/20 border border-pxi-purple/30 text-white text-sm"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold">
                        @{u.username?.charAt(0) || '?'}
                      </span>
                    )}
                    <span className="font-medium">@{u.username}</span>
                    <button
                      type="button"
                      onClick={() => removeFromSelection(u.id)}
                      className="p-0.5 rounded text-zinc-400 hover:text-white hover:bg-white/10"
                      aria-label={`Remove ${u.username}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-stretch gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search by username or email, then add to list…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
                  disabled={inviting}
                  autoComplete="off"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={18} className="animate-spin text-zinc-500" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={openConfirmModal}
                disabled={inviting || selectedToInvite.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              >
                <UserPlus size={16} />
                Send invites ({selectedToInvite.length})
              </button>
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1 py-1 rounded-xl bg-zinc-900 border border-white/10 shadow-xl z-10 max-h-60 overflow-auto">
                {searchResults.length === 0 && !searching && (
                  <p className="px-4 py-3 text-zinc-500 text-sm">No users found. Type a username and press Enter to add by @username.</p>
                )}
                {searchResults.map((user) => {
                  const isStaff = staffUserIds.has(user.id);
                  const alreadySelected = selectedToInvite.some((s) => s.id === user.id);
                  const canAdd = !isStaff && !alreadySelected;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => canAdd && addToSelection(user)}
                      disabled={!canAdd}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-sm">
                            @{user.username?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">@{user.username}</p>
                        {user.name && (
                          <p className="text-xs text-zinc-500 truncate">{user.name}</p>
                        )}
                      </div>
                      {isStaff ? (
                        <span className="text-xs text-zinc-500 font-medium">Already staff</span>
                      ) : alreadySelected ? (
                        <span className="text-xs text-pxi-purple font-medium">Added</span>
                      ) : (
                        <UserPlus size={16} className="text-pxi-purple flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirmation modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !inviting && setShowConfirmModal(false)}>
              <div
                className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 shadow-xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-white mb-2">Send staff invites?</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Invite the following users as <span className="text-white font-semibold">{INVITE_ROLES.find((r) => r.value === inviteRole)?.label ?? inviteRole}</span>. They will get a notification and can accept in the PXI app.
                </p>
                <ul className="mb-6 max-h-40 overflow-auto space-y-1.5 rounded-lg bg-zinc-800/50 p-3">
                  {selectedToInvite.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 text-sm text-white">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-bold flex-shrink-0">@{u.username?.charAt(0)}</span>
                      )}
                      <span className="font-medium">@{u.username}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => !inviting && setShowConfirmModal(false)}
                    disabled={inviting}
                    className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={sendInvites}
                    disabled={inviting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm disabled:opacity-50 hover:brightness-110"
                  >
                    {inviting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Yes, send invites'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {inviteError && (
            <p className="text-sm text-red-400">{inviteError}</p>
          )}
          <p className="text-xs text-zinc-500">
            Search and add users, choose a role (Bouncer, Co-Host, or Featured Talent), then click &quot;Send invites&quot;. Invited users get a real-time notification in the PXI app and can accept the role.
          </p>

          {/* All participants (staff + members who joined) */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              Staff & members ({allParticipants.length})
            </h3>
            {allParticipants.length === 0 ? (
              <p className="text-zinc-500 text-sm">No one has joined yet. Search or type a username above to invite staff.</p>
            ) : (
              <ul className="space-y-2">
                {allParticipants.map((p) => (
                  <li
                    key={p.userId}
                    className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/50 border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                          @{p.username?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">@{p.username ?? '—'}</p>
                      <p className="text-xs text-zinc-500">
                        {p.role === 'OWNER'
                          ? 'Owner'
                          : p.role === 'ADMIN'
                            ? 'Co-Host'
                            : p.role === 'BOUNCER'
                              ? 'Bouncer (staff)'
                              : p.role === 'MEMBER'
                                ? 'Featured Talent / Member'
                                : 'Member'}
                        {p.joinedAt && ` · Joined ${formatDate(p.joinedAt)}`}
                      </p>
                    </div>
                    {(p.role === 'BOUNCER' || p.role === 'ADMIN' || p.role === 'MEMBER') && p.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(p.userId)}
                        disabled={removing === p.userId}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        title="Remove from staff"
                      >
                        {removing === p.userId ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Users size={18} className="text-pxi-purple" />
          <h2 className="font-bold text-white uppercase tracking-widest text-sm">Featured people</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-zinc-500">Tag citizens by username with a talent role (Singer, Dancer, Designer, Band).</p>

          <div className="flex flex-wrap gap-2">
            {FEATURED_ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFeaturedRole(role)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wider ${
                  featuredRole === role
                    ? 'border-pxi-purple/70 bg-pxi-purple/20 text-pxi-purple'
                    : 'border-white/10 text-zinc-400 hover:bg-white/5'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-stretch gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
              <input
                type="text"
                value={featuredUsername}
                onChange={(e) => setFeaturedUsername(e.target.value)}
                placeholder="@username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
                disabled={savingFeatured}
              />
            </div>
            <button
              type="button"
              onClick={saveFeaturedPerson}
              disabled={savingFeatured || featuredUsername.replace(/^@/, '').trim().length < 2}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              {savingFeatured ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Save tag
            </button>
          </div>

          {featuredError && <p className="text-sm text-red-400">{featuredError}</p>}

          {featuredPeople.length === 0 ? (
            <p className="text-sm text-zinc-500">No featured people tagged yet.</p>
          ) : (
            <ul className="space-y-2">
              {featuredPeople.map((person) => (
                <li key={person.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xs">
                        @{person.username?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">@{person.username || 'unknown'}</p>
                    <p className="text-xs text-zinc-500 truncate">{person.name || 'PXI user'}</p>
                  </div>
                  <span className="text-xs font-bold tracking-wider text-pxi-purple">{person.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Users size={18} className="text-pxi-purple" />
          <h2 className="font-bold text-white uppercase tracking-widest text-sm">Invite attendees</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-zinc-500">
            {event.visibility === 'PUBLIC'
              ? 'Public event: friends + previous attendees + search'
              : 'Private event: friends + search'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={selectAllAudience}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:bg-white/5"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAllAudience}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-300 hover:bg-white/5"
            >
              Clear all
            </button>
            <span className="text-xs text-zinc-500 ml-auto">{selectedAudienceIds.size} selected</span>
          </div>

          {loadingAudience ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={18} className="animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="max-h-72 overflow-auto rounded-xl border border-white/5 bg-zinc-900/30">
              {audienceCandidates.length === 0 ? (
                <p className="px-4 py-6 text-sm text-zinc-500">No candidates available.</p>
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

          <button
            type="button"
            onClick={sendAudienceInvites}
            disabled={audienceInviting || selectedAudienceIds.size === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            {audienceInviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Send attendee invites ({selectedAudienceIds.size})
          </button>

          {audienceInviteError && <p className="text-sm text-red-400">{audienceInviteError}</p>}
        </div>
      </section>
    </div>
  );
}
