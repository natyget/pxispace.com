'use client';

/* global process */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon, ImageIcon, Loading02Icon, UserGroupIcon, Cancel01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import Cropper from 'react-easy-crop';
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import { toast } from 'sonner';
import { eventsService } from '@/services/events';
import { uploadImageToR2 } from '@/services/media';
import { authService, authStorage } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useEventManage } from './EventManageContext';
import { PxiSpinner } from '@/components/loading/PxiLoading';
import { assignRosterToEvent, listTeamRosters, updateTeamRoster } from '@/services/teamRosters';
import { attachFloorPlan, detachFloorPlan, getEventFloorPlan, listFloorPlans } from '@/services/floorPlans';
import { listGates, updateGate } from '@/services/gates';
import {
  buildTicketPricingPayload,
  createEmptyTier,
  validatePaidPricing,
} from '@/lib/ticketTiers';

function memberDisplayName(member) {
  return member?.name || member?.handle || member?.contact || 'Team member';
}

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
  const { event, eventId, loading, reloadEvent, isPast } = useEventManage();

  const lastHydratedEventId = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [venueName, setVenueName] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [stampImage, setStampImage] = useState(null);
  const [isStampUploading, setIsStampUploading] = useState(false);
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
  const [useTierList, setUseTierList] = useState(false);
  const [ticketTiers, setTicketTiers] = useState([]);
  const [paidGate, setPaidGate] = useState(null);
  const [graceTimeHours, setGraceTimeHours] = useState('0');
  const [graceTimeMinutes, setGraceTimeMinutes] = useState('15');
  const [maxImages, setMaxImages] = useState('100');
  const [capacity, setCapacity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [teamRosters, setTeamRosters] = useState([]);
  const [teamRostersLoading, setTeamRostersLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [attachedVenue, setAttachedVenue] = useState(null);
  const [venueLoading, setVenueLoading] = useState(true);
  const [venueSaving, setVenueSaving] = useState(false);
  const [gates, setGates] = useState([]);
  const [gatesLoading, setGatesLoading] = useState(false);
  const [gatesError, setGatesError] = useState('');
  const [savingGateId, setSavingGateId] = useState(null);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    lastHydratedEventId.current = null;
  }, [eventId]);

  useEffect(() => {
    if (!event || loading || !eventId) return undefined;
    if (lastHydratedEventId.current === eventId) return;
    lastHydratedEventId.current = eventId;

    const timer = setTimeout(() => {
      setFormError(null);
      setPaidGate(null);
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
      const rawTiers = Array.isArray(event.ticketTiersJson) ? event.ticketTiersJson : [];
      const hydratedTiers = rawTiers
        .filter((t) => t && (t.id || t.label || t.name))
        .map((t, idx) => ({
          id: t.id || `tier_${eventId}_${idx}`,
          name: String(t.label || t.name || '').trim(),
          capacity: t.capacity != null ? String(t.capacity) : '',
          price: t.priceUsd != null ? String(Math.round(Number(t.priceUsd))) : '',
        }))
        .filter((t) => t.name || t.price);
      if (ticketType === 'PAID' && hydratedTiers.length > 0) {
        setUseTierList(true);
        setTicketTiers(hydratedTiers);
        setPrice('');
      } else {
        setUseTierList(false);
        setTicketTiers([]);
        const tp = event.ticketPrice;
        setPrice(tp != null && tp > 0 ? String(Math.round(Number(tp))) : '');
      }

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

      setVenueName(typeof event.venueName === 'string' ? event.venueName : '');
      setRecurrence(typeof event.recurrenceRule === 'string' ? event.recurrenceRule : '');
      setStampImage(typeof event.stampImageUrl === 'string' && event.stampImageUrl ? event.stampImageUrl : null);
    }, 0);
    return () => clearTimeout(timer);
  }, [event, loading, eventId]);

  useEffect(() => {
    let alive = true;
    listTeamRosters()
      .then((rosters) => {
        if (alive) setTeamRosters(rosters);
      })
      .catch(() => {
        if (alive) setTeamRosters([]);
      })
      .finally(() => {
        if (alive) setTeamRostersLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    listFloorPlans()
      .then((res) => {
        if (alive) setVenues(res.floorPlans || []);
      })
      .catch(() => {
        if (alive) setVenues([]);
      })
      .finally(() => {
        if (alive) setVenuesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const refreshAttachedVenue = useCallback(() => {
    if (!eventId) return;
    setVenueLoading(true);
    getEventFloorPlan(eventId)
      .then((res) => setAttachedVenue(res.floorPlan || null))
      .catch(() => setAttachedVenue(null))
      .finally(() => setVenueLoading(false));
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(refreshAttachedVenue, 0);
    return () => clearTimeout(timer);
  }, [refreshAttachedVenue]);

  const refreshGates = useCallback(() => {
    if (!eventId) return;
    setGatesLoading(true);
    listGates(eventId)
      .then((res) => {
        setGates(res.gates || []);
        setGatesError('');
      })
      .catch(() => setGatesError('Could not load gates for this event.'))
      .finally(() => setGatesLoading(false));
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(refreshGates, 0);
    return () => clearTimeout(timer);
  }, [refreshGates]);

  // Rosters already assigned to this event, keyed by rosterId — Event team reads
  // eventAssignments straight off each roster (assignRosterToEvent's own shape).
  const assignmentByRosterId = useMemo(() => {
    const entries = teamRosters
      .map((roster) => [roster.id, (roster.eventAssignments || []).find((a) => a.eventId === eventId)])
      .filter(([, assignment]) => Boolean(assignment));
    return new Map(entries);
  }, [teamRosters, eventId]);

  const assignedRosterIds = useMemo(() => new Set(assignmentByRosterId.keys()), [assignmentByRosterId]);

  const toggleTeamRoster = async (roster) => {
    if (!eventId) return;
    try {
      if (assignmentByRosterId.has(roster.id)) {
        const nextAssignments = (roster.eventAssignments || []).filter((a) => a.eventId !== eventId);
        const updated = await updateTeamRoster(roster.id, { eventAssignments: nextAssignments });
        if (updated) setTeamRosters((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const result = await assignRosterToEvent(roster.id, eventId, { memberIds: [] });
        if (result.roster) setTeamRosters((prev) => prev.map((r) => (r.id === result.roster.id ? result.roster : r)));
      }
    } catch {
      toast.error('Could not update the team assignment.');
    }
  };

  const setTeamRosterMembers = async (roster, memberIds) => {
    if (!eventId) return;
    try {
      const result = await assignRosterToEvent(roster.id, eventId, { memberIds });
      if (result.roster) setTeamRosters((prev) => prev.map((r) => (r.id === result.roster.id ? result.roster : r)));
    } catch {
      toast.error('Could not update the team assignment.');
    }
  };

  // Flattened members of every team assigned to this event, in GateEditModal's
  // assignedPeople shape — the pool Door assignments toggles staff from.
  const assignedTeamMembers = useMemo(
    () =>
      teamRosters
        .filter((roster) => assignedRosterIds.has(roster.id))
        .flatMap((roster) => (roster.members || []).map((member) => ({
          id: `${roster.id}:${member.id}`,
          label: member.name || member.handle || member.contact || member.id,
          rosterId: roster.id,
          memberId: member.id,
          role: member.role,
        }))),
    [teamRosters, assignedRosterIds]
  );

  const pickVenue = async (venue) => {
    if (!eventId || venueSaving) return;
    setVenueSaving(true);
    try {
      await attachFloorPlan(eventId, venue.id);
      setAttachedVenue(venue);
      refreshGates();
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Could not attach the venue.');
    } finally {
      setVenueSaving(false);
    }
  };

  const removeVenue = async () => {
    if (!eventId || venueSaving) return;
    setVenueSaving(true);
    try {
      await detachFloorPlan(eventId);
      setAttachedVenue(null);
    } catch (err) {
      toast.error(err?.data?.error || err?.message || 'Could not remove the venue.');
    } finally {
      setVenueSaving(false);
    }
  };

  const toggleGateMember = async (gate, member) => {
    const current = Array.isArray(gate.staffJson) ? gate.staffJson : [];
    const active = current.some((person) => person.id === member.id);
    const next = active ? current.filter((person) => person.id !== member.id) : [...current, member];
    setSavingGateId(gate.id);
    try {
      await updateGate(eventId, gate.id, { staffJson: next });
      setGates((prev) => prev.map((g) => (g.id === gate.id ? { ...g, staffJson: next } : g)));
    } catch {
      setGatesError('Could not update the door assignment. Try again.');
    } finally {
      setSavingGateId(null);
    }
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
    if (!location.trim()) {
      setFormError('Venue / location is required.');
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
    const pricingCheck = validatePaidPricing({ isPaid, useTierList, price, tiers: ticketTiers });
    if (!pricingCheck.ok) {
      setFormError(pricingCheck.error);
      return;
    }

    setIsSaving(true);
    try {
      const graceTime =
        (parseInt(graceTimeHours, 10) || 0) * 60 + (parseInt(graceTimeMinutes, 10) || 0);
      const pricing = buildTicketPricingPayload({ isPaid, useTierList, price, tiers: ticketTiers });
      await eventsService.updateEvent(eventId, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        latitude: geoLat ?? undefined,
        longitude: geoLon ?? undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        coverImage: coverImage.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        ticketType: pricing.ticketType,
        ticketPrice: pricing.ticketPrice,
        ...(pricing.ticketTiersJson ? { ticketTiersJson: pricing.ticketTiersJson } : { ticketTiersJson: null }),
        currency: (event.currency || 'USD').trim() || 'USD',
        graceTime,
        maxImagesPerUser: parseInt(maxImages, 10) || 100,
        capacity: capacity.trim() !== '' && parseInt(capacity, 10) > 0 ? parseInt(capacity, 10) : null,
        venueName: venueName.trim() || null,
        recurrenceRule: recurrence || null,
        stampImageUrl: stampImage || null,
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
    'w-full rounded-xl bg-white/[0.045] text-white placeholder-zinc-500 px-3 py-2.5 text-sm outline-none focus:bg-white/[0.07]';
  const labelClass = 'block text-[11px] font-bold text-zinc-500 tracking-[0.02em] mb-1.5';

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center py-16">
        <PxiSpinner size="md" />
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
        <div className="flex items-center justify-between bg-zinc-950 px-5 py-4">
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
              className="flex-1 accent-white"
            />
          </div>
          <button
            type="button"
            onClick={handleCropConfirm}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200"
          >
            Use photo
          </button>
        </div>
      </div>
    )}
    <div className="space-y-6 pb-16">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isPast} className="space-y-6 disabled:opacity-60">
        {formError && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}
        <section className="dashboard-surface rounded-2xl p-5 space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.02em] text-zinc-500">
            <HugeiconsIcon icon={ImageIcon} size={16} />
            Cover image
          </h2>
          <label className="relative block w-full sm:w-[300px] sm:mx-auto cursor-pointer" style={{ aspectRatio: '3/4' }}>
            <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} disabled={isCoverUploading} />
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-white/[0.045]">
              {(coverImage || coverPreview) ? (
                <img src={coverImage || coverPreview} alt="" className="w-full h-full object-cover" />
              ) : !isCoverUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <HugeiconsIcon icon={ImageIcon} size={36} className="text-white opacity-30" />
                  <span className="text-[11px] font-bold text-white/30 tracking-[0.02em]">Add cover image</span>
                </div>
              ) : null}
              {isCoverUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 rounded-2xl">
                  <PxiSpinner size="md" />
                  <span className="text-[11px] font-extrabold text-white/85 tracking-[0.02em]">Uploading cover...</span>
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
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            )}
          </label>
        </section>

        <section className="dashboard-surface rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold tracking-[0.02em] text-zinc-500">Basics</h2>
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
            <label className={labelClass}>Use a saved venue</label>
            {venueLoading || venuesLoading ? (
              <div className="h-16 animate-pulse rounded-xl bg-white/[0.035]" />
            ) : (
              <>
                {attachedVenue ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.08] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{attachedVenue.name}</p>
                      {attachedVenue.address ? (
                        <p className="mt-1 truncate text-xs text-zinc-500">{attachedVenue.address}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={venueSaving}
                      onClick={removeVenue}
                      className="shrink-0 text-[11px] font-bold tracking-[0.02em] text-red-400 hover:text-red-300 disabled:opacity-40"
                    >
                      Remove venue
                    </button>
                  </div>
                ) : null}
                {venues.length ? (
                  <div className="flex flex-wrap gap-2">
                    {venues.map((venue) => {
                      const active = attachedVenue?.id === venue.id;
                      return (
                        <button
                          key={venue.id}
                          type="button"
                          disabled={venueSaving}
                          onClick={() => pickVenue(venue)}
                          className={`rounded-xl px-3.5 py-2.5 text-left transition disabled:opacity-40 ${
                            active ? 'bg-white/[0.08]' : 'bg-white/[0.035] hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className="block text-xs font-bold text-white">{venue.name}</span>
                          {venue.address ? <span className="mt-0.5 block text-[10px] text-zinc-500">{venue.address}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No saved venues yet — add one from Floor Plans.</p>
                )}
              </>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Venue / location *</label>
            <div
              className={`${inputClass} p-0 overflow-visible`}
              onChange={(e) => {
                if (e.target.tagName === 'INPUT') setLocation(e.target.value);
              }}
            >
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Venue name</label>
              <input
                className={inputClass}
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. The Grand Hall"
              />
            </div>
            <div>
              <label className={labelClass}>Repeats</label>
              <select className={inputClass} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <option value="">One-off event</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every two weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>
          {recurrence ? (
            <div>
              <label className={labelClass}>Custom passport stamp (recurring series)</label>
              <div className="flex items-center gap-3">
                {stampImage ? (
                  <img src={stampImage} alt="Custom stamp" className="h-16 w-16 rounded-xl object-cover" />
                ) : null}
                <label className="pill-ghost cursor-pointer px-4 py-2 text-xs font-bold tracking-[0.02em]">
                  {isStampUploading ? 'Uploading...' : stampImage ? 'Replace stamp' : 'Upload stamp'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isStampUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsStampUploading(true);
                      try {
                        const url = await uploadImageToR2(file);
                        setStampImage(url);
                      } catch {
                        setFormError('Stamp upload failed. Try another image.');
                      } finally {
                        setIsStampUploading(false);
                      }
                    }}
                  />
                </label>
                {stampImage ? (
                  <button
                    type="button"
                    onClick={() => setStampImage(null)}
                    className="text-xs font-semibold tracking-[0.02em] text-white/40 hover:text-white"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
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

        <section className="dashboard-surface rounded-2xl p-5 space-y-5">
          <h2 className="text-xs font-bold tracking-[0.02em] text-zinc-500">Configuration</h2>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
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
              className={`relative w-12 h-7 rounded-full transition-colors ${!isPrivate ? 'bg-white' : 'bg-zinc-600'}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full transition-all ${!isPrivate ? 'left-6 bg-black' : 'left-1 bg-white'}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Paid ticket</p>
              <p className="text-xs text-zinc-500">Requires completed hosting payment setup.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPaid}
              onClick={() => handlePaidToggle(!isPaid)}
              className={`relative w-12 h-7 rounded-full transition-colors ${isPaid ? 'bg-white' : 'bg-zinc-600'}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full transition-all ${isPaid ? 'left-6 bg-black' : 'left-1 bg-white'}`}
              />
            </button>
          </div>

          {isPaid && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
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
                  className={`relative w-12 h-7 rounded-full transition-colors ${useTierList ? 'bg-white' : 'bg-zinc-600'}`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full transition-all ${useTierList ? 'left-6 bg-black' : 'left-1 bg-white'}`}
                  />
                </button>
              </div>

              {useTierList ? (
                <div className="space-y-3">
                  {ticketTiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="space-y-3 rounded-xl bg-white/[0.035] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold tracking-[0.02em] text-zinc-500">
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
                    className="w-full rounded-xl bg-white/[0.045] py-2.5 text-xs font-semibold tracking-wider text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    + Add tier
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.045] px-3 py-2">
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

        <section className="dashboard-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold tracking-[0.02em] text-zinc-500">Event team</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {assignedRosterIds.size ? `${assignedRosterIds.size} team${assignedRosterIds.size === 1 ? '' : 's'} assigned` : 'Optional'}
              </p>
            </div>
            <Link
              href="/dashboard/team"
              className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] text-zinc-400 hover:bg-white/[0.1] hover:text-white"
            >
              Manage teams
            </Link>
          </div>

          {teamRostersLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-white/[0.035]" />
          ) : teamRosters.length ? (
            <div className="space-y-3">
              {teamRosters.map((roster) => {
                const assignment = assignmentByRosterId.get(roster.id);
                const selectedMemberIds = assignment?.memberIds || [];
                const wholeTeam = Boolean(assignment && selectedMemberIds.length === 0);

                return (
                  <div key={roster.id} className={`rounded-xl px-4 py-4 transition ${assignment ? 'bg-white/[0.08]' : 'bg-white/[0.035]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <button type="button" onClick={() => toggleTeamRoster(roster)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-bold text-white">{roster.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {roster.members.length} member{roster.members.length === 1 ? '' : 's'}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleTeamRoster(roster)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] transition ${
                          assignment ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white'
                        }`}
                      >
                        {assignment ? 'Selected' : 'Choose'}
                      </button>
                    </div>

                    {assignment && roster.members.length ? (
                      <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setTeamRosterMembers(roster, [])}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] transition ${
                            wholeTeam ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white'
                          }`}
                        >
                          Whole team
                        </button>
                        {roster.members.map((member) => {
                          const active = selectedMemberIds.includes(member.id);
                          return (
                            <button
                              type="button"
                              key={member.id}
                              onClick={() => {
                                const memberIds = active
                                  ? selectedMemberIds.filter((memberId) => memberId !== member.id)
                                  : [...selectedMemberIds, member.id];
                                setTeamRosterMembers(roster, memberIds);
                              }}
                              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] transition ${
                                active ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white'
                              }`}
                            >
                              {memberDisplayName(member)}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.035] px-4 py-5 text-sm text-zinc-500">
              Create a team in Teams &amp; Security, then return here to attach it.
            </div>
          )}
        </section>

        {attachedVenue && assignedRosterIds.size > 0 ? (
          <section className="dashboard-surface rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-xs font-bold tracking-[0.02em] text-zinc-500">Door assignments</h2>
              <p className="mt-1 text-xs text-zinc-500">Assign your team to {attachedVenue.name}&apos;s gates.</p>
            </div>
            {gatesError ? <p className="text-xs text-red-300">{gatesError}</p> : null}
            {gatesLoading ? (
              <div className="h-16 animate-pulse rounded-xl bg-white/[0.035]" />
            ) : gates.length ? (
              <div className="space-y-3">
                {gates.map((gate) => {
                  const assignedIds = new Set((Array.isArray(gate.staffJson) ? gate.staffJson : []).map((person) => person.id));
                  return (
                    <div key={gate.id} className="rounded-xl bg-white/[0.035] px-4 py-3">
                      <p className="text-sm font-bold text-white">{gate.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {assignedTeamMembers.length ? assignedTeamMembers.map((member) => {
                          const active = assignedIds.has(member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              disabled={savingGateId === gate.id}
                              onClick={() => toggleGateMember(gate, member)}
                              className={`rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] transition disabled:opacity-40 ${
                                active ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-white'
                              }`}
                            >
                              {member.label}
                            </button>
                          );
                        }) : (
                          <p className="text-xs text-zinc-500">Assign a team above to staff this gate.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">This venue has no named gates yet.</p>
            )}
          </section>
        ) : null}

        {paidGate && (
          <div className="space-y-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {paidGate === 'no-account' ? (
              <p>To sell tickets, complete hosting setup with Stripe.</p>
            ) : (
              <p>Stripe is still verifying your account. You can save as a free event or check status from hosting setup.</p>
            )}
            <Link href="/dashboard/vendor-upgrade" className="inline-block font-bold text-white underline decoration-white/30 underline-offset-4 hover:text-zinc-200">
              Hosting setup
            </Link>
          </div>
        )}

        </fieldset>
        <div className="dashboard-surface flex flex-col-reverse gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="pill-ghost inline-flex min-h-[48px] items-center justify-center px-5 text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPast || isSaving || isCoverUploading}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-white px-6 text-sm font-bold tracking-[0.02em] text-black transition hover:bg-zinc-200 disabled:opacity-45"
          >
            {isSaving ? <PxiSpinner size="sm" /> : null}
            {isSaving ? 'Saving...' : isPast ? 'Event ended (read-only)' : 'Save'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl bg-red-500/5">
        <div className="p-5">
          <h2 className="text-xs font-bold text-red-400 tracking-[0.02em]">Danger zone</h2>
        </div>
        <div className="p-5">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPast || isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-5 py-2.5 text-xs font-bold tracking-[0.02em] text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
            {isDeleting ? 'Deleting...' : 'Delete event'}
          </button>
          <p className="mt-2 text-xs text-zinc-500">This action is permanent and cannot be undone.</p>
        </div>
      </section>

      {showPublicConsent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="dashboard-popover-surface w-full max-w-md space-y-4 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-white">Public event</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              By making this event public, you agree that photos and content from this event may be curated into public
              scrapbooks and used in PXI marketing materials. Attendees will be notified when they join.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPublicConsent(false)}
                className="pill-ghost px-4 py-2.5 text-sm text-zinc-300"
              >
                Keep private
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPrivate(false);
                  setShowPublicConsent(false);
                }}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black"
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
