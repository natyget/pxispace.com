'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VenueWizard from '@/components/dashboard/floorplan/VenueWizard';
import { listFloorPlans, deleteFloorPlan, attachFloorPlan } from '@/services/floorPlans';

function FloorPlansPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const attachEventId = searchParams.get('eventId');
    const openPlanId = searchParams.get('planId');

    const [plans, setPlans] = useState(null);
    const [editing, setEditing] = useState(null); // null | 'new' | plan object
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const load = () => {
        listFloorPlans()
            .then((res) => setPlans(res.floorPlans || []))
            .catch(() => setPlans([]));
    };

    useEffect(() => {
        const timer = setTimeout(load, 0);
        return () => clearTimeout(timer);
    }, []);

    // Deep links: ?planId= opens that plan's calibrator; ?eventId= with no plans jumps straight to "new".
    useEffect(() => {
        if (!plans || editing) return;
        if (openPlanId) {
            const plan = plans.find((item) => item.id === openPlanId);
            if (plan) setEditing(plan);
        } else if (attachEventId && plans.length === 0) {
            setEditing('new');
        }
    }, [plans, openPlanId, attachEventId, editing]);

    const handleSaved = async (plan) => {
        setEditing(null);
        setError('');
        if (attachEventId) {
            try {
                await attachFloorPlan(attachEventId, plan.id);
                router.push('/dashboard/analytics');
                return;
            } catch (err) {
                setError(err?.data?.error || err?.message || 'Saved the plan, but attaching it to the event failed.');
            }
        } else {
            setNotice(`Saved "${plan.name}".`);
        }
        load();
    };

    const removePlan = async (plan) => {
        if (!window.confirm(`Delete "${plan.name}"? Events using it will lose their heat-map plan.`)) return;
        try {
            await deleteFloorPlan(plan.id);
            load();
        } catch (err) {
            setError(err?.data?.error || err?.message || 'Failed to delete the floor plan');
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-5 md:space-y-6">
            <section className="flex flex-col gap-4 px-1 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="text-[13px] font-medium text-zinc-500">Intelligence</p>
                    <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-[28px]">Venues</h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500">
                        Save a venue once — its address, gates, and an optional calibrated floor plan. Every event held there projects
                        its photos, scans, and chat onto it as a heat map. Venue accounts co-hosted on an event can attach their venue to it.
                    </p>
                </div>
                {!editing ? (
                    <button type="button" onClick={() => setEditing('new')} className="pill-solid shrink-0 px-5 py-2.5 text-sm">
                        New venue
                    </button>
                ) : null}
            </section>

            {attachEventId && !editing ? (
                <div className="rounded-2xl bg-white/[0.045] px-4 py-3 text-xs font-semibold text-zinc-300">
                    Pick or add a venue — it will be attached to your event automatically.
                </div>
            ) : null}
            {error ? <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</div> : null}
            {notice ? <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">{notice}</div> : null}

            {editing ? (
                <VenueWizard
                    existingVenue={editing === 'new' ? null : editing}
                    eventId={attachEventId}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                />
            ) : plans === null ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="h-48 animate-pulse rounded-[1.25rem] bg-white/[0.035]" />
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <div className="dashboard-surface rounded-[1.25rem] px-6 py-14 text-center">
                    <p className="text-sm font-bold text-white">No venues yet.</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                        Find your venue, name it, and list its gates — a floor plan is optional. The spatial heat map on Analytics
                        unlocks the moment a venue is attached to an event.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const gateCount = (plan.gatePinsJson || plan.gatePins || []).length;
                        return (
                            <article key={plan.id} className="dashboard-surface overflow-hidden rounded-[1.25rem]">
                                {plan.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={plan.imageUrl} alt="" className="h-36 w-full bg-[#0b0b0f] object-contain" loading="lazy" />
                                ) : (
                                    <div className="flex h-36 w-full items-center justify-center bg-[#0b0b0f]">
                                        <p className="text-xs font-semibold text-zinc-600">No floor plan yet</p>
                                    </div>
                                )}
                                <div className="p-4">
                                    <p className="truncate text-sm font-bold text-white">{plan.name}</p>
                                    {plan.address ? <p className="mt-0.5 truncate text-xs text-zinc-600">{plan.address}</p> : null}
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {plan.attachedEventCount || 0} event{(plan.attachedEventCount || 0) === 1 ? '' : 's'}
                                        {plan.imageWidthPx && plan.metersPerPixel
                                            ? ` · ~${Math.round(plan.imageWidthPx * plan.metersPerPixel)} m wide`
                                            : ' · no plan yet'}
                                        {gateCount ? ` · ${gateCount} gate${gateCount === 1 ? '' : 's'}` : ''}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <button type="button" onClick={() => setEditing(plan)} className="pill-ghost px-3.5 py-1.5 text-xs font-bold tracking-[0.02em]">
                                            Edit
                                        </button>
                                        {attachEventId ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSaved(plan)}
                                                className="pill-solid px-3.5 py-1.5 text-xs"
                                            >
                                                Use for event
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => removePlan(plan)}
                                            className="ml-auto text-xs font-bold tracking-[0.02em] text-red-400 transition hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function FloorPlansPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-6xl p-8 text-zinc-500">Loading floor plans...</div>}>
            <FloorPlansPageContent />
        </Suspense>
    );
}
