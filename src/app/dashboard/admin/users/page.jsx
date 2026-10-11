'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers, fetchSalesManagers, saveStaffAccess, updateAdminUser, updateSalesRole, suspendUser, unsuspendUser } from '@/services/admin';
import { cityLabel } from '@/lib/dashboardNavConfig';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { adminMockUsers } from '@/lib/adminMockData';
import {
    CUSTOM_SETUP,
    STAFF_CITIES,
    STAFF_SETUPS,
    describeStaff,
    liveAdminRoleOf,
    savedNotice,
    setupChanges,
    setupOf,
    setupProblem,
    staffBadges,
    staffBody,
} from '@/lib/staffSetup';
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

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

const SALES_ROLE_LABELS = { NONE: 'No sales role', AMBASSADOR: 'Ambassador', REGIONAL_MANAGER: 'Regional manager' };
const selectCls = 'rounded-full bg-white/[0.065] px-3 py-1.5 text-[12px] text-white/80 outline-none';
const BADGE_TONES = { admin: 'bg-sky-500/10 text-sky-300', sales: 'bg-amber-500/10 text-amber-300', off: 'bg-white/[0.06] text-white/45' };

/**
 * Super admin only: what this person is, as one choice and one Save (lib/staffSetup.js). The backend sets
 * the role, the city, the sales role and the tier together and applies the same rules as before; when it
 * refuses, its message is shown as is.
 */
function StaffSetup({ row, busy, act, managers, error }) {
    const [setup, setSetup] = useState(() => setupOf(row));
    const now = describeStaff(row, managers);
    const wasCustom = setupOf(row).key === CUSTOM_SETUP.key;
    const choice = STAFF_SETUPS.find((s) => s.key === setup.key) || CUSTOM_SETUP;
    const problem = setupProblem(setup);
    const offered = managers.filter((m) => m.id !== row.id);

    // A super admin is set by email on the server: there is nothing to choose here.
    if (liveAdminRoleOf(row) === 'SUPER_ADMIN') {
        return (
            <div data-staff-setup="fixed" className="rounded-xl bg-pxi-field p-4">
                <p className="text-[11px] font-medium text-white/40">Staff access</p>
                <p data-staff-now className="mt-1 text-[13px] text-white/85">{now.text}</p>
            </div>
        );
    }

    return (
        <div data-staff-setup="open" className="space-y-3 rounded-xl bg-pxi-field p-4">
            <div>
                <p className="text-[11px] font-medium text-white/40">Staff access</p>
                <p data-staff-now className="mt-1 text-[13px] text-white/85">Right now: {now.text}</p>
                {now.warning ? <p data-staff-warning className="mt-1 text-[12px] leading-5 text-amber-300">{now.warning}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-white/55">Set up as</span>
                <select
                    value={setup.key}
                    disabled={busy}
                    onChange={(e) => setSetup((current) => ({ ...current, key: e.target.value }))}
                    className={selectCls}
                    aria-label="Set up as"
                >
                    {wasCustom ? <option value={CUSTOM_SETUP.key}>{CUSTOM_SETUP.label}</option> : null}
                    {STAFF_SETUPS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                </select>
                {choice.needs === 'city' && (
                    <select
                        value={setup.cityCode || ''}
                        disabled={busy}
                        onChange={(e) => setSetup((current) => ({ ...current, cityCode: e.target.value || null }))}
                        className={selectCls}
                        aria-label="City"
                    >
                        <option value="">Choose a city</option>
                        {STAFF_CITIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                    </select>
                )}
                {choice.needs === 'manager' && (
                    <select
                        value={setup.managerId || ''}
                        disabled={busy}
                        onChange={(e) => setSetup((current) => ({ ...current, managerId: e.target.value || null }))}
                        className={selectCls}
                        aria-label="Regional manager"
                    >
                        <option value="">Choose their regional manager</option>
                        {offered.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name || `@${m.username}`} ({cityLabel(m.cityCode)})
                            </option>
                        ))}
                    </select>
                )}
                <button
                    type="button"
                    disabled={busy || Boolean(problem) || !setupChanges(row, setup)}
                    onClick={() => act(() => saveStaffAccess(row.id, staffBody(setup)), savedNotice(row, setup), 'setup')}
                    className="rounded-full bg-pxi-purple px-5 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
                >
                    Save
                </button>
            </div>
            <p data-staff-hint className="text-[12px] leading-5 text-white/45">
                {choice.hint}
                {choice.needs === 'manager' && offered.length === 0 ? ' There is no regional manager yet: set one up first.' : ''}
            </p>
            {error ? <p data-staff-error className="text-[12px] leading-5 text-red-300">{error}</p> : null}
        </div>
    );
}

/**
 * The same settings one at a time, as they were before the choice above: an admin's city and a person's
 * sales role. Kept for the mixes the choices do not cover. The backend enforces the rules (support and
 * moderation stay central, a manager needs a city, an ambassador needs a manager) and its message is shown
 * as is when it refuses.
 */
function StaffAccessControls({ row, busy, act, managers: allManagers }) {
    const [salesRole, setSalesRole] = useState(row.salesRole || 'NONE');
    const [cityCode, setCityCode] = useState(row.adminCityCode || '');
    const [managerId, setManagerId] = useState(row.salesManagerId || '');
    const managers = allManagers.filter((m) => m.id !== row.id);

    const salesBody = () => {
        if (salesRole === 'REGIONAL_MANAGER') return { salesRole, cityCode: cityCode || null };
        if (salesRole === 'AMBASSADOR') return { salesRole, salesManagerId: managerId || null };
        return { salesRole };
    };
    const salesChanged =
        salesRole !== (row.salesRole || 'NONE') ||
        (salesRole === 'REGIONAL_MANAGER' && cityCode !== (row.adminCityCode || '')) ||
        (salesRole === 'AMBASSADOR' && managerId !== (row.salesManagerId || ''));

    return (
        <div className="space-y-2 rounded-xl bg-pxi-field p-3">
            <p className="text-[11px] font-medium text-white/40">City and sales access</p>
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={row.adminCityCode || ''}
                    disabled={busy}
                    onChange={(e) => act(() => updateAdminUser(row.id, { adminCityCode: e.target.value || null }))}
                    className={selectCls}
                    aria-label="Admin city"
                >
                    <option value="">Admin city: all cities</option>
                    <option value="NYC">Admin city: New York only</option>
                    <option value="BOS">Admin city: Boston only</option>
                </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <select value={salesRole} disabled={busy} onChange={(e) => setSalesRole(e.target.value)} className={selectCls} aria-label="Sales role">
                    {Object.entries(SALES_ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                {salesRole === 'REGIONAL_MANAGER' && (
                    <select value={cityCode} disabled={busy} onChange={(e) => setCityCode(e.target.value)} className={selectCls} aria-label="Territory">
                        <option value="">Choose a territory</option>
                        <option value="NYC">New York</option>
                        <option value="BOS">Boston</option>
                    </select>
                )}
                {salesRole === 'AMBASSADOR' && (
                    <select value={managerId} disabled={busy} onChange={(e) => setManagerId(e.target.value)} className={selectCls} aria-label="Manager">
                        <option value="">Choose a regional manager</option>
                        {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name || `@${m.username}`} ({cityLabel(m.cityCode)})
                            </option>
                        ))}
                    </select>
                )}
                <button
                    type="button"
                    disabled={busy || !salesChanged}
                    onClick={() => act(() => updateSalesRole(row.id, salesBody()))}
                    className="rounded-full bg-pxi-field px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                >
                    Save sales role
                </button>
            </div>
            <p className="text-[11px] leading-5 text-white/35">
                An admin city limits an ADMIN to that city. A regional manager&apos;s territory is stored as their city too.
                Support and moderation roles cannot have a city.
            </p>
        </div>
    );
}

function UserActions({ user: row, canManageRoles, viewerEmail, canSuspend, onDone }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [managers, setManagers] = useState([]);

    useEffect(() => {
        if (!canManageRoles) return undefined;
        let cancelled = false;
        fetchSalesManagers()
            .then((data) => { if (!cancelled) setManagers(data.managers || []); })
            .catch(() => { if (!cancelled) setManagers([]); });
        return () => { cancelled = true; };
    }, [canManageRoles, row.id]);

    // `from` says which block the action belongs to, so its refusal is shown beside it.
    const act = async (fn, notice, from) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
            onDone(notice);
        } catch (err) {
            setError({ message: err.message || 'Action failed', from });
            setBusy(false);
        }
    };

    return (
        <div className="rounded-2xl bg-pxi-field p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => updateAdminUser(row.id, { isVendor: !row.isVendor }))}
                    className="rounded-full bg-pxi-field px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                >
                    {row.isVendor ? 'Remove organizer' : 'Make organizer'}
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => updateAdminUser(row.id, { isVerified: !row.isVerified }))}
                    className="rounded-full bg-pxi-field px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                >
                    {row.isVerified ? 'Unverify' : 'Verify'}
                </button>
            </div>
            {canManageRoles ? (
                <>
                    <StaffSetup row={row} busy={busy} act={act} managers={managers} error={error?.from === 'setup' ? error.message : null} />
                    {liveAdminRoleOf(row) !== 'SUPER_ADMIN' && (
                        <details data-staff-advanced className="rounded-xl bg-pxi-field p-3">
                            <summary className="cursor-pointer text-[12px] text-white/55">Advanced: change one setting at a time</summary>
                            <div className="mt-3 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        defaultValue={row.accountTier}
                                        disabled={busy}
                                        onChange={(e) => act(() => updateAdminUser(row.id, { accountTier: e.target.value }))}
                                        className={selectCls}
                                        aria-label="Account tier"
                                    >
                                        <option value="PARTIAL">PARTIAL</option>
                                        <option value="CITIZEN">CITIZEN</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                    <select
                                        defaultValue={row.adminRole || 'NONE'}
                                        disabled={busy}
                                        onChange={(e) => act(() => updateAdminUser(row.id, { adminRole: e.target.value }))}
                                        className={selectCls}
                                        aria-label="Control-room role"
                                    >
                                        <option value="NONE">Role: none</option>
                                        <option value="SUPPORT">Role: support</option>
                                        <option value="MODERATOR">Role: moderator</option>
                                        <option value="ADMIN">Role: admin</option>
                                    </select>
                                </div>
                                <p className="text-[11px] leading-5 text-white/35">
                                    A role only works while the tier is ADMIN. The choice above sets the two together; here they are separate.
                                </p>
                                <StaffAccessControls row={row} busy={busy} act={act} managers={managers} />
                            </div>
                        </details>
                    )}
                </>
            ) : (
                <p data-staff-readonly className="rounded-xl bg-pxi-field p-4 text-[12px] leading-5 text-white/55">
                    Staff access: {describeStaff(row).text} Only a super admin can change it
                    {viewerEmail ? `, and ${viewerEmail} is not a super admin account.` : '.'}
                </p>
            )}
            {canSuspend && (
            <div className="flex flex-wrap items-center gap-2">
                {row.suspendedAt ? (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => act(() => unsuspendUser(row.id))}
                        className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                        Unsuspend
                    </button>
                ) : (
                    <>
                        <input
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="Reason for suspension"
                            className="flex-1 min-w-[220px] rounded-full bg-pxi-field px-4 py-1.5 text-[12px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]"
                        />
                        <button
                            type="button"
                            disabled={busy || !suspendReason.trim()}
                            onClick={() => act(() => suspendUser(row.id, suspendReason.trim()))}
                            className="rounded-full bg-red-500/10 px-4 py-1.5 text-[12px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                        >
                            Suspend
                        </button>
                    </>
                )}
            </div>
            )}
            {error && error.from !== 'setup' && <p className="text-red-300 text-[12px]">{error.message}</p>}
        </div>
    );
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [q, setQ] = useState('');
    const [openUserId, setOpenUserId] = useState(null);
    const [notice, setNotice] = useState(null);
    const { isLive: isLiveAdmin, cityScope, adminRole } = useAdminMode();
    // The server's own answer (GET /api/admin/whoami), not this app's copy of the super admin list: the two
    // are set separately, and when they disagreed the controls showed for someone the server refused, or
    // were missing for someone it would have let through.
    const canManageRoles = isLiveAdmin && adminRole === 'SUPER_ADMIN';
    // Suspension is trust-and-safety work, run centrally (PART-4): the backend refuses it for a city admin.
    const canSuspend = !cityScope;

    useEffect(() => {
        const t = setTimeout(() => setQ(input.trim()), 400);
        return () => clearTimeout(t);
    }, [input]);

    useEffect(() => {
        const timer = setTimeout(() => setPage(1), 0);
        return () => clearTimeout(timer);
    }, [q]);

    const load = useCallback(async (p) => {
        if (!isLiveAdmin) {
            const term = q.trim().toLowerCase();
            const filtered = term
                ? adminMockUsers.filter((row) =>
                    [row.email, row.username, row.id].some((field) => String(field || '').toLowerCase().includes(term))
                )
                : adminMockUsers;
            setRows(filtered);
            setTotal(filtered.length);
            setTotalPages(1);
            setError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminUsers({ page: p, limit: 50, q: q || undefined });
            setRows(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load users'));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [q, isLiveAdmin]);

    useEffect(() => {
        const timer = setTimeout(() => load(page), 0);
        return () => clearTimeout(timer);
    }, [load, page]);

    return (
        <AdminPageShell
            title="Accounts"
            copy={`${cityScope ? `People in ${cityLabel(cityScope)}: they chose the city, hold a ticket there, or host there. ` : ''}Search by email, username, or ID. Open a live account to adjust organizer access${cityScope ? ' and verification' : ', verification, and suspension state'}.${canManageRoles ? ' Super-admin controls are enabled.' : ''}`}
            source={isLiveAdmin ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Matches', value: total.toLocaleString(), hint: q || 'All users' },
                { label: 'Rows', value: rows.length.toLocaleString(), hint: `Page ${page}` },
            ]}
        >
            <AdminPanel className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <input
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search accounts..."
                    className="w-full rounded-full bg-pxi-field px-5 py-3 text-[14px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]"
                />
                <p className="w-fit rounded-full bg-pxi-field px-3 py-1.5 text-xs font-semibold text-zinc-400">
                    {isLiveAdmin ? 'Live management enabled' : 'Previewing mock users'}
                </p>
            </AdminPanel>

            <AdminError>{error}</AdminError>
            {notice ? <p data-admin-notice className="rounded-2xl bg-emerald-500/10 px-5 py-3 text-sm text-emerald-200">{notice}</p> : null}

            <AdminTableShell loading={loading} emptyMessage={rows.length === 0 ? 'No users found.' : null}>
                    <table className={`${adminTableClass} min-w-[840px]`}>
                        <thead>
                            <tr>
                                <th className={adminThClass}>Email</th>
                                <th className={adminThClass}>Username</th>
                                <th className={adminThClass}>Tier / Role</th>
                                <th className={adminThClass}>Organizer</th>
                                <th className={adminThClass}>Status</th>
                                <th className={adminThClass}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((u) => (
                                <Fragment key={u.id}>
                                    <tr
                                        onClick={() => {
                                            if (!isLiveAdmin) return;
                                            setNotice(null);
                                            setOpenUserId(openUserId === u.id ? null : u.id);
                                        }}
                                        className={`hover:bg-white/[0.02] transition-colors ${isLiveAdmin ? 'cursor-pointer' : ''}`}
                                    >
                                        <td data-label="Email" className="admin-table-primary px-6 py-4 text-[14px] text-white/90 break-all max-w-[200px]">
                                            <div className="font-semibold">{u.email}</div>
                                            <div className="mt-1 text-[12px] font-normal text-white/40 md:hidden">@{u.username || 'account'}</div>
                                        </td>
                                        <td data-label="Username" className={`${adminTdClass} text-[14px]`}>{u.username || '—'}</td>
                                        <td data-label="Tier / role" className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-pxi-field px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-white/70">
                                                {u.accountTier}
                                            </span>
                                            {staffBadges(u).map((badge) => (
                                                <span key={badge.label} data-staff-badge={badge.tone} className={`ml-1.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${BADGE_TONES[badge.tone]}`}>
                                                    {badge.label}
                                                </span>
                                            ))}
                                        </td>
                                        <td data-label="Organizer" className={`${adminTdClass} text-[14px]`}>{u.isVendor ? 'Yes' : 'No'}</td>
                                        <td data-label="Status" className="px-6 py-4">
                                            {u.suspendedAt ? (
                                                <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-red-300">
                                                    Suspended
                                                </span>
                                            ) : (
                                                <span className="text-[13px] text-white/50">{u.isVerified ? 'Verified' : 'Active'}</span>
                                            )}
                                        </td>
                                        <td data-label="Joined" className={`${adminTdClass} whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
                                    </tr>
                                    {openUserId === u.id && isLiveAdmin && (
                                        <tr className="admin-table-expanded-row">
                                            <td colSpan={6} className="px-6 pb-5">
                                                <UserActions
                                                    user={u}
                                                    canManageRoles={canManageRoles}
                                                    viewerEmail={user?.email}
                                                    canSuspend={canSuspend}
                                                    onDone={(message) => {
                                                        setOpenUserId(null);
                                                        setNotice(message || null);
                                                        load(page);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
            </AdminTableShell>

            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} />
        </AdminPageShell>
    );
}
