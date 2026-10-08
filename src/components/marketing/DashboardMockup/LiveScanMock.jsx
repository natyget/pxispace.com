'use client';

import React from 'react';
import { CapacityIndicator, EntryVelocityPanel, RecentScansSection } from '@/components/dashboard/LiveOpsPanels';
import DashboardMock from './DashboardMock';
import { LIVE_OPS_SAMPLE } from './sampleData';

const noop = () => {};

/**
 * The live control room as the dashboard draws it: capacity filling, entry velocity over the last hour, and the
 * newest scans with the duplicate pass flagged. The panels are the Live Operations page's own, on sample scans.
 */
export default function LiveScanMock() {
  const { capacity, scanned, sold, velocityBars, scans } = LIVE_OPS_SAMPLE;
  return (
    <DashboardMock className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[5fr_7fr]">
        <CapacityIndicator isLive capacity={capacity} scanned={scanned} sold={sold} />
        <EntryVelocityPanel isLive bars={velocityBars} />
      </div>
      <RecentScansSection isLive scans={scans} onIncident={noop} />
    </DashboardMock>
  );
}
