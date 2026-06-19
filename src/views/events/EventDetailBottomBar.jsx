'use client';

import { useRouter } from 'next/navigation';

const ACCENT = '#c44d54';

/**
 * Mobile: "Continue to checkout" first, then "Open in PXI" (when album) on the next line.
 * Desktop: checkout only (open-in-app is mobile-only).
 */
export default function EventDetailBottomBar({ albumId, eventId }) {
  const router = useRouter();
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <div className="pointer-events-auto flex w-full max-w-[25.5rem] flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push(`/events/${eventId}/checkout`)}
          className="inline-flex h-[3.375rem] w-full min-w-0 items-center justify-center rounded-full px-8 text-sm font-semibold uppercase tracking-wide text-white shadow-md shadow-black/40 transition hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          Continue to checkout
        </button>
        {openInAppUrl ? (
          <a
            href={openInAppUrl}
            className="inline-flex h-[3.375rem] w-full min-w-0 items-center justify-center rounded-full border border-white/15 bg-black/85 text-sm font-semibold uppercase tracking-wide text-white shadow-lg backdrop-blur-md transition hover:bg-black/95 md:hidden"
            rel="noopener noreferrer"
          >
            Open in PXI
          </a>
        ) : null}
      </div>
    </div>
  );
}
