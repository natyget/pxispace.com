'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  Plus,
  X,
  Search,
  DollarSign,
  Images,
} from 'lucide-react';
import { eventsService, searchUsers } from '../../services/events';
import { uploadImageToR2 } from '../../services/media';
import { authService, authStorage } from '../../services/auth';
import { useAuth } from '@/contexts/AuthContext';

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
  const [startLocal, setStartLocal] = useState(defaults.current.start);
  const [endLocal, setEndLocal] = useState(defaults.current.end);

  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  const [isPrivate, setIsPrivate] = useState(true);
  const [showPublicConsent, setShowPublicConsent] = useState(false);

  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [paidGate, setPaidGate] = useState(null);

  const [graceTimeHours, setGraceTimeHours] = useState('0');
  const [graceTimeMinutes, setGraceTimeMinutes] = useState('15');
  const [maxImages, setMaxImages] = useState('100');

  const [lineupRoleDraft, setLineupRoleDraft] = useState('');
  const [featuredQuery, setFeaturedQuery] = useState('');
  const [featuredResults, setFeaturedResults] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredPeople, setFeaturedPeople] = useState([]);

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

  const addFeaturedPerson = useCallback(
    (candidate) => {
      const normalizedUsername = String(candidate.username || '').replace(/^@/, '').trim();
      if (!normalizedUsername) return;
      const roleForEntry = (lineupRoleDraft.trim() || 'Line up').slice(0, LINEUP_ROLE_MAX);
      setFeaturedPeople((prev) => {
        const exists = prev.find(
          (p) => p.id === candidate.id || p.username.toLowerCase() === normalizedUsername.toLowerCase()
        );
        if (exists) {
          return prev.map((p) =>
            p.id === candidate.id || p.username.toLowerCase() === normalizedUsername.toLowerCase()
              ? { ...p, role: roleForEntry }
              : p
          );
        }
        return [
          ...prev,
          {
            id: candidate.id,
            username: normalizedUsername,
            name: candidate.name,
            avatarUrl: candidate.avatarUrl,
            role: roleForEntry,
          },
        ];
      });
      setFeaturedQuery('');
      setFeaturedResults([]);
    },
    [lineupRoleDraft]
  );

  const removeFeaturedPerson = (id) => {
    setFeaturedPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const onCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setFormError(null);
    if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    const blobUrl = URL.createObjectURL(file);
    setCoverPreview(blobUrl);
    setCoverImage(null);
    setIsCoverUploading(true);
    try {
      const publicUrl = await uploadImageToR2(file, {
        filename: file.name,
        contentType: file.type,
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
    if (!name.trim() || !startLocal || !endLocal) {
      setFormError('Event name, start, and end are required.');
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
    if (isPaid) {
      const p = parseInt(price, 10);
      if (!price.trim() || Number.isNaN(p) || p <= 0) {
        setFormError('Paid events need a ticket price greater than 0.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const geo = await tryGetGeo();
      const graceTime =
        (parseInt(graceTimeHours, 10) || 0) * 60 + (parseInt(graceTimeMinutes, 10) || 0);
      const ticketPrice = isPaid ? parseInt(price, 10) : 0;

      const created = await eventsService.createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        location,
        latitude: typeof geo.latitude === 'number' ? geo.latitude : undefined,
        longitude: typeof geo.longitude === 'number' ? geo.longitude : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        coverImage: coverImage.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        ticketType: isPaid ? 'PAID' : 'FREE',
        ticketPrice,
        currency: 'USD',
        graceTime,
        maxImages: parseInt(maxImages, 10) || 100,
        createdBy: user.id,
        featuredPeople: featuredPeople.map((p) => ({ username: p.username, role: p.role })),
      });

      if (created.token && user) {
        await authStorage.save({ token: created.token, user });
      }

      const eventId = created.event?.id || created.id;
      if (!eventId) {
        setFormError('Event created but no id returned.');
        return;
      }
      router.push(`/dashboard/events/${eventId}`);
    } catch (err) {
      setFormError(err.message || 'Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-500 px-3 py-2.5 text-sm focus:border-pxi-purple/50 focus:outline-none';
  const labelClass = 'block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/events"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create event</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Same fields as the PXI mobile studio flow.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {formError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={16} className="text-pxi-purple" />
            Cover image *
          </h2>
          <p className="text-xs text-zinc-500">
            Uploaded to cloud storage (presigned URL). Required before submit, matching the mobile app.
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-sm text-white hover:border-pxi-purple/40 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} />
              Choose image
            </label>
            {isCoverUploading && (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                Uploading…
              </span>
            )}
          </div>
          {(coverPreview || coverImage) && (
            <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-zinc-800">
              <img
                src={coverImage || coverPreview}
                alt=""
                className="w-full max-h-[520px] object-contain bg-black"
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Basics</h2>
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
          <div>
            <label className={labelClass}>Venue / location</label>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
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

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Search size={16} className="text-pxi-purple" />
            Line up (optional)
          </h2>
          <p className="text-xs text-zinc-500">
            Search people by username. Set a role label (max {LINEUP_ROLE_MAX} chars) before adding; they receive line-up
            invites when the event is created.
          </p>
          <div>
            <label className={labelClass}>Role for next add</label>
            <input
              className={inputClass}
              value={lineupRoleDraft}
              onChange={(e) => setLineupRoleDraft(e.target.value.slice(0, LINEUP_ROLE_MAX))}
              placeholder="Line up, DJ, Host…"
              maxLength={LINEUP_ROLE_MAX}
            />
          </div>
          <div>
            <label className={labelClass}>Search username</label>
            <input
              className={inputClass}
              value={featuredQuery}
              onChange={(e) => setFeaturedQuery(e.target.value)}
              placeholder="Type at least 2 characters…"
              autoComplete="off"
            />
            {featuredLoading && <p className="text-xs text-zinc-500 mt-2">Searching…</p>}
            {featuredResults.length > 0 && (
              <ul className="mt-2 rounded-xl border border-white/10 divide-y divide-white/5 max-h-40 overflow-auto">
                {featuredResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/5 flex justify-between items-center gap-2"
                      onClick={() => addFeaturedPerson(u)}
                    >
                      <span>
                        @{u.username}
                        {u.name ? <span className="text-zinc-500"> • {u.name}</span> : null}
                      </span>
                      <Plus size={16} className="text-pxi-purple shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {featuredPeople.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {featuredPeople.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 text-xs text-fuchsia-200"
                >
                  @{p.username} • {p.role}
                  <button type="button" onClick={() => removeFeaturedPerson(p.id)} className="text-zinc-400 hover:text-white">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 space-y-5">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Configuration</h2>

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

        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
            <Link
              href="/dashboard/events"
              className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-white/15 text-sm font-semibold text-zinc-200 hover:bg-white/5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isCoverUploading || !coverImage}
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-pxi-purple text-white text-sm font-bold uppercase tracking-widest disabled:opacity-45 hover:brightness-110 transition-all"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSubmitting ? 'Creating…' : isCoverUploading ? 'Uploading cover…' : 'Create event'}
            </button>
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
  );
}
