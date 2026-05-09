'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GalleryMassUploadSection from '../GalleryMassUploadSection';
import { useEventManage } from './EventManageContext';
import CreateUploadLinkModal from '@/components/upload/CreateUploadLinkModal';

export default function EventMassUploadPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants } = useEventManage();
  const [showLinkModal, setShowLinkModal] = useState(false);

  const myAlbumRole = participants.find((p) => p.userId === user?.id)?.role;
  const isEventCreator = Boolean(user?.id && event?.createdBy && event.createdBy === user.id);
  const canGalleryMassUpload =
    isEventCreator || myAlbumRole === 'OWNER' || myAlbumRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {albumId && eventId && canGalleryMassUpload ? (
        <>
          <div id="gallery-mass-upload" className="scroll-mt-6">
            <GalleryMassUploadSection albumId={albumId} eventId={String(eventId)} disabled={!user?.id} />
          </div>

          {/* Photographer share link */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center gap-2">
              <Link2 size={18} className="text-pxi-purple" />
              <h2 className="font-bold text-white uppercase tracking-widest text-sm">Photographer Upload Link</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Generate a shareable link that lets photographers upload directly to this album — no account or organizer access required. You can set upload capacity, photographer limit, and an expiry time.
              </p>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/12 hover:border-white/20 transition-colors"
              >
                <Link2 size={16} />
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
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
          <p>You don&apos;t have permission to mass upload for this album. Only the event creator or album admins can use this tool.</p>
          <Link
            href={`/dashboard/events/${eventId}`}
            className="inline-block mt-4 text-pxi-purple text-xs font-bold uppercase tracking-widest hover:underline"
          >
            ← Back to details
          </Link>
        </div>
      )}
    </div>
  );
}
