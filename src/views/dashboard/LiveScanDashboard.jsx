'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Alert02Icon,
    Cancel01Icon,
    Calendar01Icon,
    CheckmarkCircle02Icon,
    Megaphone01Icon,
    Notification03Icon,
    QrCodeIcon,
    Search01Icon,
    UserGroupIcon,
} from '@hugeicons/core-free-icons';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';
import SectionCard from '@/components/dashboard/SectionCard';

const queueCards = [
    { label: 'Pending scans', value: 17, tone: 'text-amber-300' },
    { label: 'Cleared entries', value: 94, tone: 'text-emerald-300' },
    { label: 'Flagged tickets', value: 3, tone: 'text-red-300' },
];

const scanFeed = [
    { id: 'scan-1', name: '@_julesx', state: 'Accepted', gate: 'North Entry', at: '8:09 PM' },
    { id: 'scan-2', name: '@mariacole', state: 'Accepted', gate: 'North Entry', at: '8:08 PM' },
    { id: 'scan-3', name: '@davidx', state: 'Flagged', gate: 'VIP Desk', at: '8:07 PM' },
    { id: 'scan-4', name: '@avryj', state: 'Accepted', gate: 'Main Gate', at: '8:06 PM' },
];

const incidents = [
    { id: 'issue-1', title: 'Duplicate Scan Ring Detected', detail: 'Multiple rapid scans from identical forged QR payloads.', priority: 'critical', state: 'open' },
    { id: 'issue-2', title: 'Oversold Capacity Warning', detail: 'At current velocity, floor cap is expected in 4 minutes.', priority: 'warning', state: 'open' },
    { id: 'issue-3', title: 'Gate B bottleneck', detail: 'Resolved by rerouting crowd to North Entry.', priority: 'resolved', state: 'resolved' },
];

const gateControls = [
    { id: 'gate-a', name: 'Gate A', velocity: '42 scans/min', status: 'online' },
    { id: 'gate-b', name: 'Gate B', velocity: '36 scans/min', status: 'online' },
    { id: 'gate-c', name: 'VIP Desk', velocity: '18 scans/min', status: 'paused' },
];

function StateChip({ state }) {
    if (state === 'Accepted') {
        return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">Accepted</span>;
    }
    if (state === 'Flagged') {
        return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-300 border border-red-500/30">Flagged</span>;
    }
    return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/5 text-zinc-400 border border-white/10">{state}</span>;
}

export default function LiveScanDashboard({ initialTab = 'scanner' }) {
    const [broadcastOpen, setBroadcastOpen] = useState(false);
    const [messageType, setMessageType] = useState('emergency');
    const [messageBody, setMessageBody] = useState('');
    const activeTab = useMemo(() => (initialTab === 'activity' ? 'incidents' : 'feed'), [initialTab]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-pxi-purple">Live Operations</p>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">Scanner Command Deck</h1>
                    <p className="text-zinc-500 text-sm mt-1">Realtime feed, gate controls, and incident response for event staff.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DataSourceBadge source="Mock" />
                    <button
                        type="button"
                        onClick={() => setBroadcastOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10"
                    >
                        <HugeiconsIcon icon={Megaphone01Icon} size={14} />
                        Broadcast
                    </button>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                        Queue online
                    </span>
                </div>
            </header>

            <nav className="flex rounded-full bg-zinc-900/80 border border-white/10 p-1 w-full md:w-fit">
                <Link
                    href="/dashboard/live-scan"
                    className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'feed' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                    Realtime Feed
                </Link>
                <Link
                    href="/dashboard/live-scan/activity"
                    className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'incidents' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                    Incidents
                </Link>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {queueCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{card.label}</p>
                        <p className={`text-3xl font-black tracking-tight mt-2 ${card.tone}`}>{card.value}</p>
                        <p className="text-zinc-500 text-xs mt-2">Mock snapshot from scanner queue model.</p>
                    </div>
                ))}
            </div>

            {activeTab === 'feed' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SectionCard
                        title="Scan Console"
                        subtitle="Mock QR check-in, fraud interception, and manual search."
                        source="Mock"
                    >
                        <div className="space-y-4">
                            <button className="w-full rounded-2xl bg-white text-black py-3 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <HugeiconsIcon icon={QrCodeIcon} size={16} />
                                Start QR Scan
                            </button>
                            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 flex items-center gap-2">
                                <HugeiconsIcon icon={Search01Icon} size={15} className="text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search handle or ticket ID"
                                    className="w-full bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
                                    readOnly
                                />
                            </div>
                            <p className="text-xs text-zinc-500">
                                Use this panel for manual ticket checks and false-positive overrides.
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Recent Scans"
                        subtitle="Last validated entries from the queue stream."
                        source="Mock"
                    >
                        <ul className="space-y-3">
                            {scanFeed.map((item) => (
                                <li key={item.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.name}</p>
                                        <p className="text-xs text-zinc-500">{item.gate} · {item.at}</p>
                                        {item.state === 'Flagged' && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <button className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10">
                                                    ID Check
                                                </button>
                                                <button className="rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-200 hover:bg-red-500/20">
                                                    Override
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <StateChip state={item.state} />
                                </li>
                            ))}
                        </ul>
                    </SectionCard>

                    <SectionCard
                        title="Gate Controls"
                        subtitle="Door velocity and scanner control toggles."
                        source="Mock"
                    >
                        <ul className="space-y-3">
                            {gateControls.map((gate) => (
                                <li key={gate.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
                                    <p className="text-sm font-semibold text-white flex items-center justify-between gap-2">
                                        <span>{gate.name}</span>
                                        <span className="text-xs text-zinc-500">{gate.velocity}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button className="rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-200 hover:bg-red-500/20">
                                            Halt Scans
                                        </button>
                                        <button className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/20">
                                            Resume Ops
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>
                </div>
            ) : (
                <SectionCard
                    title="Active Incidents"
                    subtitle="Security and operations triage queue."
                    source="Mock"
                >
                    <ul className="space-y-3">
                        {incidents.map((item) => (
                            <li key={`incident-${item.id}`} className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                                item.priority === 'critical'
                                    ? 'border-red-500/40 bg-red-500/10'
                                    : item.priority === 'warning'
                                        ? 'border-amber-500/40 bg-amber-500/10'
                                        : 'border-white/10 bg-black/30 opacity-70'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                                        <HugeiconsIcon
                                            icon={item.priority === 'resolved' ? CheckmarkCircle02Icon : Alert02Icon}
                                            size={16}
                                            className={item.priority === 'resolved' ? 'text-emerald-300' : 'text-red-300'}
                                        />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.title}</p>
                                        <p className="text-xs text-zinc-400">{item.detail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.priority !== 'resolved' && (
                                        <>
                                            <button className="rounded-lg border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10">
                                                Assign
                                            </button>
                                            <button className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/20">
                                                Resolve
                                            </button>
                                        </>
                                    )}
                                    {item.priority === 'resolved' && (
                                        <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                            Resolved
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Guard lane</p>
                            <p className="text-white text-sm mt-1 flex items-center gap-2"><HugeiconsIcon icon={UserGroupIcon} size={14} /> North Entry</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Active event</p>
                            <p className="text-white text-sm mt-1 flex items-center gap-2"><HugeiconsIcon icon={Calendar01Icon} size={14} /> Tonight Launch</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Alerts</p>
                            <p className="text-white text-sm mt-1 flex items-center gap-2"><HugeiconsIcon icon={Notification03Icon} size={14} /> 3 unresolved</p>
                        </div>
                    </div>
                </SectionCard>
            )}

            {broadcastOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70">
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-white font-bold text-lg">Broadcast to Attendees</h3>
                                <p className="text-zinc-400 text-sm mt-1">Mock payload builder for emergency and set-time notifications.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBroadcastOpen(false)}
                                className="rounded-full border border-white/10 p-2 text-zinc-400 hover:text-white hover:bg-white/5"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} />
                            </button>
                        </div>

                        <div className="space-y-3 mt-5">
                            <select
                                value={messageType}
                                onChange={(event) => setMessageType(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            >
                                <option value="emergency">Emergency</option>
                                <option value="set-change">Set Time Change</option>
                                <option value="info">General Info</option>
                            </select>
                            <textarea
                                value={messageBody}
                                onChange={(event) => setMessageBody(event.target.value)}
                                placeholder="Type broadcast payload..."
                                className="w-full h-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                onClick={() => setBroadcastOpen(false)}
                                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setBroadcastOpen(false)}
                                className="rounded-xl bg-pxi-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Send Broadcast
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
