'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import GalleryMassUploadSection from '../GalleryMassUploadSection';
import { useEventManage } from './EventManageContext';
import CreateUploadLinkModal from '@/components/upload/CreateUploadLinkModal';
import LineupPlaylistCard from '@/components/dashboard/LineupPlaylistCard';

export default function EventMassUploadPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants } = useEventManage();
  const [showLinkModal, setShowLinkModal] = useState(false);

  const myAlbumRole = participants.find((p) => p.userId === user?.id)?.role;
  const isEventCreator = Boolean(user?.id && event?.createdBy && event.createdBy === user.id);
  const canGalleryMassUpload =
    isEventCreator || myAlbumRole === 'OWNER' || myAlbumRole === 'ADMIN' || !myAlbumRole;

  return (
    <div className="space-y-6">
      {albumId && eventId && canGalleryMassUpload ? (
        <>
          {/* Choose image (mass upload) section */}
          <div id="gallery-mass-upload" className="scroll-mt-6">
            <GalleryMassUploadSection albumId={albumId} eventId={String(eventId)} disabled={!user?.id} />
          </div>

          {/* Photographer share link */}
          <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 px-5 pb-2 pt-5">
              <HugeiconsIcon icon={Link01Icon} size={18} className="text-white opacity-70" />
              <h2 className="font-bold text-white tracking-[0.02em] text-sm">Photographer Upload Link</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Generate a shareable link that lets photographers upload directly to this album. No account or organizer access required. You can set upload capacity, photographer limit, and an expiry time.
              </p>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="pill-ghost inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold tracking-[0.02em]"
              >
                <HugeiconsIcon icon={Link01Icon} size={16} />
                Create Share Link
              </button>
            </div>
          </div>

          {showLinkModal && (
            <CreateUploadLinkModal
              albumId={albumId}
              eventId={String(eventId)}
              onClose={() => setShowLinkModal(false)}
            />
          )}

          {/* Lineup playlist */}
          <LineupPlaylistCard eventId={String(eventId)} />
        </>
      ) : (
        <div className="glass-panel rounded-2xl p-6 text-sm text-zinc-400">
          <p>You don&apos;t have permission to configure this album. Only the event creator or album admins can use this tool.</p>
          <Link
            href={`/dashboard/events/${eventId}`}
            className="mt-4 inline-block text-xs font-bold tracking-[0.02em] text-white/60 hover:text-white"
          >
            Back to details
          </Link>
        </div>
      )}
    </div>
  );
}
