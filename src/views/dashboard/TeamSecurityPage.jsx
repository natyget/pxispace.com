'use client';

import { useEffect, useState } from 'react';
import SectionCard from '@/components/dashboard/SectionCard';
import { listTeamRosters, addRosterMember, removeRosterMember, createTeamRoster, ROSTER_ROLE_OPTIONS } from '@/services/teamRosters';

export default function TeamSecurityPage() {
    const [roster, setRoster] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('Event Staff');

    useEffect(() => {
        let alive = true;
        listTeamRosters()
            .then((rosters) => {
                if (!alive) return null;
                if (rosters.length > 0) {
                    setRoster(rosters[0]);
                    return null;
                }
                return createTeamRoster({ name: 'Default Team', defaultRole: 'Event Staff' }).then((newRoster) => {
                    if (alive) setRoster(newRoster);
                });
            })
            .catch(() => {
                if (alive) setError('Could not load your team roster. Please try again.');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => { alive = false; };
    }, []);

    const handleAdd = async () => {
        if (!name || !email || !roster) return;
        const updatedRoster = await addRosterMember(roster.id, { name, contact: email, handle: username, role });
        setRoster(updatedRoster);
        setName('');
        setEmail('');
        setUsername('');
        setRole('Event Staff');
    };

    const handleRemove = async (id) => {
        if (!roster) return;
        const updatedRoster = await removeRosterMember(roster.id, id);
        setRoster(updatedRoster);
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-3">
                    <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
                    <div className="h-4 w-80 max-w-full animate-pulse rounded bg-white/5" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="glow-surface h-72 animate-pulse rounded-2xl" />
                    <div className="glow-surface h-72 animate-pulse rounded-2xl md:col-span-2" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Teams & Security</h1>
                <SectionCard title="Roster unavailable">
                    <p className="px-4 py-2 text-sm text-zinc-400">{error}</p>
                </SectionCard>
            </div>
        );
    }

    if (!roster) return null;

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Teams & Security</h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                    <SectionCard title="Add Team Member">
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

                <div className="md:col-span-2 space-y-6">
                    <SectionCard title="Roster">
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
        </div>
    );
}
