'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketingKitModal from '@/components/dashboard/MarketingKitModal';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { Button, EmptyState, Notice, PageHeader, Panel, Skeleton, StateText } from '@/components/dashboard/ui/kit';
import { count, dayDate, money, shortDate, until } from '@/lib/dashFormat';
import { eventsService } from '@/services/events';
import { organizerAnalyticsService } from '@/services/organizerAnalytics';
import { useDashboardShellStore } from '@/lib/dashboardShellStore';
import LiveScanDashboard from '@/views/dashboard/LiveScanDashboard';
import AfterPanel from '@/views/dashboard/insights/AfterPanel';
import { ComparisonPanel, NightPicker } from '@/views/dashboard/insights/ComparePanels';
import ChevronSelect from '@/views/dashboard/insights/ChevronSelect';
import DoorPanel from '@/views/dashboard/insights/DoorPanel';
import MarketingSection from '@/views/dashboard/insights/MarketingSection';
import SalesPanel from '@/views/dashboard/insights/SalesPanel';
import { nightLabel, nightState, pickRelevantNight, projectSales, sortNights } from '@/views/dashboard/insights/nights';

const SEVERITY_TONE = { good: 'good', info: 'muted', warning: 'warn' };

/** The backend's observations about this night: a real number and the lever that acts on it. Nothing to say, nothing shown. */
function NoticedPanel({ insights = [], onCta }) {
    if (!insights.length) return null;
    return (
        <Panel title="What we noticed">
            <ul className="space-y-1.5">
                {insights.map((insight) => (
                    <li key={insight.id} className="flex flex-col gap-2 rounded-2xl bg-pxi-field px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4">
                        <div className="min-w-0">
                            <StateText tone={SEVERITY_TONE[insight.severity] || 'muted'}>{insight.title}</StateText>
                            <p className="mt-1 text-[14px] text-white/70">{insight.body}</p>
                        </div>
                        {insight.ctaLabel && insight.ctaHref ? (
                            <Link href={insight.ctaHref} className="shrink-0 text-[13px] font-semibold text-[#c77dff] transition hover:text-white">
                                {insight.ctaLabel}
                            </Link>
                        ) : insight.ctaLabel && onCta ? (
                            <button type="button" onClick={() => onCta(insight)} className="shrink-0 text-left text-[13px] font-semibold text-[#c77dff] transition hover:text-white">
                                {insight.ctaLabel}
                            </button>
                        ) : null}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

function PanelsSkeleton() {
    return (
        <div className="space-y-5 md:space-y-6">
            <Skeleton className="h-[420px]" />
            <Skeleton className="h-[320px]" />
        </div>
    );
}

function AnalyticsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view') === 'live-ops' ? 'live-ops' : 'analytics';
    const isLiveEvent = useDashboardShellStore((store) => store.isLiveEvent);
    const [mountedAtMs] = useState(() => Date.now());

    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // One id = the full story of a night, several = the comparison.
    const [selectedIds, setSelectedIds] = useState([]);
    const [compareOpen, setCompareOpen] = useState(false);
    const [comparisonDetails, setComparisonDetails] = useState([]);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [eventDetail, setEventDetail] = useState(null);
    const [eventDetailLoading, setEventDetailLoading] = useState(false);
    const [marketingKitOpen, setMarketingKitOpen] = useState(false);
    const selectedEventId = selectedIds.length === 1 ? selectedIds[0] : null;
    const isComparing = selectedIds.length > 1;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setEventsLoading(true);
            try {
                // managed=1: created OR co-hosted events, so venue accounts see the events they staff.
                const res = await eventsService.getManagedEvents({ limit: 100, offset: 0 });
                if (!cancelled) setEvents(res?.events || []);
            } catch {
                if (!cancelled) setEvents([]);
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = () => setIsMobile(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Live nights first, then the next one, then the past ones, newest first.
    const nights = useMemo(
        () => sortNights(events, mountedAtMs).map((event) => ({
            id: event.id,
            name: event.name || 'Untitled event',
            dateLabel: shortDate(event.startDate) || 'Date to be set',
            label: nightLabel(event, mountedAtMs),
        })),
        [events, mountedAtMs]
    );

    // Open on the night that matters most: the one happening now, else the next one, else the last one.
    useEffect(() => {
        if (eventsLoading || selectedIds.length || !events.length) return undefined;
        const first = pickRelevantNight(events, mountedAtMs);
        if (!first) return undefined;
        const timer = setTimeout(() => setSelectedIds([first.id]), 0);
        return () => clearTimeout(timer);
    }, [events, eventsLoading, mountedAtMs, selectedIds.length]);

    // Click adds a night, clicking again takes it out (at least one stays). Four at most, so the overlay stays readable.
    const handleToggleEvent = (eventId) => {
        setSelectedIds((current) => {
            if (current.includes(eventId)) {
                const next = current.filter((id) => id !== eventId);
                return next.length ? next : current;
            }
            return [...current, eventId].slice(-4);
        });
    };

    useEffect(() => {
        if (!selectedEventId) {
            const timer = setTimeout(() => setEventDetail(null), 0);
            return () => clearTimeout(timer);
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            setEventDetailLoading(true);
            organizerAnalyticsService
                .getEventAnalytics(selectedEventId)
                .then((res) => { if (!cancelled) setEventDetail(res); })
                .catch(() => { if (!cancelled) setEventDetail(null); })
                .finally(() => { if (!cancelled) setEventDetailLoading(false); });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [selectedEventId]);

    // Only fetches when actually comparing (2+ selected); a single night reuses eventDetail above.
    useEffect(() => {
        const ids = selectedIds.length > 1 ? selectedIds.slice(0, 4) : [];
        if (!ids.length) {
            const timer = setTimeout(() => setComparisonDetails([]), 0);
            return () => clearTimeout(timer);
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            setComparisonLoading(true);
            Promise.allSettled(ids.map((id) => organizerAnalyticsService.getEventAnalytics(id)))
                .then((results) => {
                    if (cancelled) return;
                    setComparisonDetails(results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])));
                })
                .finally(() => {
                    if (!cancelled) setComparisonLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [selectedIds]);

    // The night picker and the quiet "Compare nights" control sit at the right of the sub-tab row.
    const pageAction = useMemo(() => {
        if (viewMode === 'live-ops' || !nights.length) return null;
        const nightOptions = nights.map((night) => ({ value: night.id, label: night.label }));
        const options = isComparing ? [{ value: '', label: `Comparing ${selectedIds.length} nights` }, ...nightOptions] : nightOptions;
        return (
            <div className="flex items-center gap-2">
                <ChevronSelect
                    aria-label="Night"
                    value={isComparing ? '' : selectedIds[0] || ''}
                    onChange={(event) => {
                        if (!event.target.value) return;
                        setSelectedIds([event.target.value]);
                        setCompareOpen(false);
                    }}
                    options={options}
                    className="w-[200px] md:w-[280px]"
                />
                <Button variant="quiet" onClick={() => setCompareOpen((open) => !open)}>Compare nights</Button>
            </div>
        );
    }, [isComparing, nights, selectedIds, viewMode]);
    usePageAction(pageAction);

    const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) || null, [events, selectedEventId]);

    // The numbers for this night, most important first.
    const kpis = useMemo(() => {
        if (!eventDetail || isComparing) return null;
        const sales = eventDetail.sales || {};
        const funnel = eventDetail.funnel || {};
        const attendance = eventDetail.attendance || {};
        const upcoming = nightState({ ...eventDetail.event, ...(selectedEvent || {}) }, mountedAtMs) === 'upcoming';
        const capacity = Number(selectedEvent?.capacity) > 0 ? Number(selectedEvent.capacity) : null;
        const items = [
            { label: 'Sold', value: count(sales.total ?? funnel.sold), hint: capacity ? `of ${count(capacity)}` : undefined },
            { label: 'Ticket sales', value: money(sales.revenue?.grossCents), hint: `${money(sales.revenue?.netCents)} to you` },
        ];
        if (upcoming) {
            const plan = projectSales({ velocityPerDay7d: sales.velocityPerDay7d, totalSold: sales.total, startDate: eventDetail.event?.startDate }, mountedAtMs);
            items.push({
                label: 'At this pace',
                value: plan?.projected != null ? count(plan.projected) : '-',
                hint: plan && plan.pace <= 0 ? 'no sales this week' : 'by doors',
                tone: 'purple',
            });
            items.push({ label: 'Doors', value: until(eventDetail.event?.startDate), hint: dayDate(eventDetail.event?.startDate) });
        } else {
            items.push({
                label: 'Turnout',
                value: `${Math.round((Number(attendance.scanRate) || 0) * 100)}%`,
                hint: `${count(attendance.scanned)} of ${count(attendance.sold)} came`,
                tone: 'purple',
            });
        }
        return items;
    }, [eventDetail, isComparing, mountedAtMs, selectedEvent]);

    if (viewMode === 'live-ops') {
        return <LiveScanDashboard isLiveEvent={isLiveEvent} />;
    }

    let body;
    if (eventsLoading) {
        body = <PanelsSkeleton />;
    } else if (!events.length) {
        body = <EmptyState title="No nights yet" line="Create an event to see its numbers here." action={<Button variant="primary" onClick={() => router.push('/dashboard/events')}>Go to events</Button>} />;
    } else if (isComparing) {
        body = (
            <>
                <ComparisonPanel details={comparisonDetails} loading={comparisonLoading} />
                <MarketingSection />
            </>
        );
    } else if (!selectedEventId || eventDetailLoading) {
        body = <PanelsSkeleton />;
    } else if (!eventDetail) {
        body = <Notice tone="error">We could not load this night. Try another one.</Notice>;
    } else {
        body = (
            <>
                <NoticedPanel
                    insights={eventDetail.insights}
                    onCta={() => document.getElementById('top-moments-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                />
                <SalesPanel detail={eventDetail} isMobile={isMobile} />
                <DoorPanel detail={eventDetail} eventId={selectedEventId} isMobile={isMobile} />
                <AfterPanel
                    detail={eventDetail}
                    onPromote={() => setMarketingKitOpen(true)}
                    onRemoved={(mediaId) =>
                        setEventDetail((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      behavior: {
                                          ...prev.behavior,
                                          topMoments: (prev.behavior?.topMoments || []).filter((m) => m.mediaId !== mediaId),
                                      },
                                  }
                                : prev
                        )
                    }
                />
                <MarketingSection selectedEventId={selectedEventId} />
                <MarketingKitModal
                    open={marketingKitOpen}
                    onClose={() => setMarketingKitOpen(false)}
                    moments={eventDetail.behavior?.topMoments || []}
                    event={{
                        ...eventDetail.event,
                        venueName: events.find((event) => event.id === eventDetail.event?.id)?.venueName || '',
                    }}
                />
            </>
        );
    }

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader title="Analytics" kpis={kpis} />
            {compareOpen ? <NightPicker nights={nights} selectedIds={selectedIds} onToggle={handleToggleEvent} onClose={() => setCompareOpen(false)} /> : null}
            {body}
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<Skeleton className="h-40" />}>
            <AnalyticsPageContent />
        </Suspense>
    );
}
