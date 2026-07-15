'use client';

const SOURCE_STYLES = {
    Live: 'bg-emerald-500/8 text-emerald-200 border-emerald-500/25',
    Derived: 'bg-violet-500/8 text-violet-200 border-violet-500/25',
    Mock: 'bg-amber-500/8 text-amber-200 border-amber-500/25',
};

const SOURCE_ICONS = {
    Live: 'L',
    Derived: 'D',
    Mock: 'M',
};

export default function DataSourceBadge({ source = 'Derived', className = '', compact = false }) {
    const style = SOURCE_STYLES[source] || SOURCE_STYLES.Derived;
    return (
        <span
            className={`inline-flex items-center rounded-full border ${compact ? 'h-6 w-6 justify-center p-0 text-[9px]' : 'px-2.5 py-1 text-[10px]'} font-bold tracking-[0.02em] ${style} ${className}`.trim()}
            title={compact ? source : undefined}
        >
            {compact ? SOURCE_ICONS[source] || SOURCE_ICONS.Derived : source}
        </span>
    );
}
