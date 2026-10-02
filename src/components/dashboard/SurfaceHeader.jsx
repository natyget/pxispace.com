'use client';

/** Eyebrow + title pair used at the top of every dashboard surface card. */
export default function SurfaceHeader({ eyebrow, title, action = null }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-pxi-purple">{eyebrow}</p>
                <h2 className="mt-1 text-[17px] font-black uppercase tracking-[-0.01em] text-white">{title}</h2>
            </div>
            {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
    );
}
