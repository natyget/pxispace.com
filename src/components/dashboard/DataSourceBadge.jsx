'use client';

const SOURCE_STYLES = {
    Live: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    Derived: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    Mock: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

export default function DataSourceBadge({ source = 'Derived', className = '' }) {
    const style = SOURCE_STYLES[source] || SOURCE_STYLES.Derived;
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${style} ${className}`.trim()}
        >
            {source}
        </span>
    );
}
