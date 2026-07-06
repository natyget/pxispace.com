'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    fetchSupportTickets,
    fetchSupportTicket,
    replySupportTicket,
    updateSupportTicket,
} from '@/services/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import DataSourceBadge from '@/components/dashboard/DataSourceBadge';

const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'WAITING_ON_USER', label: 'Waiting on user' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
];

const statusStyle = {
    OPEN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    IN_PROGRESS: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    WAITING_ON_USER: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CLOSED: 'bg-white/5 text-white/55 border-white/10',
};

const priorityStyle = {
    LOW: 'text-white/45',
    NORMAL: 'text-white/70',
    HIGH: 'text-amber-400',
    URGENT: 'text-red-400',
};

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyle[status] || statusStyle.OPEN}`}>
            {String(status || '').replaceAll('_', ' ')}
        </span>
    );
}

function TicketDetail({ ticketId, onClose, onChanged }) {
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState(null);
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await fetchSupportTicket(ticketId);
            setTicket(data.ticket);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load ticket');
        }
    }, [ticketId]);

    useEffect(() => {
        load();
    }, [load]);

    const act = async (fn) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
            await load();
            onChanged?.();
        } catch (err) {
            setError(err.message || 'Action failed');
        } finally {
            setBusy(false);
        }
    };

    const sendReply = () => {
        const body = reply.trim();
        if (!body) return;
        act(async () => {
            await replySupportTicket(ticketId, body);
            setReply('');
        });
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white">{ticket?.subject || 'Ticket'}</h2>
                    <p className="text-white/50 text-[13px] mt-1">
                        {ticket ? (
                            <>
                                {ticket.user?.email} · {ticket.category} · opened {formatDate(ticket.createdAt)}
                            </>
                        ) : 'Loading…'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-[12px] text-white/70 hover:text-white hover:border-white/25"
                >
                    Close
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-300 text-[13px]">{error}</div>
            )}

            {ticket && (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={ticket.status} />
                        <select
                            value={ticket.status}
                            disabled={busy}
                            onChange={(e) => act(() => updateSupportTicket(ticketId, { status: e.target.value }))}
                            className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[12px] text-white/80 outline-none"
                        >
                            {STATUS_FILTERS.filter((s) => s.value).map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <select
                            value={ticket.priority}
                            disabled={busy}
                            onChange={(e) => act(() => updateSupportTicket(ticketId, { priority: e.target.value }))}
                            className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[12px] text-white/80 outline-none"
                        >
                            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        {ticket.assignee ? (
                            <span className="text-[12px] text-white/55">
                                Assigned: {ticket.assignee.username || ticket.assignee.email}
                            </span>
                        ) : null}
                    </div>

                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {(ticket.messages || []).map((m) => (
                            <div
                                key={m.id}
                                className={`rounded-xl border px-4 py-3 ${
                                    m.isStaff
                                        ? 'border-sky-500/20 bg-sky-500/5 ml-8'
                                        : 'border-white/10 bg-zinc-900/60 mr-8'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">
                                        {m.isStaff ? `PXI Staff${m.author?.username ? ` · ${m.author.username}` : ''}` : (m.author?.username || 'User')}
                                    </span>
                                    <span className="text-[11px] text-white/35">{formatDate(m.createdAt)}</span>
                                </div>
                                <p className="text-[14px] text-white/85 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={3}
                            placeholder="Reply as PXI staff…"
                            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:border-white/25 resize-y"
                        />
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={sendReply}
                                disabled={busy || !reply.trim()}
                                className="rounded-full bg-white text-black px-5 py-2 text-[13px] font-bold disabled:opacity-40"
                            >
                                Send reply
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function AdminSupportPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const [openTicketId, setOpenTicketId] = useState(null);
    const isLiveAdmin = user?.accountTier === 'ADMIN';

    const load = useCallback(async (p) => {
        if (!isLiveAdmin) {
            setRows([]);
            setTotal(0);
            setTotalPages(1);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSupportTickets({ page: p, limit: 50, status: status || undefined });
            setRows(data.tickets || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(err.message || 'Failed to load support queue');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin, status]);

    useEffect(() => {
        load(page);
    }, [load, page]);

    useEffect(() => {
        setPage(1);
    }, [status]);

    return (
        <div className="max-w-6xl space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white mb-2">Support tickets</h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        User-filed tickets from the app and web. {total > 0 ? `${total} match.` : null}
                    </p>
                </div>
                <DataSourceBadge source={isLiveAdmin ? 'Live' : 'Mock'} />
            </div>

            <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.value || 'all'}
                        type="button"
                        onClick={() => setStatus(f.value)}
                        className={`rounded-full px-4 py-1.5 text-[12px] font-semibold border transition-colors ${
                            status === f.value
                                ? 'bg-white text-black border-white'
                                : 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-300 text-sm">{error}</div>
            )}

            {openTicketId && (
                <TicketDetail
                    ticketId={openTicketId}
                    onClose={() => setOpenTicketId(null)}
                    onChanged={() => load(page)}
                />
            )}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-x-auto">
                {loading ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="px-6 py-12 text-center text-white/45 text-sm">
                        {isLiveAdmin ? 'No tickets in this view.' : 'Live support queue requires a backend ADMIN account.'}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[880px]">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Priority</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Subject</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">User</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Category</th>
                                <th className="px-6 py-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">Last activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => setOpenTicketId(t.id)}
                                    className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                                    <td className={`px-6 py-4 text-[12px] font-bold ${priorityStyle[t.priority] || 'text-white/70'}`}>
                                        {t.priority}
                                    </td>
                                    <td className="px-6 py-4 text-[14px] text-white/90 max-w-[260px]">
                                        <p className="truncate">{t.subject}</p>
                                        {t.messages?.[0] ? (
                                            <p className="text-[12px] text-white/40 truncate mt-0.5">{t.messages[0].body}</p>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-white/60 break-all max-w-[180px]">
                                        {t.user?.email || t.userId}
                                    </td>
                                    <td className="px-6 py-4 text-[12px] text-white/55">{t.category}</td>
                                    <td className="px-6 py-4 text-[13px] text-white/50 whitespace-nowrap">{formatDate(t.lastMessageAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </div>
    );
}
