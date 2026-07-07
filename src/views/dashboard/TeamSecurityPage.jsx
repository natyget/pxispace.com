'use client';

import { useEffect, useState } from 'react';
import SectionCard from '@/components/dashboard/SectionCard';
import {
    listTeamRosters,
    addRosterMember,
    removeRosterMember,
    createTeamRoster,
    deleteTeamRoster,
    updateTeamRoster,
    ROSTER_ROLE_OPTIONS,
} from '@/services/teamRosters';

function TeamHero({ rosterCount, memberCount }) {
    return (
        <section className="relative overflow-hidden rounded-[2rem] bg-black px-5 py-7 shadow-[0_24px_90px_rgba(0,0,0,0.45)] md:px-8">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Access</p>
                    <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-normal text-white normal-case md:text-6xl">Teams & Security</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                        Build reusable rosters for doors, hosts, media, and event operations.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:w-[360px]">
                    <div className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Teams</p>
                        <p className="mt-2 text-2xl font-black text-white">{rosterCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Members</p>
                        <p className="mt-2 text-2xl font-black text-white">{memberCount.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function TeamSecurityPage() {
    const [rosters, setRosters] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('Event Staff');
    const [creating, setCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    const roster = rosters.find((r) => r.id === selectedId) || rosters[0] || null;
    const memberCount = rosters.reduce((sum, item) => sum + (item.members?.length || 0), 0);

    useEffect(() => {
        let alive = true;
        listTeamRosters()
            .then((loaded) => {
                if (!alive) return;
                setRosters(loaded);
                if (loaded.length > 0) setSelectedId(loaded[0].id);
            })
            .catch(() => {
                if (alive) setError('Could not load your team rosters. Please try again.');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => { alive = false; };
    }, []);

    const replaceRoster = (updated) => {
        if (!updated) return;
        setRosters((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    };

    const handleAdd = async () => {
        if (!name || !email || !roster) return;
        const updatedRoster = await addRosterMember(roster.id, { name, contact: email, handle: username, role });
        replaceRoster(updatedRoster);
        setName('');
        setEmail('');
        setUsername('');
        setRole('Event Staff');
    };

    const handleRemove = async (id) => {
        if (!roster) return;
        const updatedRoster = await removeRosterMember(roster.id, id);
        replaceRoster(updatedRoster);
    };

    const handleCreateTeam = async () => {
        const teamName = newTeamName.trim();
        if (!teamName) return;
        const created = await createTeamRoster({ name: teamName, defaultRole: 'General Staff' });
        setRosters((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setNewTeamName('');
        setCreating(false);
    };

    const handleDeleteTeam = async () => {
        if (!roster) return;
        if (!window.confirm(`Delete team "${roster.name}"? Its member list is removed (PXI accounts are untouched).`)) return;
        const remaining = await deleteTeamRoster(roster.id);
        setRosters(remaining);
        setSelectedId(remaining[0]?.id ?? null);
    };

    const handleRename = async () => {
        const next = renameValue.trim();
        if (!roster || !next || next === roster.name) {
            setRenaming(false);
            return;
        }
        const updated = await updateTeamRoster(roster.id, { name: next });
        replaceRoster(updated);
        setRenaming(false);
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="h-48 animate-pulse rounded-[2rem] bg-white/[0.035]" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="glow-surface h-72 animate-pulse rounded-2xl" />
                    <div className="glow-surface h-72 animate-pulse rounded-2xl md:col-span-2" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-6xl space-y-6">
                <TeamHero rosterCount={0} memberCount={0} />
                <SectionCard title="Roster unavailable">
                    <p className="px-4 py-2 text-sm text-zinc-400">{error}</p>
                </SectionCard>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
            <TeamHero rosterCount={rosters.length} memberCount={memberCount} />

            {/* Team switcher: pick, create, rename, delete */}
            <div className="flex flex-wrap items-center gap-2 rounded-[1.75rem] bg-white/[0.035] p-3">
                {rosters.map((r) => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                            roster?.id === r.id ? 'bg-white text-black' : 'glow-chip text-zinc-400 hover:text-white'
                        }`}
                    >
                        {r.name}
                        <span className="ml-1.5 opacity-60">{r.members?.length ?? 0}</span>
                    </button>
                ))}
                {creating ? (
                    <span className="flex items-center gap-2">
                        <input
                            autoFocus
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTeam(); if (e.key === 'Escape') setCreating(false); }}
                            placeholder="Team name"
                            className="dashboard-input h-9 w-44"
                        />
                        <button type="button" onClick={handleCreateTeam} disabled={!newTeamName.trim()} className="pill-solid px-4 py-2 text-xs disabled:opacity-40">
                            Create
                        </button>
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="rounded-full bg-white/[0.055] px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                    >
                        + New team
                    </button>
                )}
            </div>

            {!roster ? (
                <SectionCard title="No teams yet" className="!rounded-[1.75rem]">
                    <p className="px-4 py-2 text-sm text-zinc-400">Create your first team above — then add door staff, hosts, and media crew.</p>
                </SectionCard>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <SectionCard title="Add Team Member" className="!rounded-[1.75rem]">
                            <div className="space-y-4 px-4 py-2">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="dashboard-input w-full mt-2" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="dashboard-input w-full mt-2" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">PXI username (optional)</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="@handle" className="dashboard-input w-full mt-2" />
                                    <p className="mt-1.5 text-[11px] text-zinc-500">
                                        Add their PXI @username so assigning them to an event can send a real staff invite.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Role</label>
                                    <select value={role} onChange={e => setRole(e.target.value)} className="dashboard-input w-full mt-2 appearance-none">
                                        {ROSTER_ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={handleAdd} disabled={!name || !email} className="pill-solid w-full mt-2 justify-center py-3">
                                    Add Member
                                </button>
                            </div>
                        </SectionCard>
                    </div>

                    <div className="space-y-6">
                        <SectionCard
                            title={roster.name}
                            className="!rounded-[1.75rem]"
                            actions={
                                <div className="flex items-center gap-3">
                                    {renaming ? (
                                        <span className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                                                className="dashboard-input h-8 w-40 text-xs"
                                            />
                                            <button type="button" onClick={handleRename} className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Save</button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { setRenameValue(roster.name); setRenaming(true); }}
                                            className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
                                        >
                                            Rename
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleDeleteTeam}
                                        className="text-[11px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300"
                                    >
                                        Delete team
                                    </button>
                                </div>
                            }
                        >
                            <div className="space-y-3 px-2 py-1">
                                {roster.members.map(member => (
                                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
                                        <div>
                                            <p className="text-sm font-bold text-white">{member.name}</p>
                                            <p className="text-xs text-zinc-500">
                                                {member.contact}
                                                {member.contact && member.handle ? ' · ' : ''}
                                                {member.handle}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="glow-chip px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                                {member.role}
                                            </span>
                                            <button type="button" onClick={() => handleRemove(member.id)} className="text-[11px] uppercase tracking-widest font-bold text-red-400 hover:text-red-300 transition-colors">
                                                Revoke
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {roster.members.length === 0 && <p className="text-sm text-zinc-500 p-4 text-center">No team members yet.</p>}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            )}
        </div>
    );
}
