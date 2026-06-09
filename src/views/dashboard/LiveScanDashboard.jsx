'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Alert02Icon,
    CheckmarkCircle02Icon,
    Megaphone01Icon,
    QrCodeIcon,
    Search01Icon,
    UserGroupIcon,
} from '@hugeicons/core-free-icons';
import Modal from '@/components/ui/Modal';
import { useDashboardShellStore } from '@/lib/dashboardShellStore';

const recentScans = [
    { id: 'scan-1', ticket: 'PXI-4218', name: '@_julesx', state: 'Accepted', gate: 'North Entry', at: '8:09 PM' },
    { id: 'scan-2', ticket: 'PXI-4217', name: '@mariacole', state: 'Accepted', gate: 'North Entry', at: '8:08 PM' },
    { id: 'scan-3', ticket: 'PXI-4216', name: '@davidx', state: 'Flagged', gate: 'VIP Desk', at: '8:07 PM' },
    { id: 'scan-4', ticket: 'PXI-4215', name: '@avryj', state: 'Accepted', gate: 'Main Gate', at: '8:06 PM' },
    { id: 'scan-5', ticket: 'PXI-4214', name: '@rennorth', state: 'Manual Check', gate: 'Main Gate', at: '8:05 PM' },
    { id: 'scan-6', ticket: 'PXI-4213', name: '@kims', state: 'Accepted', gate: 'VIP Desk', at: '8:04 PM' },
];

const initialGates = [
    {
        id: 'north-entry',
        name: 'North Entry',
        velocity: '42 scans/min',
        paused: false,
        issue: false,
        scans: recentScans.filter((scan) => scan.gate === 'North Entry'),
        incidentLog: ['Crowd flow normal', 'Two staff active'],
    },
    {
        id: 'main-gate',
        name: 'Main Gate',
        velocity: '36 scans/min',
        paused: false,
        issue: true,
        scans: recentScans.filter((scan) => scan.gate === 'Main Gate'),
        incidentLog: ['Manual ID check queued', 'Lane two rerouted for three minutes'],
    },
    {
        id: 'vip-desk',
        name: 'VIP Desk',
        velocity: '18 scans/min',
        paused: true,
        issue: true,
        scans: recentScans.filter((scan) => scan.gate === 'VIP Desk'),
        incidentLog: ['Duplicate ticket flagged', 'Supervisor review requested'],
    },
];

const teamMessages = [
    { id: 'team-1', author: 'Floor Lead', body: 'Keep Main Gate open but slow manual checks.', at: '8:06 PM' },
    { id: 'team-2', author: 'Security', body: 'VIP Desk has one duplicate scan under review.', at: '8:07 PM' },
    { id: 'team-3', author: 'Ops', body: 'Capacity pacing looks stable.', at: '8:08 PM' },
];

function cx(...classes) {
    return classes.filter(Boolean).join(' ');
}

function StateChip({ state, muted = false }) {
    if (state === 'Accepted') {
        return (
            <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest', muted ? 'border-white/10 bg-white/5 text-zinc-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300')}>
                Accepted
            </span>
        );
    }

    if (state === 'Flagged') {
        return (
            <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest', muted ? 'border-white/10 bg-white/5 text-zinc-500' : 'border-red-500/30 bg-red-500/10 text-red-300')}>
                Flagged
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {state}
        </span>
    );
}

function GlassPanel({ children, className = '', muted = false }) {
    return (
        <section className={cx('dashboard-surface-b rounded-2xl p-5 shadow-[0_18px_70px_rgba(0,0,0,0.25)]', muted && 'grayscale opacity-65', className)}>
            {children}
        </section>
    );
}

function DormantMessage() {
    return (
        <div className="dashboard-surface-b rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-300">
            Goes live during active events.
        </div>
    );
}

function CapacityIndicator({ isLive }) {
    const venueCapacity = 1200;
    const currentAttendance = isLive ? 894 : 0;
    const capacityPercent = Math.round((currentAttendance / venueCapacity) * 100);

    return (
        <GlassPanel muted={!isLive}>
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Capacity</p>
            <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-3xl font-black tracking-tight text-white">
                    {currentAttendance.toLocaleString()}
                    <span className="text-base text-zinc-500"> / {venueCapacity.toLocaleString()}</span>
                </p>
                <p className="text-sm font-bold text-zinc-400">{capacityPercent}% full</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                    className={cx('h-full rounded-full transition-all', isLive ? 'bg-emerald-300' : 'bg-zinc-600')}
                    style={{ width: `${capacityPercent}%` }}
                />
            </div>
            {!isLive ? <p className="mt-3 text-xs font-semibold text-zinc-500">Goes live during active events.</p> : null}
        </GlassPanel>
    );
}

function TeamMessagePanel({ isLive, onOpenChat }) {
    return (
        <GlassPanel muted={!isLive} className="flex flex-col justify-between gap-4">
            <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Team Message</p>
                <p className="mt-2 text-sm text-zinc-300">Open the shared staff thread for floor, security, and gate leads.</p>
            </div>
            <button
                type="button"
                onClick={onOpenChat}
                disabled={!isLive}
                className={cx(
                    'inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition',
                    isLive ? 'bg-white text-black hover:bg-zinc-200' : 'cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500'
                )}
            >
                <HugeiconsIcon icon={UserGroupIcon} size={15} />
                Team Message
            </button>
        </GlassPanel>
    );
}

function ScanActionPanel({ isLive }) {
    return (
        <GlassPanel muted={!isLive}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                    type="button"
                    disabled={!isLive}
                    className={cx(
                        'inline-flex w-fit items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition',
                        isLive ? 'bg-white text-black hover:bg-zinc-200' : 'cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500'
                    )}
                >
                    <HugeiconsIcon icon={QrCodeIcon} size={15} />
                    Scan Ticket
                </button>
                <div className={cx('flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2', !isLive && 'opacity-60')}>
                    <HugeiconsIcon icon={Search01Icon} size={15} className="text-zinc-500" />
                    <input
                        type="text"
                        placeholder={isLive ? 'Search handle or ticket ID' : 'Goes live during active events'}
                        disabled={!isLive}
                        readOnly
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
                    />
                </div>
            </div>
        </GlassPanel>
    );
}

function RecentScansSection({ isLive }) {
    return (
        <GlassPanel muted={!isLive}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-black tracking-tight text-white">Recent Scans</h2>
                    <p className="mt-1 text-sm text-zinc-500">{isLive ? 'Latest tickets moving through every active gate.' : 'Goes live during active events.'}</p>
                </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                {recentScans.map((scan) => (
                    <div key={scan.id} className="grid gap-3 border-b border-white/10 bg-black/20 px-4 py-3 last:border-b-0 md:grid-cols-[1.2fr_0.9fr_0.7fr_auto] md:items-center">
                        <div>
                            <p className="text-sm font-bold text-white">{scan.name}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{scan.ticket}</p>
                        </div>
                        <p className="text-sm font-semibold text-zinc-300">{scan.gate}</p>
                        <div className="flex items-center gap-3">
                            <StateChip state={scan.state} muted={!isLive} />
                            <span className="text-xs text-zinc-500">{scan.at}</span>
                        </div>
                        <button
                            type="button"
                            disabled={!isLive}
                            className={cx(
                                'rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition',
                                isLive ? 'border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500'
                            )}
                        >
                            Incident Report
                        </button>
                    </div>
                ))}
            </div>
        </GlassPanel>
    );
}

function GateCard({ gate, isLive, menuOpen, onOpen, onTogglePause, onToggleMenu, onDelete }) {
    const issueScans = gate.scans.filter((scan) => scan.state === 'Flagged' || scan.state === 'Manual Check');

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={() => onOpen(gate.id)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onOpen(gate.id);
            }}
            className={cx(
                'dashboard-surface-b relative min-h-[260px] cursor-pointer rounded-2xl p-5 transition hover:border-white/20',
                !isLive && 'grayscale opacity-65'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={cx('h-3 w-3 rounded-full', gate.issue ? 'bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.65)]' : 'bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.55)]')} />
                        <h3 className="text-xl font-black tracking-tight text-white">{gate.name}</h3>
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {isLive ? gate.velocity : 'Goes live during active events'}
                    </p>
                </div>
                <div className="relative">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleMenu(gate.id);
                        }}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm font-black text-zinc-300 hover:bg-white/10 hover:text-white"
                        aria-label={`${gate.name} options`}
                    >
                        ...
                    </button>
                    {menuOpen ? (
                        <div
                            className="dashboard-surface-b absolute right-0 top-9 z-20 w-40 rounded-xl p-2 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-300 hover:bg-white/10">
                                Gate options
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(gate.id)}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-red-200 hover:bg-red-500/10"
                            >
                                Delete gate
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <button
                type="button"
                disabled={!isLive}
                onClick={(event) => {
                    event.stopPropagation();
                    onTogglePause(gate.id);
                }}
                className={cx(
                    'mt-5 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition',
                    !isLive
                        ? 'cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500'
                        : gate.paused
                            ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : 'border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                )}
            >
                {gate.paused ? 'Resume Scan' : 'Halt Scan'}
            </button>

            <div className="mt-5 max-h-32 space-y-2 overflow-y-auto pr-1">
                {gate.scans.map((scan) => (
                    <div key={`${gate.id}-${scan.id}`} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-white">{scan.ticket}</p>
                            <StateChip state={scan.state} muted={!isLive} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{scan.name} / {scan.at}</p>
                    </div>
                ))}
                {!gate.scans.length ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-zinc-500">
                        No scans yet.
                    </div>
                ) : null}
            </div>

            <p className="mt-4 text-xs font-semibold text-zinc-500">
                {issueScans.length ? `${issueScans.length} issue${issueScans.length > 1 ? 's' : ''} flagged` : 'No active issues'}
            </p>
        </article>
    );
}

function GateDetailsModal({ gate, open, onClose }) {
    if (!gate) return null;
    const flaggedIssues = gate.scans.filter((scan) => scan.state === 'Flagged' || scan.state === 'Manual Check');

    return (
        <Modal
            open={open}
            title={gate.name}
            description="All scanned tickets, flagged issues, and incident log for this gate."
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">All Tickets Scanned</h3>
                    <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                        {gate.scans.map((scan) => (
                            <div key={`modal-${scan.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.055] px-3 py-3">
                                <div>
                                    <p className="text-sm font-bold text-white">{scan.ticket}</p>
                                    <p className="text-xs text-zinc-500">{scan.name} / {scan.at}</p>
                                </div>
                                <StateChip state={scan.state} />
                            </div>
                        ))}
                        {!gate.scans.length ? <p className="text-sm text-zinc-500">No tickets scanned yet.</p> : null}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Flagged Issues</h3>
                        <div className="mt-3 space-y-2">
                            {flaggedIssues.map((scan) => (
                                <div key={`flag-${scan.id}`} className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-3">
                                    <p className="text-sm font-bold text-red-100">{scan.ticket}</p>
                                    <p className="mt-1 text-xs text-red-200/70">{scan.state} at {scan.at}</p>
                                </div>
                            ))}
                            {!flaggedIssues.length ? <p className="text-sm text-zinc-500">No flagged issues.</p> : null}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Incident Log</h3>
                        <div className="mt-3 space-y-2">
                            {gate.incidentLog.map((entry) => (
                                <div key={entry} className="flex gap-2 rounded-xl bg-white/[0.055] px-3 py-2 text-sm text-zinc-300">
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-pxi-purple" />
                                    <span>{entry}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function TeamChatModal({ open, onClose }) {
    const [draft, setDraft] = useState('');

    return (
        <Modal
            open={open}
            title="Team Message"
            description="Group chat for live event staff."
            onClose={onClose}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-3">
                {teamMessages.map((message) => (
                    <div key={message.id} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-white">{message.author}</p>
                            <p className="text-xs text-zinc-500">{message.at}</p>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">{message.body}</p>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Message the operations team..."
                    className="min-h-20 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                    type="button"
                    onClick={() => setDraft('')}
                    className="self-end rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-zinc-200"
                >
                    Send
                </button>
            </div>
        </Modal>
    );
}

export default function LiveScanDashboard({ isLiveEvent }) {
    const shellLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);
    const eventIsLive = isLiveEvent ?? shellLiveEvent;
    const [gates, setGates] = useState(initialGates);
    const [selectedGateId, setSelectedGateId] = useState(null);
    const [menuGateId, setMenuGateId] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);

    const selectedGate = gates.find((gate) => gate.id === selectedGateId);

    const addGate = () => {
        if (!eventIsLive) return;
        const nextNumber = gates.length + 1;
        setGates((current) => [
            ...current,
            {
                id: `gate-${Date.now()}`,
                name: `Gate ${nextNumber}`,
                velocity: '0 scans/min',
                paused: false,
                issue: false,
                scans: [],
                incidentLog: ['Gate added to operations board'],
            },
        ]);
    };

    const toggleGatePause = (gateId) => {
        if (!eventIsLive) return;
        setGates((current) => current.map((gate) => (gate.id === gateId ? { ...gate, paused: !gate.paused } : gate)));
    };

    const deleteGate = (gateId) => {
        setGates((current) => current.filter((gate) => gate.id !== gateId));
        setMenuGateId(null);
        if (selectedGateId === gateId) setSelectedGateId(null);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header>
                <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Operations</h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-500">Live event controls for gates, scans, and incident response.</p>
            </header>

            {!eventIsLive ? <DormantMessage /> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <CapacityIndicator isLive={eventIsLive} />
                <TeamMessagePanel isLive={eventIsLive} onOpenChat={() => setChatOpen(true)} />
            </div>

            <ScanActionPanel isLive={eventIsLive} />

            <GlassPanel muted={!eventIsLive}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-white">Gate Control</h2>
                        <p className="mt-1 text-sm text-zinc-500">{eventIsLive ? 'Tap a gate for scanned tickets, issues, and incident history.' : 'Goes live during active events.'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={addGate}
                        disabled={!eventIsLive}
                        className={cx(
                            'flex h-10 w-10 items-center justify-center rounded-full text-2xl font-black transition',
                            eventIsLive ? 'bg-white text-black hover:bg-zinc-200' : 'cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500'
                        )}
                        aria-label="Add gate"
                    >
                        +
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {gates.map((gate) => (
                        <GateCard
                            key={gate.id}
                            gate={gate}
                            isLive={eventIsLive}
                            menuOpen={menuGateId === gate.id}
                            onOpen={setSelectedGateId}
                            onTogglePause={toggleGatePause}
                            onToggleMenu={(gateId) => setMenuGateId((current) => (current === gateId ? null : gateId))}
                            onDelete={deleteGate}
                        />
                    ))}
                    {!gates.length ? (
                        <div className="dashboard-surface-b rounded-2xl border-dashed p-8 text-center text-sm font-semibold text-zinc-500 lg:col-span-3">
                            Add a gate when Operations is live.
                        </div>
                    ) : null}
                </div>
            </GlassPanel>

            <RecentScansSection isLive={eventIsLive} />

            <GlassPanel muted={!eventIsLive}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-white">Incident Response</h2>
                        <p className="mt-1 text-sm text-zinc-500">{eventIsLive ? 'Active flags and resolved floor issues.' : 'Goes live during active events.'}</p>
                    </div>
                    <HugeiconsIcon icon={Megaphone01Icon} size={20} className="text-zinc-500" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                        <HugeiconsIcon icon={Alert02Icon} size={18} className={eventIsLive ? 'text-red-300' : 'text-zinc-500'} />
                        <p className="mt-3 text-sm font-black text-white">Duplicate ticket watch</p>
                        <p className="mt-1 text-xs text-zinc-500">VIP Desk flagged one ticket.</p>
                    </div>
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                        <HugeiconsIcon icon={Alert02Icon} size={18} className={eventIsLive ? 'text-amber-300' : 'text-zinc-500'} />
                        <p className="mt-3 text-sm font-black text-white">Manual check lane</p>
                        <p className="mt-1 text-xs text-zinc-500">Main Gate review queue is open.</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className={eventIsLive ? 'text-emerald-300' : 'text-zinc-500'} />
                        <p className="mt-3 text-sm font-black text-white">Crowd flow stable</p>
                        <p className="mt-1 text-xs text-zinc-500">North Entry is clear.</p>
                    </div>
                </div>
            </GlassPanel>

            <GateDetailsModal gate={selectedGate} open={!!selectedGate} onClose={() => setSelectedGateId(null)} />
            <TeamChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
        </div>
    );
}
