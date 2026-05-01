'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Shield, ShieldCheck, UserMinus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/services/events';
import { useEventManage } from './EventManageContext';

const ROLE_OPTIONS = ['MEMBER', 'BOUNCER', 'ADMIN'];

export default function EventMembersPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants, reloadParticipants } = useEventManage();
  const [busyByUserId, setBusyByUserId] = useState({});
  const [error, setError] = useState(null);

  const myAlbumRole = participants.find((p) => p.userId === user?.id)?.role;
  const isOwner = myAlbumRole === 'OWNER';
  const canManageMembers = isOwner;

  const sortedParticipants = useMemo(() => {
    const rank = { OWNER: 0, ADMIN: 1, BOUNCER: 2, MEMBER: 3 };
    return [...participants].sort((a, b) => {
      const ra = rank[a.role] ?? 99;
      const rb = rank[b.role] ?? 99;
      if (ra !== rb) return ra - rb;
      return String(a.username || a.userId).localeCompare(String(b.username || b.userId));
    });
  }, [participants]);

  const setBusy = (userId, value) =>
    setBusyByUserId((prev) => ({ ...prev, [userId]: value }));

  const handleRoleChange = async (member, nextRole) => {
    if (!albumId || !canManageMembers) return;
    if (member.role === 'OWNER') return;
    if (member.role === nextRole) return;
    setBusy(member.userId, true);
    setError(null);
    try {
      await eventsService.updateMemberRole(albumId, member.userId, nextRole);
      await reloadParticipants();
    } catch (e) {
      setError(e?.message || 'Failed to update role.');
    } finally {
      setBusy(member.userId, false);
    }
  };

  const handleBlock = async (member) => {
    if (!albumId || !canManageMembers) return;
    if (member.role === 'OWNER') return;
    const handle = String(member.username || member.userId || '').replace(/^@/, '');
    const ok = window.confirm(`Block/remove @${handle || member.userId} from this event album?`);
    if (!ok) return;
    setBusy(member.userId, true);
    setError(null);
    try {
      await eventsService.removeMember(albumId, member.userId);
      await reloadParticipants();
    } catch (e) {
      setError(e?.message || 'Failed to block member.');
    } finally {
      setBusy(member.userId, false);
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
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 shrink-0"
          aria-label="Back to event details"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-pxi-purple shrink-0" />
            <h1 className="text-lg font-black text-white tracking-tight truncate">Members</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            View all members, update roles, and block/remove members.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            {event?.name || 'Event'} · {participants.length} members
          </p>
          {!canManageMembers ? (
            <p className="text-[11px] text-zinc-500">Role updates + block are owner-only.</p>
          ) : null}
        </div>
        <div className="p-5 space-y-2">
          {sortedParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500">No album members yet.</p>
          ) : (
            sortedParticipants.map((member) => {
              const isBusy = Boolean(busyByUserId[member.userId]);
              const isOwnerRow = member.role === 'OWNER';
              const handle = String(member.username || '').replace(/^@/, '').trim();
              return (
                <div
                  key={member.userId}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {handle ? `@${handle}` : member.userId}
                      {member.name ? <span className="text-zinc-500 font-normal"> · {member.name}</span> : null}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mt-0.5">
                      Current role: {member.role || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5">
                      {member.role === 'OWNER' ? (
                        <ShieldCheck size={14} className="text-emerald-400" />
                      ) : (
                        <Shield size={14} className="text-zinc-500" />
                      )}
                      <select
                        value={member.role || 'MEMBER'}
                        disabled={!canManageMembers || isOwnerRow || isBusy}
                        onChange={(e) => void handleRoleChange(member, e.target.value)}
                        className="rounded-lg bg-zinc-800 border border-white/10 text-white text-xs px-2.5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isOwnerRow ? (
                          <option value="OWNER">OWNER</option>
                        ) : (
                          ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!canManageMembers || isOwnerRow || isBusy}
                      onClick={() => void handleBlock(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500/20"
                    >
                      <UserMinus size={13} />
                      {isBusy ? 'Working...' : 'Block'}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {error ? <p className="text-sm text-red-400 pt-1">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
