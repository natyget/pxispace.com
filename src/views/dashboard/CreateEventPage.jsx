'use client';

/* global process */
/* eslint-disable no-unused-vars */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Loading02Icon, ImageIcon, HelpCircleIcon, Cancel01Icon, Search01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import Cropper from 'react-easy-crop';
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import { toast } from 'sonner';
import { eventsService, searchUsers } from '../../services/events';
import { uploadImageToR2 } from '../../services/media';
import { authService, authStorage } from '../../services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/lib/dashboardStore';
import { PxiSpinner } from '@/components/loading/PxiLoading';
import {
  assignRosterToEvent,
  clearCreateEventTeamAssignments,
  getCreateEventTeamAssignments,
  listTeamRosters,
  setCreateEventTeamAssignments,
} from '@/services/teamRosters';
import { listFloorPlans, attachFloorPlan } from '@/services/floorPlans';
import { listGates, updateGate } from '@/services/gates';
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

function memberDisplayName(member) {
  return member?.name || member?.handle || member?.contact || 'Team member';
}

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

export default function CreateEventPage({ embedded = false, onCancel, onCreated }) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { invalidate } = useEvents({ limit: 100, offset: 0 });
  const defaults = useMemo(() => defaultStartEnd(), []);
  const searchTimerRef = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [venueName, setVenueName] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState('');
  const [stampImage, setStampImage] = useState(null);
  const [isStampUploading, setIsStampUploading] = useState(false);
  const [geoLat, setGeoLat] = useState(null);
  const [geoLon, setGeoLon] = useState(null);
  const [startLocal, setStartLocal] = useState(() => defaults.start);
  const [endLocal, setEndLocal] = useState(() => defaults.end);

  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  /** { [gateName]: assignedPerson[] } — staged locally until the event (and its
   *  auto-seeded EventGate rows) exist; flushed via updateGate after create. */
  const [doorAssignments, setDoorAssignments] = useState({});

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
  // Single free-form role input (mirrors mobile). "Co-host"/"Bouncer" resolve to
  // staff; anything else is a display lineup role (DJ, MC…). No "Host" — the
  // creator is the host.
  const [lineupRoleDraft, setLineupRoleDraft] = useState('');
  const [featuredQuery, setFeaturedQuery] = useState('');
  const [featuredResults, setFeaturedResults] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  /** People tapped from search but NOT yet added — committed together on ADD. */
  const [selectedPeople, setSelectedPeople] = useState([]);
  /** @type {Array<{ id: string; username: string; name?: string; avatarUrl?: string; kind: 'lineup' | 'member' | 'cohost' | 'bouncer'; lineupSubrole?: string }>} */
  const [pendingInvites, setPendingInvites] = useState([]);
  const [teamRosters, setTeamRosters] = useState([]);
  const [teamAssignments, setTeamAssignments] = useState([]);
  const [teamAssignmentsLoading, setTeamAssignmentsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    let alive = true;
    Promise.all([listTeamRosters(), getCreateEventTeamAssignments()])
      .then(([rosters, assignments]) => {
        if (!alive) return;
        const rosterIds = new Set(rosters.map((roster) => roster.id));
        setTeamRosters(rosters);
        setTeamAssignments(assignments.filter((assignment) => rosterIds.has(assignment.rosterId)));
      })
      .catch(() => {
        if (!alive) return;
        setTeamRosters([]);
        setTeamAssignments([]);
      })
      .finally(() => {
        if (alive) setTeamAssignmentsLoading(false);
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

  useEffect(() => {
    const q = featuredQuery.trim();
    if (q.length < 2) {
      const timer = setTimeout(() => setFeaturedResults([]), 0);
      return () => clearTimeout(timer);
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
    (candidate, override) => {
      const normalizedUsername = String(candidate.username || '').replace(/^@/, '').trim();
      if (!normalizedUsername) return;
      const kind = override?.kind ?? inviteRoleKind;
      const lineupSubrole =
        kind === 'lineup'
          ? ((override?.lineupSubrole ?? lineupSubDraft).trim() || 'Line up').slice(0, LINEUP_ROLE_MAX)
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
          kind,
          lineupSubrole,
        };
        if (exists) {
          return prev.map((p) =>
            p.id === candidate.id || p.username.toLowerCase() === normalizedUsername.toLowerCase() ? entry : p
          );
        }
        return [...prev, entry];
      });
    },
    [inviteRoleKind, lineupSubDraft]
  );

  const removePendingInvite = (id) => {
    setPendingInvites((prev) => prev.filter((p) => p.id !== id));
  };

  /** Map a free-form role string onto the invite model. "Co-host"/"Bouncer" are
   *  staff; everything else is a display lineup subrole (DJ, MC…). No host. */
  const deriveInvite = (roleText) => {
    const t = roleText.trim().toLowerCase();
    if (t === 'co-host' || t === 'cohost') return { kind: 'cohost', lineupSubrole: undefined };
    if (t === 'bouncer') return { kind: 'bouncer', lineupSubrole: undefined };
    return { kind: 'lineup', lineupSubrole: roleText.trim() };
  };

  // The flow: choose a role → search and STAGE one or more people (clicking a
  // profile only selects, never adds) → ADD commits them all under that role.
  const canAddLineup = lineupRoleDraft.trim().length > 0 && selectedPeople.length > 0;

  const toggleSelectPerson = (person) => {
    setSelectedPeople((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person]
    );
  };

  const commitLineup = () => {
    const role = lineupRoleDraft.trim();
    if (!role || selectedPeople.length === 0) return;
    const invite = deriveInvite(role);
    selectedPeople.forEach((person) => addPendingInvite(person, invite));
    setSelectedPeople([]);
    setLineupRoleDraft('');
    setFeaturedQuery('');
    setFeaturedResults([]);
  };

  const persistTeamAssignments = useCallback((updater) => {
    setTeamAssignments((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      void setCreateEventTeamAssignments(next);
      return next;
    });
  }, []);

  const toggleTeamRoster = useCallback(
    (rosterId) => {
      persistTeamAssignments((current) => {
        if (current.some((assignment) => assignment.rosterId === rosterId)) {
          return current.filter((assignment) => assignment.rosterId !== rosterId);
        }
        return [...current, { rosterId, memberIds: [] }];
      });
    },
    [persistTeamAssignments]
  );

  const setTeamRosterMembers = useCallback(
    (rosterId, memberIds) => {
      persistTeamAssignments((current) => {
        const existing = current.find((assignment) => assignment.rosterId === rosterId);
        if (!existing) return [...current, { rosterId, memberIds }];
        return current.map((assignment) =>
          assignment.rosterId === rosterId ? { ...assignment, memberIds } : assignment
        );
      });
    },
    [persistTeamAssignments]
  );

  const assignmentByRosterId = useMemo(
    () => new Map(teamAssignments.map((assignment) => [assignment.rosterId, assignment])),
    [teamAssignments]
  );

  const assignedTeamCount = teamAssignments.length;

  const pickVenue = (venue) => {
    setSelectedVenueId(venue.id);
    setLocation(venue.address || '');
    setVenueName(venue.name || '');
    setGeoLat(typeof venue.venueLat === 'number' ? venue.venueLat : null);
    setGeoLon(typeof venue.venueLng === 'number' ? venue.venueLng : null);
  };

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) || null,
    [venues, selectedVenueId]
  );

  // Teams already linked to this venue (Teams & Security "Venues" chips) — promoted
  // to the top of the Event team picker below as a suggestion, never auto-selected.
  const suggestedRosterIds = useMemo(() => {
    if (!selectedVenue) return new Set();
    return new Set(
      teamRosters.filter((roster) => (roster.venueIds || []).includes(selectedVenue.id)).map((roster) => roster.id)
    );
  }, [selectedVenue, teamRosters]);

  const orderedTeamRosters = useMemo(() => {
    if (!suggestedRosterIds.size) return teamRosters;
    const suggested = teamRosters.filter((roster) => suggestedRosterIds.has(roster.id));
    const rest = teamRosters.filter((roster) => !suggestedRosterIds.has(roster.id));
    return [...suggested, ...rest];
  }, [teamRosters, suggestedRosterIds]);

  // Flattened members of every team assigned in "Event team", in GateEditModal's
  // assignedPeople shape — the pool Door assignments toggles staff from.
  const assignedTeamMembers = useMemo(() => {
    const assignedRosterIds = new Set(teamAssignments.map((assignment) => assignment.rosterId));
    return teamRosters
      .filter((roster) => assignedRosterIds.has(roster.id))
      .flatMap((roster) => (roster.members || []).map((member) => ({
        id: `${roster.id}:${member.id}`,
        label: member.name || member.handle || member.contact || member.id,
        rosterId: roster.id,
        memberId: member.id,
        role: member.role,
      })));
  }, [teamAssignments, teamRosters]);

  const doorAssignmentsVisible = Boolean(selectedVenue && assignedTeamCount > 0);

  const toggleDoorAssignment = (gateName, member) => {
    setDoorAssignments((current) => {
      const existing = current[gateName] || [];
      const active = existing.some((person) => person.id === member.id);
      const next = active ? existing.filter((person) => person.id !== member.id) : [...existing, member];
      return { ...current, [gateName]: next };
    });
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
    const pricingCheck = validatePaidPricing({ isPaid, useTierList, price, tiers: ticketTiers });
    if (!pricingCheck.ok) {
      setFormError(pricingCheck.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const geo = geoLat != null && geoLon != null
        ? { latitude: geoLat, longitude: geoLon }
        : await tryGetGeo();
      const graceTime =
        (parseInt(graceTimeHours, 10) || 0) * 60 + (parseInt(graceTimeMinutes, 10) || 0);
      const pricing = buildTicketPricingPayload({ isPaid, useTierList, price, tiers: ticketTiers });

      const lineupOnly = pendingInvites
        .filter((p) => p.kind === 'lineup')
        .map((p) => ({ username: p.username, role: p.lineupSubrole || 'Line up' }));

      const created = await eventsService.createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        latitude: typeof geo.latitude === 'number' ? geo.latitude : undefined,
        longitude: typeof geo.longitude === 'number' ? geo.longitude : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        coverImage: coverImage.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        ticketType: pricing.ticketType,
        ticketPrice: pricing.ticketPrice,
        currency: 'USD',
        graceTime,
        maxImages: parseInt(maxImages, 10) || 100,
        capacity: capacity.trim() !== '' && parseInt(capacity, 10) > 0 ? parseInt(capacity, 10) : undefined,
        createdBy: user.id,
        featuredPeople: lineupOnly,
        venueName: venueName.trim() || undefined,
        recurrenceRule: recurrence || undefined,
        stampImageUrl: stampImage || undefined,
        spotifyPlaylistUrl: spotifyPlaylistUrl.trim() || undefined,
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

      // Ticket tiers aren't accepted by POST /api/events; persist them with an
      // immediate follow-up PUT (same shape EventEditPageView uses). Non-fatal:
      // the event itself is already created with the correct base ticketPrice.
      if (pricing.ticketTiersJson) {
        try {
          await eventsService.updateEvent(eventId, { ticketTiersJson: pricing.ticketTiersJson });
        } catch {
          /* non-fatal; organizer can retry tier setup from Edit event */
        }
      }

      if (teamAssignments.length > 0) {
        let staffInvited = 0;
        let staffFailed = 0;
        for (const assignment of teamAssignments) {
          try {
            const result = await assignRosterToEvent(assignment.rosterId, eventId, { memberIds: assignment.memberIds });
            staffInvited += result?.staffInvites?.invited.length || 0;
            staffFailed += result?.staffInvites?.failed.length || 0;
          } catch {
            /* non-fatal; teams can be adjusted from Teams & Security */
          }
        }
        if (staffInvited) toast.success(`Invited ${staffInvited} team member${staffInvited === 1 ? '' : 's'} as event staff.`);
        if (staffFailed) toast.error(`${staffFailed} team member${staffFailed === 1 ? '' : 's'} couldn't be invited — check their PXI username in Teams & Security.`);
        await clearCreateEventTeamAssignments();
        setTeamAssignments([]);
      }

      if (selectedVenueId) {
        try {
          await attachFloorPlan(eventId, selectedVenueId);
          const hasDoorAssignments = Object.values(doorAssignments).some((members) => members.length > 0);
          if (hasDoorAssignments) {
            const gatesRes = await listGates(eventId);
            for (const gate of gatesRes.gates || []) {
              const members = doorAssignments[gate.name];
              if (members && members.length) {
                try {
                  await updateGate(eventId, gate.id, { staffJson: members });
                } catch {
                  /* non-fatal; door assignments can be adjusted from Live Ops */
                }
              }
            }
          }
        } catch {
          /* non-fatal; venue can be attached later from Floor Plans */
        }
      }

      // Strongest role first: if the same person shows up twice, the server
      // keeps the higher invite and drops the lesser one, so sending co-host
      // ahead of member means no card ever appears and then disappears.
      const inviteKindRank = { cohost: 3, bouncer: 2, lineup: 1, member: 0 };
      const postInvites = pendingInvites
        .filter((p) => p.kind !== 'lineup')
        .slice()
        .sort((a, b) => (inviteKindRank[b.kind] ?? 0) - (inviteKindRank[a.kind] ?? 0));
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
      invalidate();
      onCreated?.(created.event || created);
      router.push(`/dashboard/events/${eventId}`);
    } catch (err) {
      const msg = err.message || 'Failed to create event.';
      setFormError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'glass-field min-h-[44px] w-full rounded-2xl px-4 py-3 text-sm text-white';
  const labelClass = 'mb-1.5 block text-[11px] font-bold tracking-[0.02em] text-white/45';
  const sectionClass = 'glass-panel rounded-[1.75rem] p-5';
  const footerClass = 'glass-panel rounded-[1.75rem] p-4';

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
        <div className="glass-panel flex items-center justify-between px-5 py-4 rounded-none">
          <button
            type="button"
            onClick={() => setCropSrc(null)}
            className="pill-ghost px-5 py-2.5 text-sm"
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
            className="pill-solid px-5 py-2.5 text-sm"
          >
            Use photo
          </button>
        </div>
      </div>
    )}
    <div className={`${embedded ? 'space-y-6 pb-6' : 'max-w-4xl mx-auto space-y-6 pb-16'}`}>
      {!embedded && (
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/events"
            className="pill-ghost p-2 text-zinc-400 hover:text-white"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Create event</h1>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        )}

        <section className={`${sectionClass} space-y-4`}>
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.02em] text-white/60">
            <HugeiconsIcon icon={ImageIcon} size={16} />
            Cover image *
          </h2>
          <label className="relative block w-full sm:w-[300px] sm:mx-auto cursor-pointer" style={{ aspectRatio: '3/4' }}>
            <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} disabled={isCoverUploading} />
            <div className="glass-field flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
              {(coverImage || coverPreview) ? (
                <img
                  src={coverImage || coverPreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
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
                onClick={(e) => { e.preventDefault(); setCoverImage(null); setCoverPreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            )}
          </label>
        </section>

        <section className={`${sectionClass} space-y-4`}>
          <h2 className="text-xs font-bold tracking-[0.02em] text-white/60">Basics</h2>
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
            {venuesLoading ? (
              <div className="h-16 animate-pulse rounded-2xl bg-white/[0.035]" />
            ) : venues.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedVenueId(null)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    !selectedVenueId ? 'glass-panel-strong' : 'glass-panel hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="block text-sm font-bold text-white">One-off location</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">Search an address below.</span>
                </button>
                {venues.map((venue) => (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => pickVenue(venue)}
                    className={`rounded-2xl px-4 py-3 text-left transition ${
                      selectedVenueId === venue.id ? 'glass-panel-strong' : 'glass-panel hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="block truncate text-sm font-bold text-white">{venue.name}</span>
                    {venue.address ? (
                      <span className="mt-0.5 block truncate text-xs text-zinc-500">{venue.address}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">No saved venues yet — use a one-off location below, or add one from Floor Plans.</p>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Venue / location</label>
            <div
              className={`${inputClass} overflow-visible p-0`}
              onChange={(e) => {
                if (e.target.tagName === 'INPUT') setLocation(e.target.value);
              }}
            >
              <GeoapifyContext apiKey={GEOAPIFY_KEY}>
                <GeoapifyGeocoderAutocomplete
                  value={location}
                  placeholder=""
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
          <div>
            <label className={labelClass}>DJ playlist (optional)</label>
            <input
              className={inputClass}
              value={spotifyPlaylistUrl}
              onChange={(e) => setSpotifyPlaylistUrl(e.target.value)}
              placeholder="Spotify or Apple Music playlist/album URL"
            />
            <p className="mt-1 text-xs text-white/40">
              Shown on the event page and matched against attendees&apos; listening taste.
            </p>
          </div>

          {/* Line up — role first, then search & stage people, then Add. Clicking
              a profile only stages it; nothing is added until Add (mirrors the
              mobile CreateEventSheet flow). Multiple people can be staged under
              one role and added at once. */}
          <div>
            <label className={labelClass}>Line up (invited as performers, not members)</label>
            <div className="flex gap-2">
              <input
                className={`${inputClass} sm:w-40`}
                value={lineupRoleDraft}
                onChange={(e) => setLineupRoleDraft(e.target.value)}
                placeholder="Role (DJ, MC…)"
              />
              <input
                className={inputClass}
                value={featuredQuery}
                onChange={(e) => setFeaturedQuery(e.target.value)}
                placeholder="Search @username"
              />
              <button
                type="button"
                disabled={!canAddLineup}
                onClick={commitLineup}
                className="shrink-0 rounded-2xl bg-white px-5 text-xs font-bold tracking-[0.02em] text-black transition-opacity disabled:opacity-40"
              >
                Add
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {['Co-host', 'Bouncer'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLineupRoleDraft(r)}
                  className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-bold tracking-[0.02em] text-white/60 hover:text-white"
                >
                  {r} · staff
                </button>
              ))}
            </div>

            {selectedPeople.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleSelectPerson(person)}
                    className="rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-100"
                  >
                    @{person.username}
                    {lineupRoleDraft.trim() ? ` · ${lineupRoleDraft.trim()}` : ''} ✕
                  </button>
                ))}
              </div>
            ) : null}

            {featuredLoading || featuredResults.length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {featuredLoading && featuredResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-white/40">Searching…</div>
                ) : (
                  featuredResults.map((person) => {
                    const isSelected = selectedPeople.some((p) => p.id === person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => toggleSelectPerson(person)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-fuchsia-500/15' : 'hover:bg-white/[0.05]'
                        }`}
                      >
                        {person.avatarUrl ? (
                          <img src={person.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
                            {(person.name || person.username || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-white">{person.name || person.username}</span>
                          {person.username ? (
                            <span className="block truncate text-xs text-white/40">@{person.username}</span>
                          ) : null}
                        </span>
                        {isSelected ? <span className="text-fuchsia-300">✓</span> : null}
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}

            {pendingInvites.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {pendingInvites.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => removePendingInvite(p.id)}
                    className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/75"
                  >
                    @{p.username} · {formatPendingLabel(p)} ✕
                  </button>
                ))}
              </div>
            ) : null}

            <p className="mt-1 text-xs text-white/40">
              Pick a role, click the people for it, then Add. You&apos;re the host — Co-host and Bouncer are staff and don&apos;t appear on the public lineup.
            </p>
          </div>
          {recurrence ? (
            <div>
              <label className={labelClass}>Custom passport stamp (recurring series)</label>
              <p className="mb-2 text-xs text-white/40">
                Optional square artwork attendees collect as this event&apos;s stamp — shared by every recurrence.
              </p>
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
                        setFormError('Stamp upload failed — try another image.');
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

        <section className={`${sectionClass} space-y-5`}>
          <h2 className="text-xs font-bold tracking-[0.02em] text-white/60">Configuration</h2>

          <div className="glass-field flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
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
              className={`relative h-7 w-12 rounded-full transition-colors ${!isPrivate ? 'bg-white/25' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${!isPrivate ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>

          <div className="glass-field flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Paid ticket</p>
              <p className="text-xs text-zinc-500">Requires completed hosting payment setup.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPaid}
              onClick={() => handlePaidToggle(!isPaid)}
              className={`relative h-7 w-12 rounded-full transition-colors ${isPaid ? 'bg-white/25' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${isPaid ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>

          {isPaid && (
            <>
              <div className="glass-field flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
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
                  className={`relative h-7 w-12 rounded-full transition-colors ${useTierList ? 'bg-white/25' : 'bg-white/10'}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${useTierList ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>

              {useTierList ? (
                <div className="space-y-3">
                  {ticketTiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="glass-field rounded-xl p-4 space-y-3"
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
                <div>
                  <label className={labelClass}>Price in USD</label>
                  <div className="glass-field flex items-center gap-2 rounded-2xl px-3 py-2">
                    <HugeiconsIcon icon={HelpCircleIcon} size={18} className="shrink-0 text-zinc-500" />
                    <input
                      aria-label="Price in USD"
                      className="flex-1 bg-transparent text-sm text-white outline-none"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                    />
                  </div>
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
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`${sectionClass} space-y-4`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold tracking-[0.02em] text-white/60">Event team</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {assignedTeamCount ? `${assignedTeamCount} team${assignedTeamCount === 1 ? '' : 's'} selected` : 'Optional'}
              </p>
            </div>
            <Link href="/dashboard/team" className="pill-ghost shrink-0 px-3 py-1.5 text-[10px] font-bold tracking-[0.02em]">
              Manage teams
            </Link>
          </div>

          {teamAssignmentsLoading ? (
            <div className="h-20 rounded-2xl bg-white/[0.035] animate-pulse" />
          ) : teamRosters.length ? (
            <div className="space-y-3">
              {orderedTeamRosters.map((roster, index) => {
                const assignment = assignmentByRosterId.get(roster.id);
                const selectedMemberIds = assignment?.memberIds || [];
                const wholeTeam = Boolean(assignment && selectedMemberIds.length === 0);
                const isSuggested = suggestedRosterIds.has(roster.id);
                const showSuggestedLabel = isSuggested && index === 0;
                const showAllTeamsLabel =
                  !isSuggested && suggestedRosterIds.size > 0 && (index === 0 || suggestedRosterIds.has(orderedTeamRosters[index - 1]?.id));

                return (
                  <div key={roster.id}>
                    {showSuggestedLabel ? (
                      <p className="mb-2 text-[10px] font-bold tracking-[0.02em] text-fuchsia-300/70">
                        Suggested for this venue
                      </p>
                    ) : null}
                    {showAllTeamsLabel ? (
                      <p className="mb-2 mt-1 text-[10px] font-bold tracking-[0.02em] text-white/30">All teams</p>
                    ) : null}
                    <div className={`rounded-2xl px-4 py-4 transition ${assignment ? 'glass-panel-strong' : 'glass-panel'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <button type="button" onClick={() => toggleTeamRoster(roster.id)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-bold text-white">{roster.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {roster.members.length} member{roster.members.length === 1 ? '' : 's'}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTeamRoster(roster.id)}
                          className={`shrink-0 px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] ${assignment ? 'pill-solid' : 'pill-ghost'}`}
                        >
                          {assignment ? 'Selected' : 'Choose'}
                        </button>
                      </div>

                      {assignment && roster.members.length ? (
                        <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none">
                          <button
                            type="button"
                            onClick={() => setTeamRosterMembers(roster.id, [])}
                            className={`shrink-0 px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] ${wholeTeam ? 'pill-solid' : 'pill-ghost'}`}
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
                                  setTeamRosterMembers(roster.id, memberIds);
                                }}
                                className={`shrink-0 px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] ${active ? 'pill-solid' : 'pill-ghost'}`}
                              >
                                {memberDisplayName(member)}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-field rounded-2xl px-4 py-5 text-sm text-zinc-500">
              Create a team in Teams &amp; Security, then return here to attach it.
            </div>
          )}
        </section>

        {doorAssignmentsVisible ? (
          <section className={`${sectionClass} space-y-4`}>
            <div>
              <h2 className="text-xs font-bold tracking-[0.02em] text-white/60">Door assignments</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Assign your team to {selectedVenue.name}&apos;s gates. Applied once the event is created.
              </p>
            </div>
            <div className="space-y-3">
              {(selectedVenue.gatePinsJson || []).map((gate) => {
                const assignedIds = new Set((doorAssignments[gate.gate] || []).map((person) => person.id));
                return (
                  <div key={gate.id || gate.gate} className="glass-field rounded-2xl px-4 py-3">
                    <p className="text-sm font-bold text-white">{gate.gate}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assignedTeamMembers.length ? assignedTeamMembers.map((member) => {
                        const active = assignedIds.has(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleDoorAssignment(gate.gate, member)}
                            className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.02em] ${active ? 'pill-solid' : 'pill-ghost'}`}
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
              {!(selectedVenue.gatePinsJson || []).length ? (
                <p className="text-xs text-zinc-500">This venue has no named gates yet.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {paidGate && (
          <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-amber-200 space-y-2">
            {paidGate === 'no-account' ? (
              <p>To sell tickets, complete hosting setup with Stripe.</p>
            ) : (
              <p>Stripe is still verifying your account. You can create a free event now or check status from hosting setup.</p>
            )}
            <Link href="/dashboard/vendor-upgrade" className="inline-block font-bold text-white hover:text-zinc-200">
              Hosting setup
            </Link>
          </div>
        )}

        <div className={footerClass}>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
            {embedded ? (
              <button
                type="button"
                onClick={onCancel}
                className="pill-ghost inline-flex min-h-[48px] items-center justify-center px-5 text-sm font-semibold"
              >
                Cancel
              </button>
            ) : (
              <Link
                href="/dashboard/events"
                className="pill-ghost inline-flex min-h-[48px] items-center justify-center px-5 text-sm font-semibold"
              >
                Cancel
              </Link>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isCoverUploading || !coverImage}
              className="pill-solid flex-1 inline-flex min-h-[48px] items-center justify-center gap-2 px-6 text-sm font-bold tracking-[0.02em] disabled:opacity-45"
            >
              {isSubmitting ? <PxiSpinner size="sm" /> : null}
              {isSubmitting ? 'Creating...' : isCoverUploading ? 'Uploading cover...' : 'Create event'}
            </button>
          </div>
        </div>
      </form>

      {showPublicConsent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="glass-panel-strong w-full max-w-md rounded-2xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">Public event</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              By making this event public, you agree that photos and content from this event may be curated into public
              scrapbooks and used in PXI marketing materials. Attendees will be notified when they join.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPublicConsent(false)}
                className="pill-ghost px-4 py-2.5 text-sm"
              >
                Keep private
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPrivate(false);
                  setShowPublicConsent(false);
                }}
                className="pill-solid px-4 py-2.5 text-sm font-bold"
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
