'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    listAdminAnnouncements,
    createAdminAnnouncement,
    updateAdminAnnouncement,
    deleteAdminAnnouncement,
} from '@/services/admin';
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
import { Button, Field, Panel, TextArea } from '@/components/dashboard/ui/kit';
import { count } from '@/lib/dashFormat';

const TITLE_MAX = 120;
const BODY_MAX = 600;
const MAX_ACTIVE = 5;

function formatDate(iso) {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '-';
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
        return `Max ${MAX_ACTIVE} active announcements. Deactivate one first.`;
    }
    return err?.message || fallback;
}

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
        <Panel title="Publish announcement">
            <div className="grid gap-3">
                <Field
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={TITLE_MAX}
                    placeholder="Title"
                    aria-label="Title"
                />
                <TextArea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={BODY_MAX}
                    rows={3}
                    placeholder="What organizers should know"
                    aria-label="Body"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Button label (optional)" aria-label="Button label" />
                    <Field value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="Button path, like /dashboard/floor-plans" aria-label="Button path" />
                    <Field
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        type="number"
                        min="1"
                        max="90"
                        placeholder="Days on screen (1 to 90)"
                        aria-label="Days on screen"
                    />
                </div>
            </div>
            {badCta && <p className="mt-3 text-[13px] text-amber-300">The path must start with a single /.</p>}
            {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
            {created && <p className="mt-3 text-[13px] text-emerald-300">Published. Live in the Command Center footer until {formatDate(created.expiresAt)}.</p>}
            <div className="mt-4">
                <Button variant="primary" onClick={submit} disabled={busy || !title.trim() || !body.trim() || badCta}>
                    {busy ? 'Publishing...' : 'Publish'}
                </Button>
            </div>
        </Panel>
    );
}

export default function AdminAnnouncementsPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLive: isLiveAdmin } = useAdminMode();

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
            copy="News for every organizer's Command Center, with an optional button."
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Active', value: `${activeCount} / ${MAX_ACTIVE}`, hint: 'Live in the footer' },
                { label: 'Total', value: count(rows.length), hint: 'Including expired' },
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
                                            '-'
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
                                                className="rounded-full bg-pxi-field px-3.5 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white"
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
