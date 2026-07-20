'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    listAdminAnnouncements,
    createAdminAnnouncement,
    updateAdminAnnouncement,
    deleteAdminAnnouncement,
} from '@/services/admin';
import { useAuth } from '@/contexts/AuthContext';
import {
    AdminError,
    AdminPageShell,
    AdminPanel,
    AdminTableShell,
    adminTableClass,
    adminTdClass,
    adminThClass,
} from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';

const TITLE_MAX = 120;
const BODY_MAX = 600;
const MAX_ACTIVE = 5;

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '—';
    }
}

/** Active = live in the Command Center footer; Expired = past expiresAt; Off = manually deactivated. */
function announcementStatus(a) {
    if (!a.active) return 'Off';
    if (new Date(a.expiresAt).getTime() <= Date.now()) return 'Expired';
    return 'Active';
}

const statusChipClass = {
    Active: 'bg-emerald-500/10 text-emerald-300',
    Expired: 'bg-amber-500/10 text-amber-300',
    Off: 'bg-white/[0.055] text-white/55',
};

function limitMessage(err, fallback) {
    if (err?.code === 'ANNOUNCEMENT_LIMIT') {
        return `Max ${MAX_ACTIVE} active announcements — deactivate one first.`;
    }
    return err?.message || fallback;
}

const inputCls =
    'w-full rounded-xl bg-white/[0.055] px-4 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]';

function ComposeAnnouncementCard({ onCreated }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [ctaLabel, setCtaLabel] = useState('');
    const [ctaHref, setCtaHref] = useState('');
    const [durationDays, setDurationDays] = useState('7');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [created, setCreated] = useState(null);

    const badCta = ctaHref.trim() !== '' && (!ctaHref.trim().startsWith('/') || ctaHref.trim().startsWith('//'));

    const submit = async () => {
        setBusy(true);
        setError(null);
        setCreated(null);
        try {
            const data = await createAdminAnnouncement({
                title: title.trim(),
                body: body.trim(),
                ctaLabel: ctaLabel.trim() || undefined,
                ctaHref: ctaHref.trim() || undefined,
                durationDays: parseInt(durationDays, 10) || 7,
            });
            setCreated(data.announcement);
            setTitle('');
            setBody('');
            setCtaLabel('');
            setCtaHref('');
            setDurationDays('7');
            onCreated?.();
        } catch (err) {
            setError(limitMessage(err, 'Failed to publish announcement'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminPanel className="space-y-4">
            <h2 className="text-[11px] font-bold tracking-[0.02em] text-white/40">Publish announcement</h2>
            <div className="grid gap-3">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={TITLE_MAX}
                    placeholder='Title (e.g. "Floor plans are live — go map your venue")'
                    className={inputCls}
                />
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={BODY_MAX}
                    rows={3}
                    placeholder="Body — what organizers should know"
                    className={`${inputCls} resize-y`}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                    <input
                        value={ctaLabel}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="CTA label (optional)"
                        className={inputCls}
                    />
                    <input
                        value={ctaHref}
                        onChange={(e) => setCtaHref(e.target.value)}
                        placeholder="CTA path (e.g. /dashboard/floor-plans)"
                        className={inputCls}
                    />
                    <input
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        type="number"
                        min="1"
                        max="90"
                        placeholder="Days on screen (1–90)"
                        className={inputCls}
                    />
                </div>
            </div>
            {badCta && <p className="text-amber-300 text-[13px]">CTA path must be an internal path starting with a single &lsquo;/&rsquo;.</p>}
            {error && <p className="text-red-300 text-[13px]">{error}</p>}
            {created && <p className="text-emerald-400 text-[13px]">Published — live in the Command Center footer until {formatDate(created.expiresAt)}.</p>}
            <button
                type="button"
                onClick={submit}
                disabled={busy || !title.trim() || !body.trim() || badCta}
                className="rounded-full bg-white text-black px-5 py-2 text-[13px] font-bold disabled:opacity-40"
            >
                {busy ? 'Publishing...' : 'Publish'}
            </button>
        </AdminPanel>
    );
}

export default function AdminAnnouncementsPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isLiveAdmin = user?.accountTier === 'ADMIN';

    const load = useCallback(async () => {
        if (!isLiveAdmin) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await listAdminAnnouncements();
            setRows(data.announcements || []);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load announcements'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(), 0);
        return () => clearTimeout(timer);
    }, [load]);

    const activeCount = rows.filter((a) => announcementStatus(a) === 'Active').length;

    const toggleActive = async (a) => {
        try {
            await updateAdminAnnouncement(a.id, { active: !a.active });
            load();
        } catch (err) {
            setError(limitMessage(err, 'Failed to update announcement'));
        }
    };

    const remove = async (a) => {
        try {
            await deleteAdminAnnouncement(a.id);
            load();
        } catch (err) {
            setError(err.message || 'Failed to delete announcement');
        }
    };

    return (
        <AdminPageShell
            title="Announcements"
            copy="Broadcast product news to every organizer's Command Center footer. Optional CTA routes to a dashboard screen; each banner auto-expires."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Active', value: `${activeCount} / ${MAX_ACTIVE}`, hint: 'Live in the footer' },
                { label: 'Total', value: rows.length.toLocaleString(), hint: 'Including expired' },
                { label: 'Mode', value: isLiveAdmin ? 'Live' : 'Mock', hint: 'Data source' },
            ]}
        >

            <ComposeAnnouncementCard onCreated={load} />

            <AdminError>{error}</AdminError>

            <AdminTableShell
                loading={loading}
                emptyMessage={rows.length === 0 ? (isLiveAdmin ? 'No announcements yet.' : 'Live announcement data requires a backend ADMIN account.') : null}
            >
                <table className={`${adminTableClass} min-w-[880px]`}>
                    <thead>
                        <tr>
                            <th className={adminThClass}>Announcement</th>
                            <th className={adminThClass}>CTA</th>
                            <th className={adminThClass}>Expires</th>
                            <th className={adminThClass}>Status</th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((a) => {
                            const status = announcementStatus(a);
                            return (
                                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td data-label="Announcement" className="admin-table-primary px-6 py-4">
                                        <span className="text-[13px] font-bold text-white/90">{a.title}</span>
                                        <p className="mt-0.5 line-clamp-2 max-w-md text-[12px] text-white/40">{a.body}</p>
                                    </td>
                                    <td data-label="CTA" className={`${adminTdClass} text-[12px]`}>
                                        {a.ctaLabel && a.ctaHref ? (
                                            <>
                                                <span className="text-white/80">{a.ctaLabel}</span>
                                                <p className="font-mono text-[11px] text-white/40 mt-0.5">{a.ctaHref}</p>
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td data-label="Expires" className={adminTdClass}>{formatDate(a.expiresAt)}</td>
                                    <td data-label="Status" className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${statusChipClass[status]}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td data-label="Action" className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(a)}
                                                className="rounded-full bg-white/[0.065] px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white"
                                            >
                                                {a.active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => remove(a)}
                                                className="rounded-full bg-red-500/[0.08] px-3.5 py-1.5 text-[12px] font-semibold text-red-300/80 hover:bg-red-500/[0.16] hover:text-red-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </AdminTableShell>
        </AdminPageShell>
    );
}
