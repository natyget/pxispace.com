'use client';

/** Optional quiet label above a title, used at the top of dashboard surface cards. */
export default function SurfaceHeader({ eyebrow, title, action = null }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                {eyebrow ? <p className="text-xs font-medium text-zinc-500">{eyebrow}</p> : null}
                <h2 className={`${eyebrow ? 'mt-1' : ''} text-[17px] font-semibold text-white`}>{title}</h2>
            </div>
            {action ? <div className="shrink-0 pt-1">{action}</div> : null}
        </div>
    );
}
