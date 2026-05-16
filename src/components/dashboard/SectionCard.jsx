'use client';

import DataSourceBadge from './DataSourceBadge';

export default function SectionCard({ title, subtitle, source, actions, children }) {
    return (
        <section className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-hidden">
            <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-[18px] font-bold text-white tracking-tight">{title}</h2>
                    {subtitle ? <p className="text-zinc-500 text-sm mt-1">{subtitle}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                    {source ? <DataSourceBadge source={source} /> : null}
                    {actions}
                </div>
            </header>
            <div className="p-6">{children}</div>
        </section>
    );
}
