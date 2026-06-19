'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Loading02Icon, ImageIcon, HelpCircleIcon, Cancel01Icon, Search01Icon, UserGroupIcon, Location01Icon } from '@hugeicons/core-free-icons';
import Cropper from 'react-easy-crop';
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import { toast } from 'sonner';
import { eventsService, searchUsers } from '../../services/events';
import { uploadImageToR2 } from '../../services/media';
import { authService, authStorage } from '../../services/auth';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildTicketPricingPayload,
  createEmptyTier,
  validatePaidPricing,
} from '@/lib/ticketTiers';

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
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    1200,
    1600,
  );
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
}

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
const LINEUP_ROLE_MAX = 80;

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartEnd() {
  const start = new Date();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) };
}

function fromDatetimeLocalValue(v) {
  // `datetime-local` emits local-time without timezone; this parses as local in JS engines.
  // We later store UTC via `toISOString()`.
  return new Date(v);
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const defaults = useRef(defaultStartEnd());
  const searchTimerRef = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [geoLat, setGeoLat] = useState(null);
  const [geoLon, setGeoLon] = useState(null);
  const [startLocal, setStartLocal] = useState(defaults.current.start);
  const [endLocal, setEndLocal] = useState(defaults.current.end);

  const [coverImage, setCoverImage] = useState(null);
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
  const [useTierList, setUseTierList] = useState(false);
  const [ticketTiers, setTicketTiers] = useState([]);
  const [paidGate, setPaidGate] = useState(null);

  const [graceTimeHours, setGraceTimeHours] = useState('0');
  const [graceTimeMinutes, setGraceTimeMinutes] = useState('15');
  const [maxImages, setMaxImages] = useState('100');
  const [capacity, setCapacity] = useState('');

  const [inviteRoleKind, setInviteRoleKind] = useState('lineup');
  const [lineupSubDraft, setLineupSubDraft] = useState('');
  const [featuredQuery, setFeaturedQuery] = useState('');
  const [featuredResults, setFeaturedResults] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  /** @type {Array<{ id: string; username: string; name?: string; avatarUrl?: string; kind: 'lineup' | 'member' | 'cohost' | 'bouncer'; lineupSubrole?: string }>} */
  const [pendingInvites, setPendingInvites] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    const q = featuredQuery.trim();
    if (q.length < 2) {
      setFeaturedResults([]);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFeaturedLoading(true);
      searchUsers(q)
        .then((res) => {
          const list = res.results || res || [];
          setFeaturedResults(Array.isArray(list) ? list.filter((u) => u.id !== user?.id).slice(0, 8) : []);
        })
        .catch(() => setFeaturedResults([]))
        .finally(() => setFeaturedLoading(false));
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [featuredQuery, user?.id]);

  const addPendingInvite = useCallback(
    (candidate) => {
      const normalizedUsername = String(candidate.username || '').replace(/^@/, '').trim();
      if (!normalizedUsername) return;
      const lineupSubrole =
        inviteRoleKind === 'lineup'
          ? (lineupSubDraft.trim() || 'Line up').slice(0, LINEUP_ROLE_MAX)
          : undefined;
      setPendingInvites((prev) => {
        const exists = prev.find(
          (p) => p.id === candidate.id || p.username.toLowerCase() === normalizedUsername.toLowerCase()
        );
        const entry = {
          id: candidate.id,
          username: normalizedUsername,
          name: candidate.name,
          avatarUrl: candidate.avatarUrl,
          kind: inviteRoleKind,
          lineupSubrole,
        };
        if (exists) {
          return prev.map((p) =>
            p.id === candidate.id || p.username.toLowerCase() === normalizedUsername.toLowerCase() ? entry : p
          );
        }
        return [...prev, entry];
      });
      setFeaturedQuery('');
      setFeaturedResults([]);
    },
    [inviteRoleKind, lineupSubDraft]
  );

  const removePendingInvite = (id) => {
    setPendingInvites((prev) => prev.filter((p) => p.id !== id));
  };

  const formatPendingLabel = (p) => {
    if (p.kind === 'lineup') return `Line-up • ${p.lineupSubrole || 'Line up'}`;
    if (p.kind === 'cohost') return 'Co-host';
    if (p.kind === 'bouncer') return 'Bouncer';
    return 'Member';
  };

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
    setCoverImage(null);
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
      setCoverPreview(null);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handlePaidToggle = async (checked) => {
    setPaidGate(null);
    if (!checked) {
      setIsPaid(false);
      setUseTierList(false);
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

  const tryGetGeo = () =>
    new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({}),
        { timeout: 5000, maximumAge: 60_000 }
      );
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!user?.id) {
      setFormError('You must be signed in.');
      return;
    }
    if (!name.trim() || !location.trim() || !startLocal || !endLocal) {
      setFormError('Event name, venue / location, start, and end are required.');
      return;
    }
    if (!coverImage) {
      setFormError('Please upload a cover image.');
      return;
    }
    if (isCoverUploading) {
      setFormError('Cover is still uploading.');
      return;
    }
    if (!/^https?:\/\//i.test(String(coverImage).trim())) {
      setFormError('Cover must be uploaded (HTTPS URL) before creating the event.');
      return;
    }

    const startDate = fromDatetimeLocalValue(startLocal);
    const endDate = fromDatetimeLocalValue(endLocal);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormError('Invalid start or end date.');
      return;
    }
    if (startDate < new Date()) {
      setFormError('Event cannot start in the past.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('End time must be after start time.');
      return;
    }
    const pricingCheck = validatePaidPricing({ isPaid, useTierList, price, tiers: ticketTiers });
    if (!pricingCheck.ok) {
      setFormError(pricingCheck.error);
      return;
    }
    const pricing = buildTicketPricingPayload({ isPaid, useTierList, price, tiers: ticketTiers });

    setIsSubmitting(true);
    try {
      const geo = geoLat != null && geoLon != null
        ? { latitude: geoLat, longitude: geoLon }
        : await tryGetGeo();
      const graceTime =
        (parseInt(graceTimeHours, 10) || 0) * 60 + (parseInt(graceTimeMinutes, 10) || 0);

      const lineupOnly = pendingInvites
        .filter((p) => p.kind === 'lineup')
        .map((p) => ({ username: p.username, role: p.lineupSubrole || 'Line up' }));

      const created = await eventsService.createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        latitude: typeof geo.latitude === 'number' ? geo.latitude : undefined,
        longitude: typeof geo.longitude === 'number' ? geo.longitude : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        coverImage: coverImage.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        ticketType: pricing.ticketType,
        ticketPrice: pricing.ticketPrice,
        ...(pricing.ticketTiersJson ? { ticketTiersJson: pricing.ticketTiersJson } : {}),
        currency: 'USD',
        graceTime,
        maxImages: parseInt(maxImages, 10) || 100,
        capacity: capacity.trim() !== '' && parseInt(capacity, 10) > 0 ? parseInt(capacity, 10) : undefined,
        createdBy: user.id,
        featuredPeople: lineupOnly,
      });

      if (created.token && user) {
        await authStorage.save({ token: created.token, user });
      }

      const eventId = created.event?.id || created.id;
      const albumId = created.album?.id;
      if (!eventId) {
        setFormError('Event created but no id returned.');
        return;
      }

      const postInvites = pendingInvites.filter((p) => p.kind !== 'lineup');
      if (albumId && postInvites.length > 0) {
        for (const p of postInvites) {
          try {
            if (p.kind === 'cohost') {
              await eventsService.inviteStaff(eventId, p.username, 'co-host');
            } else if (p.kind === 'bouncer') {
              await eventsService.inviteStaff(eventId, p.username, 'bouncer');
            } else {
              await eventsService.inviteAlbumUser(albumId, p.username, { role: 'member' });
            }
          } catch {
            /* non-fatal; user can re-invite from event page */
          }
        }
      }

      toast.success('Event created!');
      router.push(`/dashboard/events/${eventId}`);
    } catch (err) {
      const msg = err.message || 'Failed to create event.';
      setFormError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 px-3 py-2.5 text-sm focus:border-pxi-purple/50 focus:outline-none';
  const labelClass = 'block text-[11px] font-bold text-pxi-purple uppercase tracking-widest mb-1.5';
  const sectionCardClass = 'rounded-2xl border border-white/10 bg-zinc-900/50 p-5';
  const sectionTitleClass = 'text-sm font-semibold text-white/90 border-b border-white/5 pb-4 mb-2';

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
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/events"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create event</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Same fields as the PXI mobile studio flow.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-8">
          {/* Left column: cover, then basics */}
          <div className="flex flex-col gap-8">
            <label className="relative block w-full max-w-[340px] mx-auto cursor-pointer" style={{ aspectRatio: '3/4' }}>
              <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} disabled={isCoverUploading} />
              <div className={`w-full h-full rounded-2xl overflow-hidden border ${coverImage || coverPreview ? 'border-white/10' : 'border-dashed border-white/20'} bg-white/5 flex items-center justify-center`}>
                {(coverImage || coverPreview) ? (
                  <img
                    src={coverImage || coverPreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : !isCoverUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <HugeiconsIcon icon={ImageIcon} size={36} className="text-white/30" />
                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.15em]">Add cover image</span>
                  </div>
                ) : null}
                {isCoverUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 rounded-2xl">
                    <HugeiconsIcon icon={Loading02Icon} size={32} className="animate-spin text-white" />
                    <span className="text-[11px] font-extrabold text-white/85 uppercase tracking-widest">Uploading cover…</span>
                  </div>
                )}
              </div>
              {(coverImage || coverPreview) && !isCoverUploading && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setCoverImage(null); setCoverPreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              )}
            </label>

            <section className={`${sectionCardClass} space-y-4`}>
              <h2 className={sectionTitleClass}>Basics</h2>
              <div>
                <label className={labelClass}>Event name *</label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name your event..."
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={`${inputClass} min-h-[88px] resize-y`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the experience..."
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Venue / location *</label>
                <div
                  className={`${inputClass} !py-0 px-0 overflow-visible relative create-event-location-field`}
                  onChange={(e) => {
                    if (e.target.tagName === 'INPUT') setLocation(e.target.value);
                  }}
                >
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 shrink-0 pointer-events-none z-10"
                  />
                  <div className="w-full create-event-location-geocoder">
                    <GeoapifyContext apiKey={GEOAPIFY_KEY}>
                      <GeoapifyGeocoderAutocomplete
                        value={location}
                        placeholder="Search venue or address..."
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
              </div>
            </section>
          </div>

          {/* Right column: configuration, then actions */}
          <div className="flex flex-col gap-8">
            <section className={`${sectionCardClass} space-y-5 flex-1`}>
              <h2 className={sectionTitleClass}>Configuration</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start date & time *</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>End date & time *</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                    required
                  />
                </div>
              </div>

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
            <>
              <div className="rounded-xl border border-white/10 bg-zinc-800/40 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">Ticket tiers</p>
                  <p className="text-xs text-zinc-500">VVIP, VIP, general admission, and more.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useTierList}
                  onClick={() => {
                    const next = !useTierList;
                    setUseTierList(next);
                    if (next && ticketTiers.length === 0) {
                      setTicketTiers([createEmptyTier()]);
                    }
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors ${useTierList ? 'bg-pxi-purple' : 'bg-zinc-600'}`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${useTierList ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>

              {useTierList ? (
                <div className="space-y-3">
                  {ticketTiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="rounded-xl border border-white/10 bg-zinc-800/30 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Tier {index + 1}
                        </span>
                        {ticketTiers.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setTicketTiers((prev) => prev.filter((t) => t.id !== tier.id))}
                            className="text-[11px] font-semibold text-zinc-400 hover:text-white"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div>
                        <label className={labelClass}>Tier name</label>
                        <input
                          className={inputClass}
                          value={tier.name}
                          onChange={(e) =>
                            setTicketTiers((prev) =>
                              prev.map((t) => (t.id === tier.id ? { ...t, name: e.target.value } : t))
                            )
                          }
                          placeholder="e.g. VIP"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Capacity</label>
                          <input
                            className={inputClass}
                            value={tier.capacity}
                            onChange={(e) =>
                              setTicketTiers((prev) =>
                                prev.map((t) =>
                                  t.id === tier.id
                                    ? { ...t, capacity: e.target.value.replace(/[^\d]/g, '') }
                                    : t
                                )
                              )
                            }
                            placeholder="Unlimited"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Price (USD)</label>
                          <input
                            className={inputClass}
                            value={tier.price}
                            onChange={(e) =>
                              setTicketTiers((prev) =>
                                prev.map((t) =>
                                  t.id === tier.id ? { ...t, price: e.target.value.replace(/[^\d]/g, '') } : t
                                )
                              )
                            }
                            placeholder="50"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTicketTiers((prev) => [...prev, createEmptyTier()])}
                    className="w-full rounded-xl border border-dashed border-white/15 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
                  >
                    + Add tier
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800/80 border border-white/10 px-3 py-2">
                  <HugeiconsIcon icon={HelpCircleIcon} size={18} className="text-zinc-500 shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
                    placeholder="Price in USD"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                  />
                </div>
              )}
            </>
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
                  onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, '').slice(0, 2); setGraceTimeMinutes(v === '' ? '' : String(Math.min(59, parseInt(v, 10)))); }}
                />
                <span className="text-xs text-zinc-500">min</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Max images per attendee</label>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={HelpCircleIcon} size={18} className="text-zinc-500 shrink-0" />
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
                <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-zinc-500 shrink-0" />
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
                  <p>Stripe is still verifying your account. You can create a free event now or check status from vendor setup.</p>
                )}
                <Link href="/dashboard/vendor-upgrade" className="inline-block text-pxi-purple font-bold hover:underline">
                  Vendor setup →
                </Link>
              </div>
            )}

            <div className="pt-2 mt-auto space-y-3">
              {formError ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {formError}
                </div>
              ) : null}
              <div className="flex items-center justify-end gap-6">
                <Link
                  href="/dashboard/events"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || isCoverUploading || !coverImage}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider disabled:opacity-45 hover:bg-white/90 transition-all"
                >
                  {isSubmitting ? <HugeiconsIcon icon={Loading02Icon} size={18} className="animate-spin" /> : null}
                  {isSubmitting ? 'Creating…' : isCoverUploading ? 'Uploading cover…' : 'Create event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

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
