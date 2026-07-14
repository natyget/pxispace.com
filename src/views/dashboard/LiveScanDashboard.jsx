'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useEvents } from '@/lib/dashboardStore';
import { listTeamRosters } from '@/services/teamRosters';
import { authStorage } from '@/services/auth';
import { getLiveOpsSnapshot } from '@/services/liveOps';
import { BUDGET_CATEGORIES, getBudgetSummary, setBudgets, createExpense } from '@/services/budget';

const BASE_URL = globalThis.process?.env?.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const GATES_STORAGE_KEY = 'pxi.live_ops.gates.v1';

const initialGates = [];

const teamMessages = [
    { id: 'team-1', author: 'Floor Lead', body: 'Keep Main Gate open but slow manual checks.', at: '8:06 PM' },
    { id: 'team-2', author: 'Security', body: 'VIP Desk has one duplicate scan under review.', at: '8:07 PM' },
    { id: 'team-3', author: 'Ops', body: 'Capacity pacing looks stable.', at: '8:08 PM' },
];

function formatCents(cents) {
    return `$${((Number(cents) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

function RevenueCostPanel({ isLive, revenue, costCents, netProfitCents }) {
    const tiles = [
        { label: 'Revenue (net to you)', value: formatCents(revenue?.organizerNetCents) },
        { label: 'PXI fees', value: formatCents(revenue?.platformFeesCents) },
        { label: 'Costs logged', value: formatCents(costCents) },
        { label: 'Net profit', value: formatCents(netProfitCents), emphasize: true },
    ];
    return (
        <GlassPanel muted={!isLive}>
            <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Revenue &amp; cost</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {tiles.map((tile) => (
                    <div key={tile.label} className="rounded-2xl bg-white/[0.045] px-4 py-3">
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">{tile.label}</p>
                        <p className={cx('mt-1 text-xl font-bold tabular-nums', tile.emphasize ? (Number(netProfitCents) >= 0 ? 'text-emerald-300' : 'text-red-300') : 'text-white')}>
                            {tile.value}
                        </p>
                    </div>
                ))}
            </div>
            {!isLive ? <p className="mt-3 text-xs font-semibold text-zinc-500">Goes live during active events.</p> : null}
        </GlassPanel>
    );
}

function TeamMessagePanel({ isLive, onOpenChat }) {
    return (
        <GlassPanel muted={!isLive} className="flex flex-col justify-between gap-4">
            <div>
                <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Team Message</p>
                <p className="mt-2 text-sm text-zinc-300">Open the shared staff thread for floor, security, and gate leads.</p>
            </div>
            <button
                type="button"
                onClick={onOpenChat}
                disabled={!isLive}
                className={cx(
                    'inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-[0.02em] transition',
                    isLive ? 'bg-white text-black hover:bg-zinc-200' : 'cursor-not-allowed bg-white/5 text-zinc-500'
                )}
            >
                <HugeiconsIcon icon={UserGroupIcon} size={15} />
                Team Message
            </button>
        </GlassPanel>
    );
}

function ScanActionPanel() {
    // In-browser QR scanning isn't built yet — ticket scanning (POST /api/tickets/validate)
    // happens in the PXI mobile app today. Keep this visible but honestly disabled rather
    // than pretending a tap here scans anything.
    return (
        <GlassPanel muted>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                    type="button"
                    disabled
                    title="Ticket scanning happens in the PXI mobile app today"
                    className="inline-flex w-fit cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.02em] text-zinc-500"
                >
                    <HugeiconsIcon icon={QrCodeIcon} size={15} />
                    Scan Ticket
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full glass-field px-4 py-2 opacity-60">
                    <HugeiconsIcon icon={Search01Icon} size={15} className="text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Scan from PXI mobile; results sync here when connected"
                        disabled
                        readOnly
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
                    />
                </div>
            </div>
        </GlassPanel>
    );
}

function RecentScansSection({ isLive, scans }) {
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
                            disabled={!isLive}
                            className={cx(
                                'rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] transition',
                                isLive ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'cursor-not-allowed bg-white/5 text-zinc-500'
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
                        <span className={cx('h-3 w-3 rounded-full', gate.issue ? 'bg-red-400' : 'bg-emerald-300')} />
                        <h3 className="text-xl font-bold text-white">{gate.name}</h3>
                    </div>
                    <p className="mt-1 text-xs font-bold tracking-[0.02em] text-zinc-500">
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
                    onTogglePause(gate.id);
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

function GateEditModal({ open, gate, rosterMembers, onClose, onSave }) {
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
                        disabled={!name.trim()}
                        onClick={() => onSave({ ...gate, name: name.trim(), assignedPeople })}
                        className="pill-solid px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Save gate
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
                            {gate.incidentLog.map((entry) => (
                                <div key={entry} className="flex gap-2 rounded-xl glass-field px-3 py-2 text-sm text-zinc-300">
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/45" />
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
                    <div key={message.id} className="rounded-2xl glass-field px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-white">{message.author}</p>
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
                    className="min-h-20 flex-1 rounded-2xl glass-field px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                    type="button"
                    disabled
                    title="Team messaging is not connected to live chat yet"
                    className="cursor-not-allowed self-end rounded-full bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.02em] text-zinc-500"
                >
                    Send
                </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">Draft only — team chat is not connected yet.</p>
        </Modal>
    );
}

function BudgetPanel({ eventId, isLive, summary, onChanged }) {
    const [drafts, setDrafts] = useState({});
    const [savingBudgets, setSavingBudgets] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: 'OTHER', amount: '', label: '' });
    const [loggingExpense, setLoggingExpense] = useState(false);
    const [error, setError] = useState('');

    if (!summary) return null;
    const byCategory = new Map(summary.byCategory.map((c) => [c.category, c]));

    async function saveBudgets() {
        const budgets = Object.entries(drafts)
            .filter(([, value]) => value !== '' && value != null)
            .map(([category, value]) => ({ category, amountCents: Math.round(Number(value) * 100) }));
        if (!budgets.length) return;
        setSavingBudgets(true);
        setError('');
        try {
            await setBudgets(eventId, budgets);
            setDrafts({});
            onChanged?.();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to save budgets');
        } finally {
            setSavingBudgets(false);
        }
    }

    async function logExpense() {
        const amount = Number(expenseForm.amount);
        if (!expenseForm.label.trim() || !Number.isFinite(amount) || amount <= 0) {
            setError('Enter a label and a positive amount');
            return;
        }
        setLoggingExpense(true);
        setError('');
        try {
            await createExpense(eventId, {
                category: expenseForm.category,
                amountCents: Math.round(amount * 100),
                label: expenseForm.label.trim(),
            });
            setExpenseForm({ category: 'OTHER', amount: '', label: '' });
            onChanged?.();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to log expense');
        } finally {
            setLoggingExpense(false);
        }
    }

    return (
        <GlassPanel muted={!isLive}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white">Budget</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        Set what you planned to spend per category, log real costs as they happen.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Total spent / budgeted</p>
                    <p className="mt-1 text-lg font-bold text-white">
                        {formatCents(summary.totalSpentCents)} <span className="text-zinc-500">/ {formatCents(summary.totalBudgetedCents)}</span>
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {BUDGET_CATEGORIES.map(({ id, label }) => {
                    const row = byCategory.get(id) || { budgetedCents: 0, spentCents: 0 };
                    const pct = row.budgetedCents > 0 ? Math.min(100, Math.round((row.spentCents / row.budgetedCents) * 100)) : 0;
                    return (
                        <div key={id} className="grid grid-cols-[100px_1fr_120px] items-center gap-3 rounded-2xl bg-white/[0.035] px-4 py-3">
                            <p className="text-sm font-bold text-white">{label}</p>
                            <div className="space-y-1">
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={cx('h-full rounded-full', row.spentCents > row.budgetedCents && row.budgetedCents > 0 ? 'bg-red-400' : 'bg-emerald-300')}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">{formatCents(row.spentCents)} spent of {formatCents(row.budgetedCents)}</p>
                            </div>
                            <input
                                type="number"
                                min="0"
                                placeholder={(row.budgetedCents / 100).toFixed(0)}
                                value={drafts[id] ?? ''}
                                onChange={(e) => setDrafts((cur) => ({ ...cur, [id]: e.target.value }))}
                                className="glass-field rounded-xl px-3 py-2 text-sm text-white outline-none"
                            />
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={saveBudgets}
                disabled={savingBudgets || !Object.keys(drafts).length}
                className="pill-solid mt-3 px-4 py-2 text-xs disabled:opacity-40"
            >
                {savingBudgets ? 'Saving...' : 'Save budgets'}
            </button>

            <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[11px] font-bold tracking-[0.02em] text-zinc-500">Log an expense</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, category: e.target.value }))}
                        className="glass-field rounded-xl px-3 py-2 text-sm text-white"
                    >
                        {BUDGET_CATEGORIES.map(({ id, label }) => (
                            <option key={id} value={id}>{label}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="What was it for?"
                        value={expenseForm.label}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, label: e.target.value }))}
                        className="glass-field min-w-[160px] flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                    />
                    <input
                        type="number"
                        min="0"
                        placeholder="Amount ($)"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm((cur) => ({ ...cur, amount: e.target.value }))}
                        className="glass-field w-32 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                    />
                    <button
                        type="button"
                        onClick={logExpense}
                        disabled={loggingExpense}
                        className="pill-solid px-4 py-2 text-xs disabled:opacity-40"
                    >
                        {loggingExpense ? 'Logging...' : 'Log expense'}
                    </button>
                </div>
            </div>
            {error ? <p className="mt-2 text-xs font-semibold text-red-300">{error}</p> : null}
        </GlassPanel>
    );
}

export default function LiveScanDashboard({ isLiveEvent }) {
    const shellLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);
    const eventIsLive = isLiveEvent ?? shellLiveEvent;
    const [gates, setGates] = useState(initialGates);
    const [teamRosters, setTeamRosters] = useState([]);
    const [selectedGateId, setSelectedGateId] = useState(null);
    const [menuGateId, setMenuGateId] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [editingGate, setEditingGate] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [budgetSummary, setBudgetSummary] = useState(null);

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
    const selectedEvent = liveEvents[0] || null;
    const selectedEventId = selectedEvent?.id || null;

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
            try {
                const stored = JSON.parse(window.localStorage.getItem(GATES_STORAGE_KEY) || 'null');
                if (alive && Array.isArray(stored)) setGates(stored);
            } catch {
                if (alive) setGates(initialGates);
            }
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

    // Real live-ops data: initial fetch + SSE for scan/expense/budget updates.
    useEffect(() => {
        if (!selectedEventId) {
            setSnapshot(null);
            setBudgetSummary(null);
            return undefined;
        }
        let alive = true;

        const refresh = () => {
            getLiveOpsSnapshot(selectedEventId).then((data) => { if (alive) setSnapshot(data); }).catch(() => {});
            getBudgetSummary(selectedEventId).then((data) => { if (alive) setBudgetSummary(data); }).catch(() => {});
        };
        refresh();

        const token = authStorage.getToken();
        let es;
        if (token) {
            es = new EventSource(
                `${BASE_URL}/api/analytics/events/${selectedEventId}/live-ops/stream?token=${encodeURIComponent(token)}`
            );
            es.addEventListener('scan', refresh);
            es.addEventListener('expense', refresh);
            es.addEventListener('budget', refresh);
        }

        return () => {
            alive = false;
            es?.close();
        };
    }, [selectedEventId]);

    const persistGates = (updater) => {
        setGates((current) => {
            const next = typeof updater === 'function' ? updater(current) : updater;
            try {
                window.localStorage.setItem(GATES_STORAGE_KEY, JSON.stringify(next));
            } catch {
                /* local persistence only */
            }
            return next;
        });
    };

    const addGate = () => {
        if (!eventIsLive) return;
        setEditingGate({
            id: '',
            name: `Gate ${gates.length + 1}`,
            velocity: '0 scans/min',
            paused: false,
            issue: false,
            scans: [],
            incidentLog: ['Gate added to operations board'],
            assignedPeople: [],
        });
    };

    const toggleGatePause = (gateId) => {
        if (!eventIsLive) return;
        persistGates((current) => current.map((gate) => (gate.id === gateId ? { ...gate, paused: !gate.paused } : gate)));
    };

    const deleteGate = (gateId) => {
        persistGates((current) => current.filter((gate) => gate.id !== gateId));
        setMenuGateId(null);
        if (selectedGateId === gateId) setSelectedGateId(null);
    };

    const saveGate = (gate) => {
        const savedGate = {
            ...gate,
            id: gate.id || `gate-${Date.now()}`,
            scans: gate.scans || [],
            incidentLog: gate.incidentLog?.length ? gate.incidentLog : ['Gate added to operations board'],
        };
        persistGates((current) => {
            if (gate.id) return current.map((item) => (item.id === gate.id ? savedGate : item));
            return [...current, savedGate];
        });
        setEditingGate(null);
        setMenuGateId(null);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <section className="dashboard-surface-b rounded-[1.25rem] px-5 py-6 md:px-7">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Operations</p>
                        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Live control room</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                            Gate flow, scan review, team messages, and incident response in one operator-friendly view.
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
            {eventIsLive && !selectedEventId ? (
                <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200">
                    Marked live, but no matching event was found to load real scan/revenue data for.
                </div>
            ) : null}

            <div className="rounded-2xl bg-white/[0.045] px-4 py-3 text-xs font-semibold text-zinc-400">
                Gate setup, incident notes, and team chat below are planning tools you configure — scans, capacity,
                and revenue/cost are live from real ticket and budget data once an event is live.
            </div>

            {!eventIsLive ? <DormantMessage /> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CapacityIndicator
                    isLive={eventIsLive}
                    capacity={snapshot?.capacity}
                    scanned={snapshot?.ticketsScanned}
                    sold={snapshot?.ticketsSold}
                />
                <RevenueCostPanel
                    isLive={eventIsLive}
                    revenue={snapshot?.revenue}
                    costCents={snapshot?.costCents}
                    netProfitCents={snapshot?.netProfitCents}
                />
            </div>

            <TeamMessagePanel isLive={eventIsLive} onOpenChat={() => setChatOpen(true)} />

            <ScanActionPanel />

            {selectedEventId ? (
                <BudgetPanel
                    eventId={selectedEventId}
                    isLive={eventIsLive}
                    summary={budgetSummary}
                    onChanged={() => getBudgetSummary(selectedEventId).then(setBudgetSummary).catch(() => {})}
                />
            ) : null}

            <GlassPanel muted={!eventIsLive}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">Gate Control</h2>
                        <p className="mt-1 text-sm text-zinc-500">{eventIsLive ? 'Tap a gate for scanned tickets, issues, and incident history.' : 'Goes live during active events.'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={addGate}
                        disabled={!eventIsLive}
                        className={cx(
                            'flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold transition',
                            eventIsLive ? 'bg-white text-black hover:bg-zinc-200' : 'cursor-not-allowed bg-white/5 text-zinc-500'
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
                            onDelete={deleteGate}
                        />
                    ))}
                    {!gates.length ? (
                        <div className="glass-panel rounded-2xl p-8 text-center text-sm font-semibold text-zinc-500 lg:col-span-3">
                            Add a gate to label scans by door (e.g. &quot;North Entry&quot;) — scanners tag the gate name at scan time.
                        </div>
                    ) : null}
                </div>
            </GlassPanel>

            <RecentScansSection isLive={eventIsLive} scans={realRecentScans} />

            <GlassPanel muted={!eventIsLive}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Incident Log</h2>
                        <p className="mt-1 text-sm text-zinc-500">{eventIsLive ? 'Notes logged per gate.' : 'Goes live during active events.'}</p>
                    </div>
                    <HugeiconsIcon icon={Megaphone01Icon} size={20} className="text-zinc-500" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {gates.flatMap((gate) => (gate.incidentLog || []).map((entry, i) => (
                        <div key={`${gate.id}-${i}`} className="rounded-2xl bg-white/[0.045] p-4">
                            <HugeiconsIcon icon={Alert02Icon} size={18} className={eventIsLive ? 'text-amber-300' : 'text-zinc-500'} />
                            <p className="mt-3 text-sm font-bold text-white">{gate.name}</p>
                            <p className="mt-1 text-xs text-zinc-500">{entry}</p>
                        </div>
                    )))}
                    {!gates.some((gate) => gate.incidentLog?.length) ? (
                        <div className="rounded-2xl bg-white/[0.045] p-4 md:col-span-3">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className={eventIsLive ? 'text-emerald-300' : 'text-zinc-500'} />
                            <p className="mt-3 text-sm font-bold text-white">No incidents logged</p>
                            <p className="mt-1 text-xs text-zinc-500">Add a gate and edit it to keep floor notes here.</p>
                        </div>
                    ) : null}
                </div>
            </GlassPanel>

            <GateDetailsModal gate={selectedGate} open={!!selectedGate} onClose={() => setSelectedGateId(null)} />
            <GateEditModal
                open={!!editingGate}
                gate={editingGate}
                rosterMembers={rosterMembers}
                onClose={() => setEditingGate(null)}
                onSave={saveGate}
            />
            <TeamChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
        </div>
    );
}
