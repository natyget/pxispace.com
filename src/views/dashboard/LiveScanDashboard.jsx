'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Alert02Icon,
    CheckmarkCircle02Icon,
    Megaphone01Icon,
} from '@hugeicons/core-free-icons';
import Modal from '@/components/ui/Modal';
import { useDashboardShellStore } from '@/lib/dashboardShellStore';
import { useEvents } from '@/lib/dashboardStore';
import { listTeamRosters } from '@/services/teamRosters';
import { authStorage } from '@/services/auth';
import { getLiveOpsSnapshot } from '@/services/liveOps';
import { listGates, createGate, updateGate, deleteGate } from '@/services/gates';

// `process.env.NEXT_PUBLIC_*` verbatim — Next inlines this form only. Written as
// `globalThis.process?.env?.X` it is never substituted, resolves to undefined in the
// browser, and silently falls through to the localhost default in production.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

function formatClockTime(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
}

function cx(...classes) {
    return classes.filter(Boolean).join(' ');
}

function StateChip({ state, muted = false }) {
    if (state === 'Accepted') {
        return (
            <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]', muted ? 'bg-white/5 text-zinc-500' : 'bg-emerald-500/10 text-emerald-300')}>
                Accepted
            </span>
        );
    }

    if (state === 'Flagged') {
        return (
            <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em]', muted ? 'bg-white/5 text-zinc-500' : 'bg-red-500/10 text-red-300')}>
                Flagged
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-zinc-400">
            {state}
        </span>
    );
}

function GlassPanel({ children, className = '', muted = false }) {
    return (
        <section className={cx('glass-panel rounded-[1.25rem] p-5', muted && 'grayscale opacity-65', className)}>
            {children}
        </section>
    );
}

function DormantMessage() {
    return (
        <div className="dashboard-surface-b rounded-[1.25rem] px-4 py-3 text-sm font-semibold text-zinc-300">
            Goes live during active events.
        </div>
    );
}

function OpsMetric({ label, value, hint }) {
    return (
        <div className="rounded-2xl bg-white/[0.045] px-4 py-4">
            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
            {hint ? <p className="mt-1 text-xs font-semibold text-zinc-500">{hint}</p> : null}
        </div>
    );
}

function CapacityIndicator({ isLive, capacity, scanned, sold }) {
    const hasCapacity = typeof capacity === 'number' && capacity > 0;
    const denominator = hasCapacity ? capacity : sold || 0;
    const capacityPercent = denominator > 0 ? Math.round(((scanned || 0) / denominator) * 100) : 0;

    return (
        <GlassPanel muted={!isLive}>
            <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Capacity</p>
            <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-3xl font-bold text-white">
                    {(scanned || 0).toLocaleString()}
                    <span className="text-base text-zinc-500"> / {hasCapacity ? capacity.toLocaleString() : `${(sold || 0).toLocaleString()} sold`}</span>
                </p>
                <p className="text-sm font-bold text-zinc-400">{capacityPercent}% {hasCapacity ? 'full' : 'scanned'}</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                    className={cx('h-full rounded-full transition-all', isLive ? 'bg-emerald-300' : 'bg-zinc-600')}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                />
            </div>
            {!isLive ? <p className="mt-3 text-xs font-semibold text-zinc-500">Goes live during active events.</p> : null}
        </GlassPanel>
    );
}

/** Per-minute entry velocity over the last hour, from real TicketScanEvent buckets. */
function EntryVelocityPanel({ isLive, velocity }) {
    const bars = useMemo(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        const counts = new Map((velocity || []).map((bucket) => [bucket.minute, bucket.count]));
        const series = [];
        for (let i = 59; i >= 0; i--) {
            const minute = new Date(now.getTime() - i * 60000).toISOString();
            series.push(counts.get(minute) || 0);
        }
        return series;
    }, [velocity]);
    const max = Math.max(1, ...bars);
    const lastFive = bars.slice(-5).reduce((sum, n) => sum + n, 0);

    return (
        <GlassPanel muted={!isLive}>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Entry velocity</p>
                    <p className="mt-2 text-3xl font-bold text-white">
                        {lastFive}
                        <span className="text-base text-zinc-500"> entries / 5 min</span>
                    </p>
                </div>
                <p className="text-xs font-semibold text-zinc-500">Last hour, per minute</p>
            </div>
            <div className="mt-4 flex h-14 items-end gap-[2px]">
                {bars.map((count, index) => (
                    <div
                        key={index}
                        className={cx('flex-1 rounded-t-sm', isLive ? 'bg-emerald-300/70' : 'bg-zinc-600/60')}
                        style={{ height: `${Math.max(4, Math.round((count / max) * 100))}%`, opacity: count === 0 ? 0.18 : 1 }}
                    />
                ))}
            </div>
            {!isLive ? <p className="mt-3 text-xs font-semibold text-zinc-500">Goes live during active events.</p> : null}
        </GlassPanel>
    );
}

function RecentScansSection({ isLive, scans, onIncident }) {
    return (
        <GlassPanel muted={!isLive}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Recent Scans</h2>
                    <p className="mt-1 text-sm text-zinc-500">{isLive ? 'Latest tickets scanned in, across every gate.' : 'Goes live during active events.'}</p>
                </div>
            </div>
            <div className="mt-4 space-y-2">
                {scans.map((scan) => (
                    <div key={scan.id} className="grid gap-3 rounded-2xl bg-white/[0.035] px-4 py-3 md:grid-cols-[1.2fr_0.9fr_0.7fr_auto] md:items-center">
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
                            disabled={!isLive || !scan.gateId}
                            title={scan.gateId ? 'Log an incident for this scan on its gate' : 'Assign this scan’s gate on the board to log incidents'}
                            onClick={() => onIncident(scan)}
                            className={cx(
                                'rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] transition',
                                isLive && scan.gateId ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'cursor-not-allowed bg-white/5 text-zinc-500'
                            )}
                        >
                            Incident Report
                        </button>
                    </div>
                ))}
                {!scans.length ? (
                    <div className="rounded-2xl bg-white/[0.035] px-4 py-4 text-sm text-zinc-500">
                        {isLive ? 'No tickets scanned yet.' : 'Goes live during active events.'}
                    </div>
                ) : null}
            </div>
        </GlassPanel>
    );
}

function GateCard({ gate, isLive, menuOpen, onOpen, onEdit, onTogglePause, onToggleMenu, onDelete }) {
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
                'glass-panel relative min-h-[260px] cursor-pointer rounded-[1.25rem] p-5 transition hover:bg-white/[0.07]',
                !isLive && 'grayscale opacity-65'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={cx('h-3 w-3 rounded-full', gate.paused ? 'bg-amber-300' : issueScans.length ? 'bg-red-400' : 'bg-emerald-300')} />
                        <h3 className="text-xl font-bold text-white">{gate.name}</h3>
                    </div>
                    <p className="mt-1 text-xs font-bold tracking-[0.02em] text-zinc-500">
                        {isLive ? `${gate.scans.length} scan${gate.scans.length === 1 ? '' : 's'} recent` : 'Goes live during active events'}
                    </p>
                </div>
                <div className="relative">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleMenu(gate.id);
                        }}
                        className="pill-ghost px-3 py-1 text-sm font-bold"
                        aria-label={`${gate.name} options`}
                    >
                        ...
                    </button>
                    {menuOpen ? (
                        <div
                            className="glass-panel absolute right-0 top-9 z-20 w-44 rounded-xl p-2"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => onEdit(gate)}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-300 hover:bg-white/10"
                            >
                                Edit gate
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
                    onTogglePause(gate);
                }}
                className={cx(
                    'mt-5 rounded-full px-4 py-2 text-xs font-bold tracking-[0.02em] transition',
                    !isLive
                        ? 'cursor-not-allowed bg-white/5 text-zinc-500'
                        : gate.paused
                            ? 'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-200 hover:bg-red-500/20'
                )}
            >
                {gate.paused ? 'Resume Scan' : 'Halt Scan'}
            </button>

            <div className="mt-5 max-h-32 space-y-2 overflow-y-auto pr-1">
                {gate.scans.map((scan) => (
                    <div key={`${gate.id}-${scan.id}`} className="rounded-xl glass-field px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-white">{scan.ticket}</p>
                            <StateChip state={scan.state} muted={!isLive} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{scan.name} / {scan.at}</p>
                    </div>
                ))}
                {!gate.scans.length ? (
                    <div className="rounded-xl bg-white/[0.035] px-3 py-4 text-sm text-zinc-500">
                        No scans yet.
                    </div>
                ) : null}
            </div>

            <p className="mt-4 text-xs font-semibold text-zinc-500">
                {issueScans.length ? `${issueScans.length} issue${issueScans.length > 1 ? 's' : ''} flagged` : 'No active issues'}
            </p>
            {gate.assignedPeople?.length ? (
                <p className="mt-2 text-[11px] font-medium tracking-[0.02em] text-white/35">
                    {gate.assignedPeople.length} assigned
                </p>
            ) : null}
        </article>
    );
}

function GateEditModal({ open, gate, rosterMembers, saving, onClose, onSave }) {
    const [name, setName] = useState('');
    const [assignedPeople, setAssignedPeople] = useState([]);

    useEffect(() => {
        if (!open) return undefined;
        const timer = setTimeout(() => {
            setName(gate?.name || '');
            setAssignedPeople(gate?.assignedPeople || []);
        }, 0);
        return () => clearTimeout(timer);
    }, [gate, open]);

    const togglePerson = (member) => {
        const id = member.id;
        setAssignedPeople((current) => (
            current.some((person) => person.id === id)
                ? current.filter((person) => person.id !== id)
                : [...current, member]
        ));
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={gate?.id ? 'Edit gate' : 'Create gate'}
            description="Name the gate and assign the people who should run it."
            maxWidth="max-w-2xl"
        >
            <div className="space-y-5">
                <label className="block">
                    <span className="text-[11px] font-medium tracking-[0.02em] text-white/40">Gate name</span>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="glass-field mt-2 min-h-[46px] w-full rounded-2xl px-4 text-sm text-white"
                        placeholder="North Entry"
                    />
                </label>
                <div>
                    <p className="text-[11px] font-medium tracking-[0.02em] text-white/40">Assign people</p>
                    <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto">
                        {rosterMembers.length ? rosterMembers.map((member) => {
                            const active = assignedPeople.some((person) => person.id === member.id);
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => togglePerson(member)}
                                    className={`px-3 py-2 text-xs font-bold ${active ? 'pill-solid' : 'pill-ghost'}`}
                                >
                                    {member.label}
                                </button>
                            );
                        }) : <p className="text-sm text-zinc-500">Create a team first to assign staff here.</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="pill-ghost px-4 py-2 text-sm font-bold">Cancel</button>
                    <button
                        type="button"
                        disabled={!name.trim() || saving}
                        onClick={() => onSave({ ...gate, name: name.trim(), assignedPeople })}
                        className="pill-solid px-4 py-2 text-sm disabled:opacity-40"
                    >
                        {saving ? 'Saving...' : 'Save gate'}
                    </button>
                </div>
            </div>
        </Modal>
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
                <div className="rounded-2xl glass-field p-4">
                    <h3 className="text-sm font-bold tracking-[0.02em] text-zinc-400">All Tickets Scanned</h3>
                    <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                        {gate.scans.map((scan) => (
                            <div key={`modal-${scan.id}`} className="flex items-center justify-between gap-3 rounded-xl glass-field px-3 py-3">
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
                    <div className="rounded-2xl glass-field p-4">
                        <h3 className="text-sm font-bold tracking-[0.02em] text-zinc-400">Flagged Issues</h3>
                        <div className="mt-3 space-y-2">
                            {flaggedIssues.map((scan) => (
                                <div key={`flag-${scan.id}`} className="rounded-xl bg-red-500/10 px-3 py-3">
                                    <p className="text-sm font-bold text-red-100">{scan.ticket}</p>
                                    <p className="mt-1 text-xs text-red-200/70">{scan.state} at {scan.at}</p>
                                </div>
                            ))}
                            {!flaggedIssues.length ? <p className="text-sm text-zinc-500">No flagged issues.</p> : null}
                        </div>
                    </div>

                    <div className="rounded-2xl glass-field p-4">
                        <h3 className="text-sm font-bold tracking-[0.02em] text-zinc-400">Incident Log</h3>
                        <div className="mt-3 space-y-2">
                            {(gate.incidentLog || []).map((entry, index) => {
                                const noteText = typeof entry === 'string' ? entry : (entry?.note || entry?.text || entry?.message || '');
                                const timeVal = typeof entry === 'object' && entry?.at ? formatClockTime(entry.at) : null;
                                return (
                                    <div key={`${index}`} className="flex items-start gap-2 rounded-xl glass-field px-3 py-2 text-sm text-zinc-300 min-w-0 break-words">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/45" />
                                        <span className="min-w-0 break-words flex-1">
                                            {noteText}
                                            {timeVal ? <span className="ml-2 text-xs text-zinc-500">{timeVal}</span> : null}
                                        </span>
                                    </div>
                                );
                            })}
                            {!(gate.incidentLog || []).length ? <p className="text-sm text-zinc-500">No incidents logged.</p> : null}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

/** Server EventGate → UI gate shape. */
function toUiGate(gate) {
    return {
        id: gate.id,
        name: gate.name,
        paused: Boolean(gate.isPaused),
        assignedPeople: Array.isArray(gate.staffJson) ? gate.staffJson : [],
        incidentLog: Array.isArray(gate.incidentsJson) ? gate.incidentsJson : [],
    };
}

export default function LiveScanDashboard({ isLiveEvent }) {
    const shellLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);
    const eventIsLive = isLiveEvent ?? shellLiveEvent;
    const [gates, setGates] = useState([]);
    const [gatesError, setGatesError] = useState('');
    const [savingGate, setSavingGate] = useState(false);
    const [teamRosters, setTeamRosters] = useState([]);
    const [selectedGateId, setSelectedGateId] = useState(null);
    const [menuGateId, setMenuGateId] = useState(null);
    const [editingGate, setEditingGate] = useState(null);
    const [snapshot, setSnapshot] = useState(null);

    const { events } = useEvents({ limit: 100, offset: 0 });
    const liveEvents = useMemo(() => {
        const nowMs = Date.now();
        return (events || []).filter((event) => {
            const status = String(event?.status || '').toUpperCase();
            if (status === 'LIVE' || status === 'ACTIVE') return true;
            const startMs = event.startDate ? new Date(event.startDate).getTime() : 0;
            const endMs = event.endDate ? new Date(event.endDate).getTime() : 0;
            return startMs && startMs <= nowMs && (!endMs || endMs >= nowMs);
        });
    }, [events]);
    // Live event first; otherwise the next upcoming event so gates can be set up ahead of doors.
    const upcomingEvent = useMemo(() => {
        const nowMs = Date.now();
        return [...(events || [])]
            .filter((event) => event.startDate && new Date(event.startDate).getTime() > nowMs)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;
    }, [events]);
    const selectedEvent = liveEvents[0] || upcomingEvent || null;
    const selectedEventId = selectedEvent?.id || null;

    const refreshGates = useCallback(() => {
        if (!selectedEventId) {
            setGates([]);
            return;
        }
        listGates(selectedEventId)
            .then((res) => {
                setGates((res.gates || []).map(toUiGate));
                setGatesError('');
            })
            .catch(() => setGatesError('Could not load gates for this event.'));
    }, [selectedEventId]);

    const realRecentScans = useMemo(() => (snapshot?.recentScans || []).map((scan) => ({
        id: scan.id,
        ticket: scan.ticketId.slice(0, 8).toUpperCase(),
        name: scan.attendee?.name ? `@${scan.attendee.name}` : 'Guest',
        state: 'Accepted',
        gate: scan.gate || 'Unassigned',
        at: formatClockTime(scan.scannedAt),
    })), [snapshot]);

    const gatesWithRealScans = useMemo(() => gates.map((gate) => ({
        ...gate,
        scans: realRecentScans.filter((scan) => scan.gate.toLowerCase() === gate.name.toLowerCase()),
    })), [gates, realRecentScans]);

    const scansWithGateIds = useMemo(() => realRecentScans.map((scan) => ({
        ...scan,
        gateId: gates.find((gate) => gate.name.toLowerCase() === scan.gate.toLowerCase())?.id || null,
    })), [realRecentScans, gates]);

    const selectedGate = gatesWithRealScans.find((gate) => gate.id === selectedGateId);
    const flagCount = useMemo(
        () => gatesWithRealScans.reduce((sum, gate) => sum + gate.scans.filter((scan) => scan.state === 'Flagged' || scan.state === 'Manual Check').length, 0),
        [gatesWithRealScans]
    );
    const activeStaffCount = useMemo(
        () => new Set(gates.flatMap((gate) => gate.assignedPeople || []).map((person) => person.id)).size,
        [gates]
    );
    const rosterMembers = useMemo(() => teamRosters.flatMap((roster) => (
        (roster.members || []).map((member) => ({
            id: `${roster.id}:${member.id}`,
            label: member.name || member.handle || member.contact || member.id,
            rosterId: roster.id,
            memberId: member.id,
            role: member.role,
        }))
    )), [teamRosters]);

    useEffect(() => {
        let alive = true;
        const timer = setTimeout(() => {
            listTeamRosters()
                .then((next) => {
                    if (alive) setTeamRosters(next);
                })
                .catch(() => {
                    if (alive) setTeamRosters([]);
                });
        }, 0);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, []);

    // Server-persisted gates for the selected event.
    useEffect(() => {
        const timer = setTimeout(refreshGates, 0);
        return () => clearTimeout(timer);
    }, [refreshGates]);

    // Real live-ops data: initial fetch + SSE for scan updates.
    useEffect(() => {
        if (!selectedEventId) {
            setSnapshot(null);
            return undefined;
        }
        let alive = true;

        const refresh = () => {
            getLiveOpsSnapshot(selectedEventId).then((data) => { if (alive) setSnapshot(data); }).catch(() => {});
        };
        refresh();

        const token = authStorage.getToken();
        let es;
        if (token) {
            es = new EventSource(
                `${BASE_URL}/api/analytics/events/${selectedEventId}/live-ops/stream?token=${encodeURIComponent(token)}`
            );
            es.addEventListener('scan', refresh);
        }

        return () => {
            alive = false;
            es?.close();
        };
    }, [selectedEventId]);

    const addGate = () => {
        if (!selectedEventId) return;
        setEditingGate({
            id: '',
            name: `Gate ${gates.length + 1}`,
            paused: false,
            assignedPeople: [],
            incidentLog: [],
        });
    };

    const toggleGatePause = async (gate) => {
        if (!eventIsLive || !selectedEventId) return;
        try {
            await updateGate(selectedEventId, gate.id, { isPaused: !gate.paused });
            refreshGates();
        } catch {
            setGatesError('Could not update the gate. Try again.');
        }
    };

    const removeGate = async (gateId) => {
        if (!selectedEventId) return;
        try {
            await deleteGate(selectedEventId, gateId);
        } catch {
            setGatesError('Could not delete the gate. Try again.');
        }
        setMenuGateId(null);
        if (selectedGateId === gateId) setSelectedGateId(null);
        refreshGates();
    };

    const saveGate = async (gate) => {
        if (!selectedEventId) return;
        setSavingGate(true);
        setGatesError('');
        try {
            if (gate.id) {
                await updateGate(selectedEventId, gate.id, { name: gate.name, staffJson: gate.assignedPeople });
            } else {
                await createGate(selectedEventId, { name: gate.name, staffJson: gate.assignedPeople });
            }
            setEditingGate(null);
            setMenuGateId(null);
            refreshGates();
        } catch (err) {
            setGatesError(err?.data?.error || err?.message || 'Could not save the gate.');
        } finally {
            setSavingGate(false);
        }
    };

    const reportIncident = async (scan) => {
        if (!selectedEventId || !scan.gateId) return;
        try {
            await updateGate(selectedEventId, scan.gateId, {
                appendIncident: `Incident reported on ticket ${scan.ticket} (${scan.name}) at ${scan.gate}`,
            });
            refreshGates();
        } catch {
            setGatesError('Could not log the incident. Try again.');
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <section className="dashboard-surface-b rounded-[1.25rem] px-5 py-6 md:px-7">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Live Operations</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Live control room</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                            Gate flow, entry velocity, and incident response — live from real scans. Money lives in Earnings.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <OpsMetric label="Mode" value={eventIsLive ? 'Live' : 'Preview'} hint={eventIsLive ? 'Controls enabled' : 'Planning only'} />
                        <OpsMetric label="Gates" value={gates.length} hint={`${gates.filter((gate) => gate.paused).length} paused`} />
                        <OpsMetric label="Flags" value={flagCount} hint="Needs review" />
                        <OpsMetric label="Staff" value={activeStaffCount || '-'} hint="Assigned today" />
                    </div>
                </div>
            </section>

            {eventIsLive && liveEvents.length > 1 ? (
                <div className="rounded-2xl bg-white/[0.045] px-4 py-3 text-xs font-semibold text-zinc-300">
                    You have {liveEvents.length} events live right now — showing <span className="text-white">{selectedEvent?.name}</span>.
                </div>
            ) : null}
            {eventIsLive && !liveEvents.length ? (
                <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
                    Marked live, but no matching event was found to load real scan data for.
                </div>
            ) : null}
            {!eventIsLive && selectedEvent ? (
                <div className="rounded-2xl bg-white/[0.045] px-4 py-3 text-xs font-semibold text-zinc-400">
                    Setting up gates for <span className="text-white">{selectedEvent.name}</span> — scans go live when the event does.
                </div>
            ) : null}
            {gatesError ? (
                <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">{gatesError}</div>
            ) : null}

            {!eventIsLive && !selectedEvent ? <DormantMessage /> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CapacityIndicator
                    isLive={eventIsLive}
                    capacity={snapshot?.capacity}
                    scanned={snapshot?.ticketsScanned}
                    sold={snapshot?.ticketsSold}
                />
                <EntryVelocityPanel isLive={eventIsLive} velocity={snapshot?.velocity} />
            </div>

            <GlassPanel muted={!eventIsLive && !selectedEvent}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">Gate Control</h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            {selectedEvent
                                ? 'Tap a gate for scanned tickets, issues, and incident history. Gates are shared with every operator.'
                                : 'Create an event to configure its gates.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addGate}
                        disabled={!selectedEventId}
                        className={cx(
                            'flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold transition',
                            selectedEventId ? 'bg-white text-black hover:bg-zinc-200' : 'cursor-not-allowed bg-white/5 text-zinc-500'
                        )}
                        aria-label="Add gate"
                    >
                        +
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {gatesWithRealScans.map((gate) => (
                        <GateCard
                            key={gate.id}
                            gate={gate}
                            isLive={eventIsLive}
                            menuOpen={menuGateId === gate.id}
                            onOpen={setSelectedGateId}
                            onEdit={setEditingGate}
                            onTogglePause={toggleGatePause}
                            onToggleMenu={(gateId) => setMenuGateId((current) => (current === gateId ? null : gateId))}
                            onDelete={removeGate}
                        />
                    ))}
                    {!gates.length ? (
                        <div className="glass-panel rounded-2xl p-8 text-center text-sm font-semibold text-zinc-500 lg:col-span-3">
                            Add a gate to label scans by door (e.g. &quot;North Entry&quot;) — scanners tag the gate name at scan time.
                        </div>
                    ) : null}
                </div>
            </GlassPanel>

            <RecentScansSection isLive={eventIsLive} scans={scansWithGateIds} onIncident={reportIncident} />

            <GlassPanel muted={!eventIsLive && !selectedEvent}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Incident Log</h2>
                        <p className="mt-1 text-sm text-zinc-500">Notes logged per gate, shared with every operator.</p>
                    </div>
                    <HugeiconsIcon icon={Megaphone01Icon} size={20} className="text-zinc-500" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {gates.flatMap((gate) => (gate.incidentLog || []).map((entry, i) => {
                        const noteText = typeof entry === 'string' ? entry : (entry?.note || entry?.text || entry?.message || '');
                        const timeVal = typeof entry === 'object' && entry?.at ? formatClockTime(entry.at) : null;
                        return (
                            <div key={`${gate.id}-${i}`} className="min-w-0 break-words rounded-2xl bg-white/[0.045] p-4">
                                <HugeiconsIcon icon={Alert02Icon} size={18} className={eventIsLive ? 'text-amber-300' : 'text-zinc-500'} />
                                <p className="mt-3 text-sm font-bold text-white">{gate.name}</p>
                                <p className="mt-1 text-xs leading-relaxed text-zinc-400 min-w-0 break-words">
                                    {noteText}
                                    {timeVal ? <span className="ml-2 text-zinc-600">{timeVal}</span> : null}
                                </p>
                            </div>
                        );
                    }))}
                    {!gates.some((gate) => gate.incidentLog?.length) ? (
                        <div className="rounded-2xl bg-white/[0.045] p-4 md:col-span-3">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className={eventIsLive ? 'text-emerald-300' : 'text-zinc-500'} />
                            <p className="mt-3 text-sm font-bold text-white">No incidents logged</p>
                            <p className="mt-1 text-xs text-zinc-500">Report one from a recent scan, or add gates to keep floor notes here.</p>
                        </div>
                    ) : null}
                </div>
            </GlassPanel>

            <GateDetailsModal gate={selectedGate} open={!!selectedGate} onClose={() => setSelectedGateId(null)} />
            <GateEditModal
                open={!!editingGate}
                gate={editingGate}
                rosterMembers={rosterMembers}
                saving={savingGate}
                onClose={() => setEditingGate(null)}
                onSave={saveGate}
            />
        </div>
    );
}
