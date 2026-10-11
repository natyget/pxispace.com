'use client';

import React, { useSyncExternalStore } from 'react';
import HypePanel from '@/components/dashboard/HypePanel';
import DashboardMock from './DashboardMock';
import { HYPE_SAMPLE } from './sampleData';

const PHONE = '(max-width: 768px)';
const subscribe = (notify) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

/**
 * "One hype metric": the Analytics page's own Hype through the night panel (chart, channels, and the stat strip with
 * the hype score), fed the Late Checkout sample. The channel switch is the panel's own; the mockup is not clickable.
 */
export default function AnalyticsMock() {
  const isMobile = useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => false);
  return (
    <DashboardMock>
      <HypePanel {...HYPE_SAMPLE} isMobile={isMobile} chartClassName="h-[220px]" statsClassName="grid-cols-3" />
    </DashboardMock>
  );
}
