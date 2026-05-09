'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Image as ImageIcon,
  Loader2,
  Images,
  Users,
  X,
  Trash2,
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import { toast } from 'sonner';
import { eventsService } from '@/services/events';
import { uploadImageToR2 } from '@/services/media';
import { authService, authStorage } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManage } from './EventManageContext';

async function getCroppedBlob(imageSrc, croppedAreaPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, 1200, 1600,
  );
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
}

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v) {
  return new Date(v);
}

export default function EventEditPageView() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { event, eventId, loading, reloadEvent } = useEventManage();

  const lastHydratedEventId = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [geoLat, setGeoLat] = useState(null);
  const [geoLon, setGeoLon] = useState(null);
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverPreview, setCoverPreview] = useState(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [showPublicConsent, setShowPublicConsent] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [paidGate, setPaidGate] = useState(null);
  const [graceTimeHours, setGraceTimeHours] = useState('0');
  const [graceTimeMinutes, setGraceTimeMinutes] = useState('15');
  const [maxImages, setMaxImages] = useState('100');
  const [capacity, setCapacity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    lastHydratedEventId.current = null;
  }, [eventId]);

  useEffect(() => {
    if (!event || loading || !eventId) return;
    if (lastHydratedEventId.current === eventId) return;
    lastHydratedEventId.current = eventId;

    setFormError(null);
    setPaidGate(null);
    setSaveOk(false);
    setName(event.name || '');
    setDescription(event.description || '');
    setLocation(event.location || '');
    setGeoLat(typeof event.latitude === 'number' ? event.latitude : null);
    setGeoLon(typeof event.longitude === 'number' ? event.longitude : null);
    const start = event.startDate ? new Date(event.startDate) : new Date();
    const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    setStartLocal(toDatetimeLocalValue(start));
    setEndLocal(toDatetimeLocalValue(end));

    const vis = String(event.visibility || '').trim().toUpperCase();
    setIsPrivate(vis !== 'PUBLIC');

    const ticketType = String(event.ticketType || '').trim().toUpperCase();
    setIsPaid(ticketType === 'PAID');
    const tp = event.ticketPrice;
    setPrice(tp != null && tp > 0 ? String(Math.round(Number(tp))) : '');

    const grace = event.graceTime != null ? Number(event.graceTime) : 15;
    const safeGrace = Number.isFinite(grace) ? grace : 15;
    setGraceTimeHours(String(Math.floor(safeGrace / 60)));
    setGraceTimeMinutes(String(safeGrace % 60));

    const cap = event.maxImagesPerUser ?? event.maxImages ?? 100;
    setMaxImages(String(cap && cap > 0 ? cap : 100));

    setCapacity(event.capacity != null && event.capacity > 0 ? String(event.capacity) : '');

    const cover = typeof event.coverImage === 'string' ? event.coverImage.trim() : '';
    setCoverImage(cover || '');
    setCoverPreview(cover ? cover : null);
  }, [event, loading, eventId]);

  const onCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropSrc(null);
    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setIsCoverUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(blob);
      setCoverPreview(previewUrl);
      const publicUrl = await uploadImageToR2(blob, {
        filename: `event_cover_${Date.now()}.jpg`,
        contentType: 'image/jpeg',
      });
      setCoverImage(publicUrl);
    } catch (err) {
      setFormError(err.message || 'Cover upload failed');
      const prev = typeof event.coverImage === 'string' ? event.coverImage.trim() : '';
      setCoverImage(prev);
      setCoverPreview(prev || null);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handlePaidToggle = async (checked) => {
    setPaidGate(null);
    if (!checked) {
      setIsPaid(false);
      return;
    }
    if (user?.isVendor) {
      setIsPaid(true);
      return;
    }
    try {
      const r = await authService.checkVendorStatus();
      if (r.isVendor) {
        if (r.token && user) {
          await authStorage.save({ token: r.token, user: { ...user, isVendor: true } });
        }
        updateUser({ isVendor: true });
        setIsPaid(true);
      } else {
        setIsPaid(false);
        setPaidGate(r.code === 'NO_STRIPE_ACCOUNT' ? 'no-account' : 'pending');
      }
    } catch {
      setIsPaid(false);
      setPaidGate('no-account');
    }
  };


  const handleDelete = async () => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await eventsService.deleteEvent(eventId);
      toast.success('Event deleted.');
      router.push('/dashboard/events');
    } catch (err) {
      toast.error(err.message || 'Failed to delete event.');
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!eventId || !user?.id) {
      setFormError('Missing event or session.');
      return;
    }
    if (!name.trim()) {
      setFormError('Event name is required.');
      return;
    }
    const startDate = fromDatetimeLocalValue(startLocal);
    const endDate = fromDatetimeLocalValue(endLocal);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormError('Invalid start or end date.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('End time must be after start.');
      return;
    }
    if (!coverImage || !/^https?:\/\//i.test(String(coverImage).trim())) {
      setFormError('Cover must be an uploaded image URL.');
      return;
    }
    if (isCoverUploading) {
      setFormError('Cover is still uploading.');
      return;
    }
    if (isPaid) {
      const p = parseInt(price, 10);
      if (!price.trim() || Number.isNaN(p) || p <= 0) {
        setFormError('Paid events need a ticket price greater than 0.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const graceTime =
        (parseInt(graceTimeHours, 10) || 0) * 60 + (parseInt(graceTimeMinutes, 10) || 0);
      const ticketPrice = isPaid ? parseInt(price, 10) : 0;
      await eventsService.updateEvent(eventId, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        latitude: geoLat ?? undefined,
        longitude: geoLon ?? undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        coverImage: coverImage.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        ticketType: isPaid ? 'PAID' : 'FREE',
        ticketPrice,
        currency: (event.currency || 'USD').trim() || 'USD',
        graceTime,
        maxImagesPerUser: parseInt(maxImages, 10) || 100,
        capacity: capacity.trim() !== '' && parseInt(capacity, 10) > 0 ? parseInt(capacity, 10) : null,
      });
      await reloadEvent?.();
      toast.success('Event saved.');
    } catch (err) {
      const msg = err.message || 'Failed to update event.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 px-3 py-2.5 text-sm focus:border-pxi-purple/50 focus:outline-none';
  const labelClass = 'block text-[11px] font-bold text-pxi-purple uppercase tracking-widest mb-1.5';

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!eventId || !event) {
    return null;
  }

  return (
    <>
    {cropSrc && (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="relative flex-1">
          <Cropper
            image={cropSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 border-t border-white/10">
          <button
            type="button"
            onClick={() => setCropSrc(null)}
            className="px-5 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3 flex-1 mx-6">
            <span className="text-xs text-zinc-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-pxi-purple"
            />
          </div>
          <button
            type="button"
            onClick={handleCropConfirm}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-pxi-purple hover:bg-pxi-purple/80 transition-colors"
          >
            Use photo
          </button>
        </div>
      </div>
    )}
    <div className="space-y-6 pb-16">
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}
        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-xs font-bold text-pxi-purple uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={16} />
            Cover image
          </h2>
          <label className="relative block w-full sm:w-[300px] sm:mx-auto cursor-pointer" style={{ aspectRatio: '3/4' }}>
            <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} disabled={isCoverUploading} />
            <div className={`w-full h-full rounded-2xl overflow-hidden border ${coverImage || coverPreview ? 'border-white/10' : 'border-dashed border-white/20'} bg-white/5 flex items-center justify-center`}>
              {(coverImage || coverPreview) ? (
                <img src={coverImage || coverPreview} alt="" className="w-full h-full object-cover" />
              ) : !isCoverUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon size={36} className="text-white/30" />
                  <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">Add cover image</span>
                </div>
              ) : null}
              {isCoverUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 rounded-2xl">
                  <Loader2 size={32} className="animate-spin text-white" />
                  <span className="text-[11px] font-extrabold text-white/85 uppercase tracking-widest">Uploading cover…</span>
                </div>
              )}
            </div>
            {(coverImage || coverPreview) && !isCoverUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const prev = typeof event.coverImage === 'string' ? event.coverImage.trim() : '';
                  setCoverImage(prev);
                  setCoverPreview(prev || null);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-xs font-bold text-pxi-purple uppercase tracking-widest">Basics</h2>
          <div>
            <label className={labelClass}>Event name *</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} min-h-[88px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Venue / location</label>
            <div
              className={`${inputClass} p-0 overflow-visible`}
              onChange={(e) => {
                if (e.target.tagName === 'INPUT') setLocation(e.target.value);
              }}
            >
              <GeoapifyContext apiKey={GEOAPIFY_KEY}>
                <GeoapifyGeocoderAutocomplete
                  value={location}
                  placeholder="Search venue or address…"
                  placeSelect={(result) => {
                    const props = result?.properties;
                    setLocation(props?.formatted || '');
                    setGeoLat(typeof props?.lat === 'number' ? props.lat : null);
                    setGeoLon(typeof props?.lon === 'number' ? props.lon : null);
                  }}
                />
              </GeoapifyContext>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>End *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-5">
          <h2 className="text-xs font-bold text-pxi-purple uppercase tracking-widest">Configuration</h2>

          <div className="rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Public event</p>
              <p className="text-xs text-zinc-500">Anyone can discover this event.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!isPrivate}
              onClick={() => {
                if (isPrivate) setShowPublicConsent(true);
                else setIsPrivate(true);
              }}
              className={`relative w-12 h-7 rounded-full transition-colors ${!isPrivate ? 'bg-pxi-purple' : 'bg-zinc-600'}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${!isPrivate ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Paid ticket</p>
              <p className="text-xs text-zinc-500">Requires verified vendor / Stripe.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPaid}
              onClick={() => handlePaidToggle(!isPaid)}
              className={`relative w-12 h-7 rounded-full transition-colors ${isPaid ? 'bg-pxi-purple' : 'bg-zinc-600'}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isPaid ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>

          {isPaid && (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-800/80 border border-white/10 px-3 py-2">
              <DollarSign size={18} className="text-zinc-500 shrink-0" />
              <input
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
                placeholder="Price in USD"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Grace period after event</label>
              <div className="flex items-center gap-2">
                <input
                  className={`${inputClass} w-20`}
                  value={graceTimeHours}
                  onChange={(e) => setGraceTimeHours(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                />
                <span className="text-xs text-zinc-500">hours</span>
                <input
                  className={`${inputClass} w-20`}
                  value={graceTimeMinutes}
                  onChange={(e) => setGraceTimeMinutes(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                />
                <span className="text-xs text-zinc-500">min</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Max images per attendee</label>
              <div className="flex items-center gap-2">
                <Images size={18} className="text-zinc-500 shrink-0" />
                <input
                  className={inputClass}
                  value={maxImages}
                  onChange={(e) => setMaxImages(e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Capacity (MB)</label>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-zinc-500 shrink-0" />
                <input
                  className={inputClass}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>
        </section>

        {paidGate && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 space-y-2">
            {paidGate === 'no-account' ? (
              <p>To sell tickets, complete vendor setup with Stripe.</p>
            ) : (
              <p>Stripe is still verifying your account. You can save as a free event or check status from vendor setup.</p>
            )}
            <Link href="/dashboard/vendor-upgrade" className="inline-block text-pxi-purple font-bold hover:underline">
              Vendor setup →
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 flex flex-col-reverse sm:flex-row gap-3 sm:items-center">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-white/15 text-sm font-semibold text-zinc-200 hover:bg-white/5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving || isCoverUploading}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest disabled:opacity-45 hover:brightness-110 transition-all"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
        <div className="p-5 border-b border-red-500/10">
          <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest">Danger zone</h2>
        </div>
        <div className="p-5">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting…' : 'Delete event'}
          </button>
          <p className="mt-2 text-xs text-zinc-500">This action is permanent and cannot be undone.</p>
        </div>
      </section>

      {showPublicConsent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">Public event</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              By making this event public, you agree that photos and content from this event may be curated into public
              scrapbooks and used in PXI marketing materials. Attendees will be notified when they join.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPublicConsent(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-300 hover:bg-white/5"
              >
                Keep private
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPrivate(false);
                  setShowPublicConsent(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-pxi-purple text-sm font-bold text-white"
              >
                I understand, make public
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
