import { Suspense } from 'react';
import DashboardLayout from '@/views/dashboard/DashboardLayout';
import { DashboardDataProvider } from '@/lib/dashboardStore';

export default function Layout({ children }) {
  return (
    <DashboardDataProvider>
      <DashboardLayout>
        <Suspense fallback={null}>{children}</Suspense>
      </DashboardLayout>
    </DashboardDataProvider>
  );
}
