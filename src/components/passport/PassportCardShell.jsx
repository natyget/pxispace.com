'use client';

/** Bottom panel (user info) — darker than legacy #0f0f0f */
export const PASSPORT_INFO_PANEL_BG = '#070707';

/** Subtle frame on passport photo (not a strong white bloom) */
export const PASSPORT_AVATAR_FRAME_CLASS =
    'shadow-[0_2px_10px_rgba(0,0,0,0.55),0_0_6px_rgba(120,120,120,0.12)]';

/** MRZ footer lines (PXI<<username<<...) */
export const PASSPORT_FOOTER_TEXT_CLASS =
    'font-mono text-[10px] leading-[12px] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.32)]';

export const PASSPORT_FOOTER_CHEV_CLASS = 'text-[11px]';

/** Top-right passport ID on map panel — matches mobile DottedText (rgba white 60%). */
export const PASSPORT_ID_OVERLAY_CLASS =
    'text-[12px] uppercase tracking-[0.16em] text-[rgba(255,255,255,0.6)]';

/**
 * Two-panel passport card: map/stamps top + info bottom, no gap between backgrounds.
 * Grey border + soft diffusion shadow (no white outline).
 * Overlay renders outside the clipped inner stack so season label can sit on the left edge.
 */
export function PassportCardShell({ top, bottom, overlay, className = '' }) {
    return (
        <div
            className={[
                'relative flex h-[558px] w-[min(95vw,361px)] min-w-0 flex-col overflow-visible rounded-[8px]',
                'border border-zinc-500/25',
                'shadow-[0_10px_36px_rgba(0,0,0,0.72),0_0_32px_rgba(120,120,120,0.14)]',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            style={{ backgroundColor: PASSPORT_INFO_PANEL_BG }}
        >
            <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[8px]">
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0a0a]">{top}</div>
                <div
                    className="relative min-h-0 flex-1 overflow-hidden"
                    style={{ backgroundColor: PASSPORT_INFO_PANEL_BG }}
                >
                    {bottom}
                </div>
                <PassportCreaseOverlay />
            </div>
            {overlay}
        </div>
    );
}

/** Fold at the seam — grey diffusion only (overlaps both halves). */
export function PassportCreaseOverlay() {
    return (
        <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-12 -translate-y-1/2"
            aria-hidden
        >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-[#0a0a0a]/70 to-[#0a0a0a]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-transparent via-[#070707]/70 to-[#070707]" />
            <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#050505] shadow-[0_0_10px_4px_rgba(0,0,0,0.85)]" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-zinc-500/35" />
        </div>
    );
}
