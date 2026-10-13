'use client';

import { PageHeader } from '@/components/dashboard/ui/kit';

/**
 * Dashboard 2: every older control-room page opens with the same header as the new ones (kit PageHeader): the
 * title, at most one short line, and up to four numbers in the KPI strip. "Mock" data still says so.
 */
export function AdminPageShell({ title, copy, source, metrics = [], actions = null, children }) {
    const kpis = metrics.slice(0, 4).map((m) => ({ label: m.label, value: m.value, hint: m.hint }));
    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader
                title={title}
                subtitle={copy}
                kpis={kpis.length ? kpis : null}
                aside={actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            />
            {kpis.length && actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            {source === 'Mock' ? (
                <p className="text-[12px] font-semibold text-amber-300">Preview data. This account has no live admin access.</p>
            ) : null}
            {children}
        </div>
    );
}

export function AdminPanel({ children, className = '' }) {
    return (
        <section className={`dashboard-surface rounded-3xl p-5 md:p-6 ${className}`.trim()}>
            {children}
        </section>
    );
}

export function AdminTableShell({ loading, emptyMessage, children }) {
    return (
        <div className="admin-table-shell dashboard-surface overflow-hidden rounded-3xl">
            {loading ? (
                <AdminStateMessage>Loading...</AdminStateMessage>
            ) : emptyMessage ? (
                <AdminStateMessage>{emptyMessage}</AdminStateMessage>
            ) : (
                <div className="overflow-x-auto">{children}</div>
            )}
        </div>
    );
}

export function AdminStateMessage({ children }) {
    return (
        <div className="px-6 py-14 text-center text-sm font-semibold text-white/45">
            {children}
        </div>
    );
}

export function AdminError({ children }) {
    if (!children) return null;
    return (
        <div className="rounded-2xl bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200">
            {children}
        </div>
    );
}

export const adminTableClass = 'w-full border-collapse text-left';
export const adminThClass = 'px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white/35';
export const adminTdClass = 'px-6 py-4 text-[13px] text-white/65';
