'use client';

import React from 'react';
import SectionCard from '@/components/dashboard/SectionCard';
import VenueHeatMap from '@/components/dashboard/floorplan/VenueHeatMap';
import DashboardMock from './DashboardMock';
import { HEATMAP_SAMPLE, HEATMAP_START } from './sampleData';

/**
 * Spatial intelligence: the Analytics page's own heat map over a floor plan, opened on the busiest moment of the night.
 * It is given the sample payload instead of fetching one, and read-only (no attach, detach or live follow).
 */
export default function VenueMapMock() {
  return (
    <DashboardMock>
      <SectionCard title="Spatial intelligence" className="!rounded-[1.25rem]">
        <VenueHeatMap sample={HEATMAP_SAMPLE} startAt={HEATMAP_START} readOnly />
      </SectionCard>
    </DashboardMock>
  );
}
