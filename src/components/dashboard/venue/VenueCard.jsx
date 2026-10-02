'use client';

// VEN-8: the pieces every card of the venue dashboard is made of. The surface is the dashboard's own
// (glass-panel), and every colour comes from chartStyles.js.

import { DASHBOARD_BRAND_COLOR, DASHBOARD_LIVE_COLOR } from '@/components/dashboard/chartStyles';

export function VenueCard({ title, badge = null, action = null, className = '', bodyClassName = '', children, ...rest }) {
    return (
        <section className={`glass-panel flex min-w-0 flex-col rounded-[1.25rem] p-4 ${className}`.trim()} {...rest}>
            {badge}
            <header className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-[15px] font-semibold tracking-tight text-white/85">{title}</h2>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>
            <div className={`mt-3 flex min-h-0 flex-1 flex-col ${bodyClassName}`.trim()}>{children}</div>
        </section>
    );
}

/** The orange pill that says something is happening now. */
export function LiveBadge({ children = 'LIVE', className = '' }) {
    return (
        <span
            className={`mb-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] text-white ${className}`.trim()}
            style={{ background: DASHBOARD_LIVE_COLOR }}
        >
            {children}
        </span>
    );
}

/** "Limited History": shown where a figure rests on one or two nights. */
export function HistoryTag({ children = 'Limited History', className = '' }) {
    return <span className={`text-[11px] font-medium text-white/55 ${className}`.trim()}>{children}</span>;
}

/** The centred line a card shows when it has nothing to draw. */
export function EmptyNote({ children, detail = null, className = '' }) {
    return (
        <div className={`flex flex-1 flex-col items-center justify-center px-2 py-6 text-center ${className}`.trim()}>
            <p className="text-[12px] font-medium text-white/80">{children}</p>
            {detail ? <p className="mt-1 max-w-[34ch] text-[11px] leading-4 text-white/45">{detail}</p> : null}
        </div>
    );
}

export function CardSkeleton({ className = 'h-24' }) {
    return <div className={`w-full animate-pulse rounded-2xl bg-white/[0.035] ${className}`.trim()} />;
}

export function CardError({ children }) {
    return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[12px] leading-5 text-red-200">{children}</p>;
}

/**
 * The ring: the filled part in the brand purple, clockwise from the top, the rest in the live orange, with
 * the two meeting softly as they do in the design.
 */
export function ProgressRing({ percent = 0, size = 112, thickness = 16, label = null }) {
    const value = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
    const blend = 3;
    const fill = DASHBOARD_BRAND_COLOR;
    const rest = DASHBOARD_LIVE_COLOR;
    let stops = `${fill} 0 100%`;
    if (value <= 0) stops = `${rest} 0 100%`;
    else if (value < 100) {
        stops = `${fill} 0, ${fill} ${Math.max(0, value - blend)}%, ${rest} ${Math.min(100, value + blend)}%, ${rest} ${100 - blend}%, ${fill} 100%`;
    }
    const mask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px + 1px))`;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${value} percent`}>
            <div
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(from 0deg, ${stops})`, WebkitMaskImage: mask, maskImage: mask }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold leading-none text-white tabular-nums" style={{ fontSize: Math.round(size * 0.22) }}>
                    {value}
                    <span style={{ fontSize: Math.round(size * 0.14) }}>%</span>
                </span>
            </div>
        </div>
    );
}

/** A small clock, as on the design's night and album labels. */
export function ClockIcon({ className = 'h-3 w-3' }) {
    return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.6V8l2.3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
