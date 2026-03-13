'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, UserPlus, Users, Trash2, Loader2, Search } from 'lucide-react';
import { eventsService, searchUsers } from '../../services/events';

const STAFF_ROLES = ['OWNER', 'ADMIN', 'BOUNCER'];

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id;
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
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

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (albumId) loadParticipants();
  }, [albumId, loadParticipants]);

  // Poll staff list so acceptance status updates without reload
  useEffect(() => {
    if (!albumId) return;
    const interval = setInterval(loadParticipants, 15000);
    return () => clearInterval(interval);
  }, [albumId, loadParticipants]);

  const staffList = participants.filter((p) => STAFF_ROLES.includes(p.role));
  const staffUserIds = new Set(staffList.map((p) => p.userId));

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

  const handleInvite = async (e, usernameOverride) => {
    e?.preventDefault?.();
    const username = (usernameOverride ?? inviteUsername).trim().replace(/^@/, '');
    if (!username) return;
    setInviteError(null);
    setInviting(true);
    try {
      await eventsService.inviteStaff(eventId, username);
      setInviteUsername('');
      setSearchQuery('');
      setSearchResults([]);
      loadParticipants();
    } catch (err) {
      setInviteError(err.message || err.error || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const inviteFromSearch = (user) => {
    if (!user?.username) return;
    handleInvite(null, user.username);
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
          {/* Search users (by username or email) */}
          <div ref={searchContainerRef} className="relative">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Search users to invite
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
                disabled={inviting}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={18} className="animate-spin text-zinc-500" />
                </div>
              )}
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1 py-1 rounded-xl bg-zinc-900 border border-white/10 shadow-xl z-10 max-h-60 overflow-auto">
                {searchResults.length === 0 && !searching && (
                  <p className="px-4 py-3 text-zinc-500 text-sm">No users found</p>
                )}
                {searchResults.map((user) => {
                  const isStaff = staffUserIds.has(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => !isStaff && inviteFromSearch(user)}
                      disabled={isStaff || inviting}
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
                      ) : (
                        <UserPlus size={16} className="text-pxi-purple flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Or invite by username manually */}
          <form onSubmit={(e) => handleInvite(e)} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                Or invite by PXI username
              </label>
              <input
                type="text"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 focus:border-pxi-purple/50 focus:outline-none"
                disabled={inviting}
              />
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteUsername.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pxi-purple text-white font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              {inviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Invite
            </button>
          </form>
          {inviteError && (
            <p className="text-sm text-red-400">{inviteError}</p>
          )}
          <p className="text-xs text-zinc-500">
            Search by username or email, or enter a username above. Invited users get a real-time
            notification in the PXI app and can accept to get BOUNCER access (QR scanning and moderation).
          </p>

          {/* Staff list */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              Current staff ({staffList.length})
            </h3>
            {staffList.length === 0 ? (
              <p className="text-zinc-500 text-sm">No staff yet. Invite someone by username above.</p>
            ) : (
              <ul className="space-y-2">
                {staffList.map((p) => (
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
                      <p className="font-medium text-white">@{p.username}</p>
                      <p className="text-xs text-zinc-500">
                        {p.role === 'OWNER'
                          ? 'Owner'
                          : p.role === 'ADMIN'
                            ? 'Admin'
                            : 'Bouncer (staff)'}
                        {p.joinedAt && ` · Joined ${formatDate(p.joinedAt)}`}
                      </p>
                    </div>
                    {p.role === 'BOUNCER' && (
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
    </div>
  );
}
