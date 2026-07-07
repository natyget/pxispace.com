'use client';

import { useMemo, useState } from 'react';
import UserAvatar from '@/components/ui/UserAvatar';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, HelpCircleIcon, UserRemove01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/services/events';
import { useEventManage } from './EventManageContext';
import EventInvitePageView from './EventInvitePageView';

const ROLE_OPTIONS = ['MEMBER', 'BOUNCER', 'ADMIN'];

export default function EventMembersPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants, reloadParticipants } = useEventManage();
  const [busyByUserId, setBusyByUserId] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('attending');

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
      <div className="rounded-2xl bg-white/[0.04] p-6 text-sm text-zinc-400">
        <p>No album linked to this event.</p>
        <Link href={`/dashboard/events/${eventId}`} className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white">
          Details
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-segmented-toggle w-full">
        {[
          { id: 'attending', label: 'Attending' },
          { id: 'send', label: 'Send invites' },
          { id: 'status', label: 'Invite status' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="dashboard-segmented-toggle__item flex-1"
            data-active={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'send' ? <EventInvitePageView initialTab="send" showTabs={false} /> : null}
      {activeTab === 'status' ? <EventInvitePageView initialTab="status" showTabs={false} /> : null}

      {activeTab === 'attending' ? (
      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 p-5">
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
                  className="glass-field flex flex-col gap-2 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      user={{ avatarUrl: member.avatarUrl }}
                      size={40}
                      alt={handle || ''}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {handle ? `@${handle}` : member.userId}
                        {member.name ? <span className="text-zinc-500 font-normal"> · {member.name}</span> : null}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mt-0.5">
                        {member.role || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5">
                      {member.role === 'OWNER' ? (
                        <HugeiconsIcon icon={HelpCircleIcon} size={14} className="text-emerald-400" />
                      ) : (
                        <HugeiconsIcon icon={Shield01Icon} size={14} className="text-zinc-500" />
                      )}
                      <select
                        value={member.role || 'MEMBER'}
                        disabled={!canManageMembers || isOwnerRow || isBusy}
                        onChange={(e) => void handleRoleChange(member, e.target.value)}
                        className="glass-field rounded-full px-2.5 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="pill-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={UserRemove01Icon} size={13} />
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
      ) : null}
    </div>
  );
}
