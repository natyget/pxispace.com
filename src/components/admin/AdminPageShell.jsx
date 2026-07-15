'use client';

import DataSourceBadge from '@/components/dashboard/DataSourceBadge';

export function AdminPageShell({ title, copy, source, metrics = [], actions = null, children }) {
    return (
        <div className="max-w-7xl space-y-6 md:space-y-8">
            <section className="dashboard-surface-b relative overflow-hidden rounded-[2rem] px-5 py-6 md:px-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">PXI Admin</span>
                            <span className="text-zinc-700">/</span>
                            <DataSourceBadge source={source} />
                        </div>
                        <h1 className="text-3xl font-black leading-[0.95] tracking-normal text-white normal-case md:text-5xl">
                            {title}
                        </h1>
                        {copy ? <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">{copy}</p> : null}
                    </div>
                    <div className="flex flex-col gap-3 xl:items-end">
                        {metrics.length ? (
                            <div className="grid grid-cols-2 gap-2 sm:min-w-[360px]">
                                {metrics.map((metric) => (
                                    <div key={metric.label} className="rounded-2xl bg-white/[0.045] p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{metric.label}</p>
                                        <p className="mt-2 truncate text-2xl font-black tracking-normal text-white tabular-nums">{metric.value}</p>
                                        {metric.hint ? <p className="mt-1 truncate text-xs font-semibold text-zinc-500">{metric.hint}</p> : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        {actions}
                    </div>
                </div>
            </section>
            {children}
        </div>
    );
}

export function AdminPanel({ children, className = '' }) {
    return (
        <section className={`dashboard-surface rounded-[1.75rem] p-5 ${className}`.trim()}>
            {children}
        </section>
    );
}

export function AdminTableShell({ loading, emptyMessage, children }) {
    return (
        <div className="admin-table-shell dashboard-surface overflow-hidden rounded-[1.75rem]">
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
