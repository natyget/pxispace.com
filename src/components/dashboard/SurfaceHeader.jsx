'use client';

/** Eyebrow + title pair used at the top of every dashboard surface card. */
export default function SurfaceHeader({ eyebrow, title, action = null }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-[12px] font-medium text-zinc-500">{eyebrow}</p>
                <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-white">{title}</h2>
            </div>
            {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
    );
}
