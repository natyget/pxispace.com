'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import GalleryMassUploadSection from '../GalleryMassUploadSection';
import { useEventManage } from './EventManageContext';
import CreateUploadLinkModal from '@/components/upload/CreateUploadLinkModal';

export default function EventMassUploadPageView() {
  const { user } = useAuth();
  const { event, eventId, albumId, participants } = useEventManage();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [tab, setTab] = useState('gallery');

  const myAlbumRole = participants.find((p) => p.userId === user?.id)?.role;
  const isEventCreator = Boolean(user?.id && event?.createdBy && event.createdBy === user.id);
  const canGalleryMassUpload =
    isEventCreator || myAlbumRole === 'OWNER' || myAlbumRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {albumId && eventId && canGalleryMassUpload ? (
        <>
          <div className="dashboard-segmented-toggle w-full">
            {[
              { id: 'gallery', label: 'Gallery' },
              { id: 'upload', label: 'Upload' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="dashboard-segmented-toggle__item flex-1"
                data-active={tab === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'gallery' ? (
            <section className="glass-panel rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Event Gallery</h2>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Large gallery preview for images captured at this event. Live album media will populate here when the gallery API is connected.
                  </p>
                </div>
                <a
                  href={event?.coverImage || '#'}
                  download
                  className="pill-ghost shrink-0 px-4 py-2 text-[10px] font-black uppercase tracking-widest"
                >
                  Download
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[event?.coverImage, event?.image, event?.heroImage].filter(Boolean).length ? (
                  [event?.coverImage, event?.image, event?.heroImage].filter(Boolean).map((src, index) => (
                    <a key={`${src}-${index}`} href={src} download className="glass-field block aspect-[3/4] overflow-hidden rounded-2xl">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </a>
                  ))
                ) : (
                  Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="glass-field flex aspect-[3/4] items-center justify-center rounded-2xl text-xs font-bold uppercase tracking-widest text-white/30">
                      Empty
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <div id="gallery-mass-upload" className="scroll-mt-6">
              <GalleryMassUploadSection albumId={albumId} eventId={String(eventId)} disabled={!user?.id} />
            </div>
          )}

          {/* Photographer share link */}
          <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 p-5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.035)]">
              <HugeiconsIcon icon={Link01Icon} size={18} className="text-pxi-purple" />
              <h2 className="font-bold text-white uppercase tracking-widest text-sm">Photographer Upload Link</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Generate a shareable link that lets photographers upload directly to this album — no account or organizer access required. You can set upload capacity, photographer limit, and an expiry time.
              </p>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="pill-ghost inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-widest"
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
        </>
      ) : (
        <div className="glass-panel rounded-2xl p-6 text-sm text-zinc-400">
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
