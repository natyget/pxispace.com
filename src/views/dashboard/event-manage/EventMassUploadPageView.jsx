'use client';

import Link from 'next/link';
import { ImagePlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GalleryMassUploadSection from '../GalleryMassUploadSection';
import { useEventManage } from './EventManageContext';

export default function EventMassUploadPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants } = useEventManage();

  const myAlbumRole = participants.find((p) => p.userId === user?.id)?.role;
  const isEventCreator = Boolean(user?.id && event?.createdBy && event.createdBy === user.id);
  const canGalleryMassUpload =
    isEventCreator || myAlbumRole === 'OWNER' || myAlbumRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {albumId && eventId && canGalleryMassUpload ? (
        <div id="gallery-mass-upload" className="scroll-mt-6">
          <GalleryMassUploadSection albumId={albumId} eventId={String(eventId)} disabled={!user?.id} />
        </div>
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
