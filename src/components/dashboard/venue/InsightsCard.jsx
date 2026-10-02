'use client';

// VEN-8, "Short Insights": a few sentences, each read straight off a number on this page.

import { buildInsights, insightsBasis } from '@/lib/venueDashboard';
import { CardSkeleton, EmptyNote, VenueCard } from './VenueCard';

export default function InsightsCard({ home, analytics, heatmap, loading = false, className = '' }) {
    const lines = buildInsights({ home, analytics, heatmap });
    const basis = insightsBasis(home);
    return (
        <VenueCard title="Short Insights" className={className} data-venue-card="insights">
            {loading ? <CardSkeleton className="h-28" /> : lines.length ? (
                <>
                    {basis ? <p className="text-[11px] font-medium text-white/80">{basis}</p> : null}
                    <ul className={`space-y-2 ${basis ? 'mt-2' : ''}`}>
                        {lines.map((line) => (
                            <li key={line} className="text-[12px] leading-[1.35] text-white/65">{line}</li>
                        ))}
                    </ul>
                </>
            ) : (
                <EmptyNote>No Current Venue Insights</EmptyNote>
            )}
        </VenueCard>
    );
}
