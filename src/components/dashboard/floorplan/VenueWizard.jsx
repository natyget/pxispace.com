'use client';

import { useEffect, useState } from 'react';
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import { createFloorPlan, updateFloorPlan } from '@/services/floorPlans';
import { staticMapUrl } from './geo';
import GateListEditor from './GateListEditor';
import PlanCalibrationStage from './PlanCalibrationStage';

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
const fieldCls = 'glass-field w-full rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500';

const STEPS = [
    { n: 1, label: 'Find venue' },
    { n: 2, label: 'Name & gates' },
    { n: 3, label: 'Floor plan — optional' },
];

/** Defensive against legacy rows saved before gates carried an `id`. */
function normalizeGates(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((g) => g && typeof g.gate === 'string' && g.gate.trim())
        .map((g, i) => ({
            id: typeof g.id === 'string' && g.id ? g.id : `legacy-${i}-${g.gate}`,
            gate: g.gate.trim(),
            ...(Number.isFinite(g.xPx) && Number.isFinite(g.yPx) ? { xPx: g.xPx, yPx: g.yPx } : {}),
        }));
}

function StepIndicator({ step, maxStep, onJump }) {
    return (
        <div className="flex flex-wrap items-center gap-2 px-1">
            {STEPS.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={s.n > maxStep}
                        onClick={() => onJump(s.n)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.02em] transition ${
                            step === s.n
                                ? 'bg-[#d84aff] text-white'
                                : s.n < step
                                  ? 'bg-white/[0.09] text-zinc-300 hover:bg-white/[0.14]'
                                  : 'bg-white/[0.04] text-zinc-600'
                        } ${s.n > maxStep ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/25 text-[10px]">{s.n}</span>
                        {s.label}
                    </button>
                    {i < STEPS.length - 1 ? <span className="h-px w-4 shrink-0 bg-white/10" /> : null}
                </div>
            ))}
        </div>
    );
}

/**
 * Venue creation/edit flow. New venues walk a strict 3-step wizard — find the
 * venue, name it and list its gates, then optionally calibrate a floor plan —
 * because gates and pin placement don't make sense before the venue exists.
 * Editing an existing venue shows every section on one page instead, since
 * all of it is already valid and any part may need a touch-up.
 */
export default function VenueWizard({ existingVenue = null, eventId = null, seedLat = null, seedLng = null, onSaved, onCancel }) {
    const isEdit = !!existingVenue?.id;
    const [originalHadPlan] = useState(!!existingVenue?.imageUrl);
    const hasSeed = !isEdit && Number.isFinite(seedLat) && Number.isFinite(seedLng);

    const [step, setStep] = useState(1);
    const [maxStep, setMaxStep] = useState(1);

    const [name, setName] = useState(existingVenue?.name || '');
    const [address, setAddress] = useState(existingVenue?.address || '');
    const [venueLat, setVenueLat] = useState(existingVenue?.venueLat ?? (hasSeed ? seedLat : null));
    const [venueLng, setVenueLng] = useState(existingVenue?.venueLng ?? (hasSeed ? seedLng : null));
    const [reverseGeocoding, setReverseGeocoding] = useState(hasSeed);

    // Arriving from "turn this into a venue" (the analytics heat map): the
    // coordinates are already the real centroid of where people were shooting
    // — reverse-geocode a human-readable address so the user isn't stuck
    // reading raw lat/lng, but they can still re-search if it's off.
    useEffect(() => {
        if (!hasSeed) return;
        let cancelled = false;
        fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${seedLat}&lon=${seedLng}&apiKey=${GEOAPIFY_KEY}`)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const formatted = data?.features?.[0]?.properties?.formatted;
                setAddress(formatted || `${seedLat.toFixed(5)}, ${seedLng.toFixed(5)}`);
            })
            .catch(() => {
                if (!cancelled) setAddress(`${seedLat.toFixed(5)}, ${seedLng.toFixed(5)}`);
            })
            .finally(() => {
                if (!cancelled) setReverseGeocoding(false);
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasSeed]);

    const [gates, setGates] = useState(() => normalizeGates(existingVenue?.gatePinsJson || existingVenue?.gatePins || []));
    const [placingGateId, setPlacingGateId] = useState(null);

    const [imageUrl, setImageUrl] = useState(existingVenue?.imageUrl || '');
    const [imageDims, setImageDims] = useState(
        existingVenue?.imageUrl ? { w: existingVenue.imageWidthPx, h: existingVenue.imageHeightPx } : null
    );
    const [calib, setCalib] = useState({
        anchorLat: existingVenue?.anchorLat ?? null,
        anchorLng: existingVenue?.anchorLng ?? null,
        rotationDeg: existingVenue?.rotationDeg ?? 0,
        metersPerPixel: existingVenue?.metersPerPixel ?? null,
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handlePlaceSelect = (result) => {
        const props = result?.properties;
        if (typeof props?.lat !== 'number' || typeof props?.lon !== 'number') return;
        setAddress(props.formatted || props.address_line1 || '');
        setVenueLat(props.lat);
        setVenueLng(props.lon);
    };

    const onPlaceGate = (gateId, xPx, yPx) => {
        setGates((cur) => cur.map((gate) => (gate.id === gateId ? { ...gate, xPx, yPx } : gate)));
    };
    const onUnplaceGate = (gateId) => {
        setGates((cur) => cur.map((gate) => (gate.id === gateId ? { id: gate.id, gate: gate.gate } : gate)));
    };

    const goNext = () =>
        setStep((s) => {
            const n = Math.min(3, s + 1);
            setMaxStep((m) => Math.max(m, n));
            return n;
        });
    const goBack = () => setStep((s) => Math.max(1, s - 1));
    const jumpTo = (n) => {
        if (n <= maxStep) setStep(n);
    };

    const save = async () => {
        if (!name.trim()) {
            setError('Venue name is required.');
            setStep(2);
            return;
        }
        if (venueLat == null || venueLng == null || !address.trim()) {
            setError('Find the venue first.');
            setStep(1);
            return;
        }
        setSaving(true);
        setError('');
        try {
            const body = {
                name: name.trim(),
                address: address.trim(),
                venueLat,
                venueLng,
                rotationDeg: ((calib.rotationDeg % 360) + 360) % 360,
                gatePinsJson: gates.map((gate) => ({
                    id: gate.id,
                    gate: gate.gate,
                    ...(gate.xPx != null && gate.yPx != null ? { xPx: gate.xPx, yPx: gate.yPx } : {}),
                })),
            };
            // Calibration is all-or-none on the backend: send every field together
            // only when a plan is fully set up, send explicit nulls to clear one
            // that used to exist, or omit the group entirely otherwise.
            const planComplete = imageUrl && imageDims && calib.anchorLat != null && calib.anchorLng != null && calib.metersPerPixel;
            if (planComplete) {
                body.imageUrl = imageUrl;
                body.imageWidthPx = imageDims.w;
                body.imageHeightPx = imageDims.h;
                body.anchorLat = calib.anchorLat;
                body.anchorLng = calib.anchorLng;
                body.metersPerPixel = calib.metersPerPixel;
            } else if (isEdit && originalHadPlan) {
                body.imageUrl = null;
                body.imageWidthPx = null;
                body.imageHeightPx = null;
                body.anchorLat = null;
                body.anchorLng = null;
                body.metersPerPixel = null;
            }
            const res = isEdit ? await updateFloorPlan(existingVenue.id, body) : await createFloorPlan(body);
            onSaved?.(res.floorPlan);
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to save the venue');
        } finally {
            setSaving(false);
        }
    };

    const mapPreviewUrl =
        venueLat != null && venueLng != null ? staticMapUrl({ lat: venueLat, lng: venueLng, zoom: 16, width: 960, height: 320 }) : null;

    const addressSearch = (placeholder) => (
        <div className="glass-field overflow-visible rounded-xl !p-0">
            <GeoapifyContext apiKey={GEOAPIFY_KEY}>
                <GeoapifyGeocoderAutocomplete placeholder={placeholder} placeSelect={handlePlaceSelect} />
            </GeoapifyContext>
        </div>
    );

    const planStage = (
        <PlanCalibrationStage
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            imageDims={imageDims}
            setImageDims={setImageDims}
            calib={calib}
            setCalib={setCalib}
            gates={gates}
            placingGateId={placingGateId}
            setPlacingGateId={setPlacingGateId}
            onPlaceGate={onPlaceGate}
            onUnplaceGate={onUnplaceGate}
            seedCenter={{ lat: venueLat, lng: venueLng }}
            eventId={eventId}
        />
    );

    // ── edit mode: every section on one page ──────────────────────────────
    if (isEdit) {
        return (
            <div className="space-y-5">
                <section className="dashboard-surface rounded-[1.25rem] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Edit venue</p>
                            <h2 className="mt-1 text-xl font-bold text-white">{existingVenue.name}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {onCancel ? (
                                <button type="button" onClick={onCancel} className="pill-ghost px-4 py-2 text-sm font-bold">
                                    Cancel
                                </button>
                            ) : null}
                            <button type="button" onClick={save} disabled={saving} className="pill-solid px-5 py-2 text-sm disabled:opacity-40">
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                    {originalHadPlan ? (
                        <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
                            Recalibrating changes the map for every event using this venue, including past playback.
                        </p>
                    ) : null}
                    {error ? <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p> : null}
                </section>

                <section className="dashboard-surface rounded-[1.25rem] p-5">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Venue</p>
                    <label className="mt-3 block max-w-md">
                        <span className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Name</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} className={`${fieldCls} mt-1.5`} />
                    </label>
                    <div className="mt-4 max-w-xl">{addressSearch('Search to change the address...')}</div>
                    {mapPreviewUrl ? (
                        <div className="mt-4 max-w-xl overflow-hidden rounded-2xl ring-1 ring-white/[0.07]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mapPreviewUrl} alt="" className="h-44 w-full bg-[#0b0b0f] object-cover" />
                            <div className="bg-white/[0.035] px-4 py-2.5 text-xs font-semibold text-zinc-300">{address}</div>
                        </div>
                    ) : null}
                </section>

                <section className="dashboard-surface rounded-[1.25rem] p-5">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Gates</p>
                    <div className="mt-3">
                        <GateListEditor gates={gates} onChange={setGates} />
                    </div>
                </section>

                <section className="dashboard-surface rounded-[1.25rem] p-5">
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Floor plan</p>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                        Select a gate chip, then click the plan to drop or move its pin.
                    </p>
                    <div className="mt-4">{planStage}</div>
                </section>
            </div>
        );
    }

    // ── new venue: strict 3-step wizard ────────────────────────────────────
    return (
        <section className="dashboard-surface rounded-[1.25rem] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">New venue</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Add a venue</h2>
                </div>
                {onCancel ? (
                    <button type="button" onClick={onCancel} className="pill-ghost px-4 py-2 text-sm font-bold">
                        Cancel
                    </button>
                ) : null}
            </div>

            <div className="mt-4">
                <StepIndicator step={step} maxStep={maxStep} onJump={jumpTo} />
            </div>

            {error ? <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p> : null}

            <div className="mt-4">
                {step === 1 ? (
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Step 1 of 3</p>
                        <h3 className="mt-1 text-lg font-bold text-white">Find the venue</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                            {hasSeed
                                ? "Seeded from where your guests' photos were actually taken — confirm it, or search to correct it."
                                : 'Search its address — this anchors everything else, gates and the floor plan included.'}
                        </p>
                        <div className="mt-4">{addressSearch('Search the venue address...')}</div>
                        {mapPreviewUrl ? (
                            <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/[0.07]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={mapPreviewUrl} alt="" className="h-56 w-full bg-[#0b0b0f] object-cover" />
                                <div className="bg-white/[0.035] px-4 py-2.5 text-xs font-semibold text-zinc-300">
                                    {reverseGeocoding ? 'Looking up the address...' : address}
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-xs text-zinc-600">Pick a result from the search to continue.</p>
                        )}
                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={goNext}
                                disabled={venueLat == null || venueLng == null}
                                className="pill-solid px-5 py-2.5 text-sm disabled:opacity-40"
                            >
                                Next — name it
                            </button>
                        </div>
                    </div>
                ) : null}

                {step === 2 ? (
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Step 2 of 3</p>
                        <h3 className="mt-1 text-lg font-bold text-white">Name the venue and list its gates</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                            Gates don&apos;t need to be placed yet — add their names now, position them on a plan later.
                        </p>
                        <label className="mt-4 block max-w-md">
                            <span className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Venue name</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Warehouse 21"
                                className={`${fieldCls} mt-1.5`}
                            />
                        </label>

                        <div className="mt-5 rounded-2xl bg-white/[0.035] p-4">
                            <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Gates</p>
                            <div className="mt-2">
                                <GateListEditor gates={gates} onChange={setGates} />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                            <button type="button" onClick={goBack} className="pill-ghost px-4 py-2 text-sm font-bold">
                                Back
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={save}
                                    disabled={!name.trim() || saving}
                                    className="pill-ghost px-4 py-2 text-sm font-bold disabled:opacity-40"
                                >
                                    {saving ? 'Saving...' : 'Save venue without a floor plan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    disabled={!name.trim()}
                                    className="pill-solid px-5 py-2.5 text-sm disabled:opacity-40"
                                >
                                    Next — floor plan
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {step === 3 ? (
                    <div>
                        <p className="text-[11px] font-medium tracking-[0.02em] text-zinc-500">Step 3 of 3 — optional</p>
                        <h3 className="mt-1 text-lg font-bold text-white">Floor plan</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                            Upload a plan image and calibrate it over the map, then select a gate below and click the plan to drop its pin.
                            Skip this if you don&apos;t have a plan yet — you can add one later.
                        </p>
                        <div className="mt-4">{planStage}</div>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                            <button type="button" onClick={goBack} className="pill-ghost px-4 py-2 text-sm font-bold">
                                Back
                            </button>
                            <button type="button" onClick={save} disabled={saving} className="pill-solid px-5 py-2.5 text-sm disabled:opacity-40">
                                {saving ? 'Saving...' : imageUrl ? 'Save venue' : 'Save without a floor plan'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
