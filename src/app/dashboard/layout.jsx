'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/views/dashboard/DashboardLayout';
import { DashboardRouteSkeleton } from '@/components/skeleton/AppSkeletons';

function DashboardFallback() {
  return <DashboardRouteSkeleton />;
}

export default function Layout({ children }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}
