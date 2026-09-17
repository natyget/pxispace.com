'use client';

// VEN-8 admin console for venues: the catalogue (VEN-1), match review with the matcher's signals, claims with the
// exposure confirmation (VEN-2), and the VEN-6 shadow-mode status. A city-scoped admin sees and acts on their
// city only; the backend enforces that on every call.

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers } from '@/services/admin';
import {
    confirmVenueProposal,
    createAdminVenue,
    decideVenueClaim,
    fetchAdminVenues,
    fetchClaimPreview,
    fetchForecastStatus,
    fetchVenueClaims,
    fetchVenueProposals,
    generateVenueProposals,
    raiseVenueClaim,
    rejectVenueProposal,
} from '@/services/venues';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { cityLabel } from '@/lib/dashboardNavConfig';
import { AdminError, AdminPageShell, AdminPanel } from '@/components/admin/AdminPageShell';
import { adminErrorMessage } from '@/components/admin/adminFormat';

const inputCls = 'w-full rounded-full bg-white/[0.055] px-4 py-2 text-[13px] text-white placeholder:text-white/35 outline-none focus:bg-white/[0.075]';
const pill = 'rounded-full bg-white/[0.065] px-4 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.1] hover:text-white disabled:opacity-40';

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '';
    }
}

function percent(n) {
    return n === null || n === undefined ? 'n/a' : `${Math.round(n * 100)}%`;
}

function CreateVenue({ cityScope, onCreated }) {
    const [form, setForm] = useState({ name: '', address: '', cityCode: '', lat: '', lng: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const lat = form.lat.trim() ? Number(form.lat) : undefined;
            const lng = form.lng.trim() ? Number(form.lng) : undefined;
            const res = await createAdminVenue({
                name: form.name.trim(),
                address: form.address.trim() || undefined,
                cityCode: cityScope ? undefined : form.cityCode || undefined,
                lat: Number.isFinite(lat) ? lat : undefined,
                lng: Number.isFinite(lng) ? lng : undefined,
            });
            setForm({ name: '', address: '', cityCode: '', lat: '', lng: '' });
            onCreated(res.venue);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to create venue'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminPanel className="space-y-3">
            <p className="text-[13px] font-semibold text-white">Add a venue</p>
            <div className="grid gap-2 md:grid-cols-2">
                <input value={form.name} onChange={set('name')} placeholder="Name" className={inputCls} />
                <input value={form.address} onChange={set('address')} placeholder="Address" className={inputCls} />
                {cityScope ? (
                    <p className="px-2 text-[12px] text-white/45">City: {cityLabel(cityScope)}</p>
                ) : (
                    <select value={form.cityCode} onChange={set('cityCode')} className={inputCls} aria-label="City">
                        <option value="">City: work it out from the location</option>
                        <option value="NYC">New York</option>
                        <option value="BOS">Boston</option>
                    </select>
                )}
                <div className="flex gap-2">
                    <input value={form.lat} onChange={set('lat')} placeholder="Latitude" className={inputCls} />
                    <input value={form.lng} onChange={set('lng')} placeholder="Longitude" className={inputCls} />
                </div>
            </div>
            {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
            <button type="button" disabled={busy || !form.name.trim()} onClick={submit} className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                {busy ? 'Adding...' : 'Add venue'}
            </button>
        </AdminPanel>
    );
}

function Proposals({ venueId, onChanged }) {
    const [items, setItems] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await fetchVenueProposals(venueId);
            setItems(res.proposals || []);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load matches'));
        }
    }, [venueId]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const act = async (fn, done) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
            if (done) setMessage(done);
            await load();
            onChanged?.();
        } catch (err) {
            setError(adminErrorMessage(err, 'Action failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminPanel className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-white">Matching events</p>
                <button
                    type="button"
                    disabled={busy}
                    className={pill}
                    onClick={() => act(async () => {
                        const res = await generateVenueProposals(venueId);
                        setMessage(`Checked ${res.result.scanned} events: ${res.result.proposed} new matches, ${res.result.updated} updated.`);
                    })}
                >
                    Find matching events
                </button>
            </div>
            {message ? <p className="text-[12px] text-white/55">{message}</p> : null}
            {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
            {!items ? <p className="text-[13px] text-white/45">Loading...</p> : items.length === 0 ? (
                <p className="text-[13px] text-white/45">No matches waiting for review. Nothing is attached without a confirmation here.</p>
            ) : (
                <ul className="space-y-2">
                    {items.map((p) => {
                        const s = p.signalsJson || {};
                        return (
                            <li key={p.id} className="rounded-xl bg-white/[0.035] px-4 py-3">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-semibold text-white">{p.event?.name}</p>
                                        <p className="text-[12px] text-white/45">
                                            {formatDate(p.event?.startDate)} · {p.event?.venueName || p.event?.location || 'No venue text'}
                                        </p>
                                        <p className="mt-1 text-[12px] text-white/55">
                                            Match {percent(p.confidence)} · name {percent(s.nameScore)}
                                            {s.distanceKm !== null && s.distanceKm !== undefined ? ` · ${s.distanceKm.toFixed(2)} km away` : ''}
                                            {s.cityAgrees === false ? ' · city disagrees' : ''}
                                            {s.cappedByNameOnly ? ' · name only, capped' : ''}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <button type="button" disabled={busy} onClick={() => act(() => confirmVenueProposal(p.id), 'Attached.')} className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40">
                                            Confirm
                                        </button>
                                        <button type="button" disabled={busy} onClick={() => act(() => rejectVenueProposal(p.id), 'Rejected.')} className="rounded-full bg-red-500/10 px-4 py-1.5 text-[12px] text-red-300 hover:bg-red-500/20 disabled:opacity-40">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </AdminPanel>
    );
}

function Claims({ venue, onChanged }) {
    const [claims, setClaims] = useState(null);
    const [query, setQuery] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [beneficiary, setBeneficiary] = useState(null);
    const [exposure, setExposure] = useState(null);
    const [acknowledged, setAcknowledged] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await fetchVenueClaims(venue.id);
            setClaims(res.claims || []);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load claims'));
        }
    }, [venue.id]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) return undefined;
        let cancelled = false;
        const t = setTimeout(() => {
            fetchAdminUsers({ q: term, limit: 10 })
                .then((res) => { if (!cancelled) setCandidates((res.users || []).filter((u) => u.isVendor)); })
                .catch(() => { if (!cancelled) setCandidates([]); });
        }, 300);
        return () => { cancelled = true; clearTimeout(t); };
    }, [query]);

    const act = async (fn) => {
        setBusy(true);
        setError(null);
        try {
            await fn();
            await load();
            onChanged?.();
        } catch (err) {
            setError(adminErrorMessage(err, 'Action failed'));
        } finally {
            setBusy(false);
        }
    };

    const preview = () => act(async () => {
        const res = await fetchClaimPreview(venue.id);
        setExposure(res.exposure);
        setAcknowledged(false);
    });

    const claim = () => act(async () => {
        await raiseVenueClaim(venue.id, beneficiary.id);
        setBeneficiary(null);
        setExposure(null);
        setQuery('');
    });

    return (
        <AdminPanel className="space-y-3">
            <p className="text-[13px] font-semibold text-white">Ownership</p>
            {venue.ownerId ? (
                <p className="text-[13px] text-white/55">Claimed. Revoke the active claim below to change the owner.</p>
            ) : (
                <div className="space-y-2">
                    <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setBeneficiary(null); setExposure(null); }} placeholder="Find the venue's vendor account by username or email" className={inputCls} />
                    {!beneficiary && query.trim().length >= 2 ? (
                        <ul className="space-y-1">
                            {candidates.map((u) => (
                                <li key={u.id}>
                                    <button type="button" onClick={() => setBeneficiary(u)} className="w-full rounded-xl bg-white/[0.03] px-4 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06]">
                                        @{u.username || 'account'} <span className="text-white/40">{u.email}</span>
                                    </button>
                                </li>
                            ))}
                            {candidates.length === 0 ? <li className="px-1 text-[12px] text-white/40">No vendor accounts match.</li> : null}
                        </ul>
                    ) : null}
                    {beneficiary ? (
                        <div className="space-y-2 rounded-xl bg-white/[0.03] p-3">
                            <p className="text-[13px] text-white/70">Claim for <span className="font-semibold text-white">@{beneficiary.username}</span></p>
                            {!exposure ? (
                                <button type="button" disabled={busy} onClick={preview} className={pill}>See what this exposes</button>
                            ) : (
                                <>
                                    <p className="text-[13px] leading-6 text-amber-200">
                                        This gives @{beneficiary.username} analytics on {exposure.eventCount} events and makes {exposure.attendeeCount} people
                                        visible to them ({exposure.checkedInCount} checked in), within the privacy wall.
                                    </p>
                                    <label className="flex items-center gap-2 text-[13px] text-white/70">
                                        <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                                        I have checked this account really is the venue.
                                    </label>
                                    <button type="button" disabled={busy || !acknowledged} onClick={claim} className="rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black disabled:opacity-40">
                                        Claim venue
                                    </button>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
            {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
            {claims && claims.length ? (
                <ul className="space-y-2 pt-2">
                    {claims.map((c) => (
                        <li key={c.id} className="flex flex-col gap-2 rounded-xl bg-white/[0.035] px-4 py-3 text-[12px] text-white/60 md:flex-row md:items-center md:justify-between">
                            <span>
                                <span className="font-semibold text-white">{c.status}</span> · raised {formatDate(c.raisedAt)} by {c.raisedByRole.toLowerCase().replaceAll('_', ' ')} ·
                                {' '}{c.exposedEventCount} events, {c.exposedAttendeeCount} people
                            </span>
                            <span className="flex gap-2">
                                {c.status === 'PENDING_APPROVAL' ? (
                                    <>
                                        <button type="button" disabled={busy} onClick={() => act(() => decideVenueClaim(c.id, 'approve'))} className={pill}>Approve</button>
                                        <button type="button" disabled={busy} onClick={() => act(() => decideVenueClaim(c.id, 'reject'))} className={pill}>Reject</button>
                                    </>
                                ) : null}
                                {c.status === 'ACTIVE' ? (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => {
                                            const reason = window.prompt('Why is access being revoked?');
                                            if (reason && reason.trim()) act(() => decideVenueClaim(c.id, 'revoke', reason.trim()));
                                        }}
                                        className="rounded-full bg-red-500/10 px-4 py-1.5 text-[12px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                                    >
                                        Revoke
                                    </button>
                                ) : null}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </AdminPanel>
    );
}

function ForecastStatus() {
    const [data, setData] = useState(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchForecastStatus()
            .then((res) => { if (!cancelled) setData(res); })
            .catch(() => { if (!cancelled) setHidden(true); });
        return () => { cancelled = true; };
    }, []);

    if (hidden || !data) return null;
    const { gate, calibration, backtest } = data;
    return (
        <AdminPanel className="space-y-2">
            <p className="text-[13px] font-semibold text-white">Forecasts: {gate.visible ? 'visible to venues' : 'shadow mode'}</p>
            <p className="text-[13px] leading-6 text-white/55">{gate.reason}.</p>
            <p className="text-[12px] leading-5 text-white/45">
                Measured forecasts: {gate.measured}. Median error, model {percent(gate.mdapeModel)} vs same as last time {percent(gate.mdapeNaive)}.
                {' '}Backtest on history: {backtest.events} events at {backtest.venues} venues, model {percent(backtest.mdapeModel)} vs naive {percent(backtest.mdapeNaive)}.
                {' '}Band: {calibration.calibrated ? `${calibration.lowRatio.toFixed(2)}x to ${calibration.highRatio.toFixed(2)}x from ${calibration.sample} ${calibration.source.toLowerCase()} pairs` : `uncalibrated (${calibration.sample} of 20 pairs)`}.
            </p>
        </AdminPanel>
    );
}

export default function AdminVenuesPage() {
    const { isLive, cityScope } = useAdminMode();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('');

    const load = useCallback(async () => {
        if (!isLive) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetchAdminVenues({ take: 100 });
            setVenues(res.venues || []);
            setError(null);
        } catch (err) {
            setError(adminErrorMessage(err, 'Failed to load venues'));
        } finally {
            setLoading(false);
        }
    }, [isLive]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const selected = venues.find((v) => v.id === selectedId) || null;
    const shown = venues.filter((v) => !filter.trim() || v.name.toLowerCase().includes(filter.trim().toLowerCase()));
    const claimedCount = venues.filter((v) => v.ownerId).length;

    return (
        <AdminPageShell
            title="Venues"
            copy={`${cityScope ? `${cityLabel(cityScope)} venues. ` : ''}The venue catalogue, events matched to each room, and who owns a venue's data. Nothing attaches or grants access without a person confirming it here.`}
            source={isLive ? 'Live' : 'Mock'}
            metrics={[
                { label: 'Venues', value: venues.length.toLocaleString(), hint: cityScope ? cityLabel(cityScope) : 'All cities' },
                { label: 'Claimed', value: claimedCount.toLocaleString(), hint: 'Owned by a venue account' },
            ]}
        >
            {!isLive ? <AdminPanel><p className="text-sm text-white/55">Live venue data requires a backend admin account.</p></AdminPanel> : null}
            <AdminError>{error}</AdminError>
            {isLive && !cityScope ? <ForecastStatus /> : null}
            {isLive ? <CreateVenue cityScope={cityScope} onCreated={(v) => { setSelectedId(v.id); load(); }} /> : null}

            {isLive ? (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <AdminPanel className="space-y-3">
                        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter venues" className={inputCls} />
                        {loading ? <p className="text-[13px] text-white/45">Loading...</p> : shown.length === 0 ? (
                            <p className="text-[13px] text-white/45">No venues yet. Add the first one above.</p>
                        ) : (
                            <ul className="max-h-[640px] space-y-1 overflow-y-auto">
                                {shown.map((v) => (
                                    <li key={v.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(v.id)}
                                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left ${selectedId === v.id ? 'bg-white/[0.1]' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-[14px] font-semibold text-white">{v.name}</span>
                                                <span className="block truncate text-[12px] text-white/45">
                                                    {v.cityCode ? cityLabel(v.cityCode) : 'No city'} · {v._count?.events ?? 0} events · {v._count?.proposals ?? 0} matches
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-[11px] text-white/45">{v.ownerId ? 'Claimed' : ''}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </AdminPanel>

                    {selected ? (
                        <div className="space-y-4">
                            <AdminPanel className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-[16px] font-semibold text-white">{selected.name}</p>
                                    <p className="text-[12px] text-white/45">{selected.address || 'No address'} · {selected.cityCode ? cityLabel(selected.cityCode) : 'No city'}</p>
                                </div>
                                <Link href={`/dashboard/venue?venueId=${selected.id}`} className={pill}>Open venue dashboard</Link>
                            </AdminPanel>
                            <Proposals key={`p-${selected.id}`} venueId={selected.id} onChanged={load} />
                            <Claims key={`c-${selected.id}`} venue={selected} onChanged={load} />
                        </div>
                    ) : (
                        <AdminPanel><p className="text-[13px] text-white/45">Choose a venue to review its matches and ownership.</p></AdminPanel>
                    )}
                </div>
            ) : null}
        </AdminPageShell>
    );
}
