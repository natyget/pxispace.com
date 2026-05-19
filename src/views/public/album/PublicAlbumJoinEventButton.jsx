'use client';

import Link from 'next/link';
import { THREAD_CHATBAR_HORIZONTAL_INSET } from './albumLayoutConstants';

/**
 * Mobile join CTA — primary action on the public album page (replaces the read-only
 * chatbar). Routes to `/events/[id]/checkout` where the full EULA + free-ticket /
 * paid-Stripe flow lives. Private albums with no event fall back to opening in app.
 */
function formatTicketPrice(event) {
    const type = String(event?.ticketType ?? '').toUpperCase();
    if (type !== 'PAID') return null;
    const price = Number(event?.ticketPrice ?? 0);
    if (!Number.isFinite(price) || price <= 0) return 'PAID';
    const sym = event?.currency === 'EUR' ? '€' : '$';
    return `${sym}${price.toFixed(2)}`;
}

export default function PublicAlbumJoinEventButton({ album, albumId, className = '' }) {
    const eventId = album?.event?.id || null;
    const ticketLabel = formatTicketPrice(album?.event);
    const buttonLabel = ticketLabel ? `Join Event · ${ticketLabel}` : 'Join Event';
    const fallbackDeepLink = albumId ? `pxi://album/${albumId}` : null;

    const wrapperClass = [
        'album-thread-chatbar shrink-0 border-t border-white/10 bg-black/90 backdrop-blur-md',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (!eventId && !fallbackDeepLink) return null;

    return (
        <div className={wrapperClass}>
            <div
                className="flex items-center"
                style={{
                    paddingLeft: THREAD_CHATBAR_HORIZONTAL_INSET,
                    paddingRight: THREAD_CHATBAR_HORIZONTAL_INSET,
                    paddingTop: 12,
                    paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
                }}
            >
                {eventId ? (
                    <Link
                        href={`/events/${eventId}/checkout`}
                        className="flex h-12 w-full items-center justify-center rounded-full bg-[#d946ef] px-6 text-[13px] font-black uppercase tracking-[0.18em] text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] transition hover:opacity-90"
                    >
                        {buttonLabel}
                    </Link>
                ) : (
                    <a
                        href={fallbackDeepLink}
                        className="flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-[13px] font-black uppercase tracking-[0.18em] text-black shadow-lg transition hover:bg-zinc-200"
                    >
                        Open album in app
                    </a>
                )}
            </div>
        </div>
    );
}
