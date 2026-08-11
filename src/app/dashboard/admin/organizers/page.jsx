'use client';

import { useCallback, useEffect, useState } from 'react';
import { listAdminOrganizers, grantCredits, sendAdminNotification } from '@/services/admin';
import { useAdminMode } from '@/contexts/AdminModeContext';
import {
    AdminError,
    AdminPageShell,
    AdminTableShell,
    adminTableClass,
    adminTdClass,
    adminThClass,
} from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';
import AdminPagination from '@/components/admin/AdminPagination';
import { getHypeTierFromScore, getHypeTierBadgeTheme } from '@/utils/hypeTier';

const TAKE = 25;

const TIER_OPTIONS = ['QUIET', 'WARM', 'BUZZING', 'ELECTRIC', 'WILDFIRE'];

function formatUsd(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

/** Small colored badge in the same letter-in-circle language as the Odyssey passport tiers. */
function TierBadge({ tier, score }) {
    const info = getHypeTierFromScore(score);
    const theme = getHypeTierBadgeTheme((tier || info.id));
    return (
        <div className="flex items-center gap-2">
            <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-black"
                style={{ backgroundColor: theme.fill, color: theme.letter, border: `1px solid ${theme.stroke}` }}
            >
                {info.badgeLetter}
            </span>
            <span className="text-[12px] font-semibold text-white/75">{info.label}</span>
        </div>
    );
}

const inputCls =
    'w-full rounded-xl bg-white/[0.055] px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]';

function ModalShell({ title, subtitle, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
            <div
                className="dashboard-surface w-full max-w-md rounded-[1.5rem] p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-[15px] font-bold text-white">{title}</h2>
                        {subtitle ? <p className="mt-0.5 text-[12px] text-white/45">{subtitle}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-white/[0.065] px-2.5 py-1 text-[12px] font-semibold text-white/60 hover:bg-white/[0.1] hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function GrantCreditsModal({ organizer, onClose, onDone }) {
    const [amountUsd, setAmountUsd] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await grantCredits({
                username: organizer.username,
                amountCents: Math.round(parseFloat(amountUsd) * 100),
                note: note.trim(),
            });
            onDone?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to grant credits');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title="Grant credits" subtitle={`@${organizer.username} · balance ${formatUsd(organizer.creditBalanceCents)}`} onClose={onClose}>
            <div className="space-y-3">
                <input
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="Amount USD (negative = adjust down)"
                    className={inputCls}
                    autoFocus
                />
                <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason (required, audited)"
                    className={inputCls}
                />
                {error && <p className="text-red-300 text-[13px]">{error}</p>}
                <button
                    type="button"
                    onClick={submit}
                    disabled={busy || !amountUsd || !note.trim()}
                    className="w-full rounded-full bg-white text-black px-5 py-2.5 text-[13px] font-bold disabled:opacity-40"
                >
                    {busy ? 'Granting...' : 'Grant'}
                </button>
            </div>
        </ModalShell>
    );
}

function SendMessageModal({ organizer, onClose, onDone }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [deepLink, setDeepLink] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [sent, setSent] = useState(false);

    const badDeepLink = deepLink.trim() !== '' && (!deepLink.trim().startsWith('/') || deepLink.trim().startsWith('//'));

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await sendAdminNotification({
                userId: organizer.id,
                title: title.trim(),
                body: body.trim(),
                deepLink: deepLink.trim() || undefined,
            });
            setSent(true);
            onDone?.();
        } catch (err) {
            setError(err.message || 'Failed to send message');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ModalShell title="Send message" subtitle={`Push + in-app notification to @${organizer.username}`} onClose={onClose}>
            {sent ? (
                <p className="text-emerald-400 text-[13px]">Sent.</p>
            ) : (
                <div className="space-y-3">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                        placeholder='Title (e.g. "You&rsquo;re on fire — let&rsquo;s talk promo")'
                        className={inputCls}
                        autoFocus
                    />
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        maxLength={600}
                        rows={3}
                        placeholder="Message body"
                        className={`${inputCls} resize-y`}
                    />
                    <input
                        value={deepLink}
                        onChange={(e) => setDeepLink(e.target.value)}
                        placeholder="Deep link path (optional, e.g. /dashboard/ads)"
                        className={inputCls}
                    />
                    {badDeepLink && <p className="text-amber-300 text-[13px]">Deep link must be an internal path starting with a single &lsquo;/&rsquo;.</p>}
                    {error && <p className="text-red-300 text-[13px]">{error}</p>}
                    <button
                        type="button"
                        onClick={submit}
                        disabled={busy || !title.trim() || !body.trim() || badDeepLink}
                        className="w-full rounded-full bg-white text-black px-5 py-2.5 text-[13px] font-bold disabled:opacity-40"
                    >
                        {busy ? 'Sending...' : 'Send'}
                    </button>
                </div>
            )}
        </ModalShell>
    );
}

export default function AdminOrganizersPage() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [tier, setTier] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creditsTarget, setCreditsTarget] = useState(null);
    const [messageTarget, setMessageTarget] = useState(null);
    const { isLive: isLiveAdmin } = useAdminMode();

    const load = useCallback(async (p, t) => {
        if (!isLiveAdmin) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await listAdminOrganizers({ page: p, take: TAKE, tier: t || undefined });
            setRows(data.organizers || []);
            setTotal(data.total || 0);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load organizers'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(page, tier), 0);
        return () => clearTimeout(timer);
    }, [load, page, tier]);

    const totalPages = Math.max(1, Math.ceil(total / TAKE));

    return (
        <AdminPageShell
            title="Organizers"
            copy="Ranked by hype score — how their events actually land, not just how many they run. Your best-performing organizers deserve the most credits, promos, and support attention."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Organizers', value: total.toLocaleString(), hint: tier ? `Filtered to ${tier.toLowerCase()}` : 'All tiers' },
                { label: 'Page', value: `${page} / ${totalPages}`, hint: `${TAKE} per page` },
                { label: 'Mode', value: isLiveAdmin ? 'Live' : 'Mock', hint: 'Data source' },
            ]}
        >

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => { setTier(''); setPage(1); }}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${tier === '' ? 'bg-white text-black' : 'bg-white/[0.065] text-white/70 hover:bg-white/[0.1] hover:text-white'}`}
                >
                    All tiers
                </button>
                {TIER_OPTIONS.map((t) => {
                    const theme = getHypeTierBadgeTheme(t);
                    const active = tier === t;
                    return (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { setTier(t); setPage(1); }}
                            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${active ? 'bg-white text-black' : 'bg-white/[0.065] text-white/70 hover:bg-white/[0.1] hover:text-white'}`}
                            style={active ? undefined : { borderLeft: `3px solid ${theme.fill}` }}
                        >
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                        </button>
                    );
                })}
            </div>

            <AdminError>{error}</AdminError>

            <AdminTableShell
                loading={loading}
                emptyMessage={rows.length === 0 ? (isLiveAdmin ? 'No organizers match this filter.' : 'Live organizer data requires a backend ADMIN account.') : null}
            >
                <table className={`${adminTableClass} min-w-[880px]`}>
                    <thead>
                        <tr>
                            <th className={adminThClass}>Organizer</th>
                            <th className={adminThClass}>Tier</th>
                            <th className={adminThClass}>Hype score</th>
                            <th className={adminThClass}>Events</th>
                            <th className={adminThClass}>Credit balance</th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((o) => (
                            <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                <td data-label="Organizer" className="admin-table-primary px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        {o.avatarUrl ? (
                                            <img src={o.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[12px] font-bold text-white">
                                                {(o.username || o.name || '?').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-bold text-white/90">{o.name || o.username}</p>
                                            <p className="truncate text-[12px] text-white/40">@{o.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Tier" className="px-6 py-4">
                                    <TierBadge tier={o.organizerHypeTier} score={o.organizerHypeScore} />
                                </td>
                                <td data-label="Hype score" className={`${adminTdClass} tabular-nums text-white/80`}>
                                    {Math.round(o.organizerHypeScore || 0).toLocaleString()}
                                </td>
                                <td data-label="Events" className={`${adminTdClass} tabular-nums`}>{o.eventCount}</td>
                                <td data-label="Credit balance" className={`${adminTdClass} tabular-nums text-white/80`}>{formatUsd(o.creditBalanceCents)}</td>
                                <td data-label="Action" className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCreditsTarget(o)}
                                            className="rounded-full bg-white/[0.065] px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white"
                                        >
                                            Grant credits
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMessageTarget(o)}
                                            className="rounded-full bg-white/[0.065] px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white"
                                        >
                                            Message
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </AdminTableShell>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />

            {creditsTarget ? (
                <GrantCreditsModal
                    organizer={creditsTarget}
                    onClose={() => setCreditsTarget(null)}
                    onDone={() => load(page, tier)}
                />
            ) : null}
            {messageTarget ? (
                <SendMessageModal
                    organizer={messageTarget}
                    onClose={() => setMessageTarget(null)}
                />
            ) : null}
        </AdminPageShell>
    );
}
