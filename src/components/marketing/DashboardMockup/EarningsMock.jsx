'use client';

import React from 'react';
import SectionCard from '@/components/dashboard/SectionCard';
import { RevenueByMonthChart, RevenueTableRow } from '@/components/dashboard/EarningsPanels';
import DashboardMock from './DashboardMock';
import { EARNINGS_SAMPLE } from './sampleData';

/**
 * Where the money goes: the Earnings page's Key metrics card (gross, the one $0.99 fee, the payout Stripe makes) and its
 * Revenue by month chart, on sample figures. The rows and the chart are the page's own components.
 */
export default function EarningsMock() {
  return (
    <DashboardMock className="space-y-4">
      <SectionCard title="Key Metrics">
        <div className="px-5 py-2">
          {EARNINGS_SAMPLE.keyMetrics.map((row) => (
            <RevenueTableRow key={row.title} {...row} />
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Revenue by month">
        <RevenueByMonthChart series={EARNINGS_SAMPLE.monthly} className="h-[220px]" animate={false} />
      </SectionCard>
    </DashboardMock>
  );
}
