'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/views/dashboard/DashboardLayout';
import { DashboardRouteSkeleton } from '@/components/skeleton/AppSkeletons';
import { DashboardDataProvider } from '@/lib/dashboardStore';

function DashboardFallback() {
  return <DashboardRouteSkeleton />;
}

export default function Layout({ children }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardDataProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardDataProvider>
    </Suspense>
  );
}
