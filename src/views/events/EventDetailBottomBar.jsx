'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SPRING_SOFT } from '@/components/motion/motionTokens';

/**
 * Mobile: "Join event" first, then "Open in PXI" (when album) on the next line.
 * Desktop: checkout only (open-in-app is mobile-only).
 */
export default function EventDetailBottomBar({ albumId, eventId }) {
  const router = useRouter();
  const openInAppUrl = albumId ? `pxi://album/${albumId}` : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <motion.div
        className="pointer-events-auto flex w-full max-w-[25.5rem] flex-col gap-2"
        initial={{ opacity: 0, y: 56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.25 }}
      >
        <button
          type="button"
          onClick={() => router.push(`/events/${eventId}/checkout`)}
          className="pxi-orange-pill inline-flex h-[3.375rem] w-full min-w-0 items-center justify-center rounded-full px-8 text-sm font-black uppercase tracking-wide text-white transition hover:scale-[1.01]"
        >
          Join event
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
      </motion.div>
    </div>
  );
}
